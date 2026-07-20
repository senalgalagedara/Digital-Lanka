import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const { authState } = useContext(AuthContext);

  return (
    <div className="placeholder-container">
      <div className="placeholder-icon-wrapper">
        <ShieldAlert size={48} />
      </div>
      <h1>Welcome Admin</h1>
      <p>Logged in as: <strong style={{ color: 'var(--primary)' }}>{authState.fullName}</strong> ({authState.email})</p>
      <div className="card" style={{ width: '100%', padding: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Module 6: Institutional Provisioning</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          As an <strong>ADMIN</strong>, you have access to this placeholder dashboard. The user management and configuration console is restricted to the <strong>SUPER ADMIN</strong> role.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
