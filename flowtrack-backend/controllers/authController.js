const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetLinkToMobile } = require('../utils/sendResetLinkToMobile');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, department, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      department,
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * NEW
 * @desc    Forgot password using registered mobile number (SMS/WhatsApp link)
 * @route   POST /api/auth/forgot-password-mobile
 *
 * Body: { phone }
 *
 * Security: Always return generic success message to avoid revealing if mobile exists.
 */
exports.forgotPasswordMobile = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || String(phone).trim().length < 6) {
      return res.status(400).json({ message: 'Please enter a valid registered mobile number' });
    }

    const cleanPhone = String(phone).trim();

    const user = await User.findOne({ phone: cleanPhone });

    // Always respond same message (do not reveal existence)
    const genericMsg = 'If this mobile number is registered, password reset link has been sent.';

    if (!user) {
      return res.json({ message: genericMsg });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token for DB storage
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 15 minutes expiry
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await user.save();

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendBase}/reset-password/${resetToken}`;

    // Send SMS/WhatsApp (or log in console if provider not configured)
    await sendResetLinkToMobile(cleanPhone, resetUrl);

    return res.json({ message: genericMsg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * NEW
 * @desc    Reset password using token
 * @route   PUT /api/auth/reset-password/:token
 *
 * Body: { newPassword, confirmPassword }
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token) return res.status(400).json({ message: 'Reset token is required' });

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    // Clear token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};