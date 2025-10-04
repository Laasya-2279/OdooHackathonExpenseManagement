const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Management API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      expenses: '/api/expenses',
      approvals: '/api/approvals'
    }
  });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/approvals', require('./routes/approval.routes'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;