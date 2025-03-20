const { v4: uuidv4 } = require('uuid');
const { Order, OrderItem, Cart, CartItem, Menu } = require("../models");

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
      message: "Order created! Silakan kirim bukti via WhatsApp",
      order,
    });
  },

  getMyOrders: async (req, res) => {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [OrderItem],
    });
    res.json(orders);
  },

  updateStatus: async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    await order.update({ status: req.body.status });
    res.json(order);
  },
};
