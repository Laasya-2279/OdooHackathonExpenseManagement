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
} = require('../controllers/approval.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin, isManagerOrAdmin } = require('../middleware/role.middleware');

// All routes require authentication
router.use(protect);

// Approval flow management (Admin only)
router.route('/flows')
  .post(isAdmin, createApprovalFlow)
  .get(getAllApprovalFlows);

router.route('/flows/:id')
  .put(isAdmin, updateApprovalFlow)
  .delete(isAdmin, deleteApprovalFlow);

// Approval actions (Manager/Admin)
router.get('/pending', isManagerOrAdmin, getPendingApprovals);
router.post('/:expenseId/approve', isManagerOrAdmin, approveExpense);
router.post('/:expenseId/reject', isManagerOrAdmin, rejectExpense);

module.exports = router;