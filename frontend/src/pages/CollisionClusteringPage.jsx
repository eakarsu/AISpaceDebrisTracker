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

  const priorityColor = (p) => ({
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  })[String(p).toLowerCase()] || 'var(--text-muted)';

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

          {result && !loading && (
            <div className="ai-result">
              <div className="ai-result-header">
                <h3>{'🤖'} Clustering Result</h3>
              </div>
              <div className="ai-result-body">
                {typeof result === 'object' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {result.summary && <p><strong>Summary:</strong> {result.summary}</p>}
                    {Array.isArray(result.clusters) && result.clusters.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: 8 }}>Clusters</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {result.clusters.map((c, i) => (
                            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <strong>{c.parent || `Cluster ${i + 1}`}</strong>
                                <span style={{ color: priorityColor(c.priority), fontSize: 12, fontWeight: 600 }}>{String(c.priority || '').toUpperCase()}</span>
                              </div>
                              {c.altitude_band_km && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Altitude: {c.altitude_band_km}</div>}
                              {c.estimated_population !== undefined && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estimated population: {c.estimated_population}</div>}
                              {Array.isArray(c.members) && c.members.length > 0 && (
                                <div style={{ fontSize: 13, marginTop: 6 }}>Members: {c.members.join(', ')}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(result.recommended_priority_order) && result.recommended_priority_order.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: 8 }}>Recommended Priority Order</h4>
                        <ol style={{ paddingLeft: 20 }}>
                          {result.recommended_priority_order.map((p, i) => <li key={i}>{p}</li>)}
                        </ol>
                      </div>
                    )}
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
