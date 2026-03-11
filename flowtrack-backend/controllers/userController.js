const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all users
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('manager', 'name email')
      .populate('teamMembers', 'name email department')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('manager', 'name email')
      .populate('teamMembers', 'name email department');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team members of a manager
// @route   GET /api/users/team/:managerId
exports.getTeamMembers = async (req, res) => {
  try {
    const managerId = req.params.managerId;
    const employees = await User.find({ manager: managerId, role: 'employee' })
      .select('-password')
      .sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my team (for logged-in manager)
// @route   GET /api/users/my-team
exports.getMyTeam = async (req, res) => {
  try {
    const employees = await User.find({ manager: req.user._id, role: 'employee' })
      .select('-password')
      .sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user
// @route   POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, manager } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      phone,
      manager: (role === 'employee' && manager) ? manager : null,
    });

    // If employee has a manager, add employee to manager's teamMembers
    if (role === 'employee' && manager) {
      await User.findByIdAndUpdate(manager, {
        $addToSet: { teamMembers: user._id },
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_USER',
      description: `Created ${role} "${user.name}"${manager ? ' and assigned to manager' : ''}`,
      entity: 'User',
      entityId: user._id,
    });

    const returnUser = await User.findById(user._id)
      .select('-password')
      .populate('manager', 'name email');
    res.status(201).json(returnUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, department, phone, isActive, manager } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldManagerId = user.manager ? user.manager.toString() : null;
    const newManagerId = manager || null;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    // Handle manager reassignment for employees
    if (user.role === 'employee' && manager !== undefined) {
      // Remove from old manager's teamMembers
      if (oldManagerId && oldManagerId !== newManagerId) {
        await User.findByIdAndUpdate(oldManagerId, {
          $pull: { teamMembers: user._id },
        });
      }

      // Add to new manager's teamMembers
      if (newManagerId && newManagerId !== oldManagerId) {
        await User.findByIdAndUpdate(newManagerId, {
          $addToSet: { teamMembers: user._id },
        });
      }

      user.manager = newManagerId;
    }

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 12);
    }

    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE_USER',
      description: `Updated user "${user.name}"`,
      entity: 'User',
      entityId: user._id,
    });

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('manager', 'name email')
      .populate('teamMembers', 'name email department');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email === 'admin@flowtrack.com') {
      return res.status(400).json({ message: 'Cannot delete default admin account' });
    }

    // If deleting an employee, remove from manager's teamMembers
    if (user.role === 'employee' && user.manager) {
      await User.findByIdAndUpdate(user.manager, {
        $pull: { teamMembers: user._id },
      });
    }

    // If deleting a manager, unset manager field from all their employees
    if (user.role === 'manager') {
      await User.updateMany(
        { manager: user._id },
        { $set: { manager: null } }
      );
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_USER',
      description: `Deleted user "${user.name}"`,
      entity: 'User',
      entityId: user._id,
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};