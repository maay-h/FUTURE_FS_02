import React, { useState, useEffect, useCallback } from 'react';
import { getActivities, createActivity, deleteActivity, getLeads } from '../api';
import { Modal, Loading, EmptyState, ConfirmDialog, Pagination, formatDate } from '../components/UI';

const TYPES = ['Call','Email','Meeting','Note','Video Call','Other'];
const OUTCOMES = ['Positive','Neutral','Interested','Not Interested'];

const TYPE_COLORS = { 'Call':'#3b82f6','Email':'#10b981','Meeting':'#f59e0b','Note':'#8b5cf6','Video Call':'#06b6d4','Other':'#64748b' };
const OUTCOME_COLORS = { 'Positive':'badge-completed','Neutral':'badge-pending','Interested':'badge-progress','Not Interested':'badge-cancelled' };

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({ type: '', page: 1, limit: 20 });
  const [form, setForm] = useState({ lead_id: '', type: 'Call', subject: '', description: '', outcome: '', next_action: '', duration: '', participants: '', attachment_url: '' });
  const [saving, setSaving] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActivities(filters);
      setActivities(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  useEffect(() => {
    getLeads({ limit: 100 }).then(r => setLeads(r.data.data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createActivity(form);
      setShowModal(false);
      setForm({ lead_id: '', type: 'Call', subject: '', description: '', outcome: '', next_action: '', duration: '', participants: '', attachment_url: '' });
      fetchActivities();
    } finally { setSaving(false); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>⚡ Activities</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Track all interactions with leads</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Activity</button>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? <Loading /> : activities.length === 0 ? (
          <EmptyState icon="⚡" title="No activities yet" subtitle="Start tracking your lead interactions." />
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Lead</th><th>Type</th><th>Subject</th><th>Outcome</th><th>Duration</th><th>Performed By</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {activities.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-blue)' }}>{a.id?.slice(0,8)}</td>
                  <td className="td-primary">{a.lead_name || '—'}</td>
                  <td>
                    <span className="badge" style={{ background: `${TYPE_COLORS[a.type]}22`, color: TYPE_COLORS[a.type] }}>{a.type}</span>
                  </td>
                  <td className="td-primary">{a.subject}</td>
                  <td>
                    {a.outcome ? <span className={`badge ${OUTCOME_COLORS[a.outcome]}`}>{a.outcome}</span> : '—'}
                  </td>
                  <td>{a.duration ? `${a.duration} min` : '—'}</td>
                  <td>{a.performed_by_name || '—'}</td>
                  <td>{formatDate(a.date)}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(a.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={pagination} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {showModal && (
        <Modal title="➕ Add Activity" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lead *</label>
                  <select className="form-select" required value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
                    <option value="">Select Lead</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} - {l.company}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Activity Type *</label>
                  <select className="form-select" required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input className="form-input" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Activity subject" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Description & Outcome</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Outcome</label>
                  <select className="form-select" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}>
                    <option value="">Select Outcome</option>
                    {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Next Action</label>
                  <input className="form-input" value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder="Follow-up action" />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input className="form-input" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="Duration" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Participants</label>
                  <input className="form-input" value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} placeholder="Comma separated names" />
                </div>
                <div className="form-group">
                  <label className="form-label">Attachment URL</label>
                  <input className="form-input" value={form.attachment_url} onChange={e => setForm(f => ({ ...f, attachment_url: e.target.value }))} placeholder="https://" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>✕ Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save'}</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog message="Delete this activity?" onConfirm={async () => { await deleteActivity(confirmDelete); setConfirmDelete(null); fetchActivities(); }} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
