const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const orderController = require("../controllers/orderController");

// Router semua untuk admin
router.use(authenticate);
router.use(authenticate, authorize(["admin"]));

router.get("/dashboard", adminController.getDashboardStats);
router.put("/users/:id", adminController.updateUser);
router.put("/users/:id/role", adminController.changeUserRole);
router.put("/users/:id/status", adminController.changeUserStatus);
router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);

// Order Management
router.get("/orders", adminController.getAllOrders);

module.exports = router;