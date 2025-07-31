const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Semua route financial hanya untuk admin
router.use(authenticate);
router.use(authorize(['admin']));

// Get financial reports with filters
router.get('/reports', financialController.getFinancialReports);

// Export financial reports to Excel
router.get('/export', financialController.exportFinancialReports);

// Get financial dashboard stats
router.get('/dashboard', financialController.getFinancialDashboard);

module.exports = router;