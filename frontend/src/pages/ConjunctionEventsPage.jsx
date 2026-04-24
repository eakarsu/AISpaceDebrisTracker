import CrudPage from '../components/CrudPage';
import { api } from '../api';

const columns = [
  { key: 'primary_object', label: 'Primary Object' },
  { key: 'secondary_object', label: 'Secondary Object' },
  { key: 'tca', label: 'TCA', render: v => v ? new Date(v).toLocaleString() : '-' },
  { key: 'miss_distance', label: 'Miss Dist (km)', render: v => v != null ? `${Number(v).toFixed(2)} km` : '-' },
  { key: 'probability', label: 'Probability', render: v => v != null ? Number(v).toExponential(2) : '-' },
  { key: 'relative_velocity', label: 'Rel. Velocity', render: v => v ? `${v} km/s` : '-' },
  { key: 'status', label: 'Status', isStatus: true },
];

const fields = [
  { key: 'primary_object', label: 'Primary Object' },
  { key: 'secondary_object', label: 'Secondary Object' },
  { key: 'tca', label: 'Time of Closest Approach', type: 'datetime-local' },
  { key: 'miss_distance', label: 'Miss Distance (km)', type: 'number' },
  { key: 'probability', label: 'Collision Probability', type: 'number' },
  { key: 'relative_velocity', label: 'Relative Velocity (km/s)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'action_taken', label: 'Action Taken', fullWidth: true },
];

export default function ConjunctionEventsPage() {
  return (
    <CrudPage
      title="Conjunction Events"
      subtitle="Close approach monitoring and collision avoidance tracking"
      icon={'\u26A0\uFE0F'}
      columns={columns}
      fields={fields}
      fetchAll={api.getConjunctionEvents}
      fetchOne={api.getConjunctionEvent}
      create={api.createConjunctionEvent}
      update={api.updateConjunctionEvent}
      remove={api.deleteConjunctionEvent}
    />
  );
}
