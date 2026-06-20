import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Database, AlertCircle, CheckCircle, RefreshCw, X, Calendar, User, Tag, MapPin, DollarSign, Package } from 'lucide-react';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

export default function DataExplorerPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit / Delete Modals
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchSales();
  }, [page, limit, search, sortBy, sortOrder]);

  // Debounced search reset to page 1
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sales', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search, sortBy, sortOrder }
      });
      if (response.data.success) {
        setSales(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load sales data:', error);
      showFeedback('error', 'Error fetching transaction database.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/sales/${editRecord._id}`, editRecord, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showFeedback('success', 'Transaction updated successfully!');
        setEditRecord(null);
        fetchSales();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.error || 'Failed to update record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/sales/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showFeedback('success', 'Transaction deleted successfully.');
        setDeleteId(null);
        // If current page became empty, roll back one page
        if (sales.length === 1 && page > 1) {
          setPage(prev => prev - 1);
        } else {
          fetchSales();
        }
      }
    } catch (error) {
      showFeedback('error', 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditFieldChange = (field, val) => {
    setEditRecord(prev => {
      const updated = { ...prev, [field]: val };
      // Derived calculations
      if (field === 'unitsSold' || field === 'unitPrice') {
        const qty = field === 'unitsSold' ? parseInt(val) || 0 : parseInt(prev.unitsSold) || 0;
        const price = field === 'unitPrice' ? parseFloat(val) || 0 : parseFloat(prev.unitPrice) || 0;
        updated.totalRevenue = qty * price;
      }
      return updated;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <div className="r-section-label" style={{ marginBottom: '8px' }}>
          <span className="r-label">Database Management Node</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Data Explorer</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>View, search, edit and audit your raw transaction spreadsheet records.</p>
      </div>

      {/* Toast Alert Feedback */}
      {feedback.message && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
          background: feedback.type === 'success' ? 'rgba(76, 175, 125, 0.95)' : 'rgba(224, 82, 82, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 32px rgba(0,0,0,0.35)', color: '#fff',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{feedback.message}</span>
        </div>
      )}

      {/* Control Bar */}
      <SpotlightCard className="r-control-bar" style={{ padding: '14px 20px' }}>
        {/* Search */}
        <div className="r-control-bar-search">
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search product, category, region..."
            value={search}
            onChange={handleSearchChange}
            className="r-input"
            style={{ 
              paddingLeft: '36px', 
              height: '38px', 
              fontSize: '13px', 
              width: '100%', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)'
            }}
          />
        </div>

        {/* Info & Page Options */}
        <div className="r-control-bar-options">
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Found <strong style={{ color: 'var(--accent)' }}>{totalRecords.toLocaleString()}</strong> records
          </span>

          <select
            value={limit}
            onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }}
            className="glass-select"
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: '12px', padding: '0 28px 0 12px', height: '38px', outline: 'none',
              cursor: 'pointer'
            }}
          >
            {[5, 10, 25, 50].map(val => (
              <option key={val} value={val}>{val} rows / page</option>
            ))}
          </select>
        </div>
      </SpotlightCard>

      {/* Table Container */}
      <SpotlightCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="r-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('date')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Date
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'date' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('product')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Product
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'product' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('category')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Category
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'category' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('region')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Region
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'region' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th className="hide-tablet">Salesperson</th>
                <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} onClick={() => toggleSort('unitsSold')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Qty
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'unitsSold' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} onClick={() => toggleSort('unitPrice')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Price
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'unitPrice' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} onClick={() => toggleSort('totalRevenue')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Revenue
                    <ArrowUpDown size={11} style={{ opacity: sortBy === 'totalRevenue' ? 1 : 0.4 }} />
                  </div>
                </th>
                <th style={{ textAlign: 'right' }} className="hide-tablet">Profit</th>
                <th style={{ textAlign: 'right' }} className="hide-tablet">Discount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: '64px 0', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px', width: '28px', height: '28px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Querying sales transaction register...</span>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '64px 0', textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', strokeWidth: 1.2 }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>No transaction logs match search filters</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Tweak filters or run a CSV import</p>
                  </td>
                </tr>
              ) : (
                sales.map(s => (
                  <tr key={s._id} style={{ transition: 'background 180ms' }}>
                    <td style={{ fontWeight: '500' }}>{new Date(s.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.product}</td>
                    <td>
                      <span style={{ fontSize: '11px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                        {s.category}
                      </span>
                    </td>
                    <td>{s.region}</td>
                    <td className="hide-tablet">{s.salesperson || 'N/A'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{s.unitsSold.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>${s.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>${s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', color: s.profit >= 0 ? 'var(--success)' : 'var(--error)' }} className="hide-tablet">
                      ${s.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }} className="hide-tablet">{s.discount}%</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setEditRecord({ ...s })}
                          title="Edit transaction"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px',
                            background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                            color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 150ms'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteId(s._id)}
                          title="Delete transaction"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px',
                            background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                            color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 150ms'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--error)'; e.currentTarget.style.color = 'var(--error)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)',
            flexWrap: 'wrap', gap: '16px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="r-btn r-btn-ghost r-btn-sm"
                style={{ padding: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const idx = i + 1;
                // Show first, last, and window around current page
                if (idx === 1 || idx === totalPages || (idx >= page - 1 && idx <= page + 1)) {
                  return (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={page === idx ? 'r-btn r-btn-primary r-btn-sm' : 'r-btn r-btn-ghost r-btn-sm'}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {idx}
                    </button>
                  );
                }
                if (idx === 2 || idx === totalPages - 1) {
                  return <span key={idx} style={{ padding: '0 4px', alignSelf: 'center', color: 'var(--text-muted)' }}>...</span>;
                }
                return null;
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="r-btn r-btn-ghost r-btn-sm"
                style={{ padding: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </SpotlightCard>

      {/* Edit Record Glass Modal */}
      {editRecord && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <SpotlightCard style={{ width: '100%', maxWidth: '540px', padding: '32px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <button
              onClick={() => setEditRecord(null)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>Edit Record</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Modify the fields below. Derived revenue is calculated automatically.</p>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Product / Category Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Package size={12} /> Product
                  </label>
                  <input
                    type="text"
                    required
                    value={editRecord.product}
                    onChange={e => handleEditFieldChange('product', e.target.value)}
                    className="r-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Tag size={12} /> Category
                  </label>
                  <input
                    type="text"
                    required
                    value={editRecord.category}
                    onChange={e => handleEditFieldChange('category', e.target.value)}
                    className="r-input"
                  />
                </div>
              </div>

              {/* Region / Salesperson Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <MapPin size={12} /> Region
                  </label>
                  <input
                    type="text"
                    required
                    value={editRecord.region}
                    onChange={e => handleEditFieldChange('region', e.target.value)}
                    className="r-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <User size={12} /> Salesperson
                  </label>
                  <input
                    type="text"
                    value={editRecord.salesperson || ''}
                    onChange={e => handleEditFieldChange('salesperson', e.target.value)}
                    className="r-input"
                  />
                </div>
              </div>

              {/* Qty / Price / Discount Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editRecord.unitsSold}
                    onChange={e => handleEditFieldChange('unitsSold', parseInt(e.target.value) || 0)}
                    className="r-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editRecord.unitPrice}
                    onChange={e => handleEditFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
                    className="r-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editRecord.discount}
                    onChange={e => handleEditFieldChange('discount', parseInt(e.target.value) || 0)}
                    className="r-input"
                  />
                </div>
              </div>

              {/* Profit / Date Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Profit ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRecord.profit}
                    onChange={e => handleEditFieldChange('profit', parseFloat(e.target.value) || 0)}
                    className="r-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Calendar size={12} /> Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editRecord.date ? new Date(editRecord.date).toISOString().split('T')[0] : ''}
                    onChange={e => handleEditFieldChange('date', e.target.value)}
                    className="r-input"
                  />
                </div>
              </div>

              {/* Derived Revenue Preview */}
              <div style={{
                background: 'rgba(232, 93, 38, 0.04)', border: '1px solid rgba(232, 93, 38, 0.15)',
                borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Estimated Revenue:</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)' }}>
                  ${(editRecord.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="r-btn r-btn-ghost r-btn-sm"
                  style={{ height: '36px', padding: '0 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="r-btn r-btn-primary r-btn-sm"
                  style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {actionLoading ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </SpotlightCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <SpotlightCard style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center', border: '1px solid rgba(224, 82, 82, 0.2)' }}>
            <div style={{
              width: '48px', height: '48px', background: 'rgba(224, 82, 82, 0.1)', border: '1px solid rgba(224, 82, 82, 0.3)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <Trash2 size={20} color="var(--error)" />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.015em' }}>Delete Transaction Record?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              This action cannot be undone. Any ML predictions or graphs will reflect this database change.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteId(null)}
                disabled={actionLoading}
                className="r-btn r-btn-ghost r-btn-sm"
                style={{ height: '36px', padding: '0 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="r-btn r-btn-primary"
                style={{ height: '36px', padding: '0 20px', background: 'var(--error)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {actionLoading ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : 'Confirm Delete'}
              </button>
            </div>
          </SpotlightCard>
        </div>
      )}
    </div>
  );
}
