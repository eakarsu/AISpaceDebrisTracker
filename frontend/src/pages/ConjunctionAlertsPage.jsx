import { useState, useEffect } from 'react';
import api from '../api';

export default function ConjunctionAlertsPage() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ high_risk: false, status: '' });
  const [screenResult, setScreenResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [page, filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter.high_risk) params.append('high_risk', 'true');
      if (filter.status) params.append('status', filter.status);
      const res = await api.get(`/conjunction-events?${params}`);
      setEvents(res.data.data || res.data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (_err) {
      setError('Failed to load conjunction events');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoScreen = async () => {
    setScreenLoading(true);
    setError('');
    try {
      const res = await api.post('/conjunction-events/auto-screen', { threshold_km: 10 });
      setScreenResult(res.data);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || 'Screening failed');
    } finally {
      setScreenLoading(false);
    }
  };

  const getRiskColor = (missDistance) => {
    const d = parseFloat(missDistance);
    if (d < 2) return { bg: '#fef2f2', text: '#991b1b', label: 'CRITICAL' };
    if (d < 5) return { bg: '#fff7ed', text: '#92400e', label: 'HIGH' };
    if (d < 10) return { bg: '#fefce8', text: '#92400e', label: 'MEDIUM' };
    return { bg: '#f0fdf4', text: '#166534', label: 'LOW' };
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Conjunction Alerts</h1>
          <p className="page-subtitle">Monitor close-approach events between space objects</p>
        </div>
        <button
          onClick={handleAutoScreen}
          disabled={screenLoading}
          className="btn btn-primary"
        >
          {screenLoading ? 'Screening...' : 'Run Auto-Screen'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {screenResult && (
        <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Auto-Screen Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#3b82f6' }}>{screenResult.objects_analyzed}</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Objects Analyzed</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b' }}>{screenResult.pairs_below_threshold}</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Pairs Below Threshold</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>{screenResult.events_created}</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Events Created</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981' }}>10km</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Threshold</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filter.high_risk}
            onChange={e => { setFilter({ ...filter, high_risk: e.target.checked }); setPage(1); }}
          />
          <span style={{ fontSize: '14px' }}>High Risk Only (&lt;10km)</span>
        </label>
        <select
          value={filter.status}
          onChange={e => { setFilter({ ...filter, status: e.target.value }); setPage(1); }}
          className="form-input"
          style={{ width: '200px' }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Resolved">Resolved</option>
          <option value="Monitoring">Monitoring</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No conjunction events found.</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Run Auto-Screen to detect close-approach events.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '12px' }}>
              {events.map((event, i) => {
                const risk = getRiskColor(event.miss_distance);
                return (
                  <div key={i} style={{ background: risk.bg, border: `1px solid ${risk.text}30`, borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ padding: '2px 8px', background: risk.text, color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {risk.label}
                          </span>
                          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                            {event.primary_object} — {event.secondary_object}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569' }}>
                          {event.miss_distance && <span>Miss Distance: <strong>{parseFloat(event.miss_distance).toFixed(3)} km</strong></span>}
                          {event.probability && <span>Probability: <strong>{(parseFloat(event.probability) * 100).toFixed(4)}%</strong></span>}
                          {event.relative_velocity && <span>Rel. Velocity: <strong>{parseFloat(event.relative_velocity).toFixed(2)} km/s</strong></span>}
                          {event.tca && <span>TCA: <strong>{new Date(event.tca).toLocaleDateString()}</strong></span>}
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', background: '#e2e8f0', color: '#334155', borderRadius: '6px', fontSize: '13px' }}>
                        {event.status || 'Active'}
                      </span>
                    </div>
                    {event.action_taken && (
                      <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>Action: {event.action_taken}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">Prev</button>
                <span style={{ padding: '6px 12px', fontSize: '14px', color: '#64748b' }}>{page} / {pagination.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="btn btn-secondary btn-sm">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
