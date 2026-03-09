import { Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiMail } from 'react-icons/hi';

const CONFIG = {
  pending: {
    icon: <HiMail className="text-5xl text-blue-500 dark:text-blue-400" />,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    title: 'Verify your email',
    message: (email) => (
      <>
        We sent a verification link to{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
        Please check your inbox and click the link to activate your account.
      </>
    ),
    action: null,
  },
  success: {
    icon: <HiCheckCircle className="text-5xl text-green-500 dark:text-green-400" />,
    bg: 'bg-green-100 dark:bg-green-900/30',
    title: 'Email verified!',
    message: () => 'Your email address has been successfully verified. You can now sign in to your account.',
    action: (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        Go to Sign In
      </Link>
    ),
  },
  error: {
    icon: <HiXCircle className="text-5xl text-red-500 dark:text-red-400" />,
    bg: 'bg-red-100 dark:bg-red-900/30',
    title: 'Verification failed',
    message: () =>
      'The verification link is invalid or has expired. Please request a new verification email.',
    action: (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        Back to Sign In
      </Link>
    ),
  },
};

export default function EmailVerification({ status = 'pending', email }) {
  const cfg = CONFIG[status] ?? CONFIG.pending;

  return (
    <div className="flex flex-col items-center space-y-5 py-4 text-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${cfg.bg}`}>
        {cfg.icon}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{cfg.title}</h2>
        <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {typeof cfg.message === 'function' ? cfg.message(email) : cfg.message}
        </p>
      </div>

      {cfg.action && <div className="pt-2">{cfg.action}</div>}

      {status === 'pending' && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Didn't receive an email?{' '}
          <button
            type="button"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Resend verification email
          </button>
        </p>
      )}
    </div>
  );
}
