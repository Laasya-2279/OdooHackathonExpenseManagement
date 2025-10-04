const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Company = require('./Company');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('travel', 'food', 'accommodation', 'transportation', 'supplies', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing'),
    allowNull: false,
    defaultValue: 'pending'
  },
  currentApprovalLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current approval level (0 = not started, 1 = first level, etc.)'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  receipt: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL or path to receipt file'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'expenses',
  timestamps: true
});

// Associations
Expense.belongsTo(User, { foreignKey: 'userId', as: 'employee' });
Expense.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });
Company.hasMany(Expense, { foreignKey: 'companyId', as: 'expenses' });

module.exports = Expense;