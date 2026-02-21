import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser, registerUser, getEmailTemplates, createEmailTemplate, deleteEmailTemplate, getEmailTriggers, createEmailTrigger } from '../api';
import { Modal, Loading, EmptyState, ConfirmDialog } from '../components/UI';

// ─── Users Management ─────────────────────────────────────────────────────────
export function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => { setLoading(true); const r = await getUsers(); setUsers(r.data); setLoading(false); };
  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await registerUser(form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'agent' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally { setSaving(false); }
  };

  const ROLE_COLORS = { admin: '#ef4444', manager: '#f59e0b', agent: '#10b981' };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>👥 Users Management</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Manage CRM users and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add User</button>
      </div>

      <div className="table-wrapper">
        {loading ? <Loading /> : users.length === 0 ? <EmptyState icon="👥" title="No users found" /> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="td-primary">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {u.name?.slice(0,2).toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{ background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role] }}>{u.role}</span>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(u.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="➕ Add User" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="User's name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : '💾 Create User'}</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog message="Delete this user?" onConfirm={async () => { await deleteUser(confirmDelete); setConfirmDelete(null); fetchUsers(); }} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

// ─── Email Templates ──────────────────────────────────────────────────────────
export function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => { const r = await getEmailTemplates(); setTemplates(r.data); };
  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createEmailTemplate(form); setShowModal(false); setForm({ name:'',subject:'',body:'' }); fetch(); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>📧 Email Templates</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Create reusable email templates</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Template</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} className="card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{t.subject}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(t.id)}>🗑️</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: 6, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>{t.body}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</div>
          </div>
        ))}
        {templates.length === 0 && <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>📧 No templates yet. Create one!</div>}
      </div>

      {showModal && (
        <Modal title="📧 Create Email Template" onClose={() => setShowModal(false)} size="modal-lg">
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Template Name *</label><input className="form-input" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Welcome Email" /></div>
              <div className="form-group"><label className="form-label">Subject *</label><input className="form-input" required value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="Email subject line" /></div>
              <div className="form-group">
                <label className="form-label">Body * <span style={{color:'var(--text-muted)',fontWeight:400,textTransform:'none'}}>— Use {'{{name}}'}, {'{{company}}'}, {'{{agent}}'} as variables</span></label>
                <textarea className="form-textarea" required style={{ minHeight: 160 }} value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} placeholder="Dear {{name}},&#10;&#10;Thank you for reaching out..." />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : '💾 Save Template'}</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog message="Delete this template?" onConfirm={async () => { await deleteEmailTemplate(confirmDelete); setConfirmDelete(null); fetch(); }} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}

// ─── Email Triggers ───────────────────────────────────────────────────────────
export function EmailTriggers() {
  const [triggers, setTriggers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', trigger_on: '', template_id: '', is_active: 1 });
  const [saving, setSaving] = useState(false);

  const TRIGGER_EVENTS = ['Lead Created','Lead Status Changed','Lead Won','Lead Lost','Task Due','Payment Received'];

  const fetch = async () => {
    const [t, tmpl] = await Promise.all([getEmailTriggers(), getEmailTemplates()]);
    setTriggers(t.data); setTemplates(tmpl.data);
  };
  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createEmailTrigger(form); setShowModal(false); setForm({ name:'', trigger_on:'', template_id:'', is_active:1 }); fetch(); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>⚡ Email Triggers</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Automate emails based on CRM events</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Trigger</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Trigger On</th><th>Template</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {triggers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⚡ No triggers configured yet</td></tr>
            ) : triggers.map(t => (
              <tr key={t.id}>
                <td className="td-primary">{t.name}</td>
                <td><span className="badge badge-progress">{t.trigger_on}</span></td>
                <td>{t.template_name || '—'}</td>
                <td><span className={`badge ${t.is_active ? 'badge-completed' : 'badge-cancelled'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="⚡ Add Email Trigger" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Trigger Name *</label><input className="form-input" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Welcome New Lead" /></div>
              <div className="form-group">
                <label className="form-label">Trigger On *</label>
                <select className="form-select" required value={form.trigger_on} onChange={e => setForm(f => ({...f, trigger_on: e.target.value}))}>
                  <option value="">Select Event</option>
                  {TRIGGER_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email Template</label>
                <select className="form-select" value={form.template_id} onChange={e => setForm(f => ({...f, template_id: e.target.value}))}>
                  <option value="">Select Template (optional)</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.is_active} onChange={e => setForm(f => ({...f, is_active: Number(e.target.value)}))}>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : '💾 Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Lead Sources ─────────────────────────────────────────────────────────────
export function LeadSources() {
  const SOURCES = [
    { id: 'SRC001', name: 'Website', description: 'Leads from company website contact form', type: 'Online', category: 'Search Engine', cost: 60, status: 'Active' },
    { id: 'SRC002', name: 'LinkedIn', description: 'Leads generated through LinkedIn outreach', type: 'Online', category: 'Social Media', cost: 150, status: 'Active' },
    { id: 'SRC003', name: 'Referral', description: 'Word of mouth and client referrals', type: 'Direct', category: 'Partner', cost: null, status: 'Active' },
    { id: 'SRC004', name: 'Cold Call', description: 'Outbound cold calling campaigns', type: 'Direct', category: 'Other', cost: 75, status: 'Active' },
    { id: 'SRC005', name: 'Email Campaign', description: 'Email marketing and newsletters', type: 'Online', category: 'Email Campaign', cost: 25, status: 'Active' },
    { id: 'SRC006', name: 'Social Media', description: 'Facebook, Instagram, Twitter leads', type: 'Online', category: 'Social Media', cost: 100, status: 'Active' },
    { id: 'SRC007', name: 'Trade Show', description: 'Industry events and trade shows', type: 'Offline', category: 'Event', cost: 500, status: 'Active' },
    { id: 'SRC008', name: 'Google Ads', description: 'Google PPC advertising campaigns', type: 'Paid', category: 'Search Engine', cost: 200, status: 'Active' },
    { id: 'SRC009', name: 'WhatsApp', description: 'WhatsApp Business inquiries', type: 'Online', category: 'Social Media', cost: 30, status: 'Active' },
    { id: 'SRC010', name: 'Walk-In', description: 'In-person office visits', type: 'Offline', category: 'Other', cost: null, status: 'Active' },
  ];

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>📡 Lead Sources</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Track where your leads come from</p>
        </div>
        <button className="btn btn-primary">➕ Add Source</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Source Name</th><th>Description</th><th>Type</th><th>Category</th><th>Cost/Lead</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {SOURCES.map(s => (
              <tr key={s.id}>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-blue)' }}>{s.id}</td>
                <td className="td-primary">{s.name}</td>
                <td style={{ maxWidth: 200 }} className="truncate">{s.description}</td>
                <td><span className="badge badge-progress">{s.type}</span></td>
                <td>{s.category}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.cost ? `$${s.cost}` : '—'}</td>
                <td><span className="badge badge-completed">{s.status}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-icon btn-sm">✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function Settings() {
  return (
    <div className="page-content">
      <div className="mb-6">
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>⚙️ Settings</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Configure your CRM system</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 900 }}>
        {[
          { icon: '🏢', title: 'Company Profile', desc: 'Update company name, logo and contact details' },
          { icon: '🔐', title: 'Security', desc: 'Change password and manage 2FA settings' },
          { icon: '📧', title: 'Email Settings', desc: 'Configure SMTP server for sending emails' },
          { icon: '🌐', title: 'Integrations', desc: 'Connect to WhatsApp, Google, and more' },
          { icon: '📊', title: 'Reports', desc: 'Configure automated reports and exports' },
          { icon: '🎨', title: 'Appearance', desc: 'Customize themes and display preferences' },
          { icon: '🔔', title: 'Notifications', desc: 'Manage email and in-app notifications' },
          { icon: '💾', title: 'Data & Backup', desc: 'Export data and manage backups' },
        ].map(s => (
          <div key={s.title} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'var(--transition)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div className="flex items-center gap-3">
              <div style={{ fontSize: 24, width: 44, height: 44, background: 'rgba(59,130,246,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
