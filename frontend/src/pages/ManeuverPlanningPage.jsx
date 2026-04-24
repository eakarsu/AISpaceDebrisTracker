import AiPage from '../components/AiPage';
import { api } from '../api';

const fields = [
  { key: 'satelliteName', label: 'Satellite Name', placeholder: 'e.g., STARLINK-5001' },
  { key: 'currentOrbit', label: 'Current Orbit', placeholder: 'e.g., 550km circular, 53° inclination' },
  { key: 'targetOrbit', label: 'Target/Safe Orbit', placeholder: 'e.g., 555km circular, same inclination' },
  { key: 'fuelRemaining', label: 'Fuel Remaining (%)', type: 'number', placeholder: 'e.g., 85' },
  { key: 'threat', label: 'Threat/Reason', type: 'textarea', placeholder: 'e.g., Conjunction with COSMOS 1408 debris, TCA in 36 hours, miss distance 0.3 km' },
];

export default function ManeuverPlanningPage() {
  return (
    <AiPage
      title="Maneuver Planning"
      subtitle="AI-assisted satellite maneuver optimization with delta-v analysis"
      icon={'\uD83C\uDFAF'}
      fields={fields}
      apiCall={api.maneuverPlanning}
    />
  );
}
