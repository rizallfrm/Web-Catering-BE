const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { authenthicate, authorize } = require("../middleware/authMiddleware");

router.get("/", menuController.getAll);
router.get("/:id", menuController.getById);

// Only admin for CRUD menu
router.post("/", menuController.create);
router.put("/:id", menuController.update);
// router.post("/", authenthicate, authorize(["admin"]), menuController.create);
// router.put("/:id", authenthicate, authorize(["admin"]), menuController.update);
router.delete(
  "/:id",
  authenthicate,
  authorize(["admin"]),
  menuController.delete
);

module.exports = router;
