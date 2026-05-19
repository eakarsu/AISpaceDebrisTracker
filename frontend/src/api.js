const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders()
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const msg = (data && data.error) || 'Request failed';
    if (res.status === 503) throw new Error(`AI provider not configured: ${msg}`);
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  // Space Objects
  getSpaceObjects: () => request('/space-objects'),
  getSpaceObject: (id) => request(`/space-objects/${id}`),
  createSpaceObject: (data) => request('/space-objects', { method: 'POST', body: JSON.stringify(data) }),
  updateSpaceObject: (id, data) => request(`/space-objects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSpaceObject: (id) => request(`/space-objects/${id}`, { method: 'DELETE' }),

  // Satellites
  getSatellites: () => request('/satellites'),
  getSatellite: (id) => request(`/satellites/${id}`),
  createSatellite: (data) => request('/satellites', { method: 'POST', body: JSON.stringify(data) }),
  updateSatellite: (id, data) => request(`/satellites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSatellite: (id) => request(`/satellites/${id}`, { method: 'DELETE' }),

  // Conjunction Events
  getConjunctionEvents: () => request('/conjunction-events'),
  getConjunctionEvent: (id) => request(`/conjunction-events/${id}`),
  createConjunctionEvent: (data) => request('/conjunction-events', { method: 'POST', body: JSON.stringify(data) }),
  updateConjunctionEvent: (id, data) => request(`/conjunction-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConjunctionEvent: (id) => request(`/conjunction-events/${id}`, { method: 'DELETE' }),

  // Launch Windows
  getLaunchWindows: () => request('/launch-windows'),
  getLaunchWindow: (id) => request(`/launch-windows/${id}`),
  createLaunchWindow: (data) => request('/launch-windows', { method: 'POST', body: JSON.stringify(data) }),
  updateLaunchWindow: (id, data) => request(`/launch-windows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLaunchWindow: (id) => request(`/launch-windows/${id}`, { method: 'DELETE' }),

  // Debris Removal
  getDebrisRemovalMissions: () => request('/debris-removal'),
  getDebrisRemovalMission: (id) => request(`/debris-removal/${id}`),
  createDebrisRemovalMission: (data) => request('/debris-removal', { method: 'POST', body: JSON.stringify(data) }),
  updateDebrisRemovalMission: (id, data) => request(`/debris-removal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDebrisRemovalMission: (id) => request(`/debris-removal/${id}`, { method: 'DELETE' }),

  // AI Features
  collisionProbability: (data) => request('/ai/collision-probability', { method: 'POST', body: JSON.stringify(data) }),
  orbitalDecay: (data) => request('/ai/orbital-decay', { method: 'POST', body: JSON.stringify(data) }),
  maneuverPlanning: (data) => request('/ai/maneuver-planning', { method: 'POST', body: JSON.stringify(data) }),
  debrisAnalysis: (data) => request('/ai/debris-analysis', { method: 'POST', body: JSON.stringify(data) }),
  launchOptimization: (data) => request('/ai/launch-optimization', { method: 'POST', body: JSON.stringify(data) }),
  getAiHistory: (params = '') => request(`/ai/history${params ? '?' + params : ''}`),

  // New: SGP4 Propagator
  propagate: (data) => request('/propagate', { method: 'POST', body: JSON.stringify(data) }),

  // New: Conjunction screening
  screenConjunctions: (data) => request('/conjunction-events/screen', { method: 'POST', body: JSON.stringify(data) }),
  autoScreenConjunctions: (data) => request('/conjunction-events/auto-screen', { method: 'POST', body: JSON.stringify(data) }),

  // New: TLE sync
  syncTLE: () => request('/space-objects/sync-tle'),

  // New: Reentry monitoring
  reentryPredict: (data) => request('/ai/reentry-predict', { method: 'POST', body: JSON.stringify(data) }),
  reentryMonitor: () => request('/ai/reentry-monitor', { method: 'POST', body: JSON.stringify({}) }),

  // Debris characterization & collision clustering
  debrisCharacterize: (data) => request('/ai/debris-characterize', { method: 'POST', body: JSON.stringify(data) }),
  collisionClustering: (data) => request('/ai/collision-clustering', { method: 'POST', body: JSON.stringify(data) }),

  // Mechanical backlog: rendezvous + regulatory compliance
  rendezvousOptimization: (data) => request('/ai/rendezvous-optimization', { method: 'POST', body: JSON.stringify(data) }),
  regulatoryCompliance: (data) => request('/ai/regulatory-compliance', { method: 'POST', body: JSON.stringify(data) }),
};

// Also export a default axios-compatible wrapper for new pages
const axiosLike = {
  get: (url) => {
    const cleanUrl = url.replace('/api', '');
    return request(cleanUrl).then(data => ({ data }));
  },
  post: (url, body) => {
    const cleanUrl = url.replace('/api', '');
    return request(cleanUrl, { method: 'POST', body: JSON.stringify(body) }).then(data => ({ data }));
  },
};

export default axiosLike;
