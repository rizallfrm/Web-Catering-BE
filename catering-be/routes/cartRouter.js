const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/authMiddleware");

//For only user login
router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/add", cartController.addItem);
router.delete("/item/:id", cartController.removeItem);
router.put("/item/:id", cartController.updateItemQuantity);
module.exports = router;
