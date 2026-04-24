import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AiPage({ title, subtitle, icon, fields, apiCall }) {
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await apiCall(formData);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{icon} {title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        <span className="card-badge badge-ai" style={{ fontSize: 14, padding: '6px 16px' }}>AI Powered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Input Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Analysis Parameters</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {fields.map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={formData[f.key] || ''}
                      onChange={e => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  ) : f.type === 'select' ? (
                    <select value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)}>
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={formData[f.key] || ''}
                      onChange={e => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      step={f.type === 'number' ? 'any' : undefined}
                    />
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
              {loading ? 'Analyzing...' : `Run ${title}`}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

          {loading && (
            <div className="ai-loading">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>AI is analyzing your data...</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>This may take a few seconds</p>
            </div>
          )}

          {result && !loading && (
            <div className="ai-result">
              <div className="ai-result-header">
                <h3>{'\uD83E\uDD16'} AI Analysis Result</h3>
                <div className="ai-result-meta">
                  <span>{'\uD83D\uDCBB'} {result.model}</span>
                  <span>{'\uD83D\uDD52'} {new Date(result.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="ai-result-body">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Ready for Analysis</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Fill in the parameters and click "Run {title}" to get AI-powered insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
