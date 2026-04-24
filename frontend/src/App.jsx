import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SpaceObjectsPage from './pages/SpaceObjectsPage';
import SatellitesPage from './pages/SatellitesPage';
import ConjunctionEventsPage from './pages/ConjunctionEventsPage';
import LaunchWindowsPage from './pages/LaunchWindowsPage';
import DebrisRemovalPage from './pages/DebrisRemovalPage';
import CollisionProbabilityPage from './pages/CollisionProbabilityPage';
import OrbitalDecayPage from './pages/OrbitalDecayPage';
import ManeuverPlanningPage from './pages/ManeuverPlanningPage';
import DebrisAnalysisPage from './pages/DebrisAnalysisPage';
import LaunchOptimizationPage from './pages/LaunchOptimizationPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { section: 'Overview' },
    { path: '/dashboard', label: 'Dashboard', icon: '\u2604\uFE0F' },
    { section: 'Data Management' },
    { path: '/space-objects', label: 'Space Objects', icon: '\uD83C\uDF11' },
    { path: '/satellites', label: 'Satellites', icon: '\uD83D\uDEF0\uFE0F' },
    { path: '/conjunction-events', label: 'Conjunction Events', icon: '\u26A0\uFE0F' },
    { path: '/launch-windows', label: 'Launch Windows', icon: '\uD83D\uDE80' },
    { path: '/debris-removal', label: 'Debris Removal', icon: '\uD83E\uDDF9' },
    { section: 'AI Analysis' },
    { path: '/ai/collision-probability', label: 'Collision Probability', icon: '\uD83D\uDCA5' },
    { path: '/ai/orbital-decay', label: 'Orbital Decay', icon: '\uD83D\uDD25' },
    { path: '/ai/maneuver-planning', label: 'Maneuver Planning', icon: '\uD83C\uDFAF' },
    { path: '/ai/debris-analysis', label: 'Debris Analysis', icon: '\uD83D\uDD2C' },
    { path: '/ai/launch-optimization', label: 'Launch Optimization', icon: '\u2728' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">{'\uD83C\uDF0C'}</span>
        <h2>Space Debris<br/>Tracker</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="sidebar-section">{item.section}</div>
          ) : (
            <Link key={item.path} to={item.path} className={location.pathname === item.path ? 'active' : ''}>
              <span>{item.icon}</span> {item.label}
            </Link>
          )
        )}
      </nav>
      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">{(user.name || 'U')[0]}</div>
          <div>
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-email">{user.email || ''}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
          Logout
        </button>
      </div>
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/space-objects" element={<ProtectedRoute><AppLayout><SpaceObjectsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/satellites" element={<ProtectedRoute><AppLayout><SatellitesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/conjunction-events" element={<ProtectedRoute><AppLayout><ConjunctionEventsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/launch-windows" element={<ProtectedRoute><AppLayout><LaunchWindowsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/debris-removal" element={<ProtectedRoute><AppLayout><DebrisRemovalPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/collision-probability" element={<ProtectedRoute><AppLayout><CollisionProbabilityPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/orbital-decay" element={<ProtectedRoute><AppLayout><OrbitalDecayPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/maneuver-planning" element={<ProtectedRoute><AppLayout><ManeuverPlanningPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/debris-analysis" element={<ProtectedRoute><AppLayout><DebrisAnalysisPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/launch-optimization" element={<ProtectedRoute><AppLayout><LaunchOptimizationPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
