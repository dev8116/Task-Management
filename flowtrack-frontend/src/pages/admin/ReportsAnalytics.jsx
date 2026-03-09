import BarChartComponent from '../../components/charts/BarChart';
import LineChartComponent from '../../components/charts/LineChart';
import PieChartComponent from '../../components/charts/PieChart';
import AreaChartComponent from '../../components/charts/AreaChart';
import { weeklyProductivity, monthlyPerformance } from '../../data/mockData';

export default function ReportsAnalytics() {
  const users = JSON.parse(localStorage.getItem('flowtrack_users') || '[]');

  const departmentData = users.reduce((acc, u) => {
    const dept = u.department || 'Unassigned';
    const existing = acc.find((d) => d.name === dept);
    if (existing) existing.value++;
    else acc.push({ name: dept, value: 1 });
    return acc;
  }, []);

  const roleData = [
    { name: 'Managers', value: users.filter((u) => u.role === 'manager').length },
    { name: 'Employees', value: users.filter((u) => u.role === 'employee').length },
  ];

  const attendanceData = [
    { week: 'Week 1', present: 92, absent: 8 },
    { week: 'Week 2', present: 88, absent: 12 },
    { week: 'Week 3', present: 95, absent: 5 },
    { week: 'Week 4', present: 90, absent: 10 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organization-wide insights and reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent data={weeklyProductivity} dataKey="tasks" xKey="day" title="Weekly Task Completion" color="#6366f1" />
        <LineChartComponent data={monthlyPerformance} xKey="month" title="Task Performance Trend"
          lines={[
            { dataKey: 'completed', name: 'Completed', color: '#10b981' },
            { dataKey: 'assigned', name: 'Assigned', color: '#6366f1' },
          ]}
        />
        <PieChartComponent data={departmentData.length > 0 ? departmentData : [{ name: 'No Data', value: 1 }]} title="Employees by Department" />
        <PieChartComponent data={roleData} title="User Roles Distribution" />
        <AreaChartComponent data={weeklyProductivity} dataKey="hours" xKey="day" title="Weekly Working Hours" color="#10b981" />
        <BarChartComponent data={attendanceData} dataKey="present" xKey="week" title="Weekly Attendance Rate (%)" color="#10b981" />
      </div>
    </div>
  );
}