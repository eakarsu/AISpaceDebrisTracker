import CrudPage from '../components/CrudPage';
import { api } from '../api';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'norad_id', label: 'NORAD ID' },
  { key: 'object_type', label: 'Type' },
  { key: 'orbit_type', label: 'Orbit' },
  { key: 'apogee', label: 'Apogee (km)', render: v => v ? `${Number(v).toLocaleString()} km` : '-' },
  { key: 'perigee', label: 'Perigee (km)', render: v => v ? `${Number(v).toLocaleString()} km` : '-' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status', isStatus: true },
];

const fields = [
  { key: 'name', label: 'Object Name' },
  { key: 'norad_id', label: 'NORAD ID' },
  { key: 'object_type', label: 'Object Type', type: 'select', options: ['Debris', 'Rocket Body', 'Payload', 'Unknown'] },
  { key: 'orbit_type', label: 'Orbit Type', type: 'select', options: ['LEO', 'MEO', 'GEO', 'GTO', 'HEO', 'SSO'] },
  { key: 'inclination', label: 'Inclination (deg)', type: 'number' },
  { key: 'apogee', label: 'Apogee (km)', type: 'number' },
  { key: 'perigee', label: 'Perigee (km)', type: 'number' },
  { key: 'period', label: 'Period (min)', type: 'number' },
  { key: 'launch_date', label: 'Launch Date', type: 'date' },
  { key: 'country', label: 'Country' },
  { key: 'rcs', label: 'RCS (m2)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active Tracking', 'Stable', 'Decaying', 'Reentered', 'Unknown'] },
];

export default function SpaceObjectsPage() {
  return (
    <CrudPage
      title="Space Objects"
      subtitle="Tracked orbital debris and space objects catalog"
      icon={'\uD83C\uDF11'}
      columns={columns}
      fields={fields}
      fetchAll={api.getSpaceObjects}
      fetchOne={api.getSpaceObject}
      create={api.createSpaceObject}
      update={api.updateSpaceObject}
      remove={api.deleteSpaceObject}
    />
  );
}
