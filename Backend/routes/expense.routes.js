const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controller/expense.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .post(createExpense)
  .get(getAllExpenses);

router.route('/:id')
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;