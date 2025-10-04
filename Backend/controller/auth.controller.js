const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken } = require('../middleware/auth.middleware');
const { getCurrencyByCountry } = require('../utils/helpers');

// @desc    Register first user (Creates Company + Admin)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, companyName, country } = req.body;

        if (!firstName || !lastName || !email || !password || !companyName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const currency = getCurrencyByCountry(country || 'India');

        const company = await Company.create({
            name: companyName,
            currency,
            country: country || 'India'
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: 'admin',
            companyId: company.id
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'Company and admin user created successfully',
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                company: {
                    id: company.id,
                    name: company.name,
                    currency: company.currency,
                    country: company.country
                },
                token
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        const user = await User.findOne({
            where: { email },
            include: [{ association: 'company' }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    department: user.department
                },
                company: {
                    id: user.company.id,
                    name: user.company.name,
                    currency: user.company.currency
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { association: 'company' },
                { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};

module.exports = {
    signup,
    login,
    getMe
};