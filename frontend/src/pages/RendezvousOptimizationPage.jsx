import FormattedAIReport from "../components/FormattedAIReport";
import { useState } from 'react';
import { api } from '../api';

export default function RendezvousOptimizationPage() {
  const [form, setForm] = useState({
    servicer: '',
    targets: '',
    deltaV_budget_mps: '',
    mission_window_days: '',
    constraints: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const tryParseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };


  const presets = [["Two-target LEO tour", {"servicer": "{\"name\":\"Illustrative LEO servicer\",\"altitude_km\":600,\"inclination_deg\":97}", "targets": "[{\"name\":\"Illustrative target A\",\"altitude_km\":610},{\"name\":\"Illustrative target B\",\"altitude_km\":630}]", "deltaV_budget_mps": "1500", "mission_window_days": "180", "constraints": "{\"max_inclination_change_deg\":5,\"reserve_delta_v_mps\":250}"}], ["Polar cleanup", {"servicer": "{\"name\":\"Illustrative polar servicer\",\"altitude_km\":750,\"inclination_deg\":98}", "targets": "[{\"name\":\"Illustrative polar target A\",\"altitude_km\":770},{\"name\":\"Illustrative polar target B\",\"altitude_km\":790}]", "deltaV_budget_mps": "1200", "mission_window_days": "240", "constraints": "{\"max_inclination_change_deg\":3,\"reserve_delta_v_mps\":200}"}], ["Low orbit survey", {"servicer": "{\"name\":\"Illustrative low-orbit servicer\",\"altitude_km\":450,\"inclination_deg\":53}", "targets": "[{\"name\":\"Illustrative low-orbit target A\",\"altitude_km\":470},{\"name\":\"Illustrative low-orbit target B\",\"altitude_km\":490}]", "deltaV_budget_mps": "900", "mission_window_days": "120", "constraints": "{\"max_inclination_change_deg\":2,\"reserve_delta_v_mps\":150}"}]];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setResult(null);
    try {
      const servicer = tryParseJSON(form.servicer) || (form.servicer ? { name: form.servicer } : null);
      const targets = tryParseJSON(form.targets) || (form.targets ? form.targets.split('\n').filter(Boolean).map((n) => ({ name: n.trim() })) : []);
      const constraints = tryParseJSON(form.constraints) || undefined;

      const payload = {
        servicer,
        targets,
        ...(form.deltaV_budget_mps ? { deltaV_budget_mps: Number(form.deltaV_budget_mps) } : {}),
        ...(form.mission_window_days ? { mission_window_days: Number(form.mission_window_days) } : {}),
        ...(constraints ? { constraints } : {}),
      };
      const data = await api.rendezvousOptimization(payload);
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
          <h1>{'🛰️'} Multi-Target Rendezvous Optimization</h1>
          <p className="subtitle">Plan a debris-removal / servicing tour across multiple targets</p>
        </div>
        <span className="card-badge badge-ai" style={{ fontSize: 14, padding: '6px 16px' }}>AI Powered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Mission Inputs</h3>
          <form onSubmit={handleSubmit}>
            <div role="group" aria-label="Complete example inputs" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{presets.map((example) => <button key={example[0]} type="button" disabled={loading} className="btn btn-secondary" onClick={() => setForm(example[1])}>{example[0]}</button>)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Servicer (JSON or name)</label>
                <textarea rows={3} value={form.servicer} onChange={(e) => handleChange('servicer', e.target.value)}
                  placeholder='{"name":"OSAM-1","altitude_km":600,"inclination_deg":51.6}' />
              </div>
              <div className="form-group">
                <label>Targets (JSON array or one name per line)</label>
                <textarea rows={4} value={form.targets} onChange={(e) => handleChange('targets', e.target.value)}
                  placeholder={'Cosmos 1408 fragment\nFengyun 1C fragment'} />
              </div>
              <div className="form-group">
                <label>Delta-V Budget (m/s)</label>
                <input type="number" value={form.deltaV_budget_mps} onChange={(e) => handleChange('deltaV_budget_mps', e.target.value)} placeholder="e.g. 1500" />
              </div>
              <div className="form-group">
                <label>Mission Window (days)</label>
                <input type="number" value={form.mission_window_days} onChange={(e) => handleChange('mission_window_days', e.target.value)} placeholder="e.g. 180" />
              </div>
              <div className="form-group">
                <label>Constraints (JSON, optional)</label>
                <textarea rows={2} value={form.constraints} onChange={(e) => handleChange('constraints', e.target.value)}
                  placeholder='{"max_inclination_change_deg":5}' />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
              {loading ? 'Optimizing...' : 'Run Rendezvous Optimization'}
            </button>
          </form>
        </div>

        <div>
          {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
          {loading && (
            <div className="ai-loading">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>AI is sequencing the rendezvous mission...</p>
            </div>
          )}
          {result !== null && result !== undefined && !loading && (
            <div className="ai-result">
              <div className="ai-result-header"><h3>{'🤖'} Optimization Result</h3></div>
              <div className="ai-result-body"><FormattedAIReport response={result} /></div>
            </div>
          )}
          {(result === null || result === undefined) && !loading && !error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{'🛰️'}</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Ready for Optimization</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Provide a servicer + targets and run the planner.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
