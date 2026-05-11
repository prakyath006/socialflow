import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('verifying'); // verifying, idle, loading, success, error, expired
  const [message, setMessage] = useState('');

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.get(`/auth/reset-password/${token}`);
        setStatus('idle');
      } catch (err) {
        setStatus('expired');
        setMessage(err.response?.data?.error || 'This reset link has expired or already been used.');
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setStatus('success');
      setMessage(data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="10" fill="#4361ee"/><path d="M9 16l5 5 9-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>SocialFlow</span>
        </div>
        <div className="login-hero">
          <h1>Publish smarter,<br/>grow faster.</h1>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          {status === 'verifying' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p>Verifying reset link...</p>
            </div>
          ) : status === 'expired' ? (
            <div style={{ textAlign: 'center' }}>
              <h2>Link Expired</h2>
              <div className="login-demo-box" style={{ borderColor: '#f44336', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '24px', marginTop: '16px' }}>
                <p style={{ margin: 0 }}>{message}</p>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/forgot-password')}>
                Request a new link
              </button>
              <p className="login-switch" style={{ marginTop: '16px' }}>
                <button type="button" className="login-switch-btn" onClick={() => navigate('/login')}>
                  Back to sign in
                </button>
              </p>
            </div>
          ) : status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h2>Password Reset!</h2>
              <div className="login-demo-box" style={{ borderColor: '#4caf50', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '24px', marginTop: '16px' }}>
                <p style={{ margin: 0 }}>{message}</p>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2>Choose a new password</h2>
              <p className="login-subtitle">Make sure it's at least 6 characters long.</p>
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label className="label">New password</label>
                  <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                {status === 'error' && <div className="login-error">{message}</div>}

                <button type="submit" className="btn btn-accent btn-lg login-submit" disabled={status === 'loading' || password.length < 6}>
                  {status === 'loading' ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
