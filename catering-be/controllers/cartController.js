const { where } = require("sequelize");
const { Cart, CartItem, Menu } = require("../models");

module.exports = {
  getCart: async (req, res) => {
    const cart = await Cart.findOne({
      where: { user_id: req.user.id },
      include: [{ model: CartItem, include: [Menu] }],
    });
    res.status(200).json(
      cart || {
        status: "Success",
        isSuccess: true,
        message: "Success get cart",
        items: [],
      }
    );
  },

  addItem: async (req, res) => {
    const { menu_id, quantity } = req.body;
    let cart = await Cart.findOne({ where: { user_id: req.user.id } });
    if (!cart) {
      cart = await Cart.create({ user_id: req.user.id });
    }

    let item = await CartItem.findOne({
      where: { cart_id: cart.id, menu_id },
    });
    if (item) {
      item.quantity += quantity;
      await item.save();
    } else {
      item = await CartItem.create({
        cart_id: cart.id,
        menu_id,
        quantity,
      });
    }

    res.status(200).json({
      status: "Success",
      isSuccess: true,
      message: "Success add item to cart",
      data: { cart },
    });
  },

  removeItem: async (req, res) => {
    const item = await CartItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    await item.destroy();
    res.json({
      status: "Success",
      isSuccess: true,
      message: "Item removed",
    });
  },
};
