const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  assignManager,
  deleteUser
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

router.route('/')
  .post(createUser)
  .get(getAllUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/role', changeUserRole);
router.put('/:id/manager', assignManager);

module.exports = router;