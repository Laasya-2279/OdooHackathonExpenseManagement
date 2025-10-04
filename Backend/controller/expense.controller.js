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

    // Validation
    if (!title || !amount || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create expense
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

    // Find matching approval flow
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
      // Create approval history entries
      let currentApprover = req.user.managerId;
      
      for (let level = 1; level <= approvalFlow.approvalLevels; level++) {
        if (currentApprover) {
          await ApprovalHistory.create({
            expenseId: expense.id,
            approverId: currentApprover,
            level,
            action: 'pending'
          });

          // Get next level approver (manager's manager)
          const approver = await User.findByPk(currentApprover);
          currentApprover = approver?.managerId;
        }
      }

      // Update expense to processing
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

    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees see only their expenses
      whereClause.userId = req.user.id;
    } else if (req.user.role === 'manager') {
      // Managers see their expenses and their subordinates' expenses
      const subordinates = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(s => s.id);
      whereClause.userId = { [Op.in]: [req.user.id, ...subordinateIds] };
    }
    // Admin sees all expenses in company

    // Apply filters
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

    // Check access rights
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

    // Only pending expenses can be updated
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

    // Only pending expenses can be deleted
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