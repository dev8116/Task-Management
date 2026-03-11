import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiUser, FiMail, FiPhone, FiBriefcase, FiShield,
  FiLock, FiEdit2, FiSave, FiX, FiEye, FiEyeOff
} from 'react-icons/fi';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user: authUser, login } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
  });

  // Password section
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/users/profile/me');
      setProfile(data);
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.department || '',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset form to current profile values
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      department: profile.department || '',
    });
  };

  // Save profile info (name, email, phone, department)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const { data } = await API.put('/users/update-profile', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
      });
      setProfile(data.user);
      setEditMode(false);
      toast.success('Profile updated successfully!');

      // Update localStorage so navbar/topbar reflects new name/email
      const stored = JSON.parse(localStorage.getItem('flowtrack_user'));
      if (stored) {
        stored.name = data.user.name;
        stored.email = data.user.email;
        localStorage.setItem('flowtrack_user', JSON.stringify(stored));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Save new password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await API.put('/users/update-profile', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-badge admin';
      case 'manager': return 'role-badge manager';
      case 'employee': return 'role-badge employee';
      default: return 'role-badge';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header-bar">
        <h2>
          <FiUser style={{ marginRight: 8 }} />
          My Profile
        </h2>
        <p>Manage your personal information and account security</p>
      </div>

      <div className="profile-grid">
        {/* ── LEFT: Avatar + Role Card ── */}
        <div className="profile-card profile-avatar-card">
          <div className="avatar-circle">
            {profile?.avatar
              ? <img src={profile.avatar} alt="avatar" className="avatar-img" />
              : <span>{getInitials(profile?.name)}</span>
            }
          </div>
          <h3>{profile?.name}</h3>
          <span className={getRoleBadgeClass(profile?.role)}>
            <FiShield style={{ marginRight: 4 }} />
            {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
          </span>
          <div className="profile-meta">
            {profile?.department && (
              <div className="meta-item">
                <FiBriefcase />
                <span>{profile.department}</span>
              </div>
            )}
            {profile?.manager && (
              <div className="meta-item">
                <FiUser />
                <span>Manager: {profile.manager.name}</span>
              </div>
            )}
          </div>
          <div className="account-status">
            <span className={profile?.isActive ? 'status-active' : 'status-inactive'}>
              {profile?.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>
          <p className="joined-date">
            Joined: {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })
              : '—'}
          </p>
        </div>

        {/* ── RIGHT: Edit Form ── */}
        <div className="profile-right">
          {/* Personal Info */}
          <div className="profile-card">
            <div className="card-header">
              <h3>
                <FiEdit2 style={{ marginRight: 6 }} />
                Personal Information
              </h3>
              {!editMode ? (
                <button className="btn-edit" onClick={() => setEditMode(true)}>
                  <FiEdit2 /> Edit
                </button>
              ) : (
                <button className="btn-cancel" onClick={handleCancelEdit}>
                  <FiX /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-grid">
                {/* Name */}
                <div className="form-group">
                  <label>
                    <FiUser className="label-icon" /> Full Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  ) : (
                    <div className="field-display">{profile?.name || '—'}</div>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>
                    <FiMail className="label-icon" /> Email Address
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  ) : (
                    <div className="field-display">{profile?.email || '—'}</div>
                  )}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label>
                    <FiPhone className="label-icon" /> Phone Number
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="field-display">{profile?.phone || '—'}</div>
                  )}
                </div>

                {/* Department */}
                <div className="form-group">
                  <label>
                    <FiBriefcase className="label-icon" /> Department
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Engineering, HR, Marketing"
                    />
                  ) : (
                    <div className="field-display">{profile?.department || '—'}</div>
                  )}
                </div>

                {/* Role — READ ONLY always */}
                <div className="form-group">
                  <label>
                    <FiShield className="label-icon" /> Role
                  </label>
                  <div className="field-display readonly">
                    {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                    <span className="readonly-hint">Cannot be changed here</span>
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={saving}>
                    <FiSave />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password */}
          <div className="profile-card">
            <div className="card-header">
              <h3>
                <FiLock style={{ marginRight: 6 }} />
                Change Password
              </h3>
            </div>
            <form onSubmit={handleSavePassword}>
              <div className="form-grid">
                {/* Old Password */}
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showOldPw ? 'text' : 'password'}
                      name="oldPassword"
                      value={passwordForm.oldPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowOldPw(!showOldPw)}
                    >
                      {showOldPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowNewPw(!showNewPw)}
                    >
                      {showNewPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                    >
                      {showConfirmPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={changingPassword}>
                  <FiLock />
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;