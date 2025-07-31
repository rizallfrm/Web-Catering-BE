const { v4: uuidv4 } = require("uuid");
const { Expense, User, sequelize } = require("../models/index");
const { Op } = require("sequelize");

module.exports = {
  // Create new expense
  createExpense: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        title,
        description,
        amount,
        category,
        expense_date,
        supplier,
        payment_method,
        notes
      } = req.body;

      // Validation
      if (!title || !amount || !expense_date) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Title, amount, and expense_date are required"
        });
      }

      // Create expense
      const expense = await Expense.create({
        id: uuidv4(),
        title,
        description,
        amount: parseInt(amount),
        category: category || 'Lainnya',
        expense_date: new Date(expense_date),
        supplier,
        payment_method: payment_method || 'Cash',
        notes,
        created_by: req.user.id,
        status: 'Pending'
      }, { transaction });

      await transaction.commit();

      // Get expense with relations
      const expenseWithRelations = await Expense.findByPk(expense.id, {
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json({
        status: "success",
        message: "Expense created successfully",
        data: { expense: expenseWithRelations }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error creating expense:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to create expense",
        error: error.message
      });
    }
  },

  // Get all expenses with filters
  getAllExpenses: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        startDate,
        endDate,
        search
      } = req.query;

      // Build where conditions
      const whereConditions = {};

      if (category) {
        whereConditions.category = category;
      }

      if (status) {
        whereConditions.status = status;
      }

      if (startDate && endDate) {
        whereConditions.expense_date = {
          [Op.between]: [
            new Date(startDate + 'T00:00:00.000Z'),
            new Date(endDate + 'T23:59:59.999Z')
          ]
        };
      }

      if (search) {
        whereConditions[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { supplier: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const expenses = await Expense.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['expense_date', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // Get total count for pagination
      const totalCount = await Expense.count({ where: whereConditions });
      const totalPages = Math.ceil(totalCount / limit);

      res.status(200).json({
        status: "success",
        message: "Expenses retrieved successfully",
        data: {
          expenses,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error("Error getting expenses:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve expenses",
        error: error.message
      });
    }
  },

  // Get expense by ID
  getExpenseById: async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await Expense.findByPk(id, {
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!expense) {
        return res.status(404).json({
          status: "error",
          message: "Expense not found"
        });
      }

      res.status(200).json({
        status: "success",
        message: "Expense retrieved successfully",
        data: { expense }
      });

    } catch (error) {
      console.error("Error getting expense:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve expense",
        error: error.message
      });
    }
  },

  // Update expense
  updateExpense: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const updateData = req.body;

      const expense = await Expense.findByPk(id, { transaction });

      if (!expense) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "Expense not found"
        });
      }

      // Check permission (only creator or admin can update)
      if (expense.created_by !== req.user.id && req.user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({
          status: "error",
          message: "Not authorized to update this expense"
        });
      }

      // Update expense
      await expense.update(updateData, { transaction });

      await transaction.commit();

      // Get updated expense with relations
      const updatedExpense = await Expense.findByPk(id, {
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(200).json({
        status: "success",
        message: "Expense updated successfully",
        data: { expense: updatedExpense }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error updating expense:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update expense",
        error: error.message
      });
    }
  },

  // Delete expense
  deleteExpense: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const expense = await Expense.findByPk(id, { transaction });

      if (!expense) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "Expense not found"
        });
      }

      // Check permission (only creator or admin can delete)
      if (expense.created_by !== req.user.id && req.user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({
          status: "error",
          message: "Not authorized to delete this expense"
        });
      }

      await expense.destroy({ transaction });
      await transaction.commit();

      res.status(200).json({
        status: "success",
        message: "Expense deleted successfully"
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting expense:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to delete expense",
        error: error.message
      });
    }
  },

  // Approve/Reject expense (Admin only)
  updateExpenseStatus: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Invalid status. Must be 'Approved' or 'Rejected'"
        });
      }

      const expense = await Expense.findByPk(id, { transaction });

      if (!expense) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "Expense not found"
        });
      }

      // Update status
      await expense.update({
        status,
        approved_by: req.user.id,
        notes: notes || expense.notes
      }, { transaction });

      await transaction.commit();

      // Get updated expense with relations
      const updatedExpense = await Expense.findByPk(id, {
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(200).json({
        status: "success",
        message: `Expense ${status.toLowerCase()} successfully`,
        data: { expense: updatedExpense }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error updating expense status:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update expense status",
        error: error.message
      });
    }
  },

  // Get expense statistics
  getExpenseStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const today = new Date();
      const defaultStartDate = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const defaultEndDate = endDate || today.toISOString().split('T')[0];

      const dateFilter = {
        status: 'Approved',
        expense_date: {
          [Op.between]: [
            new Date(defaultStartDate + 'T00:00:00.000Z'),
            new Date(defaultEndDate + 'T23:59:59.999Z')
          ]
        }
      };

      // Total expenses
      const totalExpenses = await Expense.sum('amount', {
        where: dateFilter
      }) || 0;

      // Expenses by category
      const expensesByCategory = await Expense.findAll({
        attributes: [
          'category',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: dateFilter,
        group: ['category'],
        order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
      });

      // Pending approvals count
      const pendingCount = await Expense.count({
        where: { status: 'Pending' }
      });

      res.status(200).json({
        status: "success",
        message: "Expense statistics retrieved successfully",
        data: {
          totalExpenses,
          expensesByCategory,
          pendingCount,
          period: {
            startDate: defaultStartDate,
            endDate: defaultEndDate
          }
        }
      });

    } catch (error) {
      console.error("Error getting expense stats:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve expense statistics",
        error: error.message
      });
    }
  }
}; 