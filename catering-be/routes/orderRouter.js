const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

router.use(authenticate);
// User route
router.post("/checkout", orderController.checkout);
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id/cancel", orderController.cancelOrder);

router.post(
  "/:id/payment-proof",
  upload.single("payment_proof"),
  orderController.uploadPaymentProof
);

// Admin ubah status
router.put("/:id/status", authorize(["admin"]), orderController.updateStatus);

module.exports = router;
