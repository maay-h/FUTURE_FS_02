import React, { useState, useEffect, useCallback } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api';
import { Modal, Loading, EmptyState, ConfirmDialog, Pagination } from '../components/UI';

export default function Customers() {
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({ search: '', sector: '', page: 1, limit: 10 });
  const [form, setForm] = useState({ account: '', sector: '', year_established: '', revenue: '', employees: '', office_location: '', subsidiary_of: '' });
  const [saving, setSaving] = useState(false);

  const SECTORS = ['technolgy','medical','retail','software','marketing','finance','telecommunications','entertainment','services','employment'];

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccounts(filters);
      setAccounts(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const openModal = (account = null) => {
    setEditAccount(account);
    setForm(account ? { ...account } : { account: '', sector: '', year_established: '', revenue: '', employees: '', office_location: '', subsidiary_of: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editAccount) await updateAccount(editAccount.id, form);
      else await createAccount(form);
      setShowModal(false); fetchAccounts();
    } finally { setSaving(false); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>🏢 Customers / Accounts</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Manage company accounts from CSV data</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>➕ Add Account</button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search accounts..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        </div>
        <select className="filter-select" value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value, page: 1 }))}>
          <option value="">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? <Loading /> : accounts.length === 0 ? (
          <EmptyState icon="🏢" title="No accounts found" />
        ) : (
          <table>
            <thead>
              <tr><th>Account</th><th>Sector</th><th>Est. Year</th><th>Revenue (M)</th><th>Employees</th><th>Location</th><th>Parent</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td className="td-primary">{a.account}</td>
                  <td><span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{a.sector}</span></td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{a.year_established || '—'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                    {a.revenue ? `$${Number(a.revenue).toFixed(1)}M` : '—'}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{a.employees?.toLocaleString() || '—'}</td>
                  <td>{a.office_location || '—'}</td>
                  <td>{a.subsidiary_of || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(a)}>✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(a.id)}>🗑️</button>
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
        <Modal title={editAccount ? '✏️ Edit Account' : '➕ Add Account'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account Name *</label>
                  <input className="form-input" required value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} placeholder="Company name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sector</label>
                  <select className="form-select" value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                    <option value="">Select Sector</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year Established</label>
                  <input className="form-input" type="number" value={form.year_established} onChange={e => setForm(f => ({ ...f, year_established: e.target.value }))} placeholder="1990" />
                </div>
                <div className="form-group">
                  <label className="form-label">Revenue (Millions)</label>
                  <input className="form-input" type="number" step="0.01" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Employees</label>
                  <input className="form-input" type="number" value={form.employees} onChange={e => setForm(f => ({ ...f, employees: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Office Location</label>
                  <input className="form-input" value={form.office_location} onChange={e => setForm(f => ({ ...f, office_location: e.target.value }))} placeholder="Country" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Subsidiary Of</label>
                  <input className="form-input" value={form.subsidiary_of} onChange={e => setForm(f => ({ ...f, subsidiary_of: e.target.value }))} placeholder="Parent company name" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : '💾 Save'}</button>
            </div>
          </form>
        </Modal>
      )}
      {confirmDelete && (
        <ConfirmDialog message="Delete this account?" onConfirm={async () => { await deleteAccount(confirmDelete); setConfirmDelete(null); fetchAccounts(); }} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
