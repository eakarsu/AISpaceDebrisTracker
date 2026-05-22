import React, { useEffect, useState } from 'react';

// Authored without JSX so the file works as a plain .js module (Vite 8 compat).
const h = React.createElement;

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const FREQUENCIES = ['hourly', 'daily', 'weekly'];

export default function ConjunctionDigest() {
  const [email, setEmail] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [frequency, setFrequency] = useState('daily');
  const [subscription, setSubscription] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadPreview = async () => {
    try {
      const res = await fetch('/api/custom-views/digest-preview', { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'preview failed');
      setPreview(json);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { loadPreview(); }, []);

  const subscribe = async () => {
    setBusy(true);
    setError('');
    setSubscription(null);
    try {
      const res = await fetch('/api/custom-views/digest-subscribe', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, min_severity: severity, frequency }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSubscription(json);
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

  const labelStyle = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 };
  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    background: '#020617', color: '#e2e8f0', border: '1px solid #334155', fontSize: 13,
  };

  const header = h('div', { style: { marginBottom: 12 } },
    h('h2', { style: { margin: 0, fontSize: 18 } }, 'Conjunction Alert Email Digest'),
    h('p', { style: { margin: '4px 0 0', color: '#94a3b8', fontSize: 13 } },
      'Stub: subscribes a recipient to a periodic email digest of upcoming conjunctions filtered by minimum severity.'
    )
  );

  const form = h('div', {
    style: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' },
  },
    h('div', null,
      h('label', { style: labelStyle }, 'Email recipient'),
      h('input', {
        type: 'email',
        value: email,
        placeholder: 'ops@example.com',
        onChange: (e) => setEmail(e.target.value),
        style: inputStyle,
      })
    ),
    h('div', null,
      h('label', { style: labelStyle }, 'Min severity'),
      h('select', {
        value: severity,
        onChange: (e) => setSeverity(e.target.value),
        style: inputStyle,
      }, SEVERITIES.map(s => h('option', { key: s, value: s }, s)))
    ),
    h('div', null,
      h('label', { style: labelStyle }, 'Frequency'),
      h('select', {
        value: frequency,
        onChange: (e) => setFrequency(e.target.value),
        style: inputStyle,
      }, FREQUENCIES.map(f => h('option', { key: f, value: f }, f)))
    ),
    h('button', {
      onClick: subscribe,
      disabled: busy || !email,
      style: {
        background: '#16a34a', color: '#fff', border: 'none',
        padding: '9px 16px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
        fontWeight: 600,
      },
    }, busy ? 'Subscribing...' : 'Subscribe')
  );

  const errBanner = error
    ? h('div', {
        style: {
          background: '#7f1d1d', color: '#fee2e2',
          padding: 10, borderRadius: 6, marginTop: 10, fontSize: 13,
        },
      }, 'Error: ' + error)
    : null;

  const subBlock = subscription
    ? h('div', {
        style: {
          marginTop: 12, padding: 10, background: '#052e16',
          color: '#bbf7d0', borderRadius: 8, fontSize: 13,
        },
      },
        h('div', null,
          h('strong', null, 'Subscription created. '),
          'ID: ', h('code', null, subscription.subscription_id),
          ' — next run: ', new Date(subscription.next_run).toLocaleString()
        )
      )
    : null;

  const previewBlock = preview
    ? h('div', { style: { marginTop: 16 } },
        h('h3', { style: { fontSize: 14, margin: '0 0 6px', color: '#cbd5e1' } },
          'Digest Preview (sample)'),
        h('pre', {
          style: {
            background: '#020617', color: '#a5f3fc', padding: 12, borderRadius: 8,
            fontSize: 12, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap',
          },
        }, preview.text),
        h('details', { style: { marginTop: 8 } },
          h('summary', { style: { cursor: 'pointer', color: '#94a3b8', fontSize: 13 } },
            'HTML preview'),
          h('div', {
            style: {
              background: '#f8fafc', color: '#0f172a', padding: 10, borderRadius: 8, marginTop: 6,
            },
            dangerouslySetInnerHTML: { __html: preview.html },
          })
        )
      )
    : null;

  return h('div', { 'data-testid': 'conjunction-digest', style: card },
    header, form, errBanner, subBlock, previewBlock);
}
