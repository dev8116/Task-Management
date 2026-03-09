const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export default function LoadingSpinner({ size = 'md', message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <div
        className={`${sizeMap[size] ?? sizeMap.md} animate-spin rounded-full border-4 border-primary-500 border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}
