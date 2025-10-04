const Expense = require('../models/Expense');
const User = require('../models/User');
const { ApprovalFlow, ApprovalHistory } = require('../models/ApprovalFlow');
const { Op } = require('sequelize');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        const { title, description, amount, category, date, receipt } = req.body;

        if (!title || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const expense = await Expense.create({
            title,
            description,
            amount,
            currency: req.user.company.currency,
            category,
            date,
            receipt,
            userId: req.user.id,
            companyId: req.user.companyId,
            status: 'pending',
            currentApprovalLevel: 0
        });

        const approvalFlow = await ApprovalFlow.findOne({
            where: {
                companyId: req.user.companyId,
                isActive: true,
                minAmount: { [Op.lte]: amount },
                [Op.or]: [
                    { maxAmount: { [Op.gte]: amount } },
                    { maxAmount: null }
                ]
            },
            order: [['minAmount', 'DESC']]
        });

        if (approvalFlow) {
            const approvers = [];
            let currentApprover = req.user.managerId;

            for (let level = 1; level <= approvalFlow.approvalLevels; level++) {
                if (currentApprover) {
                    approvers.push(currentApprover);

                    const approver = await User.findByPk(currentApprover);
                    currentApprover = approver?.managerId;
                } else {
                    const admin = await User.findOne({
                        where: {
                            companyId: req.user.companyId,
                            role: 'admin',
                            isActive: true
                        }
                    });

                    if (admin && !approvers.includes(admin.id)) {
                        approvers.push(admin.id);
                    } else if (!admin) {
                        await expense.destroy();
                        return res.status(400).json({
                            success: false,
                            message: `Cannot find approver for level ${level}`
                        });
                    } else {
                        approvers.push(admin.id);
                    }
                }
            }

            if (approvers.length < approvalFlow.approvalLevels) {
                await expense.destroy();
                return res.status(400).json({
                    success: false,
                    message: 'Not enough approvers available for this approval flow'
                });
            }

            const approvalRecords = approvers.map((approverId, index) => ({
                expenseId: expense.id,
                approverId,
                level: index + 1,
                action: 'pending'
            }));

            await ApprovalHistory.bulkCreate(approvalRecords);

            await expense.update({
                status: 'processing',
                currentApprovalLevel: 1
            });
        }

        const createdExpense = await Expense.findByPk(expense.id, {
            include: [
                { association: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: createdExpense
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating expense',
            error: error.message
        });
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getAllExpenses = async (req, res) => {
    try {
        const { status, category, startDate, endDate } = req.query;

        let whereClause = { companyId: req.user.companyId };

        if (req.user.role === 'employee') {
            whereClause.userId = req.user.id;
        } else if (req.user.role === 'manager') {

            const subordinates = await User.findAll({
                where: { managerId: req.user.id },
                attributes: ['id']
            });
            const subordinateIds = subordinates.map(s => s.id);
            whereClause.userId = { [Op.in]: [req.user.id, ...subordinateIds] };
        }

        if (status) whereClause.status = status;
        if (category) whereClause.category = category;
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date[Op.gte] = startDate;
            if (endDate) whereClause.date[Op.lte] = endDate;
        }

        const expenses = await Expense.findAll({
            where: whereClause,
            include: [
                { association: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expenses',
            error: error.message
        });
    }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            },
            include: [
                { association: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
                {
                    association: 'approvalHistory',
                    include: [
                        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] }
                    ],
                    order: [['level', 'ASC']]
                }
            ]
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        if (req.user.role === 'employee' && expense.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this expense'
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expense',
            error: error.message
        });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        const { title, description, amount, category, date, receipt } = req.body;

        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
                companyId: req.user.companyId
            }
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found or not authorized'
            });
        }

        if (expense.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update expense that is already in processing or completed'
            });
        }

        await expense.update({
            title: title || expense.title,
            description: description !== undefined ? description : expense.description,
            amount: amount || expense.amount,
            category: category || expense.category,
            date: date || expense.date,
            receipt: receipt !== undefined ? receipt : expense.receipt
        });

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: expense
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating expense',
            error: error.message
        });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
                companyId: req.user.companyId
            }
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found or not authorized'
            });
        }

        if (expense.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete expense that is already in processing or completed'
            });
        }

        await expense.destroy();

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting expense',
            error: error.message
        });
    }
};

module.exports = {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense
};