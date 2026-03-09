import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SearchFilter from '../../components/SearchFilter';
import { getStatusClass, getPriorityClass } from '../../utils/helpers';
import axiosInstance from '../../api/axiosInstance';

export default function ManagerProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get('/projects');
        const allProjects = res.data?.data || res.data || [];
        setProjects(allProjects.filter((p) => p.managerId === (user._id || user.id)));
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    fetchProjects();
  }, [user]);

  const filtered = projects.filter((p) => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Projects assigned to you</p>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search projects..."
        filters={[{ key: 'status', label: 'All Status', value: statusFilter, options: ['Pending', 'In Progress', 'Completed'] }]}
        onFilterChange={(k, v) => setStatusFilter(v)}
      />

      {filtered.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">No projects assigned to you yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p._id || p.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                <span className={getPriorityClass(p.priority)}>{p.priority}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{p.description}</p>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold">{p.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={getStatusClass(p.status)}>{p.status}</span>
                <span className="text-xs text-gray-400">Due: {p.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
