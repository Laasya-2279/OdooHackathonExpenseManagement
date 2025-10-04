const { ApprovalFlow, ApprovalHistory } = require('../models/ApprovalFlow');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Create approval flow
// @route   POST /api/approvals/flows
// @access  Private (Admin only)
const createApprovalFlow = async (req, res) => {
    try {
        const { name, minAmount, maxAmount, approvalLevels } = req.body;

        if (!name || minAmount === undefined || !approvalLevels) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (approvalLevels < 1 || approvalLevels > 5) {
            return res.status(400).json({
                success: false,
                message: 'Approval levels must be between 1 and 5'
            });
        }

        const overlapping = await ApprovalFlow.findOne({
            where: {
                companyId: req.user.companyId,
                isActive: true,
                [Op.or]: [
                    {
                        minAmount: { [Op.lte]: minAmount },
                        [Op.or]: [
                            { maxAmount: { [Op.gte]: minAmount } },
                            { maxAmount: null }
                        ]
                    },
                    {
                        minAmount: { [Op.lte]: maxAmount || 999999999 },
                        maxAmount: { [Op.gte]: maxAmount || 999999999 }
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: 'Approval flow with overlapping amount range already exists'
            });
        }

        const approvalFlow = await ApprovalFlow.create({
            name,
            minAmount,
            maxAmount: maxAmount || null,
            approvalLevels,
            companyId: req.user.companyId
        });

        res.status(201).json({
            success: true,
            message: 'Approval flow created successfully',
            data: approvalFlow
        });
    } catch (error) {
        console.error('Create approval flow error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating approval flow',
            error: error.message
        });
    }
};

// @desc    Get all approval flows
// @route   GET /api/approvals/flows
// @access  Private
const getAllApprovalFlows = async (req, res) => {
    try {
        const flows = await ApprovalFlow.findAll({
            where: { companyId: req.user.companyId },
            order: [['minAmount', 'ASC']]
        });

        res.json({
            success: true,
            count: flows.length,
            data: flows
        });
    } catch (error) {
        console.error('Get approval flows error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching approval flows',
            error: error.message
        });
    }
};

// @desc    Get pending approvals for current user
// @route   GET /api/approvals/pending
// @access  Private (Manager/Admin)
const getPendingApprovals = async (req, res) => {
    try {
        const pendingApprovals = await ApprovalHistory.findAll({
            where: {
                approverId: req.user.id,
                action: 'pending'
            },
            include: [
                {
                    association: 'expense',
                    where: { status: 'processing' },
                    include: [
                        { association: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }
                    ]
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            count: pendingApprovals.length,
            data: pendingApprovals
        });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending approvals',
            error: error.message
        });
    }
};

// @desc    Approve expense
// @route   POST /api/approvals/:expenseId/approve
// @access  Private (Manager/Admin)
const approveExpense = async (req, res) => {
    try {
        const { comments } = req.body;
        const expenseId = req.params.expenseId;

        const approval = await ApprovalHistory.findOne({
            where: {
                expenseId,
                approverId: req.user.id,
                action: 'pending'
            },
            include: [{ association: 'expense' }]
        });

        if (!approval) {
            return res.status(404).json({
                success: false,
                message: 'Pending approval not found or not authorized'
            });
        }

        const expense = approval.expense;

        if (expense.currentApprovalLevel !== approval.level) {
            return res.status(400).json({
                success: false,
                message: 'This is not the current approval level'
            });
        }

        await approval.update({
            action: 'approved',
            comments,
            actionDate: new Date()
        });

        const nextLevelApproval = await ApprovalHistory.findOne({
            where: {
                expenseId,
                level: approval.level + 1,
                action: 'pending'
            }
        });

        if (nextLevelApproval) {
            await expense.update({
                currentApprovalLevel: approval.level + 1
            });

            res.json({
                success: true,
                message: 'Expense approved. Moved to next approval level.',
                data: expense
            });
        } else {
            await expense.update({
                status: 'approved',
                currentApprovalLevel: approval.level
            });

            res.json({
                success: true,
                message: 'Expense fully approved!',
                data: expense
            });
        }
    } catch (error) {
        console.error('Approve expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving expense',
            error: error.message
        });
    }
};

// @desc    Reject expense
// @route   POST /api/approvals/:expenseId/reject
// @access  Private (Manager/Admin)
const rejectExpense = async (req, res) => {
    try {
        const { comments } = req.body;
        const expenseId = req.params.expenseId;

        if (!comments) {
            return res.status(400).json({
                success: false,
                message: 'Comments are required when rejecting an expense'
            });
        }

        const approval = await ApprovalHistory.findOne({
            where: {
                expenseId,
                approverId: req.user.id,
                action: 'pending'
            },
            include: [{ association: 'expense' }]
        });

        if (!approval) {
            return res.status(404).json({
                success: false,
                message: 'Pending approval not found or not authorized'
            });
        }

        const expense = approval.expense;

        if (expense.currentApprovalLevel !== approval.level) {
            return res.status(400).json({
                success: false,
                message: 'This is not the current approval level'
            });
        }

        await approval.update({
            action: 'rejected',
            comments,
            actionDate: new Date()
        });

        await expense.update({
            status: 'rejected',
            remarks: comments
        });

        await ApprovalHistory.update(
            { action: 'rejected', actionDate: new Date() },
            {
                where: {
                    expenseId,
                    action: 'pending'
                }
            }
        );

        res.json({
            success: true,
            message: 'Expense rejected',
            data: expense
        });
    } catch (error) {
        console.error('Reject expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting expense',
            error: error.message
        });
    }
};

// @desc    Update approval flow
// @route   PUT /api/approvals/flows/:id
// @access  Private (Admin only)
const updateApprovalFlow = async (req, res) => {
    try {
        const { name, minAmount, maxAmount, approvalLevels, isActive } = req.body;

        const flow = await ApprovalFlow.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!flow) {
            return res.status(404).json({
                success: false,
                message: 'Approval flow not found'
            });
        }

        await flow.update({
            name: name || flow.name,
            minAmount: minAmount !== undefined ? minAmount : flow.minAmount,
            maxAmount: maxAmount !== undefined ? maxAmount : flow.maxAmount,
            approvalLevels: approvalLevels || flow.approvalLevels,
            isActive: isActive !== undefined ? isActive : flow.isActive
        });

        res.json({
            success: true,
            message: 'Approval flow updated successfully',
            data: flow
        });
    } catch (error) {
        console.error('Update approval flow error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating approval flow',
            error: error.message
        });
    }
};

// @desc    Delete approval flow
// @route   DELETE /api/approvals/flows/:id
// @access  Private (Admin only)
const deleteApprovalFlow = async (req, res) => {
    try {
        const flow = await ApprovalFlow.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!flow) {
            return res.status(404).json({
                success: false,
                message: 'Approval flow not found'
            });
        }

        await flow.update({ isActive: false });

        res.json({
            success: true,
            message: 'Approval flow deactivated successfully'
        });
    } catch (error) {
        console.error('Delete approval flow error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting approval flow',
            error: error.message
        });
    }
};

module.exports = {
    createApprovalFlow,
    getAllApprovalFlows,
    getPendingApprovals,
    approveExpense,
    rejectExpense,
    updateApprovalFlow,
    deleteApprovalFlow
};