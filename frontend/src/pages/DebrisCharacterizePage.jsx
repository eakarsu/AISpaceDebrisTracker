import FormattedAIReport from "../components/FormattedAIReport";
import { useState } from 'react';
import { api } from '../api';

export default function DebrisCharacterizePage() {
  const [form, setForm] = useState({
    observations: '',
    parentObject: '',
    sizeEstimate: '',
    materialHints: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));


  const presets = [["Radar fragment", {"observations": "[{\"radar_cross_section\":0.02,\"altitude_km\":780,\"inclination_deg\":98}]", "parentObject": "Possible Cosmos 1408 fragmentation family; unverified", "sizeEstimate": "Approximately 10 cm, uncertain", "materialHints": "Possible metallic fragment; composition unverified"}], ["Optical track", {"observations": "[{\"brightness_magnitude\":14.2,\"altitude_km\":620,\"track_duration_s\":45}]", "parentObject": "Unknown parent; compare with catalog before attribution", "sizeEstimate": "Size unknown; optical brightness only", "materialHints": "No material measurement available"}], ["Mixed observations", {"observations": "[{\"radar_cross_section\":0.05,\"altitude_km\":850},{\"brightness_magnitude\":12.8,\"altitude_km\":852}]", "parentObject": "Candidate breakup family, attribution unconfirmed", "sizeEstimate": "Roughly 10–30 cm pending calibration", "materialHints": "Radar and optical observations do not establish composition"}]];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      let observations;
      if (form.observations.trim()) {
        try { observations = JSON.parse(form.observations); }
        catch { observations = form.observations.split('\n').filter(Boolean); }
      }
      const payload = {
        ...(observations ? { observations } : {}),
        parentObject: form.parentObject,
        sizeEstimate: form.sizeEstimate,
        materialHints: form.materialHints,
      };
      const data = await api.debrisCharacterize(payload);
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
          <h1>{'🧬'} Debris Characterization</h1>
          <p className="subtitle">AI-driven characterization of debris fragments from limited observations</p>
        </div>
        <span className="card-badge badge-ai" style={{ fontSize: 14, padding: '6px 16px' }}>AI Powered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Observation Inputs</h3>
          <form onSubmit={handleSubmit}>
            <div role="group" aria-label="Complete example inputs" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{presets.map((example) => <button key={example[0]} type="button" disabled={loading} className="btn btn-secondary" onClick={() => setForm(example[1])}>{example[0]}</button>)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Observations (JSON or newline-separated)</label>
                <textarea
                  rows={4}
                  value={form.observations}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  placeholder='[{"radar_cross_section": 0.02, "altitude_km": 780}]'
                />
              </div>
              <div className="form-group">
                <label>Parent Object</label>
                <input
                  type="text"
                  value={form.parentObject}
                  onChange={(e) => handleChange('parentObject', e.target.value)}
                  placeholder="e.g. Cosmos 1408"
                />
              </div>
              <div className="form-group">
                <label>Size Estimate</label>
                <input
                  type="text"
                  value={form.sizeEstimate}
                  onChange={(e) => handleChange('sizeEstimate', e.target.value)}
                  placeholder="e.g. ~10cm"
                />
              </div>
              <div className="form-group">
                <label>Material Hints</label>
                <input
                  type="text"
                  value={form.materialHints}
                  onChange={(e) => handleChange('materialHints', e.target.value)}
                  placeholder="e.g. aluminum alloy, titanium"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
              {loading ? 'Characterizing...' : 'Run Characterization'}
            </button>
          </form>
        </div>

        <div>
          {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

          {loading && (
            <div className="ai-loading">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>AI is characterizing the debris...</p>
            </div>
          )}

          {result !== null && result !== undefined && !loading && (
            <div className="ai-result">
              <div className="ai-result-header">
                <h3>{'🤖'} Characterization Result</h3>
              </div>
              <div className="ai-result-body"><FormattedAIReport response={result} /></div>
            </div>
          )}

          {(result === null || result === undefined) && !loading && !error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'🧬'}</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Ready for Analysis</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Provide observation parameters and run the characterization.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
