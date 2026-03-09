import { motion } from 'framer-motion';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

export default function StatsCard({ title, value, icon: Icon, color = 'blue', trend, subtitle }) {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    pink: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
    teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
  };

  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/50 rounded-xl shadow-xl p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-800 dark:text-gray-100 tabular-nums truncate">
            {value}
          </p>

          {/* Trend */}
          {trend !== undefined && trend !== null && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <HiTrendingUp className="text-green-500 dark:text-green-400 text-base shrink-0" />
              ) : (
                <HiTrendingDown className="text-red-500 dark:text-red-400 text-base shrink-0" />
              )}
              <span
                className={`text-xs font-medium ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {trend}%
              </span>
              {subtitle && (
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</span>
              )}
            </div>
          )}

          {!trend && subtitle && (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorMap[color] ?? colorMap.blue}`}>
            <Icon className="text-2xl" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
