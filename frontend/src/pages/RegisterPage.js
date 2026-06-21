import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, ArrowRight, BarChart2, Database, Brain } from 'lucide-react';
import api from '../api';

export default function RegisterPage({ setIsAuthenticated, setUser }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        name: formData.name, email: formData.email, password: formData.password
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    { icon: BarChart2, text: 'Unlimited analytics dashboards' },
    { icon: Database,  text: 'Secure per-user data isolation' },
    { icon: Brain,     text: 'Auto-trained ML models on your data' },
  ];

  const fieldStyle = {
    label: {
      display: 'block', fontSize: '12px', fontWeight: '600',
      color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: '8px',
    },
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'var(--font)',
      background: 'var(--bg)',
    }}>

      {/* ── Left — branding ───────────────────────────────── */}
      <div style={{
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        padding: '60px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }} className="register-brand-panel">

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

        <div>
          <div className="r-tag" style={{ display: 'inline-flex', marginBottom: '28px' }}>
            Free Account
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1.1,
            color: 'var(--text-primary)', marginBottom: '20px',
          }}>
            Start turning data<br />into{' '}
            <span style={{ color: 'var(--accent)' }}>revenue.</span>
          </h2>
          <p className="r-body" style={{ maxWidth: '340px', marginBottom: '40px' }}>
            Create your free account and connect your sales data in under 2 minutes. No credit card required.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {perks.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', background: 'var(--accent-dim)',
                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={15} color="var(--accent)" />
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{p.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 SmartAnalytics — Your data never leaves your account
        </p>
      </div>

      {/* ── Right — form ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 64px',
        overflowY: 'auto',
      }} className="register-form-panel">

        <div style={{ width: '100%', maxWidth: '380px' }} className="fade-in">

          <h1 style={{
            fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>
            Create your account
          </h1>
          <p className="r-body" style={{ fontSize: '14px', marginBottom: '36px' }}>
            Free to start — no credit card needed
          </p>

          {error && (
            <div className="error" style={{ marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Full name */}
            <div>
              <label style={fieldStyle.label}>Full Name</label>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleChange} placeholder="John Doe"
                className="r-input" required
              />
            </div>

            {/* Email */}
            <div>
              <label style={fieldStyle.label}>Email Address</label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="name@example.com"
                className="r-input" required
              />
            </div>

            {/* Password */}
            <div>
              <label style={fieldStyle.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={formData.password}
                  onChange={handleChange} placeholder="Min. 6 characters"
                  className="r-input" style={{ paddingRight: '44px' }} required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={fieldStyle.label}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} placeholder="Re-enter password"
                  className="r-input" style={{ paddingRight: '44px' }} required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="r-btn r-btn-primary"
              style={{
                width: '100%', marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><div className="spinner" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .register-brand-panel { display: none !important; }
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
          .register-form-panel { padding: 40px 24px !important; }
        }
      `}</style>
    </div>
  );
}