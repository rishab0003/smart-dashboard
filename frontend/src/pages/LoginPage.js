import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import api from '../api';

export default function LoginPage({ setIsAuthenticated, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, text: 'Real-time revenue forecasting' },
    { icon: Zap,        text: 'Instant ML model retraining' },
    { icon: Shield,     text: 'Isolated per-user data environment' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'var(--font)',
      background: 'var(--bg)',
    }}>

      {/* ── Left panel — branding ─────────────────────────── */}
      <div style={{
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        padding: '60px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }} className="login-brand-panel">

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--accent)',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart3 size={17} color="#fff" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            SmartAnalytics
          </span>
        </Link>

        {/* Main copy */}
        <div>
          <div className="r-tag" style={{ display: 'inline-flex', marginBottom: '28px' }}>
            AI Analytics
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}>
            Your data.<br />
            Your <span style={{ color: 'var(--accent)' }}>insights.</span>
          </h2>
          <p className="r-body" style={{ maxWidth: '340px', marginBottom: '40px' }}>
            Upload any sales CSV and get AI-powered dashboards, forecasts, and analytics — all in real time.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    background: 'var(--accent-dim)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color="var(--accent)" />
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom quote */}
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 SmartAnalytics — Powered by Random Forest ML
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 64px',
      }} className="login-form-panel">

        <div style={{ width: '100%', maxWidth: '380px' }} className="fade-in">

          <h1 style={{
            fontSize: '24px', fontWeight: '800',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            Welcome back
          </h1>
          <p className="r-body" style={{ fontSize: '14px', marginBottom: '36px' }}>
            Sign in to your SmartAnalytics account
          </p>

          {/* Error */}
          {error && (
            <div className="error" style={{ marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: '8px',
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="r-input"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: '8px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="r-input"
                  style={{ paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="r-btn r-btn-primary"
              style={{
                width: '100%', marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><div className="spinner" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Register link */}
          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>

          {/* Test credentials */}
          <div 
            onClick={() => {
              setEmail('test@example.com');
              setPassword('password123');
            }}
            style={{
              marginTop: '32px', padding: '16px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--card-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card-bg)'; }}
          >
            <p className="r-label" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Test credentials</span>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700' }}>Click to autofill</span>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>test@example.com</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>password123</p>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel { display: none !important; }
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
          .login-form-panel { padding: 40px 24px !important; }
        }
      `}</style>
    </div>
  );
}