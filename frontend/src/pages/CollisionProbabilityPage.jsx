import AiPage from '../components/AiPage';
import { api } from '../api';

const fields = [
  { key: 'object1', label: 'Object 1', placeholder: 'e.g., ISS (ZARYA)' },
  { key: 'object2', label: 'Object 2', placeholder: 'e.g., COSMOS 1408 DEB' },
  { key: 'distance', label: 'Closest Approach Distance (km)', type: 'number', placeholder: 'e.g., 0.45' },
  { key: 'relativeVelocity', label: 'Relative Velocity (km/s)', type: 'number', placeholder: 'e.g., 14.2' },
];

export default function CollisionProbabilityPage() {
  return (
    <AiPage
      title="Collision Probability"
      subtitle="AI-powered collision risk assessment between space objects"
      icon={'\uD83D\uDCA5'}
      fields={fields}
      apiCall={api.collisionProbability}
    />
  );
}
