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
import OrbitalMapPage from './pages/OrbitalMapPage';
import ConjunctionAlertsPage from './pages/ConjunctionAlertsPage';
import TLESyncPage from './pages/TLESyncPage';
import DebrisCharacterizePage from './pages/DebrisCharacterizePage';
import CollisionClusteringPage from './pages/CollisionClusteringPage';
import RendezvousOptimizationPage from './pages/RendezvousOptimizationPage';
import RegulatoryCompliancePage from './pages/RegulatoryCompliancePage';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

// === Batch 08 Gaps & Frontend Mounts ===
import CfPredictiveCollisionClusteringByLikelyFragmentationParent from './pages/CfPredictiveCollisionClusteringByLikelyFragmentationParent'
import CfSensorFusionCombiningOpticalRadarObservationsVia from './pages/CfSensorFusionCombiningOpticalRadarObservationsVia'
import CfMultiMissionOptimizerRecommendingConstellationReconfigurations from './pages/CfMultiMissionOptimizerRecommendingConstellationReconfigurations'
import CfActiveDebrisRemovalLogisticsWithPayloadCapacity from './pages/CfActiveDebrisRemovalLogisticsWithPayloadCapacity'
import CfRegulatoryComplianceScoringAgainstNationalInternationalGuidelines from './pages/CfRegulatoryComplianceScoringAgainstNationalInternationalGuidelines'
import CfRealTimeConjunctionAlertingViaWebhooksAnd from './pages/CfRealTimeConjunctionAlertingViaWebhooksAnd'
import GapNoAiDrivenDebrisCharacterizationFromLimited from './pages/GapNoAiDrivenDebrisCharacterizationFromLimited'
import GapNoMultiTargetRendezvousOptimizationEndpoint from './pages/GapNoMultiTargetRendezvousOptimizationEndpoint'
import GapNoSensorFusionMlForObservationConfidence from './pages/GapNoSensorFusionMlForObservationConfidence'
import GapNoWebhooksOrPushNotificationsForReal from './pages/GapNoWebhooksOrPushNotificationsForReal'
import GapNoIntegrationWithNoradTleFeedsOr from './pages/GapNoIntegrationWithNoradTleFeedsOr'
import GapNo3dVisualizationOfDebrisCloudsAt from './pages/GapNo3dVisualizationOfDebrisCloudsAt'
import GapNoRegulatoryComplianceTrackingBackendOuterSpace from './pages/GapNoRegulatoryComplianceTrackingBackendOuterSpace'
import GapNoAuditLogging from './pages/GapNoAuditLogging'
import GapNoMultiTenantOperatorSupport from './pages/GapNoMultiTenantOperatorSupport'
import CustomViewsPage from './pages/CustomViewsPage'

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
    { section: 'New Features' },
    { path: '/orbital-map', label: 'Orbital Map (SGP4)', icon: '\uD83D\uDDFA\uFE0F' },
    { path: '/conjunction-alerts', label: 'Conjunction Alerts', icon: '\uD83D\uDEA8' },
    { path: '/ai/debris-characterize', label: 'Debris Characterize', icon: '🧬' },
    { path: '/ai/collision-clustering', label: 'Collision Clustering', icon: '🌐' },
    { path: '/ai/rendezvous-optimization', label: 'Rendezvous Optimization', icon: '🛰️' },
    { path: '/ai/regulatory-compliance', label: 'Regulatory Compliance', icon: '⚖️' },
    { path: '/tle-sync', label: 'TLE Sync', icon: '\uD83D\uDD04' },
    { section: 'Custom Views' },
    { path: '/custom-views', label: 'Tracking Views', icon: '\uD83D\uDCE1' },
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
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

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
      <Route path="/orbital-map" element={<ProtectedRoute><AppLayout><OrbitalMapPage /></AppLayout></ProtectedRoute>} />
      <Route path="/conjunction-alerts" element={<ProtectedRoute><AppLayout><ConjunctionAlertsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/tle-sync" element={<ProtectedRoute><AppLayout><TLESyncPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/debris-characterize" element={<ProtectedRoute><AppLayout><DebrisCharacterizePage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/collision-clustering" element={<ProtectedRoute><AppLayout><CollisionClusteringPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/rendezvous-optimization" element={<ProtectedRoute><AppLayout><RendezvousOptimizationPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/regulatory-compliance" element={<ProtectedRoute><AppLayout><RegulatoryCompliancePage /></AppLayout></ProtectedRoute>} />
      {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-predictive-collision-clustering-by-likely-fragmentation-parent-with" element={<ProtectedRoute><CfPredictiveCollisionClusteringByLikelyFragmentationParent /></ProtectedRoute>} />
      <Route path="/cf-sensor-fusion-combining-optical-radar-observations-via-ml" element={<ProtectedRoute><CfSensorFusionCombiningOpticalRadarObservationsVia /></ProtectedRoute>} />
      <Route path="/cf-multi-mission-optimizer-recommending-constellation-reconfigurations" element={<ProtectedRoute><CfMultiMissionOptimizerRecommendingConstellationReconfigurations /></ProtectedRoute>} />
      <Route path="/cf-active-debris-removal-logistics-with-payload-capacity-cost" element={<ProtectedRoute><CfActiveDebrisRemovalLogisticsWithPayloadCapacity /></ProtectedRoute>} />
      <Route path="/cf-regulatory-compliance-scoring-against-national-international-guidelines" element={<ProtectedRoute><CfRegulatoryComplianceScoringAgainstNationalInternationalGuidelines /></ProtectedRoute>} />
      <Route path="/cf-real-time-conjunction-alerting-via-webhooks-and-pager-style-escalation" element={<ProtectedRoute><CfRealTimeConjunctionAlertingViaWebhooksAnd /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-debris-characterization-from-limited-observations-frontend" element={<ProtectedRoute><GapNoAiDrivenDebrisCharacterizationFromLimited /></ProtectedRoute>} />
      <Route path="/gap-no-multi-target-rendezvous-optimization-endpoint" element={<ProtectedRoute><GapNoMultiTargetRendezvousOptimizationEndpoint /></ProtectedRoute>} />
      <Route path="/gap-no-sensor-fusion-ml-for-observation-confidence" element={<ProtectedRoute><GapNoSensorFusionMlForObservationConfidence /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-or-push-notifications-for-real-time-conjunction" element={<ProtectedRoute><GapNoWebhooksOrPushNotificationsForReal /></ProtectedRoute>} />
      <Route path="/gap-no-integration-with-norad-tle-feeds-or-jspoc" element={<ProtectedRoute><GapNoIntegrationWithNoradTleFeedsOr /></ProtectedRoute>} />
      <Route path="/gap-no-3d-visualization-of-debris-clouds-at-the" element={<ProtectedRoute><GapNo3dVisualizationOfDebrisCloudsAt /></ProtectedRoute>} />
      <Route path="/gap-no-regulatory-compliance-tracking-backend-outer-space-treaty" element={<ProtectedRoute><GapNoRegulatoryComplianceTrackingBackendOuterSpace /></ProtectedRoute>} />
      <Route path="/gap-no-audit-logging" element={<ProtectedRoute><GapNoAuditLogging /></ProtectedRoute>} />
      <Route path="/gap-no-multi-tenant-operator-support" element={<ProtectedRoute><GapNoMultiTenantOperatorSupport /></ProtectedRoute>} />
      <Route path="/custom-views" element={<ProtectedRoute><AppLayout><CustomViewsPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
