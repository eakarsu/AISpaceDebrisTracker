import { useNavigate } from 'react-router-dom';

const features = [
  { path: '/space-objects', icon: '\uD83C\uDF11', title: 'Space Object Catalog', desc: 'Track and manage orbital debris objects with NORAD IDs, orbital parameters, and status monitoring.', badge: 'Data Management', badgeClass: 'badge-data' },
  { path: '/satellites', icon: '\uD83D\uDEF0\uFE0F', title: 'Satellite Registry', desc: 'Manage active satellites including operators, mission types, fuel levels, and orbital data.', badge: 'Data Management', badgeClass: 'badge-data' },
  { path: '/conjunction-events', icon: '\u26A0\uFE0F', title: 'Conjunction Events', desc: 'Monitor close approach events, collision probabilities, and track avoidance maneuvers.', badge: 'Data Management', badgeClass: 'badge-data' },
  { path: '/launch-windows', icon: '\uD83D\uDE80', title: 'Launch Windows', desc: 'Schedule launches with debris clearance checks, weather status, and vehicle assignments.', badge: 'Data Management', badgeClass: 'badge-data' },
  { path: '/debris-removal', icon: '\uD83E\uDDF9', title: 'Debris Removal Missions', desc: 'Plan and track active debris removal operations across multiple agencies worldwide.', badge: 'Data Management', badgeClass: 'badge-data' },
  { path: '/ai/collision-probability', icon: '\uD83D\uDCA5', title: 'Collision Probability Calculator', desc: 'AI-powered collision risk assessment with detailed probability analysis and maneuver recommendations.', badge: 'AI Powered', badgeClass: 'badge-ai' },
  { path: '/ai/orbital-decay', icon: '\uD83D\uDD25', title: 'Orbital Decay Prediction', desc: 'Predict atmospheric reentry timelines with AI analysis of drag, solar activity, and ground risk.', badge: 'AI Powered', badgeClass: 'badge-ai' },
  { path: '/ai/maneuver-planning', icon: '\uD83C\uDFAF', title: 'Maneuver Planning Assistant', desc: 'AI-assisted satellite maneuver optimization with delta-v budgets and fuel analysis.', badge: 'AI Powered', badgeClass: 'badge-ai' },
  { path: '/ai/debris-analysis', icon: '\uD83D\uDD2C', title: 'Debris Field Analysis', desc: 'AI analysis of debris cluster patterns, density mapping, and evolution predictions.', badge: 'AI Powered', badgeClass: 'badge-ai' },
  { path: '/ai/launch-optimization', icon: '\u2728', title: 'Launch Window Optimizer', desc: 'AI-optimized launch windows considering debris avoidance, trajectory, and environmental factors.', badge: 'AI Powered', badgeClass: 'badge-ai' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mission Control Dashboard</h1>
          <p className="subtitle">AI-powered orbital debris tracking and space situational awareness</p>
        </div>
      </div>
      <div className="dashboard-grid">
        {features.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="card-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className={`card-badge ${f.badgeClass}`}>{f.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
