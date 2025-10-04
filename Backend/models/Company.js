const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
    comment: 'ISO 4217 currency code (USD, EUR, INR, etc.)'
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies',
  timestamps: true
});

module.exports = Company;