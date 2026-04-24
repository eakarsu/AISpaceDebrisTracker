import { useState, useEffect } from 'react';

function getStatusClass(status) {
  if (!status) return '';
  const s = status.toLowerCase().replace(/\s+/g, '-');
  if (['operational','active','approved','confirmed','active-tracking'].includes(s)) return 'status-operational';
  if (['critical','emergency'].includes(s)) return 'status-critical';
  if (['high','danger'].includes(s)) return 'status-danger';
  if (['medium','under-review','in-development'].includes(s)) return 'status-medium';
  if (['warning','decaying'].includes(s)) return 'status-warning';
  return 'status-low';
}

export default function CrudPage({ title, subtitle, icon, columns, fields, fetchAll, fetchOne, create, update, remove, formatRow }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAll();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = async (item) => {
    try {
      const detail = await fetchOne(item.id);
      setSelected(detail);
      setShowDetail(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNew = () => {
    setFormData({});
    setEditing(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    setFormData({ ...selected });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await remove(selected.id);
      setShowDetail(false);
      setSelected(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await update(formData.id, formData);
      } else {
        await create(formData);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{icon} {title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New {title.replace(/s$/, '').replace(/ies$/, 'y')}</button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 16 }}>{error} <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>x</button></div>}

      {loading ? (
        <div className="ai-loading"><div className="spinner"></div><p>Loading data...</p></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No items found</td></tr>
              ) : items.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {columns.map(c => (
                    <td key={c.key}>
                      {c.render ? c.render(item[c.key], item) : (
                        c.isStatus ? <span className={`status ${getStatusClass(item[c.key])}`}>{item[c.key]}</span> : (item[c.key] ?? '-')
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selected && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{icon} Detail View</h2>
              <button className="modal-close" onClick={() => setShowDetail(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {fields.map(f => (
                  <div key={f.key} className="detail-item">
                    <div className="detail-label">{f.label}</div>
                    <div className="detail-value">
                      {f.isStatus ? <span className={`status ${getStatusClass(selected[f.key])}`}>{selected[f.key] || '-'}</span> : (
                        f.format ? f.format(selected[f.key]) : (selected[f.key] ?? '-')
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit' : 'New'} {title.replace(/s$/, '').replace(/ies$/, 'y')}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {fields.filter(f => f.key !== 'id' && f.key !== 'created_at').map(f => (
                    <div key={f.key} className={`form-group ${f.fullWidth ? 'full-width' : ''}`}>
                      <label>{f.label}</label>
                      {f.type === 'select' ? (
                        <select value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value)}>
                          <option value="">Select...</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={f.type || 'text'}
                          value={formData[f.key] || ''}
                          onChange={e => handleChange(f.key, e.target.value)}
                          placeholder={f.placeholder || f.label}
                          step={f.type === 'number' ? 'any' : undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
