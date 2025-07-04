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
router.get("/orders", orderController.getAllOrders);
router.put("/orders/:id/confirm", orderController.confirmOrder)
router.put("/orders/:id/verify-payment", orderController.verifyPayment)
router.put("/orders/:id/delivery-status", orderController.updateDeliveryStatus)

module.exports = router;