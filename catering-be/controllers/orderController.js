const { v4: uuidv4 } = require("uuid");
const { Order, OrderItem, Cart, CartItem, Menu, User } = require("../models");

module.exports = {
  checkout: async (req, res) => {
    const cart = await Cart.findOne({
      where: { user_id: req.user.id },
      include: [CartItem],
    });

    if (!cart || cart.CartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = await Order.create({
      user_id: req.user.id,
      status: "pending",
      total_price: 0, // akan diupdate
      payment_proof_url: "", // kirim manual via WhatsApp
    });

    let total = 0;
    for (const item of cart.CartItems) {
      const menu = await Menu.findByPk(item.menu_id);
      total += menu.price * item.quantity;
      await OrderItem.create({
        id: uuidv4(), // tambahkan ini
        order_id: order.id,
        menu_id: item.menu_id,
        quantity: item.quantity,
        price: menu.price,
      });
    }

    order.total_price = total;
    await order.save();

    // Kosongkan keranjang
    await CartItem.destroy({ where: { cart_id: cart.id } });

    res.status(201).json({
      status: "success",
      message: "Order created! Silakan kirim bukti via WhatsApp",
      data: { order },
    });
  },

  getMyOrders: async (req, res) => {
    try {
      console.log("User ID:", req.user.id);

      // First, try a simple query without includes
      const orders = await Order.findAll({
        where: { user_id: req.user.id },
        order: [["createdAt", "DESC"]],
      });

      console.log("Found orders:", orders.length);

      // Return basic data
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
        stack: error.stack,
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
                attributes: ["id", "name", "price", "image_url",],
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
        data: { order },
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
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      await order.update({ status: req.body.status });

      res.status(200).json({
        status: "success",
        message: `Order status updated to ${req.body.status}`,
        data: { order },
      });
    } catch (error) {
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
                attributes: ["id", "name", "price", "image_url",],
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
