import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Filter, Download, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import axios from 'axios';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    summary: {},
    trend: [],
    categories: [],
    regions: [],
    topProducts: []
  });
  const [selectedYear, setSelectedYear] = useState(2024);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedYear]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summary, trend, categories, regions, topProducts] = await Promise.all([
        axios.get('/api/analytics/summary', { headers }),
        axios.get(`/api/analytics/trend?year=${selectedYear}`, { headers }),
        axios.get('/api/analytics/by-category', { headers }),
        axios.get('/api/analytics/by-region', { headers }),
        axios.get('/api/analytics/top-products', { headers })
      ]);

      setAnalyticsData({
        summary: summary.data.data || {},
        trend: trend.data.data || [],
        categories: categories.data.data || [],
        regions: regions.data.data || [],
        topProducts: topProducts.data.data || []
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#E85D26', '#5DB5B0', '#E8A226', '#E05252', '#A78BFA', '#06b6d4', '#84cc16'];

  const years = [2022, 2023, 2024];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
        <div>
          <div className="r-section-label" style={{ marginBottom: '8px' }}>
            <span className="r-label">Insights</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Analytics</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Detailed insights into your business performance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button className="r-btn r-btn-primary r-btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Revenue', value: `$${(analyticsData.summary.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp },
          { label: 'Total Orders', value: (analyticsData.summary.totalOrders || 0).toLocaleString(), icon: BarChart3 },
          { label: 'Avg Order Value', value: `$${(analyticsData.summary.avgOrderValue || 0).toLocaleString()}`, icon: TrendingUp },
          { label: 'Total Profit', value: `$${(analyticsData.summary.totalProfit || 0).toLocaleString()}`, icon: TrendingUp },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="r-kpi-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="r-label">{s.label}</span>
                <div style={{ width: '32px', height: '32px', background: 'var(--accent-dim)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color="var(--accent)" />
                </div>
              </div>
              <div className="r-kpi-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <div className="r-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Revenue Trend ({selectedYear})</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly</span>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData.trend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E85D26" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#E85D26" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#E85D26" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Revenue by Category */}
        <div className="r-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Revenue by Category</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analyticsData.categories} cx="50%" cy="50%" outerRadius={80} dataKey="revenue" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {analyticsData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Region */}
        <div className="r-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Revenue by Region</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.regions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="region" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="#E85D26" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="r-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Top Performing Products</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="r-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Orders</th>
                <th style={{ textAlign: 'right' }}>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topProducts.slice(0, 10).map((product, index) => (
                <tr key={index}>
                  <td>
                    <span style={{ display: 'inline-flex', width: '22px', height: '22px', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', background: index === 0 ? '#E8A226' : index === 1 ? '#9A9590' : index === 2 ? '#E85D26' : 'var(--bg)', color: index < 3 ? '#fff' : 'var(--text-muted)' }}>
                      {index + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{product.productName}</td>
                  <td>
                    <span style={{ fontSize: '11px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '2px', fontWeight: '600' }}>
                      {product.productLine}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>${product.revenue.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{product.orders}</td>
                  <td style={{ textAlign: 'right' }}>${(product.revenue / product.orders).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {[
          { title: 'Growth Rate', rows: [['Revenue Growth', '+15.2%', 'var(--success)'], ['Order Growth', '+8.7%', 'var(--success)'], ['Customer Growth', '+12.3%', 'var(--success)']] },
          { title: 'Market Share', rows: [['Classic Cars', '35%', 'var(--accent)'], ['Motorcycles', '28%', 'var(--teal)'], ['Planes', '22%', 'var(--warning)']] },
          { title: 'Key Metrics', rows: [['Conversion Rate', '3.2%', '#A78BFA'], ['Return Rate', '2.1%', 'var(--accent)'], ['Profit Margin', '18.5%', 'var(--success)']] },
        ].map(section => (
          <div key={section.title} className="r-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>{section.title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {section.rows.map(([label, val, color], i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}