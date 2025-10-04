const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Expense = require('./Expense');

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
  }
}, {
  tableName: 'approval_history',
  timestamps: true
});

// Associations
ApprovalFlow.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(ApprovalFlow, { foreignKey: 'companyId', as: 'approvalFlows' });

ApprovalHistory.belongsTo(Expense, { foreignKey: 'expenseId', as: 'expense' });
ApprovalHistory.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

Expense.hasMany(ApprovalHistory, { foreignKey: 'expenseId', as: 'approvalHistory' });
User.hasMany(ApprovalHistory, { foreignKey: 'approverId', as: 'approvals' });

module.exports = {
  ApprovalFlow,
  ApprovalHistory
};