import { useState, useEffect } from 'react';
import SearchFilter from '../../components/SearchFilter';
import axiosInstance from '../../api/axiosInstance';
import { HiOutlineUser, HiOutlineFolder, HiOutlineClipboardList, HiOutlineClock, HiOutlineCalendar } from 'react-icons/hi';

const typeIcons = {
  user: HiOutlineUser,
  project: HiOutlineFolder,
  task: HiOutlineClipboardList,
  attendance: HiOutlineClock,
  leave: HiOutlineCalendar,
};

const typeColors = {
  user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  project: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  task: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  attendance: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  leave: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function ActivityLogs() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/activity-logs');
        const data = res.data?.data || res.data || [];
        setLogs([...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchSearch = (l.user || '').toLowerCase().includes(search.toLowerCase()) || (l.action || '').toLowerCase().includes(search.toLowerCase()) || (l.target || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || l.type === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all system activities</p>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search logs..."
        filters={[{ key: 'type', label: 'All Types', value: typeFilter, options: ['User', 'Project', 'Task', 'Attendance', 'Leave'] }]}
        onFilterChange={(k, v) => setTypeFilter(v)}
      />

      {loading ? (
        <div className="card text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">No activity logs found</div>
          ) : (
            filtered.map((log) => {
              const Icon = typeIcons[log.type] || HiOutlineClipboardList;
              return (
                <div key={log._id || log.id} className="card flex items-start gap-4 py-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[log.type] || ''}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{log.user}</span> {log.action}
                    </p>
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{log.target}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${typeColors[log.type] || ''}`}>{log.type}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
