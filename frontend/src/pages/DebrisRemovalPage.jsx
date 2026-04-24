import CrudPage from '../components/CrudPage';
import { api } from '../api';

const columns = [
  { key: 'mission_name', label: 'Mission' },
  { key: 'target_object', label: 'Target' },
  { key: 'method', label: 'Method' },
  { key: 'agency', label: 'Agency' },
  { key: 'estimated_cost', label: 'Est. Cost', render: v => v ? `$${(Number(v)/1e6).toFixed(0)}M` : '-' },
  { key: 'success_probability', label: 'Success Prob.', render: v => v != null ? `${(Number(v)*100).toFixed(0)}%` : '-' },
  { key: 'status', label: 'Status', isStatus: true },
];

const fields = [
  { key: 'mission_name', label: 'Mission Name' },
  { key: 'target_object', label: 'Target Object' },
  { key: 'method', label: 'Removal Method', type: 'select', options: ['Capture & Deorbit', 'Magnetic Capture', 'Robotic Arm', 'Net Capture', 'Laser Ablation', 'Ion Beam Shepherd', 'Harpoon Capture', 'Tethered Deorbit', 'Robotic Grapple', 'Electromagnetic Tether', 'Foam Deorbit', 'Tentacle Capture', 'Net & Drag Sail', 'GEO Servicing', 'Multi-Target ADR'] },
  { key: 'estimated_cost', label: 'Estimated Cost ($)', type: 'number' },
  { key: 'launch_date', label: 'Launch Date', type: 'date' },
  { key: 'duration_days', label: 'Duration (days)', type: 'number' },
  { key: 'success_probability', label: 'Success Probability (0-1)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['Concept', 'Research', 'Planning', 'In Development', 'Scheduled', 'Active', 'Completed', 'Failed'] },
  { key: 'agency', label: 'Agency/Organization' },
];

export default function DebrisRemovalPage() {
  return (
    <CrudPage
      title="Debris Removal Missions"
      subtitle="Active debris removal mission planning and tracking"
      icon={'\uD83E\uDDF9'}
      columns={columns}
      fields={fields}
      fetchAll={api.getDebrisRemovalMissions}
      fetchOne={api.getDebrisRemovalMission}
      create={api.createDebrisRemovalMission}
      update={api.updateDebrisRemovalMission}
      remove={api.deleteDebrisRemovalMission}
    />
  );
}
