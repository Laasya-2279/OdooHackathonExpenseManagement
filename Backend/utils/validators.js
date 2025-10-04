const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

const validateSignup = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),

    body('companyName')
        .trim()
        .notEmpty().withMessage('Company name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Company name must be 2-100 characters'),

    body('country')
        .optional()
        .trim()
        .isLength({ max: 100 }),

    handleValidationErrors
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

const validateCreateUser = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['employee', 'manager']).withMessage('Role must be employee or manager'),

    body('managerId')
        .optional()
        .isInt({ min: 1 }).withMessage('Manager ID must be a positive integer'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 }),

    handleValidationErrors
];

const validateCreateExpense = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description too long'),

    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['travel', 'food', 'accommodation', 'transportation', 'supplies', 'other'])
        .withMessage('Invalid category'),

    body('date')
        .notEmpty().withMessage('Date is required')
        .isDate().withMessage('Must be a valid date (YYYY-MM-DD)'),

    body('receipt')
        .optional()
        .trim()
        .isLength({ max: 500 }),

    handleValidationErrors
];

const validateUpdateExpense = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }),

    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

    body('category')
        .optional()
        .isIn(['travel', 'food', 'accommodation', 'transportation', 'supplies', 'other'])
        .withMessage('Invalid category'),

    body('date')
        .optional()
        .isDate().withMessage('Must be a valid date'),

    handleValidationErrors
];

// Approval flow validation rules
const validateCreateApprovalFlow = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),

    body('minAmount')
        .notEmpty().withMessage('Minimum amount is required')
        .isFloat({ min: 0 }).withMessage('Minimum amount must be 0 or greater'),

    body('maxAmount')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('Maximum amount must be 0 or greater'),

    body('approvalLevels')
        .notEmpty().withMessage('Approval levels is required')
        .isInt({ min: 1, max: 5 }).withMessage('Approval levels must be between 1 and 5'),

    handleValidationErrors
];

const validateApprovalAction = [
    body('comments')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Comments too long'),

    handleValidationErrors
];

const validateIdParam = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),

    handleValidationErrors
];

const validateExpenseIdParam = [
    param('expenseId')
        .isInt({ min: 1 }).withMessage('Invalid expense ID'),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateSignup,
    validateLogin,
    validateCreateUser,
    validateCreateExpense,
    validateUpdateExpense,
    validateCreateApprovalFlow,
    validateApprovalAction,
    validateIdParam,
    validateExpenseIdParam
};