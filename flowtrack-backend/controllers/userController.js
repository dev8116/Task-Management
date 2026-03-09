const { validationResult } = require('express-validator');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

// GET /api/users — Admin only, paginated, filterable by role/department
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;

    const [data, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/users — Admin only
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, role, department });

    await logActivity(req.user._id, 'CREATE_USER', `Created user ${user.email}`, req.ip);

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/profile — Get current user's profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile — Update current user's profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const allowed = ['name', 'department', 'profileImage'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    await logActivity(req.user._id, 'UPDATE_PROFILE', `Updated own profile`, req.ip);

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id — Admin, Manager, or self
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === req.params.id;

    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id — Admin only
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const allowed = ['name', 'department', 'role', 'profileImage'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logActivity(req.user._id, 'UPDATE_USER', `Updated user ${user.email}`, req.ip);

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — Admin only
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logActivity(req.user._id, 'DELETE_USER', `Deleted user ${user.email}`, req.ip);

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/upload-avatar — Admin or self
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const isAdminOrSelf =
      req.user.role === 'admin' || req.user._id.toString() === req.params.id;
    if (!isAdminOrSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profileImage: imagePath },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logActivity(req.user._id, 'UPLOAD_AVATAR', `Avatar updated for user ${user.email}`, req.ip);

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getProfile,
  updateProfile,
  getUserById,
  updateUser,
  deleteUser,
  uploadAvatar,
};
