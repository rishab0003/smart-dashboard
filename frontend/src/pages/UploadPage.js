import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, XCircle, Clock, Database, ChevronRight, Activity, Cpu, Play } from 'lucide-react';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const navigate = useNavigate();

  // Staging Visual Pipeline States
  const [stagingActive, setStagingActive] = useState(false);
  const [stagingFile, setStagingFile] = useState(null); // { name, size, headers, rows, mapping }
  const [pipelineStep, setPipelineStep] = useState(0); // 0: Idle, 1: Parsing, 2: Schema Validate, 3: ML Retrain, 4: Synced
  const [trainProgress, setTrainProgress] = useState(0);
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/upload', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const history = response.data.data.map(u => ({
        name: u.originalName,
        size: u.size,
        uploadedAt: new Date(u.createdAt),
        status: u.status === 'completed' ? 'success' : u.status === 'failed' ? 'error' : 'processing',
        id: u._id,
        error: u.errors && u.errors.length > 0 ? u.errors[0].message : null
      }));
      setUploadedFiles(history);

      history.forEach(file => {
        if (file.status === 'processing') {
          pollStatus(file.id);
        }
      });
    } catch (err) {
      console.error('Failed to load upload history:', err);
    }
  };

  const pollStatus = (id, onComplete) => {
    let progress = 0;
    const intervalId = setInterval(async () => {
      // Animate progress up to 90% while waiting
      progress = Math.min(progress + 15, 90);
      setTrainProgress(progress);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/upload/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const upload = response.data.data;
        if (upload.status !== 'processing') {
          clearInterval(intervalId);
          setTrainProgress(100);
          
          const success = upload.status === 'completed';
          setPipelineStep(success ? 4 : 0);
          if (!success && upload.errors && upload.errors.length > 0) {
            setUploadErrorMsg(upload.errors[0].message);
          }

          // Refresh history list
          fetchUploadHistory();

          if (onComplete) onComplete(success);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        clearInterval(intervalId);
        setPipelineStep(0);
        setUploadErrorMsg('Status check failed');
      }
    }, 1200);
  };

  const detectSchemaMapping = (headers) => {
    // Each field has multiple regex patterns to match real-world column naming conventions
    const fieldPatterns = {
      month: [
        /^month$/i,
        /^month[_\s]?id$/i,
        /^month[_\s]?num(ber)?$/i,
        /^mo$/i,
        /^mnth$/i,
      ],
      year: [
        /^year$/i,
        /^year[_\s]?id$/i,
        /^yr$/i,
        /^yyyy$/i,
      ],
      // A full date column (e.g. ORDERDATE) can supply BOTH month and year
      dateColumn: [
        /^order[_\s]?date$/i,
        /^date$/i,
        /^transaction[_\s]?date$/i,
        /^sale[_\s]?date$/i,
        /^invoice[_\s]?date$/i,
        /^created[_\s]?at$/i,
      ],
      quantityordered: [
        /^quantity[_\s]?ordered$/i,
        /^qty[_\s]?ordered$/i,
        /^quantity$/i,
        /^qty$/i,
        /^units[_\s]?sold$/i,
        /^sales[_\s]?volume$/i,
        /^volume$/i,
        /^count$/i,
        /^units$/i,
        /^order[_\s]?qty$/i,
        /^quantityordered$/i,
      ],
      priceeach: [
        /^price[_\s]?each$/i,
        /^unit[_\s]?price$/i,
        /^price$/i,
        /^rate$/i,
        /^msrp$/i,
        /^amount$/i,
        /^priceeach$/i,
        /^unit[_\s]?cost$/i,
        /^sale[_\s]?price$/i,
      ],
      productline: [
        /^product[_\s]?line$/i,
        /^productline$/i,
        /^category$/i,
        /^product[_\s]?category$/i,
        /^product[_\s]?type$/i,
        /^product$/i,
        /^item[_\s]?category$/i,
        /^line$/i,
        /^segment$/i,
      ],
      territory: [
        /^territory$/i,
        /^region$/i,
        /^location$/i,
        /^country$/i,
        /^area$/i,
        /^zone$/i,
        /^market$/i,
        /^geo$/i,
        /^sales[_\s]?region$/i,
      ],
    };

    const mapping = {};
    const dateColFound = {};

    headers.forEach(header => {
      const h = header.toLowerCase().trim();

      // Check for full-date columns first — they can provide both month + year
      for (const pattern of fieldPatterns.dateColumn) {
        if (pattern.test(h)) {
          dateColFound.column = header;
          break;
        }
      }

      // Check all non-date fields
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (field === 'dateColumn') continue;
        if (mapping[field]) continue; // already found, first match wins
        for (const pattern of patterns) {
          if (pattern.test(h)) {
            mapping[field] = header;
            break;
          }
        }
      }
    });

    // If no explicit month/year columns found but a date column exists,
    // use that column as the source for both (server-side will parse it)
    if (!mapping.month && dateColFound.column) {
      mapping.month = `${dateColFound.column} (parsed)`;
    }
    if (!mapping.year && dateColFound.column) {
      mapping.year = `${dateColFound.column} (parsed)`;
    }

    return mapping;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const csvFile = acceptedFiles.find(file => file.name.endsWith('.csv'));
    
    if (!csvFile) {
      alert('Please upload a valid CSV file');
      return;
    }

    setUploadErrorMsg('');
    setTrainProgress(0);
    setStagingActive(true);
    setPipelineStep(1);

    // Client-side parse for preview and schema mapping
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      const headers = lines[0].split(',').map(h => h.trim());
      const previewRows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
        const row = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      const schemaMapping = detectSchemaMapping(headers);

      setStagingFile({
        name: csvFile.name,
        size: csvFile.size,
        headers,
        rows: previewRows,
        mapping: schemaMapping
      });

      // Parse finished, transit to Step 2 after delay
      setTimeout(() => {
        setPipelineStep(2);
        
        // Schema Validation finished, transit to Step 3 and upload file
        setTimeout(() => {
          setPipelineStep(3);
          performUpload(csvFile);
        }, 1200);
      }, 1000);
    };
    reader.readAsText(csvFile);

  }, [overwrite]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const performUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/upload?overwrite=${overwrite}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadId = response.data.uploadId;
      pollStatus(uploadId);

    } catch (error) {
      console.error('Upload failed:', error);
      setPipelineStep(0);
      setUploadErrorMsg(error.response?.data?.error || 'Ingest connection error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <div className="r-section-label" style={{ marginBottom: '8px' }}>
          <span className="r-label">Data Ingest Node</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Upload Data</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upload business transaction sheets to generate dashboards and train Random Forest models.</p>
      </div>

      {/* Main Upload / Staging Area */}
      {!stagingActive ? (
        <SpotlightCard style={{ padding: '32px' }}>
          {/* Overwrite Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <input
              type="checkbox"
              id="overwrite"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <label htmlFor="overwrite" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Overwrite database — purge previous transaction logs before importing
            </label>
          </div>

          <div
            {...getRootProps()}
            className="upload-zone"
            style={{ padding: '64px 32px', textAlign: 'center', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
          >
            <input {...getInputProps()} />
            <div>
              <div style={{ width: '56px', height: '56px', background: 'var(--accent-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Upload size={24} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Drag and drop CSV files here</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>or <span style={{ color: 'var(--accent)', fontWeight: '600' }}>click to browse local drives</span></p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {['CSV format only', 'Max 100MB size', 'Retrains ML models'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <CheckCircle size={13} color="var(--success)" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SpotlightCard>
      ) : (
        /* Animated Ingestion Pipeline Stepper */
        <SpotlightCard style={{ padding: '32px' }} className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Ingestion Pipeline Status</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>File: {stagingFile?.name} ({formatFileSize(stagingFile?.size)})</span>
            </div>
            {pipelineStep < 4 && !uploadErrorMsg && <div className="spinner"></div>}
          </div>

          {uploadErrorMsg && (
            <div className="error" style={{ marginBottom: '24px' }}>
              <strong>Pipeline Error:</strong> {uploadErrorMsg}
              <button 
                onClick={() => setStagingActive(false)} 
                className="r-btn r-btn-ghost r-btn-sm" 
                style={{ marginLeft: '16px', padding: '6px 12px' }}
              >
                Reset Ingest
              </button>
            </div>
          )}

          {/* Stepper Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { step: 1, label: 'File Parse', desc: 'Decoding CSV rows', icon: File },
              { step: 2, label: 'Schema Audit', desc: 'Validating variables', icon: Database },
              { step: 3, label: 'Model Retrain', desc: 'Random Forest fit', icon: Cpu },
              { step: 4, label: 'Sync Complete', desc: 'Refreshing analytics', icon: CheckCircle }
            ].map(s => {
              const Icon = s.icon;
              const isDone = pipelineStep > s.step || (s.step === 4 && pipelineStep === 4);
              const isActive = pipelineStep === s.step;
              const color = isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--text-muted)';
              const bg = isDone ? 'rgba(76,175,125,0.06)' : isActive ? 'var(--accent-dim)' : 'var(--bg-elevated)';
              const border = isDone ? '1px solid rgba(76,175,125,0.2)' : isActive ? '1px solid rgba(232,93,38,0.2)' : '1px solid var(--border)';
              
              return (
                <div key={s.step} style={{ padding: '16px', background: bg, border: border, borderRadius: '6px', opacity: (pipelineStep >= s.step || isDone) ? 1 : 0.45, transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDone ? 'var(--success)' : 'transparent', border: isDone ? 'none' : `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDone ? <CheckCircle size={14} color="#fff" /> : <Icon size={13} color={color} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: color }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Stepper Progress Bar */}
          {pipelineStep === 3 && (
            <div style={{ marginBottom: '32px' }} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Model Convergence</span>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>{trainProgress}%</span>
              </div>
              <div className="r-progress">
                <div className="r-progress-fill" style={{ width: `${trainProgress}%` }}></div>
              </div>
            </div>
          )}

          {pipelineStep >= 2 && stagingFile && (() => {
            const fields = [
              { field: 'month', label: 'Month', required: true },
              { field: 'year', label: 'Year', required: true },
              { field: 'quantityordered', label: 'Quantity Ordered', required: true },
              { field: 'priceeach', label: 'Price Each', required: true },
              { field: 'productline', label: 'Product Line', required: true },
              { field: 'territory', label: 'Territory', required: true },
            ];
            const passCount = fields.filter(f => !!stagingFile.mapping[f.field]).length;
            const allPass = passCount === fields.length;
            return (
              <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${allPass ? 'rgba(76,175,125,0.25)' : 'rgba(220,38,38,0.2)'}`, borderRadius: '8px', padding: '20px', marginBottom: '24px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Schema Verification Audit</h4>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                    background: allPass ? 'var(--success-dim)' : 'var(--error-dim)',
                    color: allPass ? 'var(--success)' : 'var(--error)',
                    border: `1px solid ${allPass ? 'rgba(76,175,125,0.3)' : 'rgba(220,38,38,0.3)'}`,
                  }}>
                    {passCount}/{fields.length} fields matched
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {fields.map(item => {
                    const mappedCol = stagingFile.mapping[item.field];
                    const isParsed = mappedCol && mappedCol.includes('(parsed)');
                    return (
                      <div key={item.field} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: mappedCol ? (isParsed ? 'rgba(232,162,38,0.06)' : 'rgba(76,175,125,0.04)') : 'rgba(220,38,38,0.04)',
                        border: `1px solid ${mappedCol ? (isParsed ? 'rgba(232,162,38,0.2)' : 'rgba(76,175,125,0.18)') : 'rgba(220,38,38,0.18)'}`,
                        borderRadius: '6px', gap: '8px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: mappedCol ? 'var(--text-primary)' : 'var(--error)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                            {mappedCol || '— Not found'}
                          </span>
                        </div>
                        {mappedCol ? (
                          <span style={{ fontSize: '8px', fontWeight: '700', color: isParsed ? 'var(--warning)' : 'var(--success)', background: isParsed ? 'var(--warning-dim)' : 'var(--success-dim)', padding: '2px 6px', borderRadius: '3px', flexShrink: 0 }}>
                            {isParsed ? 'PARSED' : 'MATCHED'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '8px', fontWeight: '700', color: 'var(--error)', background: 'var(--error-dim)', padding: '2px 6px', borderRadius: '3px', flexShrink: 0 }}>MISSING</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!allPass && (
                  <p style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '12px', padding: '8px 12px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: '4px' }}>
                    ⚠️ Some required fields could not be auto-detected. The upload will still proceed but analytics may be limited. Rename your columns to match the reference layout below.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Data Preview Spreadsheet */}
          {pipelineStep >= 2 && stagingFile && (
            <div className="fade-in" style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Tabular Data Preview (First 5 Rows)</h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <table className="r-table" style={{ background: 'var(--bg-elevated)', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      {stagingFile.headers.slice(0, 6).map(h => (
                        <th key={h} style={{ fontSize: '11px', padding: '10px 14px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stagingFile.rows.map((row, idx) => (
                      <tr key={idx}>
                        {stagingFile.headers.slice(0, 6).map(h => (
                          <td key={h} style={{ fontSize: '12px', padding: '10px 14px' }}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success summary dashboard links */}
          {pipelineStep === 4 && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="fade-in">
              <button 
                onClick={() => { setStagingActive(false); setStagingFile(null); }}
                className="r-btn r-btn-ghost r-btn-sm"
              >
                Close Pipeline
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="r-btn r-btn-primary r-btn-sm"
              >
                Open Dashboard →
              </button>
            </div>
          )}
        </SpotlightCard>
      )}

      {/* Upload History */}
      <SpotlightCard style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Ingestion Registry</h3>
        </div>

        {uploadedFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <File size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}>No records logged yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Submit CSV files to populate files directory</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="r-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Upload Date</th>
                  <th>Size</th>
                  <th style={{ textAlign: 'center' }}>Pipeline Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <File size={14} color="var(--accent)" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{file.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {file.uploadedAt.toLocaleDateString()} {file.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '600', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '2px' }}>
                        {formatFileSize(file.size)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '6px', height: '6px', borderRadius: '50%', 
                          background: file.status === 'success' ? 'var(--success)' : file.status === 'error' ? 'var(--error)' : 'var(--warning)',
                          boxShadow: file.status === 'processing' ? '0 0 6px var(--warning)' : 'none' 
                        }} />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: file.status === 'success' ? 'var(--success)' : file.status === 'error' ? 'var(--error)' : 'var(--warning)' }}>
                          {file.status === 'success' ? 'Processed' : file.status === 'error' ? 'Failed' : 'Processing'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {file.status === 'success' ? (
                        <button
                          onClick={() => navigate('/dashboard')}
                          style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          View Analytics →
                        </button>
                      ) : file.status === 'error' ? (
                        <span style={{ fontSize: '12px', color: 'var(--error)' }}>{file.error || 'Syntax failure'}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Running stepper...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>

      {/* Baseline Template */}
      <SpotlightCard style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Reference CSV Layout</h3>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', overflowX: 'auto' }}>
          <pre style={{ fontSize: '12px', color: 'var(--teal)', fontFamily: "'Courier New', monospace", lineHeight: 1.6 }}>
{`month,year,quantityordered,priceeach,productline,territory
1,2024,50,99.99,Classic Cars,NA
2,2024,75,149.99,Motorcycles,EMEA
3,2024,30,199.99,Planes,APAC`}
          </pre>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
          Note: Schema auditor automatically matches other standard headers (e.g. `orderdate` mapped to `month`/`year`, `qty` mapped to `quantityordered`).
        </p>
      </SpotlightCard>
    </div>
  );
}