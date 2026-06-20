import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Brain, BarChart3,
  LogOut, Menu, X, Bell, ChevronRight, Zap,
  CheckCheck, TrendingUp, FileUp, AlertCircle, Cpu,
  Sun, Moon, Database
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  { id: 1, icon: FileUp,    color: '#5DB5B0', title: 'CSV Upload Complete',        body: 'sales_data_2024.csv processed successfully.', time: '2 min ago',  read: false },
  { id: 2, icon: Cpu,       color: '#E85D26', title: 'ML Model Retrained',         body: 'Your custom model achieved 94.2% accuracy.',   time: '18 min ago', read: false },
  { id: 3, icon: TrendingUp,color: '#A78BFA', title: 'Prediction Ready',           body: 'Q3 forecast generated for Classic Cars line.',  time: '1 hr ago',   read: false },
  { id: 4, icon: AlertCircle,color:'#E8A226', title: 'Data Validation Warning',    body: '3 rows skipped — missing Region field.',       time: '3 hr ago',   read: true  },
  { id: 5, icon: FileUp,    color: '#4CAF7D', title: 'Export Downloaded',          body: 'analytics_report.csv saved to your device.',  time: 'Yesterday',  read: true  },
];

export default function Layout({ user, logout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  });
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notifRef = useRef(null);
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Apply theme class to <html> and persist
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
    // Origin: centre of the toggle button, fallback to center of window
    const x = rect ? Math.round(rect.left + rect.width  / 2) : Math.round(window.innerWidth / 2);
    const y = rect ? Math.round(rect.top  + rect.height / 2) : Math.round(window.innerHeight / 2);

    // Radius large enough to cover the entire viewport from the origin
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y)
    );

    if (!document.startViewTransition) {
      // Fallback for older browsers
      const html = document.documentElement;
      html.classList.add('theme-transitioning');
      setIsDark(d => !d);
      setTimeout(() => html.classList.remove('theme-transitioning'), 450);
      return;
    }

    // Use View Transitions API for a circular reveal from the button
    const transition = document.startViewTransition(() => {
      // flushSync forces React to render synchronously so the html.light
      // class is applied INSIDE the transition snapshot callback
      flushSync(() => setIsDark(d => !d));
    });

    // Once the browser has captured both before/after snapshots, animate
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 550,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // spring-like ease-out
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

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
    { name: 'Data Explorer', href: '/explorer',    icon: Database,        label: 'Spreadsheet' },
  ];
  const isActive = (path) => location.pathname === path;
  const activeIndex = navigation.findIndex(item => isActive(item.href));

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
      <nav style={{ flex: 1, padding: '4px 12px', overflow: 'hidden', position: 'relative' }} onMouseLeave={() => setHoveredIndex(null)}>
        {/* Sliding active highlight background */}
        <div
          style={{
            position: 'absolute',
            left: '12px',
            right: '12px',
            height: '46px',
            borderRadius: '6px',
            background: 'var(--accent-dim)',
            borderLeft: '2px solid var(--accent)',
            pointerEvents: 'none',
            transition: 'transform 260ms cubic-bezier(0.25, 1, 0.5, 1), opacity 150ms',
            opacity: (hoveredIndex !== null || activeIndex !== -1) ? 1 : 0,
            transform: `translateY(${(hoveredIndex !== null ? hoveredIndex : (activeIndex !== -1 ? activeIndex : 0)) * 50}px)`,
            zIndex: 0
          }}
        />

        {navigation.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isHighlighted = hoveredIndex !== null ? hoveredIndex === index : active;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              onMouseEnter={() => setHoveredIndex(index)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '6px',
                textDecoration: 'none', margin: '4px 0',
                color: isHighlighted ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: active ? '600' : '500',
                transition: 'color 220ms var(--ease)',
                position: 'relative',
                zIndex: 1,
                height: '46px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px',
                background: isHighlighted ? 'rgba(232,93,38,0.15)' : 'rgba(255,255,255,0.04)',
                borderRadius: '5px', flexShrink: 0,
                transition: 'background 220ms, color 220ms',
                color: isHighlighted ? 'var(--accent)' : 'inherit'
              }}>
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ lineHeight: 1.2 }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: isHighlighted ? 'rgba(232,93,38,0.7)' : 'var(--text-muted)', fontWeight: '400', marginTop: '1px', transition: 'color 220ms' }}>{item.label}</div>
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
        <header
          className="app-header"
          style={{
            height: '60px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', flexShrink: 0,
            position: 'sticky', top: 0, zIndex: 30,
          }}
        >
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

            {/* Theme toggle */}
            <button
              id="theme-toggle"
              onClick={(e) => toggleTheme(e)}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                border: '1px solid var(--border)',
                borderRadius: '8px', cursor: 'pointer',
                color: isDark ? '#E8A226' : '#52525B',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isDark ? 'rgba(232,162,38,0.12)' : 'rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(232,162,38,0.3)' : 'rgba(0,0,0,0.18)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {isDark
                ? <Sun  size={15} strokeWidth={2} />
                : <Moon size={15} strokeWidth={2} />}
            </button>

            {/* Bell + Notification Dropdown */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                style={{
                  background: notifOpen ? 'rgba(232,93,38,0.1)' : 'none',
                  border: notifOpen ? '1px solid rgba(232,93,38,0.25)' : '1px solid transparent',
                  borderRadius: '6px', padding: '5px 6px',
                  cursor: 'pointer', color: notifOpen ? 'var(--accent)' : 'var(--text-muted)',
                  position: 'relative', display: 'flex',
                  transition: 'all 180ms var(--ease)',
                }}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    minWidth: '16px', height: '16px', padding: '0 4px',
                    background: 'var(--accent)', borderRadius: '8px',
                    border: '1.5px solid var(--bg)',
                    fontSize: '9px', fontWeight: '800', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    letterSpacing: '-0.02em',
                  }}>{unreadCount}</span>
                )}
              </button>

              {/* Dropdown panel */}
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: '-8px',
                  width: '340px', zIndex: 100,
                  background: isDark ? 'rgba(14,14,14,0.92)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(28px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
                  border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.09)',
                  borderRadius: '12px',
                  boxShadow: isDark 
                    ? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,93,38,0.06), inset 0 1px 0 rgba(255,255,255,0.06)' 
                    : '0 24px 64px rgba(0,0,0,0.08), 0 0 0 1px rgba(232,93,38,0.04), inset 0 1px 0 rgba(255,255,255,0.4)',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.18s ease-out both',
                }}>
                  {/* Panel header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px 12px',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={13} color="var(--accent)" />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', background: 'rgba(232,93,38,0.12)', border: '1px solid rgba(232,93,38,0.2)', borderRadius: '10px', padding: '1px 7px' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', transition: 'color 150ms' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <CheckCheck size={12} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications.map((notif, i) => {
                      const Icon = notif.icon;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markOneRead(notif.id)}
                          style={{
                            display: 'flex', gap: '12px', padding: '12px 16px',
                            borderBottom: i < notifications.length - 1 ? (isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)') : 'none',
                            background: notif.read ? 'transparent' : (isDark ? 'rgba(232,93,38,0.03)' : 'rgba(232,93,38,0.05)'),
                            cursor: 'pointer', transition: 'background 150ms',
                            alignItems: 'flex-start',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : (isDark ? 'rgba(232,93,38,0.03)' : 'rgba(232,93,38,0.05)')}
                        >
                          {/* Icon badge */}
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: `${notif.color}15`,
                            border: `1px solid ${notif.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginTop: '1px',
                          }}>
                            <Icon size={14} color={notif.color} />
                          </div>
                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {notif.title}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{notif.time}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{notif.body}</p>
                          </div>
                          {/* Unread dot */}
                          {!notif.read && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px rgba(232,93,38,0.6)', flexShrink: 0, marginTop: '5px' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: '10px 16px',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {notifications.length} total notifications
                    </span>
                  </div>
                </div>
              )}
            </div>

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
        <div
          className="app-ticker"
          style={{
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            fontSize: '11px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            position: 'relative',
            flexShrink: 0
          }}
        >
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