const express = require('express');
const router = express.Router();
const smartDeliveryController = require('../controllers/smartDeliveryController');

// Smart delivery routes
router.post('/calculate-fee', smartDeliveryController.autoDetectOngkir);
router.post('/validate', smartDeliveryController.validateAddress);
router.get('/suggest', smartDeliveryController.getAddressSuggestions);
router.get('/areas', smartDeliveryController.getDeliveryAreas);

module.exports = router;