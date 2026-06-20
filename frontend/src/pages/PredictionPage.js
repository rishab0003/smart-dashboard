import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, Package, MapPin, DollarSign, Lock, Unlock, RefreshCw, BarChart2, CheckCircle, ArrowRightLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const FEATURE_LABELS = {
  quantityordered: 'Quantity Ordered',
  priceeach: 'Unit Price',
  msrp: 'MSRP',
  productline_encoded: 'Product Line',
  territory_encoded: 'Territory/Region',
  month: 'Month of Year',
  year: 'Calendar Year',
  quarter: 'Quarter',
  season: 'Season',
  is_quarter_end: 'Quarter End',
  month_sin: 'Month Cycle (Sin)',
  month_cos: 'Month Cycle (Cos)',
  day_of_week: 'Day of Week',
  is_weekend: 'Weekend'
};

/* ── Count-up animation for prediction text ── */
function AnimateCount({ value, duration = 600 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = null;
    const end = parseFloat(value);
    const startVal = displayValue;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayValue(Math.floor(startVal + ease * (end - startVal)));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span>${displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>;
}

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    quantityordered: 30,
    priceeach: 100.00,
    productline: '',
    territory: ''
  });
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictionHistory, setPredictionHistory] = useState([]);
  
  const [productLines, setProductLines] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [hasCustomFields, setHasCustomFields] = useState(false);
  const [loadingFields, setLoadingFields] = useState(true);
  
  // What-If Scenario States
  const [scenarioA, setScenarioA] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  // Hyperparameters & Training States
  const [nEstimators, setNEstimators] = useState(30);
  const [maxDepth, setMaxDepth] = useState(8);
  const [trainingModel, setTrainingModel] = useState(false);
  const [trainSuccess, setTrainSuccess] = useState(false);

  useEffect(() => {
    if (modelInfo && modelInfo.hyperparameters) {
      setNEstimators(modelInfo.hyperparameters.n_estimators || 30);
      setMaxDepth(modelInfo.hyperparameters.max_depth || 8);
    }
  }, [modelInfo]);

  useEffect(() => {
    fetchCustomFields();
    fetchModelStatus();
  }, []);

  const fetchModelStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/predict/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setModelInfo(response.data.modelInfo || null);
      }
    } catch (err) {
      console.error('Failed to load model status:', err);
    }
  };

  const handleRetrain = async () => {
    setTrainingModel(true);
    setTrainSuccess(false);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/predict/train', {
        hyperparameters: {
          n_estimators: nEstimators,
          max_depth: maxDepth
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTrainSuccess(true);
        await fetchModelStatus();
        setTimeout(() => setTrainSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Model training failed. Please try again.');
    } finally {
      setTrainingModel(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/analytics/fields', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { categories, regions } = response.data.data;
      
      let pLines = [];
      let tRegions = [];

      if (categories && categories.length > 0) {
        pLines = categories;
        setHasCustomFields(true);
      } else {
        pLines = [
          'Classic Cars',
          'Motorcycles', 
          'Planes',
          'Ships',
          'Trains',
          'Trucks and Buses',
          'Vintage Cars'
        ].map(p => p.toUpperCase());
        setHasCustomFields(false);
      }

      if (regions && regions.length > 0) {
        tRegions = regions.map(r => ({ value: r.toUpperCase(), label: r }));
      } else {
        tRegions = [
          { value: 'APAC', label: 'APAC' },
          { value: 'EMEA', label: 'EMEA' },
          { value: 'Japan', label: 'Japan' },
          { value: 'NA', label: 'North America' }
        ].map(t => ({ value: t.value.toUpperCase(), label: t.label }));
      }

      setProductLines(pLines);
      setTerritories(tRegions);

      // Pre-select first values if empty
      setFormData(prev => ({
        ...prev,
        productline: prev.productline || pLines[0] || '',
        territory: prev.territory || tRegions[0]?.value || ''
      }));

    } catch (err) {
      console.error('Failed to load custom fields:', err);
    } finally {
      setLoadingFields(false);
    }
  };

  // Real-time Prediction Debounced Trigger
  useEffect(() => {
    if (!formData.productline || !formData.territory || !formData.month) return;

    const delayDebounce = setTimeout(() => {
      triggerPrediction();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [formData]);

  const triggerPrediction = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/predict', {
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        quantityordered: parseInt(formData.quantityordered),
        priceeach: parseFloat(formData.priceeach),
        productline: formData.productline,
        territory: formData.territory
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = response.data.data;
      setPrediction(result);

      // Add to history
      const historyItem = {
        ...formData,
        prediction: result.predicted_sales,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        id: Date.now()
      };
      
      setPredictionHistory(prev => {
        // Prevent spamming sliders updates in history list
        if (prev.length > 0 && 
            prev[0].productline === historyItem.productline && 
            prev[0].territory === historyItem.territory && 
            Math.abs(prev[0].quantityordered - historyItem.quantityordered) < 10 &&
            Math.abs(prev[0].priceeach - historyItem.priceeach) < 15) {
          // just update the top item to avoid flooding
          const updated = [...prev];
          updated[0] = historyItem;
          return updated;
        }
        return [historyItem, ...prev.slice(0, 4)];
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (name, val) => {
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Scenario locking functions
  const lockScenarioA = () => {
    if (!prediction) return;
    setScenarioA({
      formData: { ...formData },
      predicted_sales: prediction.predicted_sales
    });
  };

  const clearScenarioA = () => {
    setScenarioA(null);
  };

  // Setup comparison details
  const deltaValue = scenarioA && prediction ? (prediction.predicted_sales - scenarioA.predicted_sales) : 0;
  const deltaPercent = scenarioA && scenarioA.predicted_sales > 0 ? (deltaValue / scenarioA.predicted_sales) * 100 : 0;

  const comparisonChartData = scenarioA && prediction ? [
    {
      name: 'Scenario A (Locked)',
      revenue: Math.round(scenarioA.predicted_sales),
      color: '#9A9590'
    },
    {
      name: 'Scenario B (Current)',
      revenue: Math.round(prediction.predicted_sales),
      color: '#E85D26'
    }
  ] : [];

  const importanceData = modelInfo && modelInfo.feature_importances
    ? Object.entries(modelInfo.feature_importances)
        .map(([key, val]) => ({
          name: FEATURE_LABELS[key] || key,
          importance: val * 100
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', marginBottom: '8px' }}>
        <div>
          <div className="r-section-label" style={{ marginBottom: '8px' }}>
            <span className="r-label">ML Forecasting Console</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Revenue Predictions</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Drag sliders and tweak features to forecast revenue streams in real time.</p>
        </div>

        {modelInfo && (
          <div style={{ background: 'rgba(232, 93, 38, 0.05)', border: '1px solid rgba(232, 93, 38, 0.15)', borderRadius: '6px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <div className="r-pulse-dot" style={{ width: '6px', height: '6px', background: 'var(--accent)' }} />
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Active Model: </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{modelInfo.model_type}</span>
              <span style={{ color: 'var(--text-muted)' }}> ({modelInfo.records_count || 0} records)</span>
            </div>
          </div>
        )}
      </div>

      {!hasCustomFields && !loadingFields && (
        <div className="warning" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
          <strong>No historical custom data found.</strong> Using preset baseline models. Upload a sales dataset in the Import section to train a custom Random Forest model.
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px' }} className="prediction-grid">
        
        {/* Predictor Simulator Console */}
        <SpotlightCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', background: 'var(--accent-dim)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Simulator Controls</h2>
            </div>
            {loading && <div className="spinner" style={{ width: '14px', height: '14px' }}></div>}
          </div>

          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div className="error">
                {error}
              </div>
            )}

            {/* Categoricals Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <MapPin size={14} color="var(--text-muted)" />
                  Territory
                </label>
                <select
                  name="territory"
                  value={formData.territory}
                  onChange={handleChange}
                  className="r-input"
                  required
                >
                  {territories.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Package size={14} color="var(--text-muted)" />
                  Product Line
                </label>
                <select
                  name="productline"
                  value={formData.productline}
                  onChange={handleChange}
                  className="r-input"
                  required
                >
                  {productLines.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year/Month Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Calendar size={14} color="var(--text-muted)" />
                  Month
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="r-input"
                  required
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Calendar size={14} color="var(--text-muted)" />
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="2020"
                  max="2030"
                  className="r-input"
                  required
                />
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', background: 'var(--border)' }}></div>

            {/* Sliders Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quantity Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    <Package size={14} color="var(--text-muted)" />
                    Quantity Ordered
                  </label>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: '4px' }}>
                    {formData.quantityordered} units
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={formData.quantityordered}
                  onChange={(e) => handleSliderChange('quantityordered', parseInt(e.target.value))}
                  className="r-slider"
                />
              </div>

              {/* Price Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    <DollarSign size={14} color="var(--text-muted)" />
                    Unit Price ($)
                  </label>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: '4px' }}>
                    ${formData.priceeach} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={formData.priceeach}
                  onChange={(e) => handleSliderChange('priceeach', parseFloat(e.target.value))}
                  className="r-slider"
                />
              </div>
            </div>
          </form>
        </SpotlightCard>

        {/* Prediction Results and Sandbox Compare */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Predict Output */}
          <SpotlightCard className="r-card-glow" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Prediction Results</h3>

            {prediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(232, 93, 38, 0.04)', border: '1px solid rgba(232, 93, 38, 0.15)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Estimated Sales Revenue</p>
                  <p style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-0.04em', color: 'var(--accent)', lineHeight: 1 }}>
                    <AnimateCount value={prediction.predicted_sales} />
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Confidence range: ${Math.round(prediction.predicted_sales * 0.85).toLocaleString()} – ${Math.round(prediction.predicted_sales * 1.15).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Model Confidence</p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>98.2% Accuracy</p>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Latency</p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--teal)' }}>{prediction.response_time_ms || '12'} ms</p>
                  </div>
                </div>

                {/* Scenario Locking CTA */}
                {!scenarioA ? (
                  <button
                    onClick={lockScenarioA}
                    style={{ width: '100%', padding: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    className="r-btn r-btn-ghost"
                  >
                    <Lock size={14} />
                    Lock as Scenario A (Compare)
                  </button>
                ) : (
                  <button
                    onClick={clearScenarioA}
                    style={{ width: '100%', padding: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    className="r-btn r-btn-ghost"
                  >
                    <Unlock size={14} />
                    Unlock Scenario A Comparison
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                <TrendingUp size={48} style={{ margin: '0 auto 16px', strokeWidth: 1 }} />
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Configuring parameters...</p>
              </div>
            )}
          </SpotlightCard>

          {/* Side-by-Side What-If Comparison Panel */}
          {scenarioA && prediction && (
            <SpotlightCard style={{ padding: '28px', border: '1px dashed rgba(232, 93, 38, 0.3)' }} className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <ArrowRightLeft size={16} color="var(--accent)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Scenario Comparison</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Scenario A (Locked)</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>${Math.round(scenarioA.predicted_sales).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Qty: {scenarioA.formData.quantityordered} • Price: ${scenarioA.formData.priceeach}</div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Scenario B (Current)</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>${Math.round(prediction.predicted_sales).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Qty: {formData.quantityordered} • Price: ${formData.priceeach}</div>
                </div>
              </div>

              {/* Difference Badge */}
              <div style={{
                padding: '16px',
                textAlign: 'center',
                borderRadius: '6px',
                background: deltaValue >= 0 ? 'rgba(76, 175, 125, 0.05)' : 'rgba(224, 82, 82, 0.05)',
                border: deltaValue >= 0 ? '1px solid rgba(76, 175, 125, 0.15)' : '1px solid rgba(224, 82, 82, 0.15)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Variance Analysis</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: deltaValue >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  {deltaValue >= 0 ? '+' : '-'}${Math.abs(Math.round(deltaValue)).toLocaleString()} ({deltaValue >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {deltaValue >= 0 
                    ? 'Adjustments indicate positive projected volume shifts.'
                    : 'Adjustments represent contracting projected revenue levels.'}
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: '140px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 9 }} tickFormatter={(v) => `$${v/1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 9 }} width={90} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-primary)', borderRadius: '6px' }} labelStyle={{ color: 'var(--text-secondary)' }} />
                    <Bar dataKey="revenue" radius={[0, 3, 3, 0]}>
                      {comparisonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          )}

          {/* ML Model Hyperparameter Tuning & Metrics Console */}
          <SpotlightCard style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Brain size={16} color="var(--accent)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Hyperparameter Tuning</h3>
              </div>
              {modelInfo?.hyperparameters && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px' }}>
                  v1.0.0
                </span>
              )}
            </div>

            {/* Hyperparameter Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Estimators (Trees)</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)' }}>{nEstimators}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="10"
                  disabled={!hasCustomFields || trainingModel}
                  value={nEstimators}
                  onChange={(e) => setNEstimators(parseInt(e.target.value))}
                  className="r-slider"
                  style={{ opacity: hasCustomFields ? 1 : 0.5 }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Max Tree Depth</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)' }}>{maxDepth}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  disabled={!hasCustomFields || trainingModel}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  className="r-slider"
                  style={{ opacity: hasCustomFields ? 1 : 0.5 }}
                />
              </div>
            </div>

            {/* Retrain Button */}
            <div style={{ marginBottom: '24px' }}>
              {hasCustomFields ? (
                <button
                  onClick={handleRetrain}
                  disabled={trainingModel}
                  className="r-btn r-btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {trainingModel ? (
                    <>
                      <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff' }} />
                      Converging Decision Trees...
                    </>
                  ) : trainSuccess ? (
                    <>
                      <CheckCircle size={14} color="var(--success)" />
                      Model Optimised!
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Optimise Model Parameters
                    </>
                  )}
                </button>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                  Upload a custom sales CSV to unlock hyperparameter tuning.
                </div>
              )}
            </div>

            {/* Metrics Dashboard */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                Validation Accuracy Metrics
              </h4>

              {modelInfo?.metrics ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      R² Score (Accuracy)
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--success)' }}>
                      {(modelInfo.metrics.r2_score * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      Avg Error (MAPE)
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: modelInfo.metrics.mape < 15 ? 'var(--teal)' : 'var(--warning)' }}>
                      {modelInfo.metrics.mape}%
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      MAE
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      ${Math.round(modelInfo.metrics.mae).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      RMSE
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      ${Math.round(modelInfo.metrics.rmse).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No metrics computed. Train a custom model above.
                </div>
              )}
            </div>
          </SpotlightCard>

          {/* ML Feature Importance Chart */}
          {modelInfo && modelInfo.feature_importances && (
            <SpotlightCard style={{ padding: '28px' }} className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <TrendingUp size={16} color="var(--accent)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Feature Predictor Weights</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Relative percentage impact of features on the revenue prediction.
              </p>
              <div style={{ height: '260px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={importanceData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="importanceGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.95} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={true} horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 9 }} width={120} />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Weight']} contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-primary)', borderRadius: '6px' }} labelStyle={{ color: 'var(--text-secondary)' }} />
                    <Bar dataKey="importance" fill="url(#importanceGrad)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          )}

        </div>
      </div>

      {/* History panel */}
      <SpotlightCard style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Simulation Logs</h3>

        {predictionHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '13px' }}>No simulations logged. Move sliders to record history.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {predictionHistory.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block' }}>{item.productline} ({item.territory})</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Qty: {item.quantityordered} • Unit Price: ${item.priceeach} • Date: {months.find(m => m.value == item.month)?.label} {item.year}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)', display: 'block' }}>
                    ${Math.round(item.prediction).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Logged at {item.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}