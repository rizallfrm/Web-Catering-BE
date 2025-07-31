const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All expense routes require authentication
router.use(authenticate);

// Create expense (authenticated users)
router.post('/', expenseController.createExpense);

// Get all expenses with filters (authenticated users)
router.get('/', expenseController.getAllExpenses);

// Get expense statistics (authenticated users)
router.get('/stats', expenseController.getExpenseStats);

// Get expense by ID (authenticated users)
router.get('/:id', expenseController.getExpenseById);

// Update expense (creator or admin only)
router.put('/:id', expenseController.updateExpense);

// Delete expense (creator or admin only)
router.delete('/:id', expenseController.deleteExpense);

// Admin only routes
router.put('/:id/status', authorize(['admin']), expenseController.updateExpenseStatus);

module.exports = router;