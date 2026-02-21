import React from 'react';

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, size = '' }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    'New': 'badge-new', 'Contacted': 'badge-contacted', 'Qualified': 'badge-qualified',
    'Proposal Sent': 'badge-proposal', 'Negotiation': 'badge-negotiation',
    'Won': 'badge-won', 'Lost': 'badge-lost',
  };
  return <span className={`badge ${map[status] || 'badge-new'}`}>{status}</span>;
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = { 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
  return <span className={`badge ${map[priority] || 'badge-medium'}`}>{priority}</span>;
}

// ─── Task Status Badge ────────────────────────────────────────────────────────
export function TaskBadge({ status }) {
  const map = {
    'Pending': 'badge-pending', 'In Progress': 'badge-progress',
    'Completed': 'badge-completed', 'Overdue': 'badge-overdue', 'Cancelled': 'badge-cancelled'
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (i === page - 2 || i === page + 2) pages.push('...');
  }
  // Deduplicate
  const unique = pages.filter((p, i) => pages.indexOf(p) === i);

  return (
    <div className="pagination">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹</button>
      {unique.map((p, i) =>
        p === '...'
          ? <span key={`dots-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
          : <button key={p} className={p === page ? 'active' : ''} onClick={() => onPageChange(p)}>{p}</button>
      )}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Loading({ fullPage = false }) {
  if (fullPage) return <div className="loading-screen"><div className="spinner" /></div>;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <div className="spinner" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'No data found', subtitle = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{message}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>This action cannot be undone.</p>
          <div className="flex gap-2" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Format currency ──────────────────────────────────────────────────────────
export function formatValue(value, currency = 'PKR') {
  if (!value && value !== 0) return '—';
  return `${currency} ${Number(value).toLocaleString()}`;
}

// ─── Format date ──────────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
