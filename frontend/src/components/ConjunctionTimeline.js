import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// Authored without JSX so the file works as a plain .js module.
const h = React.createElement;

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function CustomTooltip(props) {
  const { active, payload } = props || {};
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return h('div', {
    style: {
      background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
      padding: 10, color: '#e2e8f0', fontSize: 12, minWidth: 220,
    }
  },
    h('div', { style: { fontWeight: 600, marginBottom: 4 } }, `${p.primary_object} vs ${p.secondary_object}`),
    h('div', null, `TCA: ${new Date(p.tca).toLocaleString()}`),
    h('div', null, `Hours to TCA: ${p.hours_to_tca}h`),
    h('div', null, `Miss distance: ${p.miss_distance_km} km`),
    h('div', null, `Rel. velocity: ${p.relative_velocity_kms} km/s`),
    h('div', null, `Altitude: ${p.altitude_km} km (${p.band})`),
    h('div', null, `Pc: ${p.probability_of_collision}`),
    h('div', { style: { color: SEVERITY_COLORS[p.severity], fontWeight: 600, marginTop: 4 } },
      `Severity: ${String(p.severity || '').toUpperCase()}`),
  );
}

export default function ConjunctionTimeline({ data }) {
  const conjunctions = (data && data.conjunctions) || [];

  const grouped = useMemo(() => {
    const buckets = { critical: [], high: [], medium: [], low: [] };
    conjunctions.forEach(c => {
      const sev = c.severity || 'low';
      if (!buckets[sev]) buckets[sev] = [];
      buckets[sev].push(c);
    });
    return buckets;
  }, [conjunctions]);

  const header = h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
    h('div', null,
      h('h3', { style: { color: '#e2e8f0', margin: 0 } }, 'Conjunction Risk Timeline'),
      h('p', { style: { color: '#94a3b8', margin: '4px 0 0', fontSize: 12 } },
        `Upcoming close approaches plotted by time-to-CA vs miss distance (${conjunctions.length} events)`)
    )
  );

  const scatters = Object.entries(grouped).map(([sev, items]) =>
    h(Scatter, {
      key: sev,
      name: sev.toUpperCase(),
      data: items,
      fill: SEVERITY_COLORS[sev] || '#94a3b8',
    })
  );

  const chart = h(ResponsiveContainer, null,
    h(ScatterChart, { margin: { top: 20, right: 24, bottom: 32, left: 16 } },
      h(CartesianGrid, { stroke: '#1e293b', strokeDasharray: '3 3' }),
      h(XAxis, {
        type: 'number', dataKey: 'hours_to_tca',
        name: 'Hours to TCA', unit: 'h',
        stroke: '#94a3b8',
        label: { value: 'Hours to Closest Approach', position: 'insideBottom', offset: -16, fill: '#94a3b8' },
      }),
      h(YAxis, {
        type: 'number', dataKey: 'miss_distance_km',
        name: 'Miss distance', unit: ' km',
        stroke: '#94a3b8',
        label: { value: 'Miss Distance (km)', angle: -90, position: 'insideLeft', fill: '#94a3b8' },
      }),
      h(ZAxis, { type: 'number', dataKey: 'relative_velocity_kms', range: [40, 220], name: 'Rel. velocity', unit: ' km/s' }),
      h(Tooltip, { content: h(CustomTooltip, null), cursor: { strokeDasharray: '3 3' } }),
      h(Legend, { wrapperStyle: { color: '#e2e8f0' } }),
      h(ReferenceLine, { y: 1, stroke: '#ef4444', strokeDasharray: '4 4', label: { value: '1 km threshold', fill: '#ef4444', fontSize: 11, position: 'right' } }),
      h(ReferenceLine, { y: 5, stroke: '#f97316', strokeDasharray: '4 4', label: { value: '5 km', fill: '#f97316', fontSize: 11, position: 'right' } }),
      ...scatters
    )
  );

  return h('div', { style: { background: '#0b1020', border: '1px solid #1f2a44', borderRadius: 12, padding: 16 } },
    header,
    h('div', { style: { width: '100%', height: 420 } }, chart)
  );
}
