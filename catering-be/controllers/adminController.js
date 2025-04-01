const { User, Order, OrderItem, Menu } = require("../models");
const { Op } = require("sequelize");

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] },
      });
      res.status(200).json({
        isSuccess: true,
        status: "Success",
        message: "All users retrieved",
        data: { users },
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({
        isSuccess: false,
        status: "Error",
        message: "Failed to retrieve users",
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
                attributes: ["id", "name", "price", "image_url"],
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

  deleteUser: async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        isSuccess: false,
        status: "Error",
        message: "Failed to delete user",
      });
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      // Get total counts
      const totalUsers = await User.count();
      const totalMenus = await Menu.count();
      const totalOrders = await Order.count();

      // Get recent orders (last 7 days)
      const recentOrders = await Order.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get new users (last 7 days)
      const newUsers = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get recent activities
      const recentActivities = [];

      // Recent orders
      const latestOrders = await Order.findAll({
        include: [
          {
            model: User,
            attributes: ["name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      latestOrders.forEach((order) => {
        recentActivities.push({
          id: `order-${order.id}`,
          type: "order",
          message: `Pesanan baru #${order.id} dari ${
            order.User?.name || order.User?.email || "Guest"
          }`,
          timestamp: order.createdAt,
        });
      });

      // Recent users
      const latestUsers = await User.findAll({
        attributes: ["id", "name", "email", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      latestUsers.forEach((user) => {
        recentActivities.push({
          id: `user-${user.id}`,
          type: "user",
          message: `Pengguna baru terdaftar: ${user.name || user.email}`,
          timestamp: user.createdAt,
        });
      });

      // Recent menus
      const latestMenus = await Menu.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      latestMenus.forEach((menu) => {
        recentActivities.push({
          id: `menu-${menu.id}`,
          type: "menu",
          message: `Menu "${menu.name}" ditambahkan`,
          timestamp: menu.createdAt,
        });
      });

      // Sort activities by timestamp (newest first)
      recentActivities.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Limit to 10 activities
      const limitedActivities = recentActivities.slice(0, 10);

      // Return dashboard stats
      res.status(200).json({
        isSuccess: true,
        status: "Success",
        message: "Dashboard stats retrieved",
        data: {
          counts: {
            users: totalUsers,
            menus: totalMenus,
            orders: totalOrders,
            recentOrders,
            newUsers,
          },
          recentActivities: limitedActivities,
        },
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({
        isSuccess: false,
        status: "Error",
        message: "Failed to retrieve dashboard stats",
      });
    }
  },

  // Tambahan fungsi untuk update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, isActive } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          isSuccess: false,
          status: "Failed",
          message: "User not found",
        });
      }

      // Update user data
      await user.update({
        name,
        email,
        role,
        isActive,
      });

      // Return updated user without password
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      res.status(200).json({
        isSuccess: true,
        status: "Success",
        message: "User updated successfully",
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({
        isSuccess: false,
        status: "Error",
        message: "Failed to update user",
      });
    }
  },

  // Fungsi untuk mengubah role user
  changeUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({
          isSuccess: false,
          status: "Failed",
          message: "Invalid role. Must be 'user' or 'admin'",
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          isSuccess: false,
          status: "Failed",
          message: "User not found",
        });
      }

      await user.update({ role });

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      res.status(200).json({
        isSuccess: true,
        status: "Success",
        message: "User role updated successfully",
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error("Error changing user role:", error);
      res.status(500).json({
        isSuccess: false,
        status: "Error",
        message: "Failed to change user role",
      });
    }
  },

  // Fungsi untuk mengubah status user (active/inactive)
  changeUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          isSuccess: false,
          status: "Failed",
          message: "isActive must be a boolean value",
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          isSuccess: false,
          status: "Failed",
          message: "User not found",
        });
      }

      await user.update({ isActive });

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      res.status(200).json({
        isSuccess: true,
        status: "Success",
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error("Error changing user status:", error);
      res.status(500).json({
        isSuccess: false,
        status: "Error",
        message: "Failed to change user status",
      });
    }
  },
};
