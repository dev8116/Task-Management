import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import ChartComponent from '../../components/Common/ChartComponent';
import { toast } from 'react-toastify';
import '../../pages/Admin/Reports.css';

const TeamPerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perfRes, teamRes] = await Promise.all([
        API.get('/reports/performance'),
        API.get('/users/my-team'),
      ]);
      setPerformance(perfRes.data);
      setTeamMembers(teamRes.data);
    } catch (err) {
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const chartData = performance.slice(0, 10).map((e) => ({
    name: e.name?.split(' ')[0],
    rate: e.completionRate,
  }));

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Tasks', accessor: 'totalTasks' },
    { header: 'Completed', accessor: 'completedTasks' },
    { header: 'Overdue', render: (row) => <span style={{ color: row.overdueTasks > 0 ? '#c62828' : '#2e7d32' }}>{row.overdueTasks}</span> },
    { header: 'Rate', render: (row) => <strong style={{ color: row.completionRate >= 70 ? '#2e7d32' : '#ef6c00' }}>{row.completionRate}%</strong> },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Team Performance</h2>
        <span style={{ fontSize: '14px', color: '#888' }}>{teamMembers.length} team members</span>
      </div>

      {teamMembers.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '18px', color: '#888' }}>No team members assigned</p>
          <p style={{ fontSize: '14px', color: '#aaa' }}>Admin needs to assign employees to your team first.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <ChartComponent type="bar" data={chartData} title="Completion Rate by Employee" dataKey="rate" xKey="name" />
          </div>

          {/* Leaderboard */}
          <div className="report-section">
            <h3>Team Leaderboard</h3>
            <div className="leaderboard">
              {performance.slice(0, 5).map((emp, idx) => (
                <div key={emp._id} className="leaderboard-card">
                  <div className={`leaderboard-rank ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>
                    #{idx + 1}
                  </div>
                  <div className="leaderboard-info">
                    <h4>{emp.name}</h4>
                    <p>{emp.department || 'No Dept'}</p>
                  </div>
                  <div className="leaderboard-stat">
                    <div className="rate">{emp.completionRate}%</div>
                    <div className="label">Completion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <DataTable title="Detailed Performance" columns={columns} data={performance} />
          </div>
        </>
      )}
    </div>
  );
};

export default TeamPerformance;