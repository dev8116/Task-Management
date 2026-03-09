import { useState, useEffect } from 'react';

const QUOTES = [
  'Great things are done by a series of small things brought together.',
  'The secret of getting ahead is getting started.',
  'Success is not the key to happiness. Happiness is the key to success.',
  "Hard work beats talent when talent doesn't work hard.",
  'Strive not to be a success, but rather to be of value.',
  "Don't watch the clock; do what it does. Keep going.",
  'The only way to do great work is to love what you do.',
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDateTime(date) {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { dateStr, timeStr };
}

export default function WelcomeBanner({ user }) {
  const [now, setNow] = useState(new Date());
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { dateStr, timeStr } = formatDateTime(now);
  const roleLabelMap = { admin: 'Administrator', manager: 'Manager', employee: 'Employee' };
  const roleLabel = roleLabelMap[user?.role] ?? user?.role ?? 'User';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg shadow-blue-500/20">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 right-24 h-32 w-32 rounded-full bg-white/10" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold sm:text-2xl">
              {getGreeting()}, {user?.name ?? 'there'}!
            </h2>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
              {roleLabel}
            </span>
          </div>
          <p className="text-sm text-blue-100">
            {dateStr} &bull; {timeStr}
          </p>
          <p className="max-w-md text-sm italic text-blue-100">"{quote}"</p>
        </div>
      </div>
    </div>
  );
}
