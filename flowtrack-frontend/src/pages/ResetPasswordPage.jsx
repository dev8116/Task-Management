import { useParams, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const { token } = useParams();

  return (
    <AuthLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Set new password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your new password must be different from your previous password.
        </p>
        <ResetPasswordForm token={token} />
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
