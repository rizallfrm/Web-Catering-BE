const express= require("express");
const router = express.Router();
const orderController = require('../controllers/orderController')
const {authenthicate, authorize} = require('../middleware/authMiddleware')

router.use(authenthicate);
router.post('/checkout', orderController.checkout)
router.post('/my-orders',orderController.getMyOrders)

// Admin ubah status
router.put('/:id/status', authorize(['admin']), orderController.updateStatus);

module.exports = router;