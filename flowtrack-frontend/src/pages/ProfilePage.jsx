import { useState } from 'react';
import PageTransition from '../layouts/PageTransition';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  employee: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleProfileSave = (e) => {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem('flowtrack_user') || '{}');
    const updated = { ...stored, name: profile.name, email: profile.email };
    localStorage.setItem('flowtrack_user', JSON.stringify(updated));
    setProfileMsg('Profile updated successfully.');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordMsg('Password changed successfully.');
    setPasswords({ current: '', next: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const roleBadgeClass = ROLE_COLORS[user?.role] || ROLE_COLORS.employee;

  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your account information
          </p>
        </div>

        {/* User info card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadgeClass}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Edit Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
            </div>
            {profileMsg && (
              <p className="text-sm text-green-600 dark:text-green-400">{profileMsg}</p>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
            {[
              { label: 'Current Password', key: 'current' },
              { label: 'New Password', key: 'next' },
              { label: 'Confirm New Password', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label}
                </label>
                <input
                  type="password"
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  required
                />
              </div>
            ))}
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.includes('successfully') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {passwordMsg}
              </p>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
