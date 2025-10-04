const express = require('express');
const router = express.Router();
const {
  createApprovalFlow,
  getAllApprovalFlows,
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  updateApprovalFlow,
  deleteApprovalFlow
} = require('../controller/approval.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin, isManagerOrAdmin } = require('../middleware/role.middleware');

router.use(protect);

router.route('/flows')
  .post(isAdmin, createApprovalFlow)
  .get(getAllApprovalFlows);

router.route('/flows/:id')
  .put(isAdmin, updateApprovalFlow)
  .delete(isAdmin, deleteApprovalFlow);

router.get('/pending', isManagerOrAdmin, getPendingApprovals);
router.post('/:expenseId/approve', isManagerOrAdmin, approveExpense);
router.post('/:expenseId/reject', isManagerOrAdmin, rejectExpense);

module.exports = router;