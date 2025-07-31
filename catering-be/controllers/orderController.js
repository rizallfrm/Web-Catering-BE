const { v4: uuidv4 } = require("uuid");
const db = require("../models/index");
const AddressOngkirService = require("../services/addressOngkirService");
const ImageKit = require("imagekit");
const { Order, OrderItem, Cart, CartItem, Menu, User, sequelize } = db;

const ongkirService = new AddressOngkirService();
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.URL_ENDPOINT,
});

module.exports = {
  checkout: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        delivery_date,
        wa_number,
        delivery_address,
        delivery_fee,
        notes,
        items,
        weekly_schedule,
      } = req.body;

      // Validasi data wajib
      if (!wa_number || !delivery_address) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "WA number and address are required",
        });
      }

      // Auto-detect ongkir jika tidak dikirim dari frontend
      let calculatedDeliveryFee = 0;
      let detectedArea = null;
      let deliveryConfidence = "none";
      let deliveryMethod = "auto_detect";

      if (delivery_fee !== undefined) {
        // Validasi delivery_fee yang dikirim frontend
        const ongkirResult =
          ongkirService.detectOngkirFromAddress(delivery_address);
        const expectedFee = ongkirResult.fee;
        const receivedFee = parseInt(delivery_fee) || 0;

        if (Math.abs(receivedFee - expectedFee) > 1000) {
          // Toleransi 1000 rupiah
          await transaction.rollback();
          return res.status(400).json({
            status: "error",
            message: `Delivery fee mismatch. Expected: ${expectedFee}, Received: ${receivedFee}`,
            expected_fee: expectedFee,
            detected_area: ongkirResult.area_name,
          });
        }

        calculatedDeliveryFee = receivedFee;
        detectedArea = ongkirResult.area_name;
        deliveryConfidence = ongkirResult.confidence;
        deliveryMethod = ongkirResult.detection_method;
      } else {
        // Auto detect jika tidak ada delivery_fee
        const ongkirResult =
          ongkirService.detectOngkirFromAddress(delivery_address);
        calculatedDeliveryFee = ongkirResult.fee;
        detectedArea = ongkirResult.area_name;
        deliveryConfidence = ongkirResult.confidence;
        deliveryMethod = ongkirResult.detection_method;
      }

      // Validasi khusus untuk pesanan harian
      if (weekly_schedule && weekly_schedule.length > 0) {
        if (weekly_schedule.some((day) => !day.date || !day.time)) {
          await transaction.rollback();
          return res.status(400).json({
            status: "error",
            message: "All selected days must have date and time",
          });
        }
      } else if (!delivery_date) {
        // Validasi untuk pesanan biasa
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Delivery date is required for regular orders",
        });
      }

      // Pastikan user ada
      const user = await User.findByPk(req.user.id, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      // Debugging: Log data yang diterima
      console.log("Received checkout data:", {
        user: req.user,
        body: req.body,
        cartItems: items,
        calculatedDeliveryFee,
        detectedArea,
      });

      // Validasi items dari frontend
      if (!items || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Cart items are required",
        });
      }

      // Cek semua menu tersedia
      const menuIds = items.map((item) => item.menu_id);
      const menus = await Menu.findAll({
        where: { id: menuIds },
        transaction,
      });

      if (menus.length !== items.length) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Some menu items are not available",
        });
      }

      // Validasi minimum order
      for (const item of items) {
        const menu = menus.find((m) => m.id === item.menu_id);
        if (!menu) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Menu with ID ${item.menu_id} not found`,
          });
        }
        if (item.quantity < menu.min_order) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Minimum order for ${menu.name} is ${menu.min_order}`,
            min_order: menu.min_order,
            menu_id: item.menu_id,
          });
        }
      }

      // Hitung total menu
      let menuTotal = 0;
      for (const item of items) {
        const menu = menus.find((m) => m.id === item.menu_id);
        menuTotal += menu.price * item.quantity;
      }

      // Total keseluruhan (menu + ongkir)
      const totalPrice = menuTotal + calculatedDeliveryFee;

      // Buat order
      const order = await Order.create(
        {
          id: uuidv4(),
          user_id: req.user.id,
          status: "Menunggu Konfirmasi",
          payment_status: "Belum Bayar",
          total_price: totalPrice,
          proof_image_url: null,
          delivery_date: weekly_schedule?.[0]?.datetime || delivery_date,
          wa_number,
          delivery_address,
          delivery_notes: notes,
          delivery_status: "Menunggu Jadwal",
          weekly_schedule: weekly_schedule || null,
          // Tambahan field ongkir
          delivery_fee: calculatedDeliveryFee,
          delivery_area: detectedArea,
          delivery_confidence: deliveryConfidence,
          delivery_method: deliveryMethod,
        },
        { transaction }
      );

      // Buat order items
      for (const item of items) {
        const menu = menus.find((m) => m.id === item.menu_id);
        await OrderItem.create(
          {
            id: uuidv4(),
            order_id: order.id,
            menu_id: item.menu_id,
            quantity: item.quantity,
            price: menu.price,
          },
          { transaction }
        );
      }

      await transaction.commit();

      res.status(201).json({
        status: "success",
        message: "Pesanan berhasil dibuat, menunggu konfirmasi admin",
        data: {
          order,
          breakdown: {
            menu_total: menuTotal,
            delivery_fee: calculatedDeliveryFee,
            total_price: totalPrice,
            detected_area: detectedArea,
            delivery_confidence: deliveryConfidence,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error in checkout:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to process checkout",
        error: error.message,
      });
    }
  },

  // Fungsi untuk admin mengkonfirmasi pesanan
  confirmOrder: async (req, res) => {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== "Menunggu Konfirmasi") {
        return res.status(400).json({
          message: "Order cannot be confirmed in its current state",
        });
      }

      await order.update({
        status: "Dikonfirmasi",
        // Tambahkan field admin_id jika perlu melacak admin yang mengkonfirmasi
      });

      res.status(200).json({
        status: "success",
        message: "Order confirmed successfully",
        data: { order },
      });
    } catch (error) {
      console.error("Error confirming order:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to confirm order",
        error: error.message,
      });
    }
  },

  getMyOrders: async (req, res) => {
    try {
      const orders = await Order.findAll({
        where: { user_id: req.user.id },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ["id", "name", "price", "image_url"],
              },
              {
                model: Order,
                attributes: ["delivery_fee", "delivery_area"],
              },
            ],
          },
          {
            model: User,
            attributes: ["name", "phone", "address"],
          },
        ],
      });

      res.status(200).json({
        status: "success",
        message: "Orders retrieved successfully",
        data: { orders },
      });
    } catch (error) {
      console.error("Error in getMyOrders:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve orders",
        error: error.message,
      });
    }
  },

  // Upload payment proof dan fungsi lainnya tetap sama...
  uploadPaymentProof: async (req, res) => {
    try {
      const order = await Order.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== "Dikonfirmasi") {
        return res.status(400).json({
          message: "Payment proof can only be uploaded for confirmed orders",
        });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Payment proof file is required" });
      }

      const fileBuffer = req.file.buffer || fs.readFileSync(req.file.path);
      const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: `payment_${order.id}_${Date.now()}`,
        folder: "/payment_proofs",
      });

      await order.update({
        proof_image_url: uploadResponse.url,
        payment_status: "Menunggu Verifikasi",
        status: "Menunggu Verifikasi",
      });

      // Hapus file temporary jika ada
      if (req.file.path) fs.unlinkSync(req.file.path);

      res.status(200).json({
        status: "success",
        message: "Payment proof uploaded successfully",
        data: { proof_image_url: uploadResponse.url },
      });
    } catch (error) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      console.error("Error uploading payment proof:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to upload payment proof",
        error: error.message,
      });
    }
  },

  // Sisa method tetap sama seperti verifyPayment, updateDeliveryStatus, dll...
  verifyPayment: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: {
          id,
          payment_status: "Menunggu Verifikasi",
        },
        transaction,
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "Order not found or payment not awaiting verification",
        });
      }

      await order.update(
        {
          payment_status: "Sudah Dibayar",
          status: "Diproses",
          delivery_status: "Sedang Diproses",
        },
        { transaction }
      );

      await transaction.commit();

      res.status(200).json({
        status: "success",
        message: "Payment verified successfully",
        data: { order },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error verifying payment:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to verify payment",
        error: error.message,
      });
    }
  },

  updateDeliveryStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = [
        "Menunggu Jadwal",
        "Sedang Diproses",
        "Dalam Pengiriman",
        "Terkirim",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid delivery status" });
      }

      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await order.update({ delivery_status: status });

      if (status === "Terkirim") {
        await order.update({ status: "Selesai" });
      }

      res.status(200).json({
        status: "success",
        message: "Delivery status updated successfully",
        data: { order },
      });
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update delivery status",
        error: error.message,
      });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const order = await Order.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ["id", "name", "price", "image_url"],
              },
              {
                model: Order,
                attributes: ["delivery_fee", "delivery_area"],
              },
            ],
          },
          {
            model: User,
            attributes: ["name", "phone", "address"],
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      const orderData = order.toJSON();
      if (
        orderData.weekly_schedule &&
        typeof orderData.weekly_schedule === "string"
      ) {
        try {
          orderData.weekly_schedule = JSON.parse(orderData.weekly_schedule);
        } catch (parseError) {
          console.error("Error parsing weekly_schedule:", parseError);
          orderData.weekly_schedule = null;
        }
      }

      res.status(200).json({
        status: "success",
        data: {
          order: orderData,
        },
      });
    } catch (error) {
      console.error("Error getting order details:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve order details",
        error: error.message,
      });
    }
  },

  updateStatus: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Menunggu Konfirmasi",
        "Dikonfirmasi",
        "Menunggu Verifikasi",
        "Diproses",
        "Dikirim",
        "Selesai",
        "Dibatalkan",
      ];

      if (!allowedStatuses.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Invalid status value",
        });
      }

      const order = await Order.findByPk(id, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      if (status === "Dikonfirmasi" && order.payment_status !== "Belum Bayar") {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Order already has payment status",
        });
      }

      await order.update({ status }, { transaction });

      if (status === "Diproses") {
        if (order.payment_status !== "Sudah Dibayar") {
          await transaction.rollback();
          return res.status(400).json({
            status: "error",
            message: "Payment must be verified first",
          });
        }
        await order.update(
          { delivery_status: "Sedang Diproses" },
          { transaction }
        );
      } else if (status === "Dikirim") {
        await order.update(
          { delivery_status: "Dalam Pengiriman" },
          { transaction }
        );
      } else if (status === "Selesai") {
        await order.update({ delivery_status: "Terkirim" }, { transaction });
      } else if (status === "Dibatalkan") {
        await order.update(
          {
            payment_status: "Dibatalkan",
            delivery_status: "Dibatalkan",
          },
          { transaction }
        );
      }

      await transaction.commit();

      res.status(200).json({
        status: "success",
        message: "Order status updated successfully",
        data: { order },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating order status:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update order status",
        error: error.message,
      });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const order = await Order.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id,
        },
      });

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      if (order.status !== "Menunggu Konfirmasi") {
        return res.status(400).json({
          status: "error",
          message: "Only pending orders can be cancelled",
        });
      }

      await order.update({ status: "Dibatalkan" });

      res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        data: { order },
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to cancel order",
        error: error.message,
      });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.findAll({
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ["id", "name", "price", "image_url", "category"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        status: "success",
        message: "All orders retrieved successfully",
        data: {
          orders: orders,
        },
      });
    } catch (error) {
      console.error("Error getting all orders:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve orders",
        error: error.message,
      });
    }
  },
};
