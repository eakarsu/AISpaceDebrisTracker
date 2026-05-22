import React, { useState } from 'react';

// Authored without JSX so the file works as a plain .js module (Vite 8 compat).
const h = React.createElement;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const SAMPLE_TLE = [
  'ISS (ZARYA)',
  '1 25544U 98067A   24087.54791667  .00016177  00000-0  29547-3 0  9993',
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50132544123456',
  'STARLINK-1042',
  '1 44737U 19074G   24087.51000000  .00002182  00000-0  15842-3 0  9994',
  '2 44737  53.0532 188.4321 0001245  90.1230 270.0123 15.06321456654321',
].join('\n');

export default function TLEImporter() {
  const [tle, setTle] = useState(SAMPLE_TLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/custom-views/import-tle', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tle }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const card = {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    color: '#e2e8f0',
  };

  const header = h('div', { style: { marginBottom: 12 } },
    h('h2', { style: { margin: 0, fontSize: 18 } }, 'TLE Importer'),
    h('p', { style: { margin: '4px 0 0', color: '#94a3b8', fontSize: 13 } },
      'Paste multiple two-line element sets (optionally preceded by a name line). Lines are parsed via regex for catalog#, epoch, inclination, and RAAN.'
    )
  );

  const textarea = h('textarea', {
    value: tle,
    onChange: (e) => setTle(e.target.value),
    spellCheck: false,
    rows: 8,
    style: {
      width: '100%',
      fontFamily: 'monospace',
      fontSize: 12,
      background: '#020617',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: 10,
      resize: 'vertical',
    },
  });

  const controls = h('div', { style: { display: 'flex', gap: 8, marginTop: 10 } },
    h('button', {
      onClick: submit,
      disabled: busy || !tle.trim(),
      className: 'btn btn-primary',
      style: {
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '8px 14px',
        borderRadius: 8,
        cursor: busy ? 'wait' : 'pointer',
      },
    }, busy ? 'Importing...' : 'Import TLE'),
    h('button', {
      onClick: () => { setTle(''); setResult(null); setError(''); },
      style: {
        background: '#334155',
        color: '#e2e8f0',
        border: 'none',
        padding: '8px 14px',
        borderRadius: 8,
        cursor: 'pointer',
      },
    }, 'Clear')
  );

  const errBanner = error
    ? h('div', {
        style: {
          background: '#7f1d1d', color: '#fee2e2',
          padding: 10, borderRadius: 6, marginTop: 10, fontSize: 13,
        },
      }, 'Error: ' + error)
    : null;

  const renderTable = (parsed) => {
    if (!parsed || parsed.length === 0) {
      return h('div', { style: { marginTop: 10, color: '#fbbf24' } },
        'Parsed 0 rows — check your TLE format (line 1 must start with "1 ", line 2 with "2 ").');
    }
    const ths = ['Name', 'Catalog#', 'Epoch', 'Incl (deg)', 'RAAN (deg)', 'Ecc', 'Mean Motion', 'Period (min)', 'Alt (km)'];
    const thead = h('thead', null,
      h('tr', { style: { background: '#1e293b' } },
        ths.map((t, i) => h('th', {
          key: i,
          style: { padding: '8px 10px', textAlign: 'left', fontSize: 12, color: '#cbd5e1' },
        }, t))
      )
    );
    const tbody = h('tbody', null,
      parsed.map((r, i) =>
        h('tr', {
          key: i,
          style: { borderTop: '1px solid #1e293b', background: i % 2 ? '#0b1220' : 'transparent' },
        },
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.name),
          h('td', { style: { padding: '6px 10px', fontSize: 12, fontFamily: 'monospace' } }, r.catalog_number),
          h('td', { style: { padding: '6px 10px', fontSize: 12, fontFamily: 'monospace' } }, r.epoch),
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.inclination_deg),
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.raan_deg),
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.eccentricity),
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.mean_motion_rev_per_day),
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.period_min),
          h('td', { style: { padding: '6px 10px', fontSize: 12 } }, r.altitude_km)
        )
      )
    );
    return h('div', { style: { marginTop: 14, overflowX: 'auto' } },
      h('div', { style: { color: '#22d3ee', fontSize: 13, marginBottom: 6 } },
        'Imported ' + parsed.length + ' object(s) at ' + new Date().toLocaleTimeString()),
      h('table', {
        style: {
          width: '100%', borderCollapse: 'collapse',
          border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden',
        },
      }, thead, tbody)
    );
  };

  const resultBlock = result
    ? renderTable(result.parsed)
    : null;

  return h('div', { 'data-testid': 'tle-importer', style: card },
    header, textarea, controls, errBanner, resultBlock);
}
