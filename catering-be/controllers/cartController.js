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
    try {
      const { menu_id, quantity } = req.body;

      // Validasi format UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!menu_id || typeof menu_id !== "string" || !uuidRegex.test(menu_id)) {
        return res.status(400).json({
          status: "Error",
          isSuccess: false,
          message: "Invalid menu_id format. Must be a valid UUID.",
        });
      }

      // Cari atau buat cart
      let cart = await Cart.findOne({ where: { user_id: req.user.id } });
      if (!cart) {
        cart = await Cart.create({ user_id: req.user.id });
      }

      // Cari item di cart
      let item = await CartItem.findOne({
        where: { cart_id: cart.id, menu_id },
      });

      // Update quantity atau buat item baru
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

      // Respons sukses
      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Success add item to cart",
        data: { cart },
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to add item to cart",
      });
    }
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

  updateItemQuantity: async (req, res) => {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }

      // Find the user's cart
      const cart = await Cart.findOne({
        where: { user_id: userId },
      });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Check if item exists and belongs to user's cart
      const cartItem = await CartItem.findOne({
        where: {
          id: itemId,
          cart_id: cart.id,
        },
      });

      if (!cartItem) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      // Update the quantity
      cartItem.quantity = quantity;
      await cartItem.save();

      // Return the updated cart
      const updatedCart = await getUserCart(userId);

      return res.status(200).json({
        message: "Item quantity updated successfully",
        cart: {
          id: updatedCart.id,
          user_id: updatedCart.user_id,
          items: updatedCart.CartItems || [],
        },
      });
    } catch (error) {
      console.error("Error updating item quantity:", error);
      return res
        .status(500)
        .json({ message: "Failed to update item quantity" });
    }
  },
};
