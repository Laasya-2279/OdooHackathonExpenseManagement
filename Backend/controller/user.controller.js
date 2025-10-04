const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Create new user (employee/manager)
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, managerId, department } = req.body;

        if (!firstName || !lastName || !email || !password || !role) {
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

        if (!['employee', 'manager'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either employee or manager'
            });
        }

        // If managerId provided, verify manager exists
        if (managerId) {
            const manager = await User.findByPk(managerId);
            if (!manager || manager.companyId !== req.user.companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid manager'
                });
            }
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role,
            companyId: req.user.companyId,
            managerId: managerId || null,
            department
        });

        const createdUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: createdUser
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// @desc    Get all users in company
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { companyId: req.user.companyId },
            attributes: { exclude: ['password'] },
            include: [
                { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            },
            attributes: { exclude: ['password'] },
            include: [
                { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { association: 'subordinates', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, department } = req.body;

        const user = await User.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        // Update user
        await user.update({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            email: email || user.email,
            department: department !== undefined ? department : user.department
        });

        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// @desc    Change user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !['employee', 'manager'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be employee or manager'
            });
        }

        const user = await User.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change admin role'
            });
        }

        await user.update({ role });

        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing user role',
            error: error.message
        });
    }
};

// @desc    Assign manager to user
// @route   PUT /api/users/:id/manager
// @access  Private (Admin only)
const assignManager = async (req, res) => {
    try {
        const { managerId } = req.body;

        const user = await User.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (managerId) {
            const manager = await User.findOne({
                where: {
                    id: managerId,
                    companyId: req.user.companyId
                }
            });

            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: 'Manager not found'
                });
            }

            if (managerId === user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'User cannot be their own manager'
                });
            }
        }

        await user.update({ managerId: managerId || null });

        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });

        res.json({
            success: true,
            message: managerId ? 'Manager assigned successfully' : 'Manager removed successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Assign manager error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning manager',
            error: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        await user.update({ isActive: false });

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    changeUserRole,
    assignManager,
    deleteUser
};