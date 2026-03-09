import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiMail, HiExclamationCircle, HiCheckCircle, HiArrowLeft } from 'react-icons/hi';

export default function ForgotPasswordForm({ onSubmit, loading, error, success }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email });
  };

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <HiCheckCircle className="text-4xl text-green-500 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Check your inbox</h3>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            We sent a password reset link to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <HiArrowLeft />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <HiExclamationCircle className="shrink-0 text-lg" />
          <span>{error}</span>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="fp-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email address
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
            <HiMail className="text-lg" />
          </span>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Sending…
          </span>
        ) : (
          'Send Reset Link'
        )}
      </button>

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <HiArrowLeft />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
