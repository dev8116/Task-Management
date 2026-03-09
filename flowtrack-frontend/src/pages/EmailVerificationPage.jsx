import { useParams, useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import EmailVerification from '../components/auth/EmailVerification';

export default function EmailVerificationPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || '';

  return (
    <AuthLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Email Verification</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Verifying your email address, please wait…
        </p>
        <EmailVerification token={token} status={status} />
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already verified?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
