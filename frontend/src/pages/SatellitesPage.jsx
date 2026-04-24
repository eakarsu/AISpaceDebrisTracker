import CrudPage from '../components/CrudPage';
import { api } from '../api';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'norad_id', label: 'NORAD ID' },
  { key: 'operator', label: 'Operator' },
  { key: 'mission_type', label: 'Mission' },
  { key: 'orbit_type', label: 'Orbit' },
  { key: 'altitude', label: 'Altitude', render: v => v ? `${Number(v).toLocaleString()} km` : '-' },
  { key: 'fuel_remaining', label: 'Fuel', render: v => v != null ? `${v}%` : '-' },
  { key: 'status', label: 'Status', isStatus: true },
];

const fields = [
  { key: 'name', label: 'Satellite Name' },
  { key: 'norad_id', label: 'NORAD ID' },
  { key: 'operator', label: 'Operator' },
  { key: 'mission_type', label: 'Mission Type', type: 'select', options: ['Communication', 'Navigation', 'Earth Observation', 'Science', 'Weather', 'Space Station', 'Surveillance', 'Technology'] },
  { key: 'orbit_type', label: 'Orbit Type', type: 'select', options: ['LEO', 'MEO', 'GEO', 'GTO', 'HEO', 'SSO', 'L2'] },
  { key: 'altitude', label: 'Altitude (km)', type: 'number' },
  { key: 'inclination', label: 'Inclination (deg)', type: 'number' },
  { key: 'launch_date', label: 'Launch Date', type: 'date' },
  { key: 'expected_lifetime', label: 'Expected Lifetime (years)', type: 'number' },
  { key: 'fuel_remaining', label: 'Fuel Remaining (%)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['Operational', 'Degraded', 'End of Life', 'Decommissioned'] },
];

export default function SatellitesPage() {
  return (
    <CrudPage
      title="Satellites"
      subtitle="Active satellite registry and monitoring"
      icon={'\uD83D\uDEF0\uFE0F'}
      columns={columns}
      fields={fields}
      fetchAll={api.getSatellites}
      fetchOne={api.getSatellite}
      create={api.createSatellite}
      update={api.updateSatellite}
      remove={api.deleteSatellite}
    />
  );
}
