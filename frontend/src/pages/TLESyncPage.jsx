import { useState } from 'react';
import api from '../api';

export default function TLESyncPage() {
  const [syncResult, setSyncResult] = useState(null);
  const [reentryResult, setReentryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reentryLoading, setReentryLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState(null);

  const handleTLESync = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/space-objects/sync-tle');
      setSyncResult(res.data);
      if (res.data.last_sync) setLastSync(res.data.last_sync);
    } catch (err) {
      setError(err.response?.data?.error || 'TLE sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReentryMonitor = async () => {
    setReentryLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/reentry-monitor');
      setReentryResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Reentry monitoring failed');
    } finally {
      setReentryLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>TLE Sync & Reentry Monitor</h1>
        <p className="page-subtitle">Synchronize orbital element data and monitor reentry risks</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* TLE Sync Card */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Celestrak TLE Sync</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            Fetch latest Two-Line Element data from Celestrak and update space object records.
          </p>
          {lastSync && (
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}
          <button
            onClick={handleTLESync}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? 'Syncing from Celestrak...' : 'Sync TLE Data'}
          </button>

          {syncResult && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ background: syncResult.success ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontWeight: '600', color: syncResult.success ? '#166534' : '#991b1b', marginBottom: '8px' }}>
                  {syncResult.success ? 'Sync Complete' : 'Sync Failed'}
                </p>
                {syncResult.synced !== undefined && (
                  <p style={{ fontSize: '14px', color: '#374151' }}>
                    Objects synced: <strong>{syncResult.synced}</strong>
                  </p>
                )}
                {syncResult.source && (
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Source: {syncResult.source}</p>
                )}
                {syncResult.message && (
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{syncResult.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reentry Monitor Card */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Reentry Monitor</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            AI-powered analysis of all objects below 400km altitude. Flags objects with reentry windows under 30 days.
          </p>
          <button
            onClick={handleReentryMonitor}
            disabled={reentryLoading}
            className="btn btn-danger"
            style={{ width: '100%' }}
          >
            {reentryLoading ? 'Analyzing...' : 'Run Reentry Analysis'}
          </button>

          {reentryResult && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
                  Reentry Analysis Complete
                </p>
                <p style={{ fontSize: '14px', color: '#374151' }}>
                  Objects monitored: <strong>{reentryResult.objects_monitored}</strong>
                </p>
                {reentryResult.analysis && (
                  <>
                    <p style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
                      Risk Level: <strong style={{ color: reentryResult.analysis.risk_level === 'Critical' ? '#dc2626' : '#d97706' }}>{reentryResult.analysis.risk_level}</strong>
                    </p>
                    {reentryResult.analysis.timeline && (
                      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{reentryResult.analysis.timeline}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reentry Predictions Table */}
      {reentryResult?.analysis?.imminent_reentries?.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Imminent Reentries</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e293b' }}>
                  {['Object Name', 'Days to Reentry', 'Risk Level'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reentryResult.analysis.imminent_reentries.map((item, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500', color: '#e2e8f0' }}>{item.name}</td>
                    <td style={{ padding: '10px 12px', color: item.days_to_reentry < 7 ? '#ef4444' : '#f59e0b' }}>
                      {item.days_to_reentry} days
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        background: item.risk_level === 'High' ? '#fef2f2' : item.risk_level === 'Medium' ? '#fefce8' : '#f0fdf4',
                        color: item.risk_level === 'High' ? '#991b1b' : item.risk_level === 'Medium' ? '#92400e' : '#166534'
                      }}>
                        {item.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {reentryResult?.analysis?.recommended_actions?.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Recommended Actions</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {reentryResult.analysis.recommended_actions.map((action, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#3b82f6', fontSize: '16px', lineHeight: '1.4' }}>&bull;</span>
                <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
