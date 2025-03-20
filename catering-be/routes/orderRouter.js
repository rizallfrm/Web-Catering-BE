const express= require("express");
const router = express.Router();
const orderController = require('../controllers/orderController')
const {authenticate, authorize} = require('../middleware/authMiddleware')

router.use(authenticate);
router.post('/checkout', orderController.checkout)
router.post('/my-orders',orderController.getMyOrders)

// Admin ubah status
router.put('/:id/status', authorize(['admin']), orderController.updateStatus);

module.exports = router;