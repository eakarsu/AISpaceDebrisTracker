import { useState } from 'react';
import { api } from '../api';

export default function RegulatoryCompliancePage() {
  const [form, setForm] = useState({
    mission: '',
    frameworks: 'UN_OST,ITU,FCC,ESA_DEBRIS_MITIGATION',
    jurisdiction: '',
    mitigation_plan: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const tryParseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const mission = tryParseJSON(form.mission) || (form.mission ? { description: form.mission } : null);
      const mitigation_plan = tryParseJSON(form.mitigation_plan) || (form.mitigation_plan ? { description: form.mitigation_plan } : undefined);
      const frameworks = form.frameworks.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        mission,
        frameworks: frameworks.length ? frameworks : undefined,
        jurisdiction: form.jurisdiction || undefined,
        mitigation_plan,
      };
      const data = await api.regulatoryCompliance(payload);
      setResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{'⚖️'} Regulatory Compliance Scoring</h1>
          <p className="subtitle">Score a mission against UN OST, ITU, FCC, and ESA debris-mitigation guidelines</p>
        </div>
        <span className="card-badge badge-ai" style={{ fontSize: 14, padding: '6px 16px' }}>AI Powered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Mission & Plan</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Mission (JSON or description)</label>
                <textarea rows={4} value={form.mission} onChange={(e) => handleChange('mission', e.target.value)}
                  placeholder='{"name":"DemoSat","orbit":"700km SSO","operator":"Acme"}' />
              </div>
              <div className="form-group">
                <label>Frameworks (comma-separated)</label>
                <input type="text" value={form.frameworks} onChange={(e) => handleChange('frameworks', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Jurisdiction</label>
                <input type="text" value={form.jurisdiction} onChange={(e) => handleChange('jurisdiction', e.target.value)} placeholder="e.g. US-FCC" />
              </div>
              <div className="form-group">
                <label>Mitigation Plan (JSON or description)</label>
                <textarea rows={3} value={form.mitigation_plan} onChange={(e) => handleChange('mitigation_plan', e.target.value)}
                  placeholder='{"deorbit_years":5,"passivation":true}' />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
              {loading ? 'Scoring...' : 'Run Compliance Scoring'}
            </button>
          </form>
        </div>

        <div>
          {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
          {loading && (
            <div className="ai-loading">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>AI is scoring regulatory compliance...</p>
            </div>
          )}
          {result && !loading && (
            <div className="ai-result">
              <div className="ai-result-header"><h3>{'🤖'} Compliance Result</h3></div>
              <div className="ai-result-body">
                {typeof result === 'object' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {result.overall_score !== undefined && <div><strong>Overall Score:</strong> {result.overall_score}/100</div>}
                    {result.risk_summary && <div><strong>Risk Summary:</strong> {result.risk_summary}</div>}
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Raw JSON</summary>
                      <pre style={{ fontSize: 12, overflow: 'auto', background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>{JSON.stringify(result, null, 2)}</pre>
                    </details>
                  </div>
                ) : (
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{String(result)}</pre>
                )}
              </div>
            </div>
          )}
          {!result && !loading && !error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'⚖️'}</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Ready for Compliance Check</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Describe the mission + mitigation plan to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
