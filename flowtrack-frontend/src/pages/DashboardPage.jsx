import { useAuth } from '../context/AuthContext';
import PageTransition from '../layouts/PageTransition';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DASHBOARD_MAP = {
  admin: AdminDashboard,
  manager: ManagerDashboard,
  employee: EmployeeDashboard,
};

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  const RoleDashboard = DASHBOARD_MAP[user.role] || EmployeeDashboard;

  return (
    <PageTransition>
      <RoleDashboard />
    </PageTransition>
  );
}
