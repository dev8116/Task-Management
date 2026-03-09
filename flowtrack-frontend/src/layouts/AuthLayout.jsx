import { Link } from 'react-router-dom';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              FlowTrack
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Streamline your workflow
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
