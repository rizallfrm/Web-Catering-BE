const { v4: uuidv4 } = require("uuid");
const db = require("../models/index");

const { Order, OrderItem, Cart, CartItem, Menu, User, sequelize } = db;
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.URL_ENDPOINT,
});
module.exports = {
  checkout: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { delivery_date, wa_number, delivery_address, notes, items } =
        req.body;
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
      });

      // Validasi data pengiriman
      if (!delivery_date || !wa_number || !delivery_address) {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Delivery date, WA number, and address are required",
        });
      }

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

      // Buat order
      const order = await Order.create(
        {
          id: uuidv4(),
          user_id: req.user.id,
          status: "Menunggu Konfirmasi",
          payment_status: "Belum Bayar",
          total_price: 0,
          proof_image_url: null,
          delivery_date,
          wa_number,
          delivery_address,
          delivery_notes: notes,
          delivery_status: "Menunggu Jadwal",
        },
        { transaction }
      );

      // Hitung total dan buat order items
      let total = 0;
      for (const item of items) {
        const menu = menus.find((m) => m.id === item.menu_id);
        total += menu.price * item.quantity;
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

      await order.update({ total_price: total }, { transaction });
      await transaction.commit();

      res.status(201).json({
        status: "success",
        message: "Pesanan berhasil dibuat, menunggu konfirmasi admin",
        data: { order },
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

      // Kirim notifikasi ke customer untuk melakukan pembayaran
      // Implementasi notifikasi tergantung sistem Anda (WhatsApp/email/SMS)

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
  // Fungsi untuk customer mengupload bukti pembayaran
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
      });

      // Hapus file temporary jika ada
      if (req.file.path) fs.unlinkSync(req.file.path);

      // Notifikasi admin untuk verifikasi pembayaran

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

  // Fungsi untuk admin memverifikasi pembayaran
  // Verify Payment
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

      // Update status pembayaran dan order
      await order.update(
        {
          payment_status: "Sudah Dibayar",
          status: "Diproses",
          delivery_status: "Sedang Diproses",
        },
        { transaction }
      );

      await transaction.commit();

      // // Kirim notifikasi ke user
      // await sendNotification(order.user_id, {
      //   title: "Pembayaran Diverifikasi",
      //   message: `Pembayaran untuk pesanan #${order.id} telah diverifikasi`,
      //   type: "payment_verified",
      // });

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
  // Fungsi untuk update status pengiriman
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

      // Jika status pengiriman berubah menjadi "Terkirim", update juga status order
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
            ],
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          order: {
            ...order.toJSON(),
            payment_proof_url: order.payment_proof_url,
          },
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

  // Update Status Order
  updateStatus: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validasi status
      const allowedStatuses = [
        "Menunggu Konfirmasi",
        "Dikonfirmasi",
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

      // Temukan order
      const order = await Order.findByPk(id, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      // Validasi alur status
      if (status === "Dikonfirmasi" && order.payment_status !== "Belum Bayar") {
        await transaction.rollback();
        return res.status(400).json({
          status: "error",
          message: "Order already has payment status",
        });
      }

      // Update status
      await order.update({ status }, { transaction });

      // Handle status khusus
      if (status === "Dikonfirmasi") {
        // Kirim notifikasi ke user untuk upload bukti bayar
        // await sendNotification(order.user_id, {
        //   title: "Pesanan Dikonfirmasi",
        //   message: `Silakan upload bukti pembayaran untuk pesanan #${order.id}`,
        //   type: "order_confirmed",
        // });
      } else if (status === "Diproses") {
        // Pastikan pembayaran sudah diverifikasi
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

      // Check if the order is in 'pending' status
      if (order.status !== "pending") {
        return res.status(400).json({
          status: "error",
          message: "Only pending orders can be cancelled",
        });
      }

      // Update the order status to 'cancelled'
      await order.update({ status: "cancelled" });

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
