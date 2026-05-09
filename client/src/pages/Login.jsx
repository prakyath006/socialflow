import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, loading } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="10" fill="#4361ee"/><path d="M9 16l5 5 9-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>SocialFlow</span>
        </div>
        <div className="login-hero">
          <h1>Publish smarter,<br/>grow faster.</h1>
          <p>Schedule and publish to all your social channels from one clean workspace.</p>
        </div>
        <div className="login-features">
          {['8 social platforms in one place', 'Smart scheduling with best-time suggestions', 'Bulk upload via CSV', 'Auto media resizing per platform'].map((f, i) => (
            <div key={i} className="login-feature">
              <span className="feature-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>{isRegister ? 'Create an account' : 'Welcome back'}</h2>
          <p className="login-subtitle">{isRegister ? 'Start your free trial today.' : 'Sign in to your workspace.'}</p>

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <div className="form-group">
                <label className="label">Full name</label>
                <input className="input" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <label className="label">Password</label>
                {!isRegister && (
                  <button type="button" className="login-switch-btn" onClick={() => navigate('/forgot-password')} style={{fontSize: '13px'}}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn btn-accent btn-lg login-submit" disabled={loading}>
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>

          <div className="login-demo-box">
            <p>Try demo account</p>
            <button className="btn btn-outline btn-lg login-submit"
              onClick={() => { setEmail('demo@sanjutechnologies.com'); setPassword('demo123'); }}
            >
              Use demo credentials
            </button>
          </div>

          <p className="login-switch">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" className="login-switch-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
