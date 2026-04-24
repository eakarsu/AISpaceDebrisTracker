import AiPage from '../components/AiPage';
import { api } from '../api';

const fields = [
  { key: 'objectName', label: 'Object Name', placeholder: 'e.g., COSMOS 1408 DEB' },
  { key: 'altitude', label: 'Current Altitude (km)', type: 'number', placeholder: 'e.g., 500' },
  { key: 'inclination', label: 'Inclination (degrees)', type: 'number', placeholder: 'e.g., 82.6' },
  { key: 'area', label: 'Cross-sectional Area (m2)', type: 'number', placeholder: 'e.g., 2.5' },
  { key: 'mass', label: 'Mass (kg)', type: 'number', placeholder: 'e.g., 750' },
];

export default function OrbitalDecayPage() {
  return (
    <AiPage
      title="Orbital Decay Prediction"
      subtitle="AI prediction of atmospheric reentry timelines and ground risk"
      icon={'\uD83D\uDD25'}
      fields={fields}
      apiCall={api.orbitalDecay}
    />
  );
}
