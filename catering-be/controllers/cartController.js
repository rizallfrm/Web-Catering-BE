const db = require("../models");

const { Cart, CartItem, Menu, sequelize } = db;

module.exports = {
  getCart: async (req, res) => {
    try {
      const cart = await Cart.findOne({
        where: { id: req.user.id },
        include: [
          {
            model: CartItem,
            include: [Menu],
            attributes: ["id", "quantity", "menu_id"],
          },
        ],
        attributes: ["id", "id"],
      });

      if (!cart) {
        // Jika cart belum ada, kembalikan cart kosong
        return res.status(200).json({
          status: "Success",
          isSuccess: true,
          message: "Success get cart",
          data: {
            cart: {
              // id: null,
              id: req.user.id,
              items: [],
            },
          },
        });
      }

      // Format response dengan lebih baik
      const formattedItems = cart.CartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        menu_id: item.menu_id, 
        Menu: {
          id: item.Menu.id,
          name: item.Menu.name,
          price: item.Menu.price,
          image_url: item.Menu.image_url,
          category: item.Menu.category,
          min_order: item.Menu.min_order,
        },
      }));

      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Success get cart",
        data: {
          cart: {
            id: cart.id,
            id: cart.id,
            items: formattedItems,
          },
        },
      });
    } catch (error) {
      console.error("Error getting cart:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to get cart",
        error: error.message,
      });
    }
  },

  addItem: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { menu_id, quantity } = req.body;

      // Validasi input
      if (!menu_id || !quantity || quantity < 1) {
        await transaction.rollback();
        return res.status(400).json({
          status: "Error",
          isSuccess: false,
          message: "menu_id and valid quantity are required",
        });
      }

      // Cek apakah menu ada dan tersedia
      const menu = await Menu.findByPk(menu_id, { transaction });
      if (!menu || !menu.available) {
        await transaction.rollback();
        return res.status(404).json({
          status: "Error",
          isSuccess: false,
          message: "Menu not found or not available",
        });
      }

      // Validasi minimum order
      const validatedQuantity = Math.max(quantity, menu.min_order);

      // Cari atau buat cart
      let cart = await Cart.findOne({
        where: { id: req.user.id },
        transaction,
      });

      if (!cart) {
        cart = await Cart.create({ id: req.user.id }, { transaction });
      }

      // Cari item di cart
      let cartItem = await CartItem.findOne({
        where: { cart_id: cart.id, menu_id },
        transaction,
      });

      if (cartItem) {
        // Jika item sudah ada, update quantity
        cartItem.quantity += validatedQuantity;
        await cartItem.save({ transaction });
      } else {
        // Jika item belum ada, buat baru
        cartItem = await CartItem.create(
          {
            cart_id: cart.id,
            menu_id,
            quantity: validatedQuantity,
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Dapatkan cart terbaru untuk response
      const updatedCart = await Cart.findOne({
        where: { id: cart.id },
        include: [{ model: CartItem, include: [Menu] }],
      });

      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Item added to cart successfully",
        data: { cart: updatedCart },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error adding item to cart:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to add item to cart",
        error: error.message,
      });
    }
  },

  removeItem: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const itemId = req.params.id;

      // Cari cart user
      const cart = await Cart.findOne({
        where: { id: req.user.id },
        transaction,
      });

      if (!cart) {
        await transaction.rollback();
        return res.status(404).json({
          status: "Error",
          isSuccess: false,
          message: "Cart not found",
        });
      }

      // Cari item di cart user
      const item = await CartItem.findOne({
        where: {
          id: itemId,
          cart_id: cart.id,
        },
        transaction,
      });

      if (!item) {
        await transaction.rollback();
        return res.status(404).json({
          status: "Error",
          isSuccess: false,
          message: "Item not found in cart",
        });
      }

      // Hapus item
      await item.destroy({ transaction });
      await transaction.commit();

      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Item removed from cart successfully",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error removing item from cart:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to remove item from cart",
        error: error.message,
      });
    }
  },

  updateItemQuantity: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const itemId = req.params.id;
      const { quantity } = req.body;

      // Validasi input
      if (!quantity || quantity < 1) {
        await transaction.rollback();
        return res.status(400).json({
          status: "Error",
          isSuccess: false,
          message: "Valid quantity is required (minimum 1)",
        });
      }

      // Cari cart user
      const cart = await Cart.findOne({
        where: { id: req.user.id },
        transaction,
      });

      if (!cart) {
        await transaction.rollback();
        return res.status(404).json({
          status: "Error",
          isSuccess: false,
          message: "Cart not found",
        });
      }

      // Cari item di cart user
      const cartItem = await CartItem.findOne({
        where: {
          id: itemId,
          cart_id: cart.id,
        },
        include: [Menu],
        transaction,
      });

      if (!cartItem) {
        await transaction.rollback();
        return res.status(404).json({
          status: "Error",
          isSuccess: false,
          message: "Item not found in cart",
        });
      }

      // Validasi minimum order
      const validatedQuantity = Math.max(quantity, cartItem.Menu.min_order);

      // Update quantity
      await cartItem.update({ quantity: validatedQuantity }, { transaction });
      await transaction.commit();

      // Dapatkan cart terbaru untuk response
      const updatedCart = await Cart.findOne({
        where: { id: cart.id },
        include: [{ model: CartItem, include: [Menu] }],
      });

      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Item quantity updated successfully",
        data: { cart: updatedCart },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating item quantity:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to update item quantity",
        error: error.message,
      });
    }
  },
};
