import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@crm.com', password: 'password123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div className="logo-icon" style={{ width: 44, height: 44, fontSize: 20 }}>R</div>
          </div>
          <div className="login-title">RAMEEZ CRM</div>
          <div className="login-sub">Custom Automation Solution</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email" placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password" placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ marginTop: 8, padding: '11px', fontSize: 14, justifyContent: 'center' }}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--accent-blue)', marginBottom: 8 }}>Demo Accounts</div>
          {[
            ['Admin', 'admin@crm.com'],
            ['Manager', 'manager1@crm.com'],
            ['Agent', 'agent1@crm.com'],
          ].map(([role, email]) => (
            <div key={role} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>{role}:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', color: 'var(--accent-blue)' }}
                onClick={() => setForm({ email, password: 'password123' })}>
                {email}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Password: password123</div>
        </div>
      </div>
    </div>
  );
}
