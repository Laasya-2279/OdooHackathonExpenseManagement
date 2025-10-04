const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Expense = require('./Expense');

// Approval Flow Template with Advanced Rules
const ApprovalFlow = sequelize.define('ApprovalFlow', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    minAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    maxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'NULL means no upper limit'
    },
    approvalLevels: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Number of approval levels required'
    },
    isManagerApprover: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether manager approval is required first'
    },
    approvalRule: {
        type: DataTypes.ENUM('sequential', 'percentage', 'specific_approver', 'hybrid'),
        defaultValue: 'sequential',
        comment: 'Type of approval rule'
    },
    percentageRequired: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Percentage of approvers required (for percentage rule)'
    },
    specificApproverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Specific approver who can auto-approve (CFO, Director, etc.)'
    },
    approverSequence: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of user IDs in approval sequence [{userId, step, role}]'
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies',
            key: 'id'
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'approval_flows',
    timestamps: true
});

// Approval History with Extended Fields
const ApprovalHistory = sequelize.define('ApprovalHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    expenseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'expenses',
            key: 'id'
        }
    },
    approverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Approval level (1, 2, 3, etc.)'
    },
    step: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Step in sequence (if using sequential approval)'
    },
    action: {
        type: DataTypes.ENUM('approved', 'rejected', 'pending'),
        allowNull: false,
        defaultValue: 'pending'
    },
    comments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    actionDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isAutoApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this was auto-approved by specific approver rule'
    }
}, {
    tableName: 'approval_history',
    timestamps: true
});

// Associations
ApprovalFlow.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
ApprovalFlow.belongsTo(User, { foreignKey: 'specificApproverId', as: 'specificApprover' });
Company.hasMany(ApprovalFlow, { foreignKey: 'companyId', as: 'approvalFlows' });

ApprovalHistory.belongsTo(Expense, { foreignKey: 'expenseId', as: 'expense' });
ApprovalHistory.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

Expense.hasMany(ApprovalHistory, { foreignKey: 'expenseId', as: 'approvalHistory' });
User.hasMany(ApprovalHistory, { foreignKey: 'approverId', as: 'approvals' });

module.exports = {
    ApprovalFlow,
    ApprovalHistory
};