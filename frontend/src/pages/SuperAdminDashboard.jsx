import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  RefreshCw, 
  Plus, 
  X, 
  Search, 
  Check, 
  AlertTriangle,
  Eye,
  EyeOff,
  Edit,
  Users,
  ClipboardList,
  CheckCircle,
  Filter
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'requests'

  // Account Requests State
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsSearchQuery, setRequestsSearchQuery] = useState('');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('ALL');

  // Add User Form State
  const [newUserData, setNewUserData] = useState({
    nic: '',
    fullName: '',
    email: '',
    password: '',
    role: 'USER',
    department: '',
    batchNumber: '',
    rank: '',
    policeStation: ''
  });

  // Edit User Form State
  const [editUserData, setEditUserData] = useState({
    id: null,
    nic: '',
    fullName: '',
    email: '',
    password: '',
    role: 'USER',
    department: '',
    batchNumber: '',
    rank: '',
    policeStation: ''
  });

  // Change Role Form State
  const [targetRole, setTargetRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch all users and requests on mount
  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin-requests');
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch registration requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field validations based on role
    if (newUserData.role === 'ADMIN' && !newUserData.department) {
      setError('Department is required for Admins.');
      return;
    }

    if (newUserData.role === 'OFFICER') {
      if (!newUserData.batchNumber || !newUserData.rank || !newUserData.policeStation) {
        setError('Batch number, rank, and police station are required for Officers.');
        return;
      }
    }

    try {
      await axios.post('/api/admin/users', newUserData);
      setSuccess(`User '${newUserData.fullName}' added successfully!`);
      setIsAddOpen(false);
      // Reset form
      setNewUserData({
        nic: '',
        fullName: '',
        email: '',
        password: '',
        role: 'USER',
        department: '',
        batchNumber: '',
        rank: '',
        policeStation: ''
      });
      fetchUsers();
    } catch (err) {
      if (err.response?.data?.errors) {
        const fieldErrors = Object.values(err.response.data.errors).join(', ');
        setError(`Validation Error: ${fieldErrors}`);
      } else {
        setError(err.response?.data?.message || 'Failed to create user.');
      }
    }
  };

  const openEditModal = (user) => {
    setEditUserData({
      id: user.id,
      nic: user.nic,
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      batchNumber: user.batchNumber || '',
      rank: user.rank || '',
      policeStation: user.policeStation || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (editUserData.role === 'ADMIN') {
      if (!editUserData.department) {
        setError('Department is required for Administrators.');
        return;
      }
    }

    if (editUserData.role === 'OFFICER') {
      if (!editUserData.batchNumber || !editUserData.rank || !editUserData.policeStation) {
        setError('Batch number, rank, and police station are required for Officers.');
        return;
      }
    }

    try {
      await axios.put(`/api/admin/users/${editUserData.id}`, editUserData);
      setSuccess(`User '${editUserData.fullName}' updated successfully!`);
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      if (err.response?.data?.errors) {
        const fieldErrors = Object.values(err.response.data.errors).join(', ');
        setError(`Validation Error: ${fieldErrors}`);
      } else {
        setError(err.response?.data?.message || 'Failed to update user.');
      }
    }
  };

  const handleRoleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedUser) return;

    try {
      await axios.put(`/api/admin/users/${selectedUser.id}/role`, { role: targetRole });
      setSuccess(`Successfully updated role of ${selectedUser.fullName} to ${targetRole}.`);
      setIsRoleOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.fullName}?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await axios.delete(`/api/admin/users/${user.id}`);
      setSuccess(`User '${user.fullName}' deleted successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleApproveRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to APPROVE the registration request for ${request.fullName}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post(`/api/admin-requests/${request.id}/approve`);
      setSuccess(`Successfully approved request for '${request.fullName}'. User account is now active.`);
      fetchRequests();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleRejectRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to REJECT the registration request for ${request.fullName}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post(`/api/admin-requests/${request.id}/reject`);
      setSuccess(`Successfully rejected request for '${request.fullName}'.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setTargetRole(user.role);
    setIsRoleOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.nic.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.fullName.toLowerCase().includes(requestsSearchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(requestsSearchQuery.toLowerCase()) ||
      req.nic.toLowerCase().includes(requestsSearchQuery.toLowerCase()) ||
      req.role.toLowerCase().includes(requestsSearchQuery.toLowerCase());
    
    const matchesStatus = requestsStatusFilter === 'ALL' || req.status === requestsStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const renderUsersTab = () => {
    return (
      <>
        {/* Header Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Active User Accounts</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchUsers} className="btn btn-secondary">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Reload</span>
            </button>
            <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Search & Stats Card */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, email, NIC or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div>Total Accounts: <strong style={{ color: '#fff' }}>{users.length}</strong></div>
              <div>Matching Filter: <strong style={{ color: 'var(--accent-cyan)' }}>{filteredUsers.length}</strong></div>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading && users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading user records...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No matching user records found.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Full Name & NIC</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Institutional Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{user.fullName}</div>
                        <div className="meta-detail">NIC: {user.nic}</div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role.toLowerCase()}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {user.role === 'SUPER_ADMIN' && (
                          <span className="meta-detail" style={{ color: 'var(--text-muted)' }}>System Administrator</span>
                        )}
                        {user.role === 'ADMIN' && (
                          <div>
                            <div>Dept: <strong>{user.department || 'N/A'}</strong></div>
                          </div>
                        )}
                        {user.role === 'OFFICER' && (
                          <div style={{ fontSize: '0.85rem' }}>
                            <div>Station: <strong>{user.policeStation || 'N/A'}</strong></div>
                            <div className="meta-detail">Rank: {user.rank || 'N/A'} | Batch: {user.batchNumber || 'N/A'}</div>
                          </div>
                        )}
                        {user.role === 'USER' && (
                          <span className="meta-detail" style={{ color: 'var(--text-muted)' }}>Standard User</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => openEditModal(user)} 
                            className="btn btn-secondary btn-icon" 
                            title="Edit User"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => openRoleModal(user)} 
                            className="btn btn-secondary btn-icon" 
                            title="Change Role"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <Shield size={14} />
                            <span>Role</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)} 
                            className="btn btn-danger btn-icon" 
                            title="Delete User"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderRequestsTab = () => {
    return (
      <>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registration Requests</h2>
          <div>
            <button onClick={fetchRequests} className="btn btn-secondary btn-icon" disabled={requestsLoading}>
              <RefreshCw size={16} className={requestsLoading ? 'animate-spin' : ''} />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, email or NIC..."
                value={requestsSearchQuery}
                onChange={(e) => setRequestsSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} className="text-muted" style={{ marginRight: '0.25rem' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
              <div className="tab-group" style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRequestsStatusFilter(filter)}
                    style={{
                      background: requestsStatusFilter === filter ? 'rgba(99, 102, 241, 0.2)' : 'none',
                      border: 'none',
                      color: requestsStatusFilter === filter ? '#fff' : 'var(--text-secondary)',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table Card */}
        <div className="card" style={{ padding: 0 }}>
          {requestsLoading && requests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading registration requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No matching registration requests found.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User Details & NIC</th>
                    <th>Email</th>
                    <th>Requested Role</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{req.fullName}</div>
                        <div className="meta-detail">NIC: {req.nic}</div>
                      </td>
                      <td>{req.email}</td>
                      <td>
                        <span className={`badge badge-${req.role.toLowerCase()}`}>
                          {req.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleApproveRequest(req)} 
                              className="btn btn-primary" 
                              title="Approve & Create Account"
                              style={{ 
                                padding: '0.35rem 0.65rem', 
                                fontSize: '0.8rem',
                                background: 'var(--success)', 
                                borderColor: 'var(--success)',
                                boxShadow: 'none'
                              }}
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(req)} 
                              className="btn btn-secondary btn-icon" 
                              title="Reject Request"
                              style={{ 
                                padding: '0.35rem 0.65rem', 
                                fontSize: '0.8rem',
                                color: 'var(--danger)',
                                borderColor: 'rgba(244, 63, 94, 0.2)'
                              }}
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Super Admin Console</h1>
          <p className="page-subtitle">Manage system directory, user accounts, and registration requests</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert-banner alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-banner alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Sidebar Layout */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Sidebar Menu */}
        <div className="card animate-fadeIn" style={{ width: '260px', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start', flexShrink: 0 }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem 0.5rem 0.5rem', borderBottom: '1px solid var(--card-border)', marginBottom: '0.5rem' }}>Super Admin Menu</h3>
          
          <button 
            onClick={() => setActiveTab('users')}
            className="btn"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'flex-start', 
              width: '100%', 
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'users' ? '600' : '500',
              color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
              background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'users' ? '1px solid var(--primary)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <Users size={16} style={{ color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span>Active Accounts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('requests')}
            className="btn"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'flex-start', 
              width: '100%', 
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'requests' ? '600' : '500',
              color: activeTab === 'requests' ? '#fff' : 'var(--text-secondary)',
              background: activeTab === 'requests' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'requests' ? '1px solid var(--primary)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <ClipboardList size={16} style={{ color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span>Registration Requests</span>
          </button>
        </div>

        {/* Right Content Panel */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {activeTab === 'users' ? renderUsersTab() : renderRequestsTab()}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="card modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} className="text-primary" />
                <span>Provision New User</span>
              </h2>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NIC (National ID)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUserData.nic}
                    onChange={(e) => setNewUserData({ ...newUserData, nic: e.target.value })}
                    placeholder="991234567V"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="john@traffic.gov.lk"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      placeholder="••••••••"
                      style={{ paddingRight: '2.5rem' }}
                      required
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="USER">User (Standard)</option>
                  <option value="OFFICER">Traffic Officer</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {/* Dynamic inputs for ADMIN */}
              {newUserData.role === 'ADMIN' && (
                <div className="form-group animate-slideUp">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUserData.department}
                    onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                    placeholder="e.g. Licensing, Finance"
                    required
                  />
                </div>
              )}

              {/* Dynamic inputs for OFFICER */}
              {newUserData.role === 'OFFICER' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="animate-slideUp">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Police Station</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newUserData.policeStation}
                      onChange={(e) => setNewUserData({ ...newUserData, policeStation: e.target.value })}
                      placeholder="e.g. Colombo Central"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newUserData.batchNumber}
                      onChange={(e) => setNewUserData({ ...newUserData, batchNumber: e.target.value })}
                      placeholder="e.g. B-9982"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rank</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newUserData.rank}
                      onChange={(e) => setNewUserData({ ...newUserData, rank: e.target.value })}
                      placeholder="e.g. Sergeant, Inspector"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="card modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={20} className="text-primary" />
                <span>Edit User Account</span>
              </h2>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editUserData.fullName}
                    onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NIC (National ID)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editUserData.nic}
                    onChange={(e) => setEditUserData({ ...editUserData, nic: e.target.value })}
                    placeholder="991234567V"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    placeholder="john@traffic.gov.lk"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password (Leave blank to keep current)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={editUserData.password}
                      onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                      placeholder="••••••••"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                >
                  <option value="USER">User (Standard)</option>
                  <option value="OFFICER">Traffic Officer</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {/* Dynamic inputs for ADMIN */}
              {editUserData.role === 'ADMIN' && (
                <div className="form-group animate-slideUp">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editUserData.department}
                    onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })}
                    placeholder="e.g. Licensing, Finance"
                    required
                  />
                </div>
              )}

              {/* Dynamic inputs for OFFICER */}
              {editUserData.role === 'OFFICER' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="animate-slideUp">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Police Station</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editUserData.policeStation}
                      onChange={(e) => setEditUserData({ ...editUserData, policeStation: e.target.value })}
                      placeholder="e.g. Colombo Central"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editUserData.batchNumber}
                      onChange={(e) => setEditUserData({ ...editUserData, batchNumber: e.target.value })}
                      placeholder="e.g. B-9982"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rank</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editUserData.rank}
                      onChange={(e) => setEditUserData({ ...editUserData, rank: e.target.value })}
                      placeholder="e.g. Sergeant, Inspector"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {isRoleOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Change User Role</h2>
              <button className="modal-close" onClick={() => setIsRoleOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRoleUpdateSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                Updating role for <strong style={{ color: 'var(--accent-cyan)' }}>{selectedUser.fullName}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Current Role: {selectedUser.role}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select New Role</label>
                <select
                  className="form-input"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="USER">User (Standard)</option>
                  <option value="OFFICER">Traffic Officer</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPER_ADMIN">System Super Admin</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRoleOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
