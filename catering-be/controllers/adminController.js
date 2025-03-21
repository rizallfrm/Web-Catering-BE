const { User, Order, OrderItem, Menu } = require("../models");

module.exports = {
  getAllUsers: async (req, res) => {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.status(200).json({
      isSuccess: true,
      status: "Success",
      message: "All users retrieved",
      data: { users },
    });
  },

  getAllOrders: async (req, res) => {
    const orders = await Order.findAll({
      include: [OrderItem],
    });
    res.status(200).json({
      isSuccess: true,
      status: "Success",
      message: "All orders retrieved",
      data: { orders },
    });
  },

  deleteUser: async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({
        isSuccess: false,
        status: "Failed",
        message: "User not found",
      });

    await user.destroy();
    res.status(200).json({
      isSuccess: true,
      status: "Success",
      message: "User deleted",
    });
  },

  
};
