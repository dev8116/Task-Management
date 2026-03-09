import { useState, useMemo } from 'react';
import { HiLockClosed, HiEye, HiEyeOff, HiExclamationCircle } from 'react-icons/hi';

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-400' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

export default function ResetPasswordForm({ onSubmit, loading, error }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ confirm: false });

  const strength = useMemo(() => getStrength(password), [password]);
  const mismatch = touched.confirm && confirm && password !== confirm;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) return;
    onSubmit({ password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <HiExclamationCircle className="shrink-0 text-lg" />
          <span>{error}</span>
        </div>
      )}

      {/* New password */}
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          New password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
            <HiLockClosed className="text-lg" />
          </span>
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
          </button>
        </div>

        {/* Strength bar */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password strength:{' '}
              <span
                className={
                  strength.label === 'Strong'
                    ? 'font-medium text-green-600 dark:text-green-400'
                    : strength.label === 'Fair'
                    ? 'font-medium text-yellow-600 dark:text-yellow-400'
                    : 'font-medium text-red-600 dark:text-red-400'
                }
              >
                {strength.label}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
            <HiLockClosed className="text-lg" />
          </span>
          <input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            placeholder="••••••••"
            className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
              mismatch
                ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
          </button>
        </div>
        {mismatch && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match.</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !!mismatch || !password || !confirm}
        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Resetting…
          </span>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
}
