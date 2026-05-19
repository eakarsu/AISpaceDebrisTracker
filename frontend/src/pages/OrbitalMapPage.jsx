import { useState } from 'react';
import api from '../api';

export default function OrbitalMapPage() {
  const [form, setForm] = useState({
    norad_id: '', tle_line1: '', tle_line2: '', minutes_ahead: 120, step_minutes: 10
  });
  const [positions, setPositions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePropagate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/propagate', {
        norad_id: form.norad_id,
        tle_line1: form.tle_line1,
        tle_line2: form.tle_line2,
        minutes_ahead: parseInt(form.minutes_ahead),
        step_minutes: parseInt(form.step_minutes),
      });
      setResult(res.data);
      setPositions(res.data.positions || []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Propagation failed');
    } finally {
      setLoading(false);
    }
  };

  // Simple ASCII-style map display since Leaflet requires additional setup
  const renderPositionsTable = () => {
    if (!positions.length) return null;
    const sample = positions.filter((_, i) => i % 3 === 0).slice(0, 20);
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
              {['Time', 'Min From Now', 'Lat', 'Lon', 'Alt (km)'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.map((pos, i) => (
              <tr key={i} style={{ borderTop: '1px solid #334155', background: i % 2 === 0 ? '#0f172a' : '#1e293b' }}>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{new Date(pos.time).toLocaleTimeString()}</td>
                <td style={{ padding: '8px 12px', color: '#64748b' }}>T+{pos.minutes_from_now}m</td>
                <td style={{ padding: '8px 12px', color: '#38bdf8' }}>{pos.latitude?.toFixed(3)}</td>
                <td style={{ padding: '8px 12px', color: '#38bdf8' }}>{pos.longitude?.toFixed(3)}</td>
                <td style={{ padding: '8px 12px', color: '#22c55e' }}>{pos.altitude_km?.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Orbital Map - SGP4 Propagator</h1>
        <p className="page-subtitle">Compute real-time satellite positions using Two-Line Element data</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Propagate Orbit</h2>
        <form onSubmit={handlePropagate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#94a3b8' }}>NORAD ID (optional)</label>
              <input
                value={form.norad_id}
                onChange={e => setForm({ ...form, norad_id: e.target.value })}
                placeholder="e.g. 25544"
                className="form-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#94a3b8' }}>Minutes Ahead</label>
              <input
                type="number"
                value={form.minutes_ahead}
                onChange={e => setForm({ ...form, minutes_ahead: e.target.value })}
                min={1} max={10080}
                className="form-input"
              />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#94a3b8' }}>TLE Line 1 *</label>
            <input
              value={form.tle_line1}
              onChange={e => setForm({ ...form, tle_line1: e.target.value })}
              placeholder="1 25544U 98067A   21275.52097222  .00001448  00000-0  33747-4 0  9999"
              className="form-input"
              required
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#94a3b8' }}>TLE Line 2 *</label>
            <input
              value={form.tle_line2}
              onChange={e => setForm({ ...form, tle_line2: e.target.value })}
              placeholder="2 25544  51.6461 297.8013 0003643 287.6566 207.5088 15.48956882303655"
              className="form-input"
              required
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Propagating...' : 'Compute Positions'}
          </button>
        </form>
        {error && <div className="alert alert-danger" style={{ marginTop: '12px' }}>{error}</div>}
      </div>

      {result && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
              Propagation Results - {result.norad_id || 'Unknown Object'}
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span className="badge badge-info">{result.positions_count} positions</span>
              <span className="badge badge-success">{result.minutes_ahead}min ahead</span>
            </div>
          </div>

          {positions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Current Lat', value: `${positions[0]?.latitude?.toFixed(3)}°` },
                  { label: 'Current Lon', value: `${positions[0]?.longitude?.toFixed(3)}°` },
                  { label: 'Altitude', value: `${positions[0]?.altitude_km?.toFixed(1)} km` },
                  { label: 'Final Alt', value: `${positions[positions.length-1]?.altitude_km?.toFixed(1)} km` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#94a3b8' }}>Position Timeline (every 3rd point)</h3>
          {renderPositionsTable()}
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '12px' }}>
            Computed using satellite.js SGP4 propagator. Start: {new Date(result.start_time).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
