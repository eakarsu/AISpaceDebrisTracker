import AiPage from '../components/AiPage';
import { api } from '../api';

const fields = [
  { key: 'missionName', label: 'Mission Name', placeholder: 'e.g., STARLINK GROUP 9-2' },
  { key: 'launchSite', label: 'Launch Site', placeholder: 'e.g., KSC LC-39A, Cape Canaveral' },
  { key: 'targetOrbit', label: 'Target Orbit', placeholder: 'e.g., LEO 550km, 53° inclination' },
  { key: 'payloadMass', label: 'Payload Mass (kg)', type: 'number', placeholder: 'e.g., 15600' },
  { key: 'vehicle', label: 'Launch Vehicle', placeholder: 'e.g., Falcon 9 Block 5' },
];

export default function LaunchOptimizationPage() {
  return (
    <AiPage
      title="Launch Optimization"
      subtitle="AI-optimized launch windows considering debris fields and trajectory constraints"
      icon={'\u2728'}
      fields={fields}
      apiCall={api.launchOptimization}
    />
  );
}
