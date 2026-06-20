import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  BarChart3, Upload, Brain, ArrowRight,
  CheckCircle, Star, Zap, Database, Shield, Globe, ChevronRight,
  Sun, Moon
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis,
  BarChart, Bar
} from 'recharts';

/* ── Fake data for hero preview ── */
const HERO_REVENUE = [
  { m: 'Jan', v: 42 }, { m: 'Feb', v: 58 }, { m: 'Mar', v: 51 },
  { m: 'Apr', v: 74 }, { m: 'May', v: 68 }, { m: 'Jun', v: 92 },
  { m: 'Jul', v: 85 }, { m: 'Aug', v: 104 }, { m: 'Sep', v: 98 },
  { m: 'Oct', v: 120 }, { m: 'Nov', v: 114 }, { m: 'Dec', v: 138 },
];
const HERO_BAR = [
  { n: 'NA', v: 38 }, { n: 'EU', v: 25 }, { n: 'AP', v: 20 }, { n: 'LA', v: 12 }, { n: 'ME', v: 8 },
];

/* ── Count-up hook ── */
function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 4);
          setVal(Math.floor(ease * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return [val, ref];
}

/* ── Scroll-reveal hook ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Sparkline mini ── */
function Sparkline({ data, color = '#E85D26', width = 80, height = 28 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = width, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={parseFloat(pts.split(' ').at(-1).split(',')[0])} cy={parseFloat(pts.split(' ').at(-1).split(',')[1])} r="2.5" fill={color} />
    </svg>
  );
}

/* ── Animated Orb Background ── */
function OrbBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,93,38,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', top: '30%', right: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(93,181,176,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '30%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
    </div>
  );
}

const FEATURES = [
  { icon: Upload,    label: 'Drag-n-Drop CSV Upload',   desc: 'Upload any size sales CSV. Auto-detects columns, validates, and ingests in seconds.' },
  { icon: BarChart3, label: 'Instant Analytics',        desc: '12+ interactive charts — trend lines, regional bars, pie breakdowns — update the moment data lands.' },
  { icon: Brain,     label: 'ML Revenue Prediction',    desc: 'Random Forest model trains on your exact data. Enter a product + region + date and get a forecast.' },
  { icon: Globe,     label: 'Multi-Region Analysis',    desc: 'See your revenue split across North America, EMEA, APAC and more in a single glance.' },
  { icon: Database,  label: 'Per-User Data Isolation',  desc: 'Your data lives in a user-scoped partition. Zero cross-contamination between accounts.' },
  { icon: Shield,    label: 'JWT Secured APIs',         desc: 'Every request is authenticated. Role-based access control on every route.' },
];

const STATS = [
  { value: 12, suffix: '+', label: 'Analytics Charts' },
  { value: 98,  suffix: '%', label: 'Prediction Accuracy' },
  { value: 5,  suffix: 'sec', label: 'Avg Ingest Time' },
  { value: 100, suffix: 'MB', label: 'Max Upload Size' },
];

const MARQUEE_ITEMS = [
  '🔥 Real-time analytics', '⚡ ML predictions', '📊 12+ chart types',
  '🔐 JWT secured', '🌍 Multi-region', '📈 Revenue forecasting',
  '🎯 CSV upload', '🧠 Random Forest ML', '📉 Trend analysis',
  '🔥 Real-time analytics', '⚡ ML predictions', '📊 12+ chart types',
  '🔐 JWT secured', '🌍 Multi-region', '📈 Revenue forecasting',
  '🎯 CSV upload', '🧠 Random Forest ML', '📉 Trend analysis',
];

/* ── Hero Dashboard Preview ── */
function HeroPreview() {
  return (
    <div className="preview-card r-float" style={{ width: '100%', maxWidth: '560px', padding: '16px', fontSize: '11px' }}>
      {/* window dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E05252' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8A226' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF7D' }} />
        <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.05em' }}>SmartAnalytics — Dashboard</span>
        <div style={{ marginLeft: 'auto' }} className="r-live-badge">
          <div className="r-pulse-dot" style={{ width: '6px', height: '6px' }} />
          LIVE
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
        {[
          { label: 'Revenue', value: '$1.24M', spark: [30,38,35,50,48,66,60,80], change: '+12.4%', up: true },
          { label: 'Orders',  value: '9,842',  spark: [20,28,25,35,40,38,50,55], change: '+8.2%', up: true },
          { label: 'Avg AOV', value: '$126',   spark: [60,58,62,55,57,60,58,63], change: '-0.5%', up: false },
          { label: 'Profit',  value: '$382K',  spark: [15,22,20,28,32,30,40,45], change: '+18%', up: true },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>{c.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Sparkline data={c.spark} color={c.up ? '#4CAF7D' : '#E05252'} width={50} />
              <span style={{ fontSize: '9px', fontWeight: '700', color: c.up ? '#4CAF7D' : '#E05252' }}>{c.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Revenue Trend</div>
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={HERO_REVENUE} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E85D26" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E85D26" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
              <XAxis dataKey="m" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px', color: 'var(--text-primary)' }} itemStyle={{ color: '#E85D26' }} />
              <Area type="monotone" dataKey="v" stroke="#E85D26" strokeWidth={1.5} fill="url(#hg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>By Region</div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={HERO_BAR} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
              <XAxis dataKey="n" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px', color: 'var(--text-primary)' }} itemStyle={{ color: '#E85D26' }} />
              <Bar dataKey="v" fill="#E85D26" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML badge row */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <div style={{ flex: 1, background: 'rgba(232,93,38,0.08)', border: '1px solid rgba(232,93,38,0.15)', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={12} color="#E85D26" />
          <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-secondary)' }}>ML Prediction ready</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: '800', color: '#E85D26' }}>$147K</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.15)', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={12} color="#4CAF7D" />
          <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-secondary)' }}>Model accuracy</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: '800', color: '#4CAF7D' }}>98.2%</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ isAuthenticated }) {
  useReveal();
  const [stat0, ref0] = useCountUp(STATS[0].value);
  const [stat1, ref1] = useCountUp(STATS[1].value);
  const [stat2, ref2] = useCountUp(STATS[2].value);
  const [stat3, ref3] = useCountUp(STATS[3].value);
  const statRefs = [ref0, ref1, ref2, ref3];
  const statVals = [stat0, stat1, stat2, stat3];

  /* ── Theme toggle (reads/syncs with Layout's localStorage key) ── */
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Keep <html> class in sync
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = (e) => {
    const btn = e?.currentTarget;
    const rect = btn?.getBoundingClientRect();
    const x = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2);
    const y = rect ? Math.round(rect.top + rect.height / 2) : Math.round(window.innerHeight / 2);
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    if (!document.startViewTransition) {
      document.documentElement.classList.add('theme-transitioning');
      setIsDark(d => !d);
      setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 450);
      return;
    }
    const transition = document.startViewTransition(() => {
      flushSync(() => setIsDark(d => !d));
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  return (
    <div style={{ background: 'var(--bg)', fontFamily: 'var(--font)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: isDark ? 'rgba(10,10,10,0.85)' : 'rgba(244,242,239,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 400ms ease',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(232,93,38,0.4)' }}>
            <BarChart3 size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>SmartAnalytics</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme toggle */}
          <button
            id="landing-theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 200ms ease',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {isDark
              ? <Sun size={16} color="var(--accent)" />
              : <Moon size={16} color="var(--accent)" />
            }
          </button>
          {isAuthenticated ? (
            <Link to="/dashboard" className="r-btn r-btn-primary r-btn-sm" style={{ textDecoration: 'none' }}>Go to Dashboard <ArrowRight size={13} /></Link>
          ) : (
            <>
              <Link to="/login" className="r-btn r-btn-ghost r-btn-sm" style={{ textDecoration: 'none' }}>Sign in</Link>
              <Link to="/register" className="r-btn r-btn-primary r-btn-sm" style={{ textDecoration: 'none' }}>Get started free</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '64px', overflow: 'hidden' }}>
        {/* Grid background */}
        <div className="r-grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        {/* Vignette overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, var(--bg) 100%)' }} />
        <OrbBackground />

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '80px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          {/* Left col */}
          <div>
            <div className="fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--accent-dim)', border: '1px solid rgba(232,93,38,0.2)', borderRadius: '20px', padding: '6px 14px', marginBottom: '28px' }}>
              <div className="r-pulse-dot" />
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', letterSpacing: '0.06em' }}>AI-Powered Analytics Platform</span>
            </div>

            <h1 className="r-display fade-in delay-100" style={{ marginBottom: '24px' }}>
              Turn raw data into{' '}
              <span className="r-hero-accent">revenue</span>
              <br />intelligence.
            </h1>

            <p className="r-body fade-in delay-200" style={{ fontSize: '18px', maxWidth: '400px', marginBottom: '40px', lineHeight: 1.7 }}>
              Upload a CSV. Get instant charts, regional breakdowns, and ML-powered revenue predictions — all in under 30 seconds.
            </p>

            <div className="fade-in delay-300" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="r-btn r-btn-primary r-btn-lg" style={{ textDecoration: 'none' }}>
                Start for free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="r-btn r-btn-ghost r-btn-lg" style={{ textDecoration: 'none' }}>
                View demo →
              </Link>
            </div>

            <div className="fade-in delay-400" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {['No credit card', 'Free forever plan', 'CSV → charts in 30s'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <CheckCircle size={13} color="var(--success)" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right col — animated dashboard preview */}
          <div className="fade-in delay-300" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeroPreview />
          </div>
        </div>

        {/* Arrow down hint */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', animation: 'float 3s ease-in-out infinite' }}>
          <div style={{ width: '20px', height: '32px', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5px' }}>
            <div style={{ width: '3px', height: '8px', background: 'var(--accent)', borderRadius: '2px', animation: 'scrollDot 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes scrollDot {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(8px); opacity: 0.4; }
        }
      `}</style>

      {/* ── MARQUEE STRIP ─────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 0', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        <div className="marquee-track" style={{ display: 'inline-flex', gap: '0' }}>
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '32px', padding: '0 24px', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {item}
              <span style={{ width: '1px', height: '12px', background: 'var(--border)', display: 'inline-block' }} />
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {STATS.map((s, i) => (
            <div key={i} ref={statRefs[i]} className="reveal" style={{ background: 'var(--card-bg)', padding: '40px 32px', textAlign: 'center', animationDelay: `${i * 100}ms` }}>
              <div className="r-stat-number">{statVals[i]}{s.suffix}</div>
              <div className="r-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────── */}
      <section style={{ padding: '0 32px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="r-section-label" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <span className="r-label">Capabilities</span>
          </div>
          <h2 className="r-h1" style={{ marginBottom: '16px' }}>
            Everything in one{' '}<span className="r-hero-accent">platform</span>
          </h2>
          <p className="r-body" style={{ maxWidth: '480px', margin: '0 auto' }}>
            From raw CSV to ML-powered insights — no code required.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="reveal r-card-lift" style={{ background: 'var(--card-bg)', padding: '36px 32px', transition: 'background 200ms, transform 200ms, box-shadow 200ms' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
              >
                <div style={{ width: '44px', height: '44px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(232,93,38,0.15)' }}>
                  <Icon size={20} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.label}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section style={{ padding: '0 32px 100px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Background accent line */}
        <div style={{ position: 'absolute', left: '50%', top: '120px', bottom: '80px', width: '1px', background: 'linear-gradient(to bottom, transparent, var(--border) 20%, var(--border) 80%, transparent)', pointerEvents: 'none' }} />

        <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="r-section-label" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <span className="r-label">Workflow</span>
          </div>
          <h2 className="r-h1">Up and running in<br /><span className="r-hero-accent">3 steps</span></h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          {[
            { n: '01', icon: Upload,    title: 'Upload your CSV', desc: 'Drag-and-drop any sales CSV. Our parser auto-detects columns like date, revenue, region, product category.' },
            { n: '02', icon: BarChart3, title: 'View instant analytics', desc: 'Revenue trends, regional breakdowns, top products, and AOV — all rendered instantly as interactive charts.' },
            { n: '03', icon: Brain,     title: 'Get ML predictions', desc: 'Enter a product line, territory, and date range. Our trained Random Forest model returns a revenue forecast.' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`reveal delay-${(i + 1) * 100}`} style={{ position: 'relative', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '36px 32px', overflow: 'hidden' }}>
                {/* Big number watermark */}
                <div style={{ position: 'absolute', top: '-10px', right: '16px', fontSize: '80px', fontWeight: '900', color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none' }}>{s.n}</div>
                {/* Orange top border accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, var(--accent), transparent)` }} />
                <div style={{ width: '40px', height: '40px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icon size={18} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.01em' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LIVE PREVIEW SECTION ───────────────────────────────── */}
      <section style={{ padding: '0 32px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          {/* Left — charts preview */}
          <div className="reveal">
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.12)' }}>
              {/* header bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['#E05252','#E8A226','#4CAF7D'].map(c => <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />)}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Revenue Trend — 2024</span>
              </div>
              <div style={{ padding: '24px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={HERO_REVENUE} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E85D26" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#E85D26" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" />
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: '#E85D26' }} />
                    <Area type="monotone" dataKey="v" name="Revenue (K)" stroke="#E85D26" strokeWidth={2} fill="url(#cg2)" dot={false} activeDot={{ r: 4, fill: '#E85D26', stroke: '#FF7940', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right — copy */}
          <div className="reveal delay-200">
            <div className="r-section-label" style={{ marginBottom: '24px' }}>
              <span className="r-label">Real-time Insights</span>
            </div>
            <h2 className="r-h1" style={{ marginBottom: '20px' }}>
              Charts that update<br />the instant you{' '}<span className="r-hero-accent">upload.</span>
            </h2>
            <p className="r-body" style={{ marginBottom: '32px', lineHeight: 1.8 }}>
              No ETL pipelines. No waiting. The moment your CSV is uploaded, every chart on the dashboard refreshes with your actual data — revenue trends, regional breakdown, top products.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: Zap, text: 'Area, bar, pie, and line charts — all interactive' },
                { icon: Globe, text: 'Segment by region: NA, EMEA, APAC, and more' },
                { icon: Star, text: 'Top-10 products ranked by revenue automatically' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.text} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--accent-dim)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingTop: '6px', lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── ML PREDICTION SHOWCASE ─────────────────────────────── */}
      <section style={{ padding: '0 32px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          {/* Left — copy */}
          <div className="reveal">
            <div className="r-section-label" style={{ marginBottom: '24px' }}>
              <span className="r-label">Machine Learning</span>
            </div>
            <h2 className="r-h1" style={{ marginBottom: '20px' }}>
              Predict the next<br />month's<br /><span className="r-hero-accent">revenue now.</span>
            </h2>
            <p className="r-body" style={{ marginBottom: '32px', lineHeight: 1.8 }}>
              Our Random Forest model trains directly on your uploaded data. Pick a product line, territory, quantity, and date — get a real-money forecast in milliseconds.
            </p>
            <Link to={isAuthenticated ? '/predictions' : '/register'} className="r-btn r-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Try the predictor <ChevronRight size={15} />
            </Link>
          </div>

          {/* Right — fake prediction UI */}
          <div className="reveal delay-200">
            <div className="r-card-glow" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--accent-dim)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(232,93,38,0.2)' }}>
                  <Brain size={18} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Revenue Forecast</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Random Forest · Trained on your data</div>
                </div>
                <div style={{ marginLeft: 'auto' }} className="r-tag">Live</div>
              </div>

              {/* Fake form fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[['Month', 'October'], ['Year', '2025'], ['Category', 'Classic Cars'], ['Territory', 'EMEA']].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{l}</div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Result */}
              <div style={{ background: 'linear-gradient(135deg, rgba(232,93,38,0.1), rgba(232,93,38,0.05))', border: '1px solid rgba(232,93,38,0.2)', borderRadius: 'var(--radius-md)', padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Predicted Revenue</div>
                <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-0.04em', color: 'var(--accent)', lineHeight: 1 }}>$147,823</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Confidence interval: $138K – $158K</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--success)', fontWeight: '600' }}>
                    <CheckCircle size={11} color="var(--success)" /> 98.2% accuracy
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                    <Zap size={11} color="var(--text-muted)" /> 120ms response
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '0 32px 120px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="reveal" style={{ position: 'relative', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '80px 60px', textAlign: 'center', overflow: 'hidden' }}>
          {/* Orbs */}
          <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '300px', background: 'radial-gradient(circle, rgba(232,93,38,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(232,93,38,0.5), transparent)' }} />

          <div className="r-tag" style={{ marginBottom: '24px' }}>Free to start</div>
          <h2 className="r-h1" style={{ marginBottom: '20px', position: 'relative' }}>
            Ready to see your data<br />
            <span className="r-hero-accent">come alive?</span>
          </h2>
          <p className="r-body" style={{ maxWidth: '440px', margin: '0 auto 40px', position: 'relative' }}>
            Upload your first CSV free. No credit card. No setup. Just answers.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', position: 'relative' }}>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="r-btn r-btn-primary r-btn-lg" style={{ textDecoration: 'none' }}>
              Create free account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="r-btn r-btn-ghost r-btn-lg" style={{ textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={12} color="#fff" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>SmartAnalytics</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 SmartAnalyticsDash — Built with React, Flask &amp; ML
        </p>
      </footer>
    </div>
  );
}
