import React, { useState, useEffect, useCallback } from 'react';
import { getLeads, deleteLead, getUsers } from '../api';
import { StatusBadge, PriorityBadge, Pagination, Loading, EmptyState, ConfirmDialog, formatValue, formatDate } from '../components/UI';
import LeadModal from './LeadModal';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', source: '', assigned_to: '', page: 1, limit: 10 });
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Google Ads', 'Trade Show', 'Social Media', 'WhatsApp'];

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads(filters);
      setLeads(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { getUsers().then(r => setUsers(r.data)); }, []);

  const handleDelete = async () => {
    await deleteLead(confirmDelete);
    setConfirmDelete(null);
    fetchLeads();
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>🎯 Leads</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Manage and track all your sales leads</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditLead(null); setShowModal(true); }}>
          ➕ Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search leads..." value={filters.search}
            onChange={e => setFilter('search', e.target.value)} />
        </div>
        {[
          { key: 'status', label: 'All Status', opts: ['New','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'] },
          { key: 'priority', label: 'All Priority', opts: ['Low','Medium','High'] },
          { key: 'source', label: 'All Sources', opts: SOURCES },
        ].map(f => (
          <select key={f.key} className="filter-select" value={filters[f.key]} onChange={e => setFilter(f.key, e.target.value)}>
            <option value="">{f.label}</option>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <select className="filter-select" value={filters.assigned_to} onChange={e => setFilter('assigned_to', e.target.value)}>
          <option value="">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {(filters.search || filters.status || filters.priority || filters.source || filters.assigned_to) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search: '', status: '', priority: '', source: '', assigned_to: '', page: 1, limit: 10 })}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
          Showing {leads.length} of {pagination.total || 0} entries
        </span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? <Loading /> : leads.length === 0 ? (
          <EmptyState icon="🎯" title="No leads found" subtitle="Try adjusting your filters or add a new lead." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Company</th>
                <th>Status</th><th>Source</th><th>Priority</th><th>Assigned To</th>
                <th>Value</th><th>Follow-up</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-blue)' }}>
                    {lead.id?.slice(0,8)}
                  </td>
                  <td className="td-primary">{lead.name}</td>
                  <td>{lead.email || '—'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{lead.phone || '—'}</td>
                  <td>{lead.company || '—'}</td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td>{lead.source || '—'}</td>
                  <td><PriorityBadge priority={lead.priority} /></td>
                  <td>{lead.assigned_name || '—'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                    {formatValue(lead.estimated_value, lead.currency)}
                  </td>
                  <td>{formatDate(lead.follow_up)}</td>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit"
                        onClick={() => { setEditLead(lead); setShowModal(true); }}>✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete"
                        onClick={() => setConfirmDelete(lead.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} />

      {showModal && (
        <LeadModal
          lead={editLead}
          users={users}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchLeads(); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog message="Delete this lead?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
