const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.use(authenticate);
// User routes
router.post("/checkout", orderController.checkout);
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id/cancel", orderController.cancelOrder);

// Admin ubah status
router.put("/:id/status", authorize(["admin"]), orderController.updateStatus);

module.exports = router;
