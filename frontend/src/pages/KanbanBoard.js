import React, { useState, useEffect } from 'react';
import { getKanban, updateLead } from '../api';
import { StatusBadge, PriorityBadge, Loading, formatValue } from '../components/UI';
import LeadModal from './LeadModal';
import { getUsers } from '../api';

const COLUMNS = ['New','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'];
const COL_COLORS = {
  'New': '#3b82f6', 'Contacted': '#8b5cf6', 'Qualified': '#10b981',
  'Proposal Sent': '#f59e0b', 'Negotiation': '#ef4444', 'Won': '#10b981', 'Lost': '#64748b'
};

export default function KanbanBoard() {
  const [kanban, setKanban] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editLead, setEditLead] = useState(null);

  const fetchKanban = async () => {
    setLoading(true);
    try {
      const res = await getKanban();
      setKanban(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchKanban();
    getUsers().then(r => setUsers(r.data));
  }, []);

  const totalLeads = Object.values(kanban).reduce((sum, col) => sum + col.length, 0);
  const totalValue = Object.values(kanban).flat().reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonDeals = (kanban['Won'] || []).length;
  const activePipeline = Object.entries(kanban).filter(([k]) => !['Won','Lost'].includes(k)).reduce((s, [, v]) => s + v.length, 0);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>📋 Kanban Board</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Drag-and-drop pipeline view</p>
        </div>
        <div className="flex gap-3" style={{ fontSize: 12 }}>
          {[
            { label: 'Total Leads', value: totalLeads, color: 'var(--accent-blue)', icon: '🎯' },
            { label: 'Active Pipeline', value: activePipeline, color: 'var(--accent-orange)', icon: '⚡' },
            { label: 'Won', value: wonDeals, color: 'var(--accent-green)', icon: '🏆' },
            { label: 'Total Value', value: formatValue(totalValue, 'PKR'), color: 'var(--accent-purple)', icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="kanban-board" style={{ flex: 1 }}>
          {COLUMNS.map(col => {
            const cards = kanban[col] || [];
            return (
              <div className="kanban-column" key={col}>
                <div className="kanban-col-header">
                  <div className="kanban-col-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COL_COLORS[col], display: 'inline-block' }} />
                    <StatusBadge status={col} />
                  </div>
                  <span className="kanban-count">{cards.length}</span>
                </div>
                <div className="kanban-cards">
                  {cards.map(lead => (
                    <div className="kanban-card" key={lead.id} onClick={() => setEditLead(lead)}>
                      <div className="kanban-card-name">{lead.name}</div>
                      <div className="kanban-card-company">
                        {lead.company && <span style={{ color: 'var(--accent-blue)', fontSize: 11 }}>🏢 {lead.company}</span>}
                      </div>
                      {lead.source && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4 }}>{lead.source}</span>
                        </div>
                      )}
                      <div className="kanban-card-footer">
                        <span className="kanban-card-value">{formatValue(lead.estimated_value, lead.currency)}</span>
                        <div className="flex gap-2 items-center">
                          <PriorityBadge priority={lead.priority} />
                          <span className="kanban-agent">👤 {lead.assigned_name?.split(' ')[0] || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                      No leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editLead && (
        <LeadModal lead={editLead} users={users} onClose={() => setEditLead(null)} onSaved={() => { setEditLead(null); fetchKanban(); }} />
      )}
    </div>
  );
}
