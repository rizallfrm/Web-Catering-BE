const { Order, OrderItem, User, Menu, Expense, sequelize } = require("../models/index");
const { Op } = require("sequelize");
const ExcelJS = require('exceljs');

module.exports = {
  // Get financial reports with date range and period
  getFinancialReports: async (req, res) => {
    try {
      const { 
        period = 'daily', 
        startDate, 
        endDate,
        page = 1,
        limit = 50 
      } = req.query;

      // Set default date range if not provided
      const today = new Date();
      const defaultStartDate = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const defaultEndDate = endDate || today.toISOString().split('T')[0];

      // Build date filter for completed orders only
      const dateFilter = {
        status: 'Selesai', // Only completed orders
        createdAt: {
          [Op.between]: [
            new Date(defaultStartDate + 'T00:00:00.000Z'),
            new Date(defaultEndDate + 'T23:59:59.999Z')
          ]
        }
      };

      // Get completed orders with details
      const orders = await Order.findAll({
        where: dateFilter,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'category', 'price']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // Calculate summary statistics
      const totalRevenue = await Order.sum('total_price', {
        where: dateFilter
      }) || 0;

      const totalOrders = await Order.count({
        where: dateFilter
      });

      const totalDeliveryFees = await Order.sum('delivery_fee', {
        where: dateFilter
      }) || 0;

      // Calculate menu revenue (total - delivery fees)
      const menuRevenue = totalRevenue - totalDeliveryFees;

      // Get total approved expenses for the period
      const totalExpenses = await Expense.sum('amount', {
        where: {
          status: 'Approved',
          expense_date: {
            [Op.between]: [
              new Date(defaultStartDate + 'T00:00:00.000Z'),
              new Date(defaultEndDate + 'T23:59:59.999Z')
            ]
          }
        }
      }) || 0;

      // Calculate profit/loss
      const netProfit = totalRevenue - totalExpenses;

      // Get period-based breakdown - FIXED SQL queries
      let periodData = [];
      
      if (period === 'daily') {
        // Group by day - FIXED: Use "createdAt" instead of "created_at"
        const dailyStats = await sequelize.query(`
          SELECT 
            DATE("createdAt") as date,
            COUNT(*)::int as order_count,
            SUM("total_price")::int as total_revenue,
            SUM("delivery_fee")::int as delivery_fees,
            SUM("total_price" - "delivery_fee")::int as menu_revenue
          FROM "Orders" 
          WHERE status = 'Selesai' 
            AND "createdAt" BETWEEN :startDate AND :endDate
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
        `, {
          replacements: { 
            startDate: defaultStartDate + 'T00:00:00.000Z',
            endDate: defaultEndDate + 'T23:59:59.999Z'
          },
          type: sequelize.QueryTypes.SELECT
        });
        
        periodData = dailyStats;
      } else if (period === 'weekly') {
        // Group by week - FIXED: Use "createdAt" instead of "created_at"
        const weeklyStats = await sequelize.query(`
          SELECT 
            DATE_TRUNC('week', "createdAt") as week_start,
            COUNT(*)::int as order_count,
            SUM("total_price")::int as total_revenue,
            SUM("delivery_fee")::int as delivery_fees,
            SUM("total_price" - "delivery_fee")::int as menu_revenue
          FROM "Orders" 
          WHERE status = 'Selesai' 
            AND "createdAt" BETWEEN :startDate AND :endDate
          GROUP BY DATE_TRUNC('week', "createdAt")
          ORDER BY week_start DESC
        `, {
          replacements: { 
            startDate: defaultStartDate + 'T00:00:00.000Z',
            endDate: defaultEndDate + 'T23:59:59.999Z'
          },
          type: sequelize.QueryTypes.SELECT
        });
        
        periodData = weeklyStats;
      } else if (period === 'monthly') {
        // Group by month - FIXED: Use "createdAt" instead of "created_at"
        const monthlyStats = await sequelize.query(`
          SELECT 
            DATE_TRUNC('month', "createdAt") as month_start,
            COUNT(*)::int as order_count,
            SUM("total_price")::int as total_revenue,
            SUM("delivery_fee")::int as delivery_fees,
            SUM("total_price" - "delivery_fee")::int as menu_revenue
          FROM "Orders" 
          WHERE status = 'Selesai' 
            AND "createdAt" BETWEEN :startDate AND :endDate
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month_start DESC
        `, {
          replacements: { 
            startDate: defaultStartDate + 'T00:00:00.000Z',
            endDate: defaultEndDate + 'T23:59:59.999Z'
          },
          type: sequelize.QueryTypes.SELECT
        });
        
        periodData = monthlyStats;
      }

      // Get expenses by category for the period
      const expensesByCategory = await Expense.findAll({
        attributes: [
          'category',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          status: 'Approved',
          expense_date: {
            [Op.between]: [
              new Date(defaultStartDate + 'T00:00:00.000Z'),
              new Date(defaultEndDate + 'T23:59:59.999Z')
            ]
          }
        },
        group: ['category'],
        order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
      });

      // Get recent expenses
      const recentExpenses = await Expense.findAll({
        where: {
          status: 'Approved',
          expense_date: {
            [Op.between]: [
              new Date(defaultStartDate + 'T00:00:00.000Z'),
              new Date(defaultEndDate + 'T23:59:59.999Z')
            ]
          }
        },
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['expense_date', 'DESC']],
        limit: 10
      });
      const topMenus = await sequelize.query(`
        SELECT 
          m.name as menu_name,
          m.category,
          SUM(oi.quantity)::int as total_quantity,
          SUM(oi.quantity * oi.price)::int as total_revenue
        FROM "OrderItems" oi
        JOIN "Orders" o ON oi.order_id = o.id
        JOIN "Menus" m ON oi.menu_id = m.id
        WHERE o.status = 'Selesai' 
          AND o."createdAt" BETWEEN :startDate AND :endDate
        GROUP BY m.id, m.name, m.category
        ORDER BY total_revenue DESC
        LIMIT 10
      `, {
        replacements: { 
          startDate: defaultStartDate + 'T00:00:00.000Z',
          endDate: defaultEndDate + 'T23:59:59.999Z'
        },
        type: sequelize.QueryTypes.SELECT
      });

      // Calculate pagination info
      const totalCount = await Order.count({ where: dateFilter });
      const totalPages = Math.ceil(totalCount / limit);

      res.status(200).json({
        status: 'success',
        message: 'Financial reports retrieved successfully',
        data: {
          summary: {
            totalRevenue,
            menuRevenue,
            totalDeliveryFees,
            totalExpenses,
            netProfit,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
          },
          periodData,
          topMenus,
          expensesByCategory,
          recentExpenses,
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            period,
            startDate: defaultStartDate,
            endDate: defaultEndDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting financial reports:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve financial reports',
        error: error.message
      });
    }
  },

  // Export financial reports to Excel
  exportFinancialReports: async (req, res) => {
    try {
      const { 
        period = 'daily', 
        startDate, 
        endDate 
      } = req.query;

      // Set default date range
      const today = new Date();
      const defaultStartDate = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const defaultEndDate = endDate || today.toISOString().split('T')[0];

      const dateFilter = {
        status: 'Selesai',
        createdAt: {
          [Op.between]: [
            new Date(defaultStartDate + 'T00:00:00.000Z'),
            new Date(defaultEndDate + 'T23:59:59.999Z')
          ]
        }
      };

      // Get all approved expenses for export
      const expenses = await Expense.findAll({
        where: {
          status: 'Approved',
          expense_date: {
            [Op.between]: [
              new Date(defaultStartDate + 'T00:00:00.000Z'),
              new Date(defaultEndDate + 'T23:59:59.999Z')
            ]
          }
        },
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['expense_date', 'DESC']]
      });

      // Get all completed orders for export
      const orders = await Order.findAll({
        where: dateFilter,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'category', 'price']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      
      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Ringkasan');
      
      // Calculate summary data
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
      const totalDeliveryFees = orders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0);
      const menuRevenue = totalRevenue - totalDeliveryFees;
      const totalOrders = orders.length;
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Add summary headers and data
      summarySheet.addRow(['LAPORAN KEUANGAN DCM']);
      summarySheet.addRow([`Periode: ${defaultStartDate} - ${defaultEndDate}`]);
      summarySheet.addRow(['']);
      summarySheet.addRow(['Metrik', 'Nilai']);
      summarySheet.addRow(['Total Pesanan', totalOrders]);
      summarySheet.addRow(['Total Omset', totalRevenue]);
      summarySheet.addRow(['Pendapatan Menu', menuRevenue]);
      summarySheet.addRow(['Biaya Ongkir', totalDeliveryFees]);
      summarySheet.addRow(['Total Pengeluaran', totalExpenses]);
      summarySheet.addRow(['Keuntungan Bersih', netProfit]);
      summarySheet.addRow(['Rata-rata Nilai Pesanan', totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0]);

      // Style summary sheet
      summarySheet.getCell('A1').font = { bold: true, size: 16 };
      summarySheet.getCell('A2').font = { bold: true };
      summarySheet.getRow(4).font = { bold: true };
      summarySheet.columns = [
        { width: 25 },
        { width: 20 }
      ];

      // Orders Detail Sheet
      const ordersSheet = workbook.addWorksheet('Detail Pesanan');
      
      // Add headers for orders sheet
      const orderHeaders = [
        'No. Pesanan', 
        'Tanggal', 
        'Pelanggan', 
        'Email', 
        'Total Menu',
        'Ongkir', 
        'Total Bayar',
        'Alamat Pengiriman',
        'Area',
        'Status'
      ];
      ordersSheet.addRow(orderHeaders);
      
      // Add order data
      orders.forEach(order => {
        const menuTotal = (order.total_price || 0) - (order.delivery_fee || 0);
        ordersSheet.addRow([
          order.id,
          new Date(order.createdAt).toLocaleDateString('id-ID'),
          order.User?.name || 'N/A',
          order.User?.email || 'N/A',
          menuTotal,
          order.delivery_fee || 0,
          order.total_price || 0,
          order.delivery_address || 'N/A',
          order.delivery_area || 'N/A',
          order.status
        ]);
      });

      // Style orders sheet headers
      ordersSheet.getRow(1).font = { bold: true };
      ordersSheet.columns = [
        { width: 15 }, // No. Pesanan
        { width: 12 }, // Tanggal
        { width: 20 }, // Pelanggan
        { width: 25 }, // Email
        { width: 15 }, // Total Menu
        { width: 12 }, // Ongkir
        { width: 15 }, // Total Bayar
        { width: 30 }, // Alamat
        { width: 15 }, // Area
        { width: 12 }  // Status
      ];

      // Menu Items Detail Sheet
      const itemsSheet = workbook.addWorksheet('Detail Item');
      
      // Add headers for items sheet
      const itemHeaders = [
        'No. Pesanan',
        'Tanggal',
        'Pelanggan',
        'Nama Menu',
        'Kategori',
        'Harga Satuan',
        'Jumlah',
        'Subtotal'
      ];
      itemsSheet.addRow(itemHeaders);

      // Add item data
      orders.forEach(order => {
        if (order.OrderItems && order.OrderItems.length > 0) {
          order.OrderItems.forEach(item => {
            itemsSheet.addRow([
              order.id,
              new Date(order.createdAt).toLocaleDateString('id-ID'),
              order.User?.name || 'N/A',
              item.Menu?.name || `Menu ID: ${item.menu_id}`,
              item.Menu?.category || 'N/A',
              item.price || 0,
              item.quantity,
              (item.price || 0) * item.quantity
            ]);
          });
        }
      });

      // Style items sheet
      itemsSheet.getRow(1).font = { bold: true };
      itemsSheet.columns = [
        { width: 15 }, // No. Pesanan
        { width: 12 }, // Tanggal
        { width: 20 }, // Pelanggan
        { width: 25 }, // Nama Menu
        { width: 15 }, // Kategori
        { width: 15 }, // Harga Satuan
        { width: 10 }, // Jumlah
        { width: 15 }  // Subtotal
      ];

      // Expenses Sheet
      const expensesSheet = workbook.addWorksheet('Detail Pengeluaran');

      // Add headers for expenses sheet
      const expenseHeaders = [
        'Tanggal',
        'Judul',
        'Kategori',
        'Jumlah',
        'Supplier',
        'Metode Pembayaran',
        'Dibuat Oleh',
        'Catatan'
      ];
      expensesSheet.addRow(expenseHeaders);

      // Add expense data
      expenses.forEach(expense => {
        expensesSheet.addRow([
          new Date(expense.expense_date).toLocaleDateString('id-ID'),
          expense.title,
          expense.category,
          expense.amount || 0,
          expense.supplier || 'N/A',
          expense.payment_method,
          expense.CreatedBy?.name || 'N/A',
          expense.notes || 'N/A'
        ]);
      });

      // Style expenses sheet
      expensesSheet.getRow(1).font = { bold: true };
      expensesSheet.columns = [
        { width: 12 }, // Tanggal
        { width: 25 }, // Judul
        { width: 15 }, // Kategori
        { width: 15 }, // Jumlah
        { width: 20 }, // Supplier
        { width: 15 }, // Metode Pembayaran
        { width: 20 }, // Dibuat Oleh
        { width: 30 }  // Catatan
      ];

      // Set response headers for Excel download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=laporan-keuangan-${defaultStartDate}-${defaultEndDate}.xlsx`
      );

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exporting financial reports:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to export financial reports',
        error: error.message
      });
    }
  },

  // Get financial dashboard stats
  getFinancialDashboard: async (req, res) => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Today's revenue
      const todayRevenue = await Order.sum('total_price', {
        where: {
          status: 'Selesai',
          createdAt: {
            [Op.gte]: startOfToday
          }
        }
      }) || 0;

      // This month's revenue
      const thisMonthRevenue = await Order.sum('total_price', {
        where: {
          status: 'Selesai',
          createdAt: {
            [Op.gte]: thisMonth
          }
        }
      }) || 0;

      // Last month's revenue
      const lastMonthRevenue = await Order.sum('total_price', {
        where: {
          status: 'Selesai',
          createdAt: {
            [Op.between]: [lastMonth, lastMonthEnd]
          }
        }
      }) || 0;

      // Growth calculation
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2)
        : 0;

      // This month's orders count
      const thisMonthOrders = await Order.count({
        where: {
          status: 'Selesai',
          createdAt: {
            [Op.gte]: thisMonth
          }
        }
      });

      // Average order value this month
      const avgOrderValue = thisMonthOrders > 0 
        ? Math.round(thisMonthRevenue / thisMonthOrders)
        : 0;

      res.status(200).json({
        status: 'success',
        message: 'Financial dashboard retrieved successfully',
        data: {
          todayRevenue,
          thisMonthRevenue,
          lastMonthRevenue,
          monthlyGrowth: parseFloat(monthlyGrowth),
          thisMonthOrders,
          avgOrderValue
        }
      });

    } catch (error) {
      console.error('Error getting financial dashboard:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve financial dashboard',
        error: error.message
      });
    }
  }
};