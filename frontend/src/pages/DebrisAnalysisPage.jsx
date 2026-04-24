import AiPage from '../components/AiPage';
import { api } from '../api';

const fields = [
  { key: 'region', label: 'Region/Orbit Zone', placeholder: 'e.g., LEO 750-900km, polar orbit corridor' },
  { key: 'altitudeRange', label: 'Altitude Range', placeholder: 'e.g., 750-900 km' },
  { key: 'source', label: 'Source Event', placeholder: 'e.g., Fengyun-1C ASAT test (2007)' },
  { key: 'objectCount', label: 'Estimated Object Count', type: 'number', placeholder: 'e.g., 3500' },
];

export default function DebrisAnalysisPage() {
  return (
    <AiPage
      title="Debris Field Analysis"
      subtitle="AI analysis of debris cluster patterns and evolution predictions"
      icon={'\uD83D\uDD2C'}
      fields={fields}
      apiCall={api.debrisAnalysis}
    />
  );
}
