import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Brain, BarChart3,
  LogOut, Menu, X, Bell, ChevronRight, Zap
} from 'lucide-react';

export default function Layout({ user, logout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Scrolling Marquee Ticker Feed
  const [tickerItems, setTickerItems] = useState([
    { time: '10:42:15', category: 'CLASSIC CARS', region: 'NA', sales: 4250 },
    { time: '10:42:02', category: 'MOTORCYCLES', region: 'EMEA', sales: 1840 },
    { time: '10:41:48', category: 'PLANES', region: 'APAC', sales: 12900 },
    { time: '10:41:30', category: 'SHIPS', region: 'JAPAN', sales: 7800 },
    { time: '10:41:12', category: 'VINTAGE CARS', region: 'NA', sales: 3100 },
  ]);

  useEffect(() => {
    const categories = ['CLASSIC CARS', 'MOTORCYCLES', 'PLANES', 'SHIPS', 'TRAINS', 'TRUCKS AND BUSES', 'VINTAGE CARS'];
    const regions = ['NA', 'EMEA', 'APAC', 'JAPAN'];
    
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const category = categories[Math.floor(Math.random() * categories.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const sales = Math.floor(Math.random() * 8500) + 1200;
      
      setTickerItems(prev => [
        { time, category, region, sales },
        ...prev.slice(0, 8)
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard, label: 'Overview' },
    { name: 'Analytics',   href: '/analytics',   icon: BarChart3,       label: 'Data Insights' },
    { name: 'Upload Data', href: '/upload',       icon: Upload,          label: 'Import CSV' },
    { name: 'Predictions', href: '/predictions',  icon: Brain,           label: 'ML Forecast' },
  ];
  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <>
      {/* ── Logo ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '64px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '30px', height: '30px', background: 'var(--accent)',
            borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(232,93,38,0.4)',
          }}>
            <BarChart3 size={15} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>SmartAnalytics</span>
            <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pro</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'none' }} className="mobile-close-btn">
          <X size={16} />
        </button>
      </div>

      {/* ── Status indicator ─────────────────────── */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.15)', borderRadius: '4px', padding: '7px 10px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px rgba(76,175,125,0.6)', animation: 'pulse-ring 2s ease-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success)', letterSpacing: '0.04em' }}>All systems operational</span>
        </div>
      </div>

      {/* ── Section label ────────────────────────── */}
      <div style={{ padding: '16px 20px 6px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Menu</span>
      </div>

      {/* ── Nav links ────────────────────────────── */}
      <nav style={{ flex: 1, padding: '4px 12px', overflow: 'hidden' }}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '6px',
                textDecoration: 'none', margin: '2px 0',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: active ? '600' : '500',
                transition: 'all 180ms var(--ease)',
                position: 'relative',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: active ? 'rgba(232,93,38,0.15)' : 'rgba(255,255,255,0.04)', borderRadius: '5px', flexShrink: 0, transition: 'background 180ms' }}>
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ lineHeight: 1.2 }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: active ? 'rgba(232,93,38,0.7)' : 'var(--text-muted)', fontWeight: '400', marginTop: '1px' }}>{item.label}</div>
              </div>
              {active && <ChevronRight size={11} style={{ flexShrink: 0, opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── Upgrade banner ────────────────────────── */}
      <div style={{ padding: '12px', flexShrink: 0 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(232,93,38,0.12), rgba(232,93,38,0.05))', border: '1px solid rgba(232,93,38,0.15)', borderRadius: '8px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={13} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>ML Model Active</span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Predictions ready based on your uploaded data.</p>
        </div>
      </div>

      {/* ── User card + logout ────────────────────── */}
      <div style={{ padding: '0 12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0, paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--accent)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '800', color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 10px rgba(232,93,38,0.3)',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{user?.name || 'User'}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '9px 12px', borderRadius: '6px', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500',
          transition: 'all 180ms var(--ease)', textAlign: 'left',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-dim)'; e.currentTarget.style.color = 'var(--error)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        height: '100vh', position: 'fixed',
        top: 0, left: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 280ms var(--ease)',
      }} className="r-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 49, backdropFilter: 'blur(6px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content Area ─────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }} className="main-area">

        {/* ── Top Header Bar ──────────────────────────────── */}
        <header style={{
          height: '60px',
          background: 'rgba(15,15,15,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} className="mobile-menu-btn">
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>SmartAnalytics</span>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            {navigation.map(n => isActive(n.href) ? (
              <span key={n.href} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{n.name}</span>
            ) : null)}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.15)', borderRadius: '3px', padding: '4px 8px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 5px rgba(76,175,125,0.8)' }} />
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success)', letterSpacing: '0.06em' }}>LIVE</span>
            </div>

            {/* Bell */}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', position: 'relative', display: 'flex' }}>
              <Bell size={17} />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', border: '1px solid var(--bg)' }} />
            </button>

            <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} />

            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}>
              <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#fff', boxShadow: '0 2px 8px rgba(232,93,38,0.35)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0] || 'User'}</span>
            </div>
          </div>
        </header>

        {/* ── Scrolling Marquee Live Transaction Ticker ── */}
        <div style={{
          height: '28px',
          background: 'rgba(12, 12, 12, 0.8)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          fontSize: '11px',
          fontWeight: '500',
          color: 'var(--text-secondary)',
          position: 'relative',
          flexShrink: 0
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '0 12px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderRight: '1px solid var(--border)',
            zIndex: 10,
            color: 'var(--accent)',
            fontWeight: '700',
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', marginRight: '6px', animation: 'pulse-ring 2s ease-out infinite' }} />
            Live Ingest
          </div>
          <div className="marquee-container" style={{ flex: 1 }}>
            <div className="marquee-track" style={{ display: 'inline-flex', gap: '48px', paddingLeft: '24px' }}>
              {tickerItems.concat(tickerItems).map((item, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{item.category}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({item.region})</span>
                  <span style={{ color: 'var(--accent)', fontWeight: '700' }}>${item.sales.toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Page Content ─────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '28px 28px' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Responsive Styles ────────────────────────────── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @media (max-width: 900px) {
          .r-sidebar { transform: translateX(-100%) !important; }
          .r-sidebar.open { transform: translateX(0) !important; }
          .main-area { margin-left: 0 !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}