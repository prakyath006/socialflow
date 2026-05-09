import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
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
          <h2>Reset your password</h2>
          <p className="login-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

          {status === 'success' ? (
            <div className="login-demo-box" style={{ borderColor: '#4caf50', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
              <p style={{ margin: 0 }}>{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              {status === 'error' && <div className="login-error">{message}</div>}

              <button type="submit" className="btn btn-accent btn-lg login-submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="login-switch" style={{ marginTop: '24px' }}>
            Remember your password?{' '}
            <button type="button" className="login-switch-btn" onClick={() => navigate('/login')}>
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
