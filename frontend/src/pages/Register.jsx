import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Lock,
  Mail,
  User as UserIcon,
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    email: '',
    password: '',
    role: 'USER'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register-request', formData);
      setSuccess('Account creation request submitted successfully! An administrator will review your request.');
      // Reset form
      setFormData({
        nic: '',
        fullName: '',
        email: '',
        password: '',
        role: 'USER'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit registration request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{ padding: '2rem 1rem' }}>
      <div className="card login-card" style={{ maxWidth: '480px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/login" className="btn btn-secondary btn-icon" style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="login-header" style={{ marginBottom: '1.5rem' }}>
          <div className="login-logo" style={{ marginBottom: '0.75rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
          </div>
          <h1>Request User Account</h1>
          <p>Submit a request to create a user account</p>
        </div>

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success" style={{ marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <UserIcon size={16} />
              </span>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-input"
                placeholder="John Doe"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="johndoe@example.com"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nic">NIC Number</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <CreditCard size={16} />
              </span>
              <input
                id="nic"
                name="nic"
                type="text"
                className="form-input"
                placeholder="199912345V"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.nic}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '1rem',
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', height: '46px' }}
            disabled={loading}
          >
            {loading ? 'Submitting request...' : 'Submit Request'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
