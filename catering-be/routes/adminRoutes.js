const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// Router semua untuk admin
router.use(authenticate, authorize(["admin"]));

router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);
router.get("/orders", adminController.getAllOrders);


module.exports = router;