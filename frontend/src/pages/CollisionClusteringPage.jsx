import FormattedAIReport from "../components/FormattedAIReport";
import { useState } from 'react';
import { api } from '../api';

export default function CollisionClusteringPage() {
  const [region, setRegion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const data = await api.collisionClustering({ region });
      setResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const presets = [["Sun-synchronous LEO", "LEO 700–900 km, sun-synchronous inclinations"], ["Mid-inclination LEO", "LEO 450–650 km, 50–60° inclination"], ["High LEO", "LEO 900–1200 km, polar inclinations"]];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{'🌐'} Collision Clustering</h1>
          <p className="subtitle">Group debris by likely fragmentation parent and prioritize mitigation</p>
        </div>
        <span className="card-badge badge-ai" style={{ fontSize: 14, padding: '6px 16px' }}>AI Powered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Cluster Parameters</h3>
          <form onSubmit={handleSubmit}>
            <div role="group" aria-label="Complete example inputs" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{presets.map((example) => <button key={example[0]} type="button" disabled={loading} className="btn btn-secondary" onClick={() => setRegion(example[1])}>{example[0]}</button>)}</div>
            <div className="form-group">
              <label>Region (optional)</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. LEO 700-900km"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
              {loading ? 'Clustering...' : 'Run Clustering'}
            </button>
          </form>
        </div>

        <div>
          {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

          {loading && (
            <div className="ai-loading">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>AI is clustering debris...</p>
            </div>
          )}

          {result !== null && result !== undefined && !loading && (
            <div className="ai-result">
              <div className="ai-result-header">
                <h3>{'🤖'} Clustering Result</h3>
              </div>
              <div className="ai-result-body"><FormattedAIReport response={result} /></div>
            </div>
          )}

          {(result === null || result === undefined) && !loading && !error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'🌐'}</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Ready for Clustering</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Optionally enter a region of interest and run clustering.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
