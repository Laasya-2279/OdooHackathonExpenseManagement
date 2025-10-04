const formatCurrency = (amount, currency = 'INR') => {
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'CAD $',
    'AUD': 'AUD $',
    'JPY': '¥',
    'CNY': '¥'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${parseFloat(amount).toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const getCurrencyByCountry = (country) => {
  const currencyMap = {
    'India': 'INR',
    'United States': 'USD',
    'United Kingdom': 'GBP',
    'Germany': 'EUR',
    'France': 'EUR',
    'Spain': 'EUR',
    'Italy': 'EUR',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Japan': 'JPY',
    'China': 'CNY',
    'Singapore': 'SGD',
    'UAE': 'AED',
    'Saudi Arabia': 'SAR'
  };
  
  return currencyMap[country] || 'USD';
};

const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const generateExpenseRef = (companyId, expenseId) => {
  const timestamp = Date.now().toString().slice(-6);
  return `EXP-${companyId}-${expenseId}-${timestamp}`;
};

const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
};

const buildPaginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

const sanitizeUser = (user) => {
  const sanitized = { ...user.toJSON() };
  delete sanitized.password;
  return sanitized;
};

const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const errorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    statusCode,
    ...(errors && { errors })
  };
};

const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  formatCurrency,
  getCurrencyByCountry,
  daysBetween,
  formatDate,
  generateExpenseRef,
  paginate,
  buildPaginationResponse,
  sanitizeUser,
  generatePassword,
  isValidEmail,
  errorResponse,
  successResponse,
  asyncHandler
};