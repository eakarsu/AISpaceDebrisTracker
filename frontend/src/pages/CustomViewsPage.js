import React, { useEffect, useState } from 'react';
import OrbitalViewer from '../components/OrbitalViewer';
import ConjunctionTimeline from '../components/ConjunctionTimeline';
import TLEImporter from '../components/TLEImporter';
import ConjunctionDigest from '../components/ConjunctionDigest';

// Authored without JSX so the file works as a plain .js module.
const h = React.createElement;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CustomViewsPage() {
  const [orbital, setOrbital] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [oRes, tRes] = await Promise.all([
        fetch('/api/custom-views/orbital-trajectories', { headers: authHeaders() }),
        fetch('/api/custom-views/conjunctions-timeline', { headers: authHeaders() }),
      ]);
      if (!oRes.ok) throw new Error(`orbital-trajectories ${oRes.status}`);
      if (!tRes.ok) throw new Error(`conjunctions-timeline ${tRes.status}`);
      setOrbital(await oRes.json());
      setTimeline(await tRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const header = h('div', { className: 'page-header' },
    h('div', null,
      h('h1', null, 'Tracking Views'),
      h('p', { className: 'subtitle' }, 'Bespoke orbital trajectory + conjunction risk dashboards')
    ),
    h('button', { onClick: load, className: 'btn btn-secondary', disabled: loading },
      loading ? 'Loading...' : 'Refresh')
  );

  const errBanner = error
    ? h('div', { style: { background: '#7f1d1d', color: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 } },
        `Error: ${error}`)
    : null;

  const cards = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: 24 } },
    orbital ? h(OrbitalViewer, { data: orbital }) : null,
    timeline ? h(ConjunctionTimeline, { data: timeline }) : null,
    h(TLEImporter, { key: 'tle-importer' }),
    h(ConjunctionDigest, { key: 'conjunction-digest' })
  );

  const footer = (!loading && orbital && timeline)
    ? h('div', { style: { marginTop: 16, color: '#94a3b8', fontSize: 12 } },
        `Data synthesized from /api/custom-views — generated at ${new Date(orbital.generated_at).toLocaleString()}`)
    : null;

  return h('div', null, header, errBanner, cards, footer);
}
