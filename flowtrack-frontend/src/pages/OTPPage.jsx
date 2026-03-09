import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import OTPVerification from '../components/auth/OTPVerification';

export default function OTPPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <AuthLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Verify your identity</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter the one-time code sent to{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{email || 'your email'}</span>
        </p>
        <OTPVerification email={email} />
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Back to{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
