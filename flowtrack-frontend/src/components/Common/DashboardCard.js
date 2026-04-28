import React from 'react';
import './DashboardCard.css';

const DashboardCard = ({ title, value, icon, color }) => {
  return (
    <div className="dashboard-card">
      <div className="card-icon" style={{ background: color || '#1a237e' }}>
        {icon}
      </div>
      <div className="card-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};

export default DashboardCard;