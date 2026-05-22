import React, { useMemo } from 'react';

// Pure SVG 2D Earth-projection viewer.
// Renders Earth as a circle and debris orbits as colored arcs in LEO/MEO/GEO bands.
// Authored without JSX so the file works as a plain .js module.

const h = React.createElement;

const BAND_COLORS = {
  LEO: '#22d3ee',
  MEO: '#a78bfa',
  GEO: '#f97316',
};

function bandFor(altKm) {
  if (altKm < 2000) return 'LEO';
  if (altKm < 35786) return 'MEO';
  return 'GEO';
}

// Logarithmic-ish radial mapping so GEO (~36000km) stays on canvas.
function radiusForAltitude(altKm, earthRadiusPx, maxRadiusPx) {
  const minAlt = 200;
  const maxAlt = 36000;
  const t = (Math.log(Math.max(altKm, minAlt)) - Math.log(minAlt)) /
            (Math.log(maxAlt) - Math.log(minAlt));
  return earthRadiusPx + t * (maxRadiusPx - earthRadiusPx);
}

export default function OrbitalViewer({ data }) {
  const objects = (data && data.objects) || [];
  const size = 560;
  const cx = size / 2;
  const cy = size / 2;
  const earthR = 56;
  const maxR = size / 2 - 16;

  const bandRings = useMemo(() => ([
    { name: 'LEO', altKm: 1000 },
    { name: 'MEO', altKm: 20000 },
    { name: 'GEO', altKm: 35786 },
  ]), []);

  const legend = h('div', { style: { display: 'flex', gap: 12 } },
    Object.entries(BAND_COLORS).map(([b, c]) =>
      h('div', { key: b, style: { display: 'flex', alignItems: 'center', gap: 6 } },
        h('span', { style: { width: 12, height: 12, borderRadius: 6, background: c, display: 'inline-block' } }),
        h('span', { style: { color: '#cbd5e1', fontSize: 12 } }, b)
      )
    )
  );

  const header = h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
    h('div', null,
      h('h3', { style: { color: '#e2e8f0', margin: 0 } }, 'Orbital Trajectory Viewer'),
      h('p', { style: { color: '#94a3b8', margin: '4px 0 0', fontSize: 12 } },
        `2D Earth projection with debris paths across LEO/MEO/GEO bands (${objects.length} objects)`)
    ),
    legend
  );

  const defs = h('defs', null,
    h('radialGradient', { id: 'earthGrad', cx: '50%', cy: '50%', r: '50%' },
      h('stop', { offset: '0%', stopColor: '#3b82f6' }),
      h('stop', { offset: '100%', stopColor: '#1e3a8a' })
    )
  );

  const gridRings = [0.25, 0.5, 0.75, 1].map((t, i) =>
    h('circle', {
      key: `grid-${i}`,
      cx, cy,
      r: earthR + (maxR - earthR) * t,
      fill: 'none', stroke: '#1e293b', strokeDasharray: '2 4', strokeWidth: 0.8,
    })
  );

  const earth = [
    h('circle', { key: 'earth-c', cx, cy, r: earthR, fill: 'url(#earthGrad)', stroke: '#60a5fa', strokeWidth: 1.5 }),
    h('text', { key: 'earth-t', x: cx, y: cy + 4, textAnchor: 'middle', fontSize: '11', fill: '#e0f2fe', fontWeight: '600' }, 'EARTH'),
  ];

  const bands = bandRings.map(b => {
    const r = radiusForAltitude(b.altKm, earthR, maxR);
    return h('g', { key: b.name },
      h('circle', { cx, cy, r, fill: 'none', stroke: BAND_COLORS[b.name], strokeOpacity: 0.25, strokeWidth: 1, strokeDasharray: '4 4' }),
      h('text', { x: cx + r + 4, y: cy - 4, fontSize: '10', fill: BAND_COLORS[b.name] }, b.name)
    );
  });

  const orbits = objects.map((o, idx) => {
    const r = radiusForAltitude(o.altitude_km, earthR, maxR);
    const inc = (o.inclination_deg || 0);
    const ry = r * Math.max(0.25, Math.cos((inc * Math.PI) / 180));
    const color = o.color || BAND_COLORS[bandFor(o.altitude_km)] || '#cbd5e1';
    const rot = (o.raan_deg || (idx * 17)) % 360;
    return h('g', { key: o.id || idx, transform: `rotate(${rot} ${cx} ${cy})` },
      h('ellipse', { cx, cy, rx: r, ry, fill: 'none', stroke: color, strokeOpacity: 0.55, strokeWidth: 1.2 }),
      h('circle', { cx: cx + r, cy, r: 2.2, fill: color })
    );
  });

  const svg = h('svg', { width: '100%', viewBox: `0 0 ${size} ${size}`, style: { display: 'block' } },
    defs, gridRings, earth, bands, orbits
  );

  return h('div', { style: { background: '#0b1020', border: '1px solid #1f2a44', borderRadius: 12, padding: 16 } },
    header, svg
  );
}
