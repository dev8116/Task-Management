function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 p-5 space-y-3">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full" />
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/3 mt-4" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      ))}
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
  );
}

function AvatarSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3">
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  );
}

const skeletonMap = {
  card: CardSkeleton,
  table: TableSkeleton,
  text: TextSkeleton,
  avatar: AvatarSkeleton,
};

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const SkeletonComponent = skeletonMap[type] ?? CardSkeleton;

  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
