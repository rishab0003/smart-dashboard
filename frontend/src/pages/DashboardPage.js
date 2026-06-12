import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users, ArrowUpRight, ArrowDownRight, BarChart2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

/* ── Sparkline SVG ── */
function Sparkline({ data = [], color = '#E85D26', height = 36, width = 90 }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1];
  const [lx, ly] = last.split(',').map(Number);
  const areaPoints = `0,${height} ${pts.join(' ')} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ background: 'linear-gradient(90deg, #1A1A1A 0%, #222 50%, #1A1A1A 100%)', backgroundSize: '200% 100%', animation: 'shimmerLoad 1.5s infinite', height: '10px', width: '60%', borderRadius: '4px', marginBottom: '16px' }} />
      <div style={{ background: 'linear-gradient(90deg, #1A1A1A 0%, #222 50%, #1A1A1A 100%)', backgroundSize: '200% 100%', animation: 'shimmerLoad 1.5s infinite 0.2s', height: '28px', width: '80%', borderRadius: '4px', marginBottom: '12px' }} />
      <div style={{ background: 'linear-gradient(90deg, #1A1A1A 0%, #222 50%, #1A1A1A 100%)', backgroundSize: '200% 100%', animation: 'shimmerLoad 1.5s infinite 0.4s', height: '10px', width: '40%', borderRadius: '4px' }} />
      <style>{`@keyframes shimmerLoad { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    trend: [],
    categories: [],
    regions: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  
  // Real-time Chart customization state
  const [chartType, setChartType] = useState('area'); // 'line' | 'area' | 'bar'

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summary, categories, regions, topProducts, fields] = await Promise.all([
        axios.get('/api/analytics/summary', { headers }),
        axios.get('/api/analytics/by-category', { headers }),
        axios.get('/api/analytics/by-region', { headers }),
        axios.get('/api/analytics/top-products', { headers }),
        axios.get('/api/analytics/fields', { headers }).catch(() => ({ data: { data: { years: [] } } }))
      ]);

      const yearsList = fields.data.data?.years || [];
      setAvailableYears(yearsList);

      const defaultYear = yearsList.length > 0 ? yearsList[0].toString() : new Date().getFullYear().toString();
      setSelectedYear(defaultYear);

      setDashboardData({
        summary: summary.data.data || {},
        trend: [],
        categories: categories.data.data || [],
        regions: regions.data.data || [],
        topProducts: topProducts.data.data || []
      });

      await fetchTrendData(defaultYear);
    } catch (error) {
      console.error('Failed to fetch initial dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async (year) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/analytics/trend?year=${year}`, { headers });
      setDashboardData(prev => ({
        ...prev,
        trend: response.data.data || []
      }));
    } catch (error) {
      console.error(`Failed to fetch trend data for ${year}:`, error);
    }
  };

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    await fetchTrendData(year);
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      rawValue: dashboardData.summary.totalRevenue || 0,
      format: v => `$${v.toLocaleString()}`,
      change: '+4.2%', changeType: 'positive',
      icon: DollarSign,
      spark: [32,40,36,52,48,62,58,78,72,88,84,100],
    },
    {
      title: 'Total Orders',
      rawValue: dashboardData.summary.totalOrders || 0,
      format: v => v.toLocaleString(),
      change: '+12%', changeType: 'positive',
      icon: ShoppingCart,
      spark: [20,28,24,36,40,38,50,55,48,62,58,70],
    },
    {
      title: 'Avg Order Value',
      rawValue: dashboardData.summary.avgOrderValue || 0,
      format: v => `$${v.toLocaleString()}`,
      change: '-0.5%', changeType: 'negative',
      icon: TrendingUp,
      spark: [60,58,62,56,58,60,56,62,58,60,56,60],
    },
    {
      title: 'Total Profit',
      rawValue: dashboardData.summary.totalProfit || 0,
      format: v => `$${v.toLocaleString()}`,
      change: '+8.1%', changeType: 'positive',
      icon: Activity,
      spark: [15,22,20,30,28,38,35,45,42,54,50,62],
    },
  ];

  const COLORS = ['#E85D26', '#5DB5B0', '#E8A226', '#E05252', '#A78BFA'];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ height: '60px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 24px', animation: 'shimmerLoad 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', height: '280px', animation: 'shimmerLoad 1.5s infinite 0.3s' }} />
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', height: '280px', animation: 'shimmerLoad 1.5s infinite 0.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <div className="r-section-label" style={{ marginBottom: '8px' }}>
          <span className="r-label">Overview</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Your business performance analytics node.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const isPos = card.changeType === 'positive';
          const sparkColor = isPos ? '#4CAF7D' : '#E05252';
          return (
            <SpotlightCard key={index} className="r-kpi-card" style={{ overflow: 'hidden', position: 'relative', cursor: 'default' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${isPos ? 'var(--success)' : 'var(--error)'}, transparent)`, opacity: 0.4 }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span className="r-label">{card.title}</span>
                <div style={{ width: '30px', height: '30px', background: 'var(--accent-dim)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color="var(--accent)" />
                </div>
              </div>
              <div className="r-kpi-value" style={{ marginBottom: '10px' }}>{card.format(card.rawValue)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isPos
                    ? <ArrowUpRight size={12} color="var(--success)" />
                    : <ArrowDownRight size={12} color="var(--error)" />
                  }
                  <span className={isPos ? 'r-kpi-change-up' : 'r-kpi-change-down'}>{card.change}</span>
                </div>
                <Sparkline data={card.spark} color={sparkColor} height={32} width={80} />
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        
        {/* Revenue Trend Chart */}
        <SpotlightCard style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Revenue Trend</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Chart type switchers */}
              <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px' }}>
                {['line', 'area', 'bar'].map(t => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    style={{
                      background: chartType === t ? 'var(--accent-dim)' : 'transparent',
                      color: chartType === t ? 'var(--accent)' : 'var(--text-secondary)',
                      border: 'none', borderRadius: '3px', padding: '4px 8px', fontSize: '11px',
                      fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize',
                      transition: 'all 150ms var(--ease)'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {availableYears.length > 0 && (
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={dashboardData.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#E85D26" strokeWidth={2.5} dot={{ fill: '#E85D26', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#FF7940' }} />
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={dashboardData.trend}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E85D26" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#E85D26" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#E85D26" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              ) : (
                <BarChart data={dashboardData.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="revenue" fill="#E85D26" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Revenue by Category */}
        <SpotlightCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Revenue by Category</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboardData.categories} cx="50%" cy="50%" outerRadius={80} dataKey="revenue" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-muted)' }}>
                  {dashboardData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }} className="bottom-charts">
        {/* Revenue by Region */}
        <SpotlightCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Revenue by Region</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.regions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="region" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="#E85D26" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Top Products */}
        <SpotlightCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Top Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {dashboardData.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: index < 4 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{product.product}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{product.category}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>${product.revenue.toLocaleString()}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{product.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      {/* Recent Activity */}
      <SpotlightCard style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Recent activity log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { color: 'var(--success)', text: 'New business dataset loaded successfully', time: 'Just now' },
            { color: 'var(--accent)', text: 'Retrained Random Forest prediction network', time: '1 minute ago' },
            { color: 'var(--warning)', text: 'Indexed sales analytics partitions', time: '2 minutes ago' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.text}</p>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
}