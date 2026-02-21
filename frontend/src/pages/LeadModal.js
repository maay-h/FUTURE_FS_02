import React, { useState, useEffect } from 'react';
import { createLead, updateLead, getAllAccounts } from '../api';
import { Modal } from '../components/UI';

const STATUSES = ['New','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'];
const PRIORITIES = ['Low','Medium','High'];
const SOURCES = ['Website','LinkedIn','Referral','Cold Call','Google Ads','Trade Show','Social Media','WhatsApp','Other'];
const INDUSTRIES = ['Technology','Medical','Finance','Retail','Software','Marketing','Telecommunications','Entertainment','Services','Employment','Other'];
const CURRENCIES = ['USD','PKR','EUR','GBP'];

export default function LeadModal({ lead, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', phone_secondary: '', company: '',
    account_id: '', job_title: '', industry: '', source: '', status: 'New',
    priority: 'Medium', estimated_value: '', currency: 'PKR',
    assigned_to: '', follow_up: '', notes: '', ...lead
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllAccounts().then(r => setAccounts(r.data)).catch(() => {});
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (lead?.id) await updateLead(lead.id, form);
      else await createLead(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save lead.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={lead ? '✏️ Edit Lead' : '➕ Add Lead'} onClose={onClose} size="modal-lg">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-section-title">👤 Basic Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lead Name *</label>
              <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Customer name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Primary phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (Secondary)</label>
              <input className="form-input" value={form.phone_secondary} onChange={e => set('phone_secondary', e.target.value)} placeholder="Secondary phone" />
            </div>
          </div>

          <div className="form-section-title">🏢 Company Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name / Company</label>
              <input className="form-input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name" />
            </div>
            <div className="form-group">
              <label className="form-label">Account</label>
              <select className="form-select" value={form.account_id} onChange={e => set('account_id', e.target.value)}>
                <option value="">Search or select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.account} ({a.sector})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input className="form-input" value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="Position" />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-select" value={form.industry} onChange={e => set('industry', e.target.value)}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div className="form-section-title">🏷️ Classification</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select className="form-select" value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="">Select Source</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Value</label>
              <input className="form-input" type="number" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <select className="form-select" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">Select User</option>
                {users?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input className="form-input" type="date" value={form.follow_up?.slice(0,10) || ''} onChange={e => set('follow_up', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes about this lead..." />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Saving...' : lead ? '💾 Update Lead' : '➕ Add Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
