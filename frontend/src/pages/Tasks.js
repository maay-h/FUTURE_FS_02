import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getLeads, getUsers } from '../api';
import { Modal, TaskBadge, PriorityBadge, Loading, EmptyState, ConfirmDialog, Pagination, formatDate } from '../components/UI';

const STATUSES = ['Pending','In Progress','Completed','Overdue','Cancelled'];
const PRIORITIES = ['Low','Medium','High'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 20 });
  const [form, setForm] = useState({ lead_id: '', title: '', type: 'Task', status: 'Pending', priority: 'Medium', due_date: '', assigned_to: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTasks(filters);
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    getLeads({ limit: 100 }).then(r => setLeads(r.data.data));
    getUsers().then(r => setUsers(r.data));
  }, []);

  const openModal = (task = null) => {
    setEditTask(task);
    setForm(task ? { ...task, due_date: task.due_date?.slice(0,16) || '' } : { lead_id: '', title: '', type: 'Task', status: 'Pending', priority: 'Medium', due_date: '', assigned_to: '', notes: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editTask) await updateTask(editTask.id, form);
      else await createTask(form);
      setShowModal(false);
      fetchTasks();
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
    fetchTasks();
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>✅ Tasks</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Manage all your tasks and follow-ups</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>➕ Add Task</button>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? <Loading /> : tasks.length === 0 ? (
          <EmptyState icon="✅" title="No tasks found" subtitle="Add tasks to track your follow-ups." />
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Lead</th><th>Company</th><th>Type</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Assigned</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td className="td-primary">{t.title}</td>
                  <td>{t.lead_name || '—'}</td>
                  <td>{t.company || '—'}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{t.type || 'Task'}</span>
                  </td>
                  <td>
                    <select style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                      value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td style={{ color: t.status === 'Overdue' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{formatDate(t.due_date)}</td>
                  <td>{t.assigned_name || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(t)}>✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(t.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={pagination} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {showModal && (
        <Modal title={editTask ? '✏️ Edit Task' : '➕ Add Task'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lead</label>
                  <select className="form-select" value={form.lead_id || ''} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
                    <option value="">Select Lead (optional)</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} - {l.company}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <input className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Task, Call, Email..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date & Time</label>
                  <input className="form-input" type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned To</label>
                  <select className="form-select" value={form.assigned_to || ''} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Select User</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>✕ Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save'}</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog message="Delete this task?" onConfirm={async () => { await deleteTask(confirmDelete); setConfirmDelete(null); fetchTasks(); }} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
