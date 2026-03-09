import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 select-none">
        <span className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600">
          404
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Page Not Found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 text-sm">
        Sorry, we couldn&apos;t find the page you were looking for. It may have been moved or deleted.
      </p>

      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
      >
        Go Home
      </button>
    </div>
  );
}
