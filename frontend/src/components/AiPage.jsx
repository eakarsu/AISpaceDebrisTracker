
import { useState } from 'react';
import FormattedAIReport from './FormattedAIReport';

const scenarios = {
  'Collision Probability': [
    { object1: 'ISS (ZARYA)', object2: 'COSMOS 1408 DEB', distance: 0.45, relativeVelocity: 14.2 },
    { object1: 'STARLINK-5001', object2: 'FENGYUN 1C DEB', distance: 1.2, relativeVelocity: 12.8 },
    { object1: 'HUBBLE SPACE TELESCOPE', object2: 'SL-8 R/B', distance: 3.8, relativeVelocity: 10.5 },
  ],
  'Orbital Decay Prediction': [
    { objectName: 'COSMOS 1408 DEB', altitude: 500, inclination: 82.6, area: 2.5, mass: 750 },
    { objectName: 'H-2A R/B', altitude: 680, inclination: 98.6, area: 8, mass: 1800 },
    { objectName: 'MICROSAT-R DEB', altitude: 300, inclination: 96.6, area: 0.4, mass: 35 },
  ],
  'Maneuver Planning': [
    { satelliteName: 'STARLINK-5001', currentOrbit: '550 km circular, 53° inclination', targetOrbit: '555 km circular, 53° inclination', fuelRemaining: 85, threat: 'Illustrative conjunction with COSMOS 1408 debris; validate current ephemerides before planning.' },
    { satelliteName: 'ISS (ZARYA)', currentOrbit: '420 km circular, 51.6° inclination', targetOrbit: '425 km circular, 51.6° inclination', fuelRemaining: 45, threat: 'Illustrative close approach with an untracked debris fragment; confirm screening data.' },
    { satelliteName: 'SENTINEL-6A', currentOrbit: '1336 km circular, 66° inclination', targetOrbit: '1340 km circular, 66° inclination', fuelRemaining: 95, threat: 'Illustrative avoidance review for a rocket body; require operator approval.' },
  ],
  'Debris Field Analysis': [
    { region: 'LEO 750–900 km polar corridor', altitudeRange: '750–900 km', source: 'FENGYUN 1C breakup, illustrative review', objectCount: 3500 },
    { region: 'LEO 400–550 km high inclination corridor', altitudeRange: '400–550 km', source: 'COSMOS 1408 breakup, illustrative review', objectCount: 1500 },
    { region: 'LEO 600–800 km sun-synchronous corridor', altitudeRange: '600–800 km', source: 'COSMOS 2251 collision debris, illustrative review', objectCount: 1200 },
  ],
  'Launch Optimization': [
    { missionName: 'STARLINK GROUP 9-2', launchSite: 'KSC LC-39A, Florida', targetOrbit: 'LEO 550 km, 53° inclination', payloadMass: 15600, vehicle: 'Falcon 9 Block 5' },
    { missionName: 'SENTINEL-2C planning exercise', launchSite: 'CSG ELA-3, French Guiana', targetOrbit: 'SSO 786 km', payloadMass: 1200, vehicle: 'Vega-C' },
    { missionName: 'GPS III planning exercise', launchSite: 'CCSFS SLC-40, Florida', targetOrbit: 'MEO 20,200 km', payloadMass: 4400, vehicle: 'Falcon 9' },
  ],
};

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
            <div role="group" aria-label="Complete example inputs" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(scenarios[title] || []).map((values, index) => <button key={index} type="button" className="btn btn-secondary" disabled={loading} onClick={() => setFormData(values)}>Fill scenario {index + 1}</button>)}
            </div>
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

          {result !== null && result !== undefined && !loading && (
            <div className="ai-result">
              <div className="ai-result-header">
                <h3>{'\uD83E\uDD16'} AI Analysis Result</h3>
                <div className="ai-result-meta">
                  <span>{'\uD83D\uDCBB'} {result.model}</span>
                  <span>{'\uD83D\uDD52'} {new Date(result.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="ai-result-body">
                <FormattedAIReport response={result.analysis ?? result} title={title} />
              </div>
            </div>
          )}

          {(result === null || result === undefined) && !loading && !error && (
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
