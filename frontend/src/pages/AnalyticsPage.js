import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Sparkles, Activity, Printer } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

/* ── Custom tooltip with glass look ────────────────────── */
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      fontSize: '12px',
      fontFamily: 'var(--font)',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: '700' }}>
          {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    summary: {},
    trend: [],
    prevTrend: [],
    categories: [],
    regions: [],
    topProducts: []
  });
  const [selectedYear, setSelectedYear] = useState(2024);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summary, trend, prevTrend, categories, regions, topProducts] = await Promise.all([
        axios.get('/api/analytics/summary', { headers }),
        axios.get(`/api/analytics/trend?year=${selectedYear}`, { headers }),
        axios.get(`/api/analytics/trend?year=${selectedYear - 1}`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('/api/analytics/by-category', { headers }),
        axios.get('/api/analytics/by-region', { headers }),
        axios.get('/api/analytics/top-products', { headers })
      ]);

      setAnalyticsData({
        summary: summary.data.data || {},
        trend: trend.data.data || [],
        prevTrend: prevTrend.data?.data || [],
        categories: categories.data.data || [],
        regions: regions.data.data || [],
        topProducts: topProducts.data.data || []
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Revenue (USD)\n";
    
    analyticsData.trend.forEach(item => {
      csvContent += `${item.month},${item.revenue}\n`;
    });
    
    csvContent += "\nCategory,Revenue (USD)\n";
    analyticsData.categories.forEach(item => {
      const name = item._id || item.category || 'Unknown';
      csvContent += `${name},${item.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#E85D26', '#5DB5B0', '#E8A226', '#E05252', '#A78BFA', '#06b6d4', '#84cc16'];
  const years = [2022, 2023, 2024, 2025];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 20px',
            borderRadius: '50%',
            border: '2px solid rgba(232,93,38,0.15)',
            borderTop: '2px solid var(--accent)',
            animation: 'spin 0.9s linear infinite',
            boxShadow: '0 0 20px rgba(232,93,38,0.2)'
          }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: `$${(analyticsData.summary.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: '#E85D26',
      dimColor: 'rgba(232,93,38,0.12)',
      change: '+15.2%',
    },
    {
      label: 'Total Orders',
      value: (analyticsData.summary.totalOrders || 0).toLocaleString(),
      icon: BarChart3,
      color: '#5DB5B0',
      dimColor: 'rgba(93,181,176,0.12)',
      change: '+8.7%',
    },
    {
      label: 'Avg Order Value',
      value: `$${(analyticsData.summary.avgOrderValue || 0).toLocaleString()}`,
      icon: Activity,
      color: '#E8A226',
      dimColor: 'rgba(232,162,38,0.12)',
      change: '+3.4%',
    },
    {
      label: 'Total Profit',
      value: `$${(analyticsData.summary.totalProfit || 0).toLocaleString()}`,
      icon: Sparkles,
      color: '#A78BFA',
      dimColor: 'rgba(167,139,250,0.12)',
      change: '+18.5%',
    },
  ];

  return (
    <div className="analytics-bg fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header Bar ────────────────────────────────────── */}
      <SpotlightCard
        className="glass-header-bar"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px 24px' }}
      >
        <div>
          <div className="r-section-label" style={{ marginBottom: '8px' }}>
            <span className="r-label">Insights</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Detailed insights into your business performance.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px' }}>
            <Calendar size={13} color="var(--text-muted)" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="glass-select"
              style={{ padding: '0', border: 'none', background: 'transparent', outline: 'none' }}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            className="r-btn r-btn-primary r-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="r-btn r-btn-ghost r-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)' }}
          >
            <Printer size={13} />
            Print Report
          </button>
        </div>
      </SpotlightCard>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        {kpiCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <SpotlightCard
              key={i}
              className="glass-kpi"
              style={{ padding: '22px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{s.label}</span>
                <div style={{
                  width: '34px', height: '34px', background: s.dimColor,
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${s.color}22`,
                  boxShadow: `0 0 12px ${s.color}15`,
                }}>
                  <Icon size={15} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.025em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '8px' }}>
                {s.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)' }}>{s.change}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>vs last year</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${s.color}50, transparent)`, borderRadius: '0 0 8px 8px' }} />
            </SpotlightCard>
          );
        })}
      </div>

      {/* ── Revenue Trend Chart ─────────────────────────────── */}
      <SpotlightCard className="glass-chart-wrap" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>Revenue Trend</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly — {selectedYear}</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '20px',
            background: 'rgba(232,93,38,0.08)', border: '1px solid rgba(232,93,38,0.18)',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E85D26', boxShadow: '0 0 8px rgba(232,93,38,0.8)' }} />
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>Live Data</span>
          </div>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData.trend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E85D26" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E85D26" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E85D26" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#E85D26', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SpotlightCard>

      {/* ── Category + Region Charts ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

        <SpotlightCard className="glass-chart-wrap" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Revenue by Category</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Distribution across product lines</p>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.categories}
                  nameKey="category"
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="revenue"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                >
                  {analyticsData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        <SpotlightCard className="glass-chart-wrap" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Revenue by Region</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Geographic revenue breakdown</p>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.regions} barSize={28}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E85D26" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#E85D26" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="region" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>

      {/* ── Top Products Table ─────────────────────────────── */}
      <SpotlightCard className="glass-table-wrap" style={{}}>
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Top Performing Products</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ranked by total revenue</p>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)',
            padding: '4px 10px', borderRadius: '20px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)'
          }}>Top 10</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="r-table" style={{ background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={{ padding: '12px 20px' }}>Rank</th>
                <th style={{ padding: '12px 16px' }}>Product Name</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '12px 20px' }}>Revenue</th>
                <th style={{ textAlign: 'right', padding: '12px 20px' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '12px 20px' }}>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topProducts.slice(0, 10).map((product, index) => {
                const rankColors = ['#E8A226', '#9A9590', '#E85D26'];
                const rankColor = index < 3 ? rankColors[index] : 'var(--bg-elevated)';
                const rankTextColor = index < 3 ? '#fff' : 'var(--text-muted)';
                return (
                  <tr key={index}>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', width: '24px', height: '24px',
                        borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: '800',
                        background: rankColor, color: rankTextColor,
                        boxShadow: index < 3 ? `0 0 10px ${rankColor}50` : 'none',
                      }}>{index + 1}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{product.product}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '11px', background: 'rgba(232,93,38,0.1)', color: 'var(--accent)', padding: '3px 9px', borderRadius: '3px', fontWeight: '600', border: '1px solid rgba(232,93,38,0.15)' }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '14px 20px', fontWeight: '700', color: 'var(--text-primary)' }}>${product.revenue.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '14px 20px', color: 'var(--text-secondary)' }}>{product.orders}</td>
                    <td style={{ textAlign: 'right', padding: '14px 20px', color: 'var(--text-secondary)' }}>${(product.revenue / product.orders).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* ── Performance Metrics ────────────────────────────── */}
      {(() => {
        const revCurr = analyticsData.trend ? analyticsData.trend.reduce((sum, item) => sum + item.revenue, 0) : 0;
        const ordCurr = analyticsData.trend ? analyticsData.trend.reduce((sum, item) => sum + item.orders, 0) : 0;
        const unitsCurr = analyticsData.trend ? analyticsData.trend.reduce((sum, item) => sum + item.units, 0) : 0;

        const revPrev = analyticsData.prevTrend ? analyticsData.prevTrend.reduce((sum, item) => sum + item.revenue, 0) : 0;
        const ordPrev = analyticsData.prevTrend ? analyticsData.prevTrend.reduce((sum, item) => sum + item.orders, 0) : 0;
        const unitsPrev = analyticsData.prevTrend ? analyticsData.prevTrend.reduce((sum, item) => sum + item.units, 0) : 0;

        const revGrowth = revPrev > 0 ? ((revCurr - revPrev) / revPrev) * 100 : 0;
        const ordGrowth = ordPrev > 0 ? ((ordCurr - ordPrev) / ordPrev) * 100 : 0;
        const unitsGrowth = unitsPrev > 0 ? ((unitsCurr - unitsPrev) / unitsPrev) * 100 : 0;

        const growthRows = [
          ['Revenue Growth', revPrev > 0 ? `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}%` : 'N/A', revPrev > 0 ? (revGrowth >= 0 ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)'],
          ['Order Growth', ordPrev > 0 ? `${ordGrowth >= 0 ? '+' : ''}${ordGrowth.toFixed(1)}%` : 'N/A', ordPrev > 0 ? (ordGrowth >= 0 ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)'],
          ['Volume Growth', unitsPrev > 0 ? `${unitsGrowth >= 0 ? '+' : ''}${unitsGrowth.toFixed(1)}%` : 'N/A', unitsPrev > 0 ? (unitsGrowth >= 0 ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)']
        ];

        const marketShareRows = analyticsData.categories && analyticsData.categories.length > 0
          ? analyticsData.categories.slice(0, 3).map((c, index) => [
              c.category.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              `${c.percentage.toFixed(1)}%`,
              ['var(--accent)', 'var(--teal)', 'var(--warning)'][index % 3]
            ])
          : [
              ['Classic Cars', '0.0%', 'var(--accent)'],
              ['Motorcycles', '0.0%', 'var(--teal)'],
              ['Planes', '0.0%', 'var(--warning)']
            ];

        const totalRev = analyticsData.summary.totalRevenue || 0;
        const totalProfit = analyticsData.summary.totalProfit || 0;
        const profitMargin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0.0';
        const avgDiscount = (analyticsData.summary.avgDiscount || 0).toFixed(1);
        const totalUnits = analyticsData.summary.totalUnits || 0;
        const totalOrders = analyticsData.summary.totalOrders || 0;
        const avgUnitsPerOrder = totalOrders > 0 ? (totalUnits / totalOrders).toFixed(1) : '0.0';

        const keyMetricsRows = [
          ['Avg Units/Order', avgUnitsPerOrder, '#A78BFA'],
          ['Avg Discount', `${avgDiscount}%`, 'var(--accent)'],
          ['Profit Margin', `${profitMargin}%`, 'var(--success)']
        ];

        const performanceSections = [
          {
            title: 'Growth Rate',
            icon: TrendingUp,
            accentColor: '#4CAF7D',
            rows: growthRows
          },
          {
            title: 'Market Share',
            icon: BarChart3,
            accentColor: '#E85D26',
            rows: marketShareRows
          },
          {
            title: 'Key Metrics',
            icon: Sparkles,
            accentColor: '#A78BFA',
            rows: keyMetricsRows
          }
        ];

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {performanceSections.map((section) => {
              const Icon = section.icon;
              return (
                <SpotlightCard key={section.title} className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '7px',
                      background: `${section.accentColor}18`,
                      border: `1px solid ${section.accentColor}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={section.accentColor} />
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{section.title}</h4>
                  </div>
                  <div>
                    {section.rows.map(([label, val, color]) => (
                      <div key={label} className="glass-metric-row">
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        );
      })()}

    </div>
  );
}