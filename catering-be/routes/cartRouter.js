const express = require("express");
const router = express.Router();
const cartController  = require('../controllers/cartController');
const { authenthicate } = require("../middleware/authMiddleware");

//For only user login
router.use(authenthicate);

router.get('/',cartController.getCart);
router.post('/add',cartController.addItem);
router.delete('/item/:id',cartController.removeItem);

module.exports = router;