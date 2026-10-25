import { useEffect, useState } from 'react';
import api, { errMsg, money } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const EMPTY = { number: '', type: 'Single', floor: 1, price: '', capacity: 2, amenities: '', description: '', image: '', status: 'available' };

export default function AdminRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [edit, setEdit] = useState(null); // null | room form object
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/rooms/manage/all').then((r) => setRooms(r.data.rooms)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const open = (room) =>
    setEdit(room ? { ...room, amenities: (room.amenities || []).join(', ') } : { ...EMPTY });
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const body = { ...edit, price: Number(edit.price), capacity: Number(edit.capacity), floor: Number(edit.floor) };
      if (edit._id) await api.put(`/rooms/${edit._id}`, body);
      else await api.post('/rooms', body);
      setEdit(null);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r) => {
    if (!confirm(`Delete room ${r.number}?`)) return;
    try { await api.delete(`/rooms/${r._id}`); load(); } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Rooms</h3>
        <button className="btn btn-primary" onClick={() => open(null)}><i className="bi bi-plus-lg me-1" />Add room</button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th>No.</th><th>Type</th><th>Floor</th><th>Capacity</th><th>Price / night</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r._id}>
                <td className="fw-semibold">{r.number}</td><td>{r.type}</td><td>{r.floor}</td><td>{r.capacity}</td>
                <td>{money(r.price)}</td><td><StatusBadge value={r.status} /></td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => open(r)}><i className="bi bi-pencil" /></button>
                  {user.role === 'admin' && <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r)}><i className="bi bi-trash" /></button>}
                </td>
              </tr>
            ))}
            {rooms.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No rooms yet</td></tr>}
          </tbody>
        </table>
      </div></div>

      {edit && (
        <Modal title={edit._id ? `Edit room ${edit.number}` : 'Add room'} onClose={() => setEdit(null)} size="modal-lg">
          <form onSubmit={save} id="room-form">
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <div className="row g-3">
              <div className="col-md-3"><label className="form-label">Room no.</label><input className="form-control" value={edit.number} onChange={set('number')} required /></div>
              <div className="col-md-3"><label className="form-label">Type</label>
                <select className="form-select" value={edit.type} onChange={set('type')}>{['Single', 'Double', 'Deluxe', 'Suite'].map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="col-md-2"><label className="form-label">Floor</label><input type="number" min="0" className="form-control" value={edit.floor} onChange={set('floor')} /></div>
              <div className="col-md-2"><label className="form-label">Capacity</label><input type="number" min="1" max="10" className="form-control" value={edit.capacity} onChange={set('capacity')} required /></div>
              <div className="col-md-2"><label className="form-label">Price (₹)</label><input type="number" min="0" className="form-control" value={edit.price} onChange={set('price')} required /></div>
              <div className="col-md-8"><label className="form-label">Amenities (comma separated)</label><input className="form-control" value={edit.amenities} onChange={set('amenities')} /></div>
              <div className="col-md-4"><label className="form-label">Status</label>
                <select className="form-select" value={edit.status} onChange={set('status')}><option value="available">Available</option><option value="maintenance">Maintenance</option></select></div>
              <div className="col-12"><label className="form-label">Image URL</label><input className="form-control" value={edit.image || ''} onChange={set('image')} /></div>
              <div className="col-12"><label className="form-label">Description</label><textarea rows="3" className="form-control" value={edit.description || ''} onChange={set('description')} /></div>
            </div>
            <div className="text-end mt-3">
              <button type="button" className="btn btn-light me-2" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save room'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
