import CrudPage from '../components/CrudPage';
import { api } from '../api';

const columns = [
  { key: 'mission_name', label: 'Mission' },
  { key: 'launch_site', label: 'Launch Site' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'target_orbit', label: 'Target Orbit' },
  { key: 'window_start', label: 'Window Start', render: v => v ? new Date(v).toLocaleString() : '-' },
  { key: 'debris_clearance', label: 'Debris Clear.', isStatus: true },
  { key: 'status', label: 'Status', isStatus: true },
];

const fields = [
  { key: 'mission_name', label: 'Mission Name' },
  { key: 'launch_site', label: 'Launch Site' },
  { key: 'target_orbit', label: 'Target Orbit' },
  { key: 'window_start', label: 'Window Start', type: 'datetime-local' },
  { key: 'window_end', label: 'Window End', type: 'datetime-local' },
  { key: 'vehicle', label: 'Launch Vehicle' },
  { key: 'payload_mass', label: 'Payload Mass (kg)', type: 'number' },
  { key: 'weather_status', label: 'Weather Status', type: 'select', options: ['Clear', 'Pending', 'Adverse', 'Unknown'] },
  { key: 'debris_clearance', label: 'Debris Clearance', type: 'select', options: ['Approved', 'Under Review', 'Pending', 'Denied'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Scheduled', 'Planning', 'Cancelled', 'Completed'] },
];

export default function LaunchWindowsPage() {
  return (
    <CrudPage
      title="Launch Windows"
      subtitle="Launch scheduling with debris clearance and weather tracking"
      icon={'\uD83D\uDE80'}
      columns={columns}
      fields={fields}
      fetchAll={api.getLaunchWindows}
      fetchOne={api.getLaunchWindow}
      create={api.createLaunchWindow}
      update={api.updateLaunchWindow}
      remove={api.deleteLaunchWindow}
    />
  );
}
