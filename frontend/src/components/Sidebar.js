import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'MAIN', items: [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/leads', icon: '🎯', label: 'Leads' },
    { to: '/kanban', icon: '📋', label: 'Kanban Board' },
    { to: '/activities', icon: '⚡', label: 'Activities' },
    { to: '/tasks', icon: '✅', label: 'Tasks' },
    { to: '/calendar', icon: '📅', label: 'Calendar' },
  ]},
  { section: 'MANAGEMENT', items: [
    { to: '/users', icon: '👥', label: 'Users Management', roles: ['admin'] },
    { to: '/customers', icon: '🏢', label: 'Customers' },
    { to: '/lead-sources', icon: '📡', label: 'Lead Sources' },
    { to: '/email-templates', icon: '📧', label: 'Email Templates' },
    { to: '/email-triggers', icon: '⚡', label: 'Email Triggers' },
  ]},
  { section: 'SETTINGS', items: [
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ]},
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logoutUser(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">R</div>
        <div>
          <div className="logo-text">RAMEEZ CRM</div>
          <div className="logo-sub">Custom Automation</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>

      {NAV.map(({ section, items }) => (
        <div className="sidebar-section" key={section}>
          <div className="sidebar-section-label">{section}</div>
          <ul className="sidebar-nav">
            {items.filter(item => !item.roles || item.roles.includes(user?.role)).map(item => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost w-full" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
