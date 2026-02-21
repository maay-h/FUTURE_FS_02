import React, { useState, useEffect } from 'react';
import { getLeadStats, getTasks } from '../api';
import { Loading, formatValue } from '../components/UI';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
const STATUS_COLORS = { 'New':'#3b82f6','Contacted':'#8b5cf6','Qualified':'#10b981','Proposal Sent':'#f59e0b','Negotiation':'#ef4444','Won':'#10b981','Lost':'#64748b' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--navy-800)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLeadStats(),
      getTasks({ limit: 5, status: 'Pending' }),
    ]).then(([statsRes, tasksRes]) => {
      setStats(statsRes.data);
      setTasks(tasksRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const pipelineData = stats?.byStatus?.map(s => ({ name: s.status, value: s.count })) || [];
  const trendData = stats?.trend?.map(t => ({ month: t.month, leads: t.count })) || [];
  const activityData = stats?.activityDist?.map(a => ({ name: a.type, value: a.count })) || [];

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Welcome back! Here's your CRM overview.</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Leads', value: stats?.totalLeads || 0, sub: '1 new in pipeline', color: 'blue', icon: '🎯' },
          { label: 'Won Deals', value: stats?.wonDeals || 0, sub: `${stats?.winRate || 0}% win rate`, color: 'green', icon: '🏆' },
          { label: 'Pipeline Value', value: formatValue(stats?.pipelineValue, 'PKR'), sub: 'Active deals value', color: 'orange', icon: '💰' },
          { label: 'Active Tasks', value: stats?.activeTasks || 0, sub: `${stats?.overdueTasks || 0} overdue`, color: 'purple', icon: '✅' },
        ].map(s => (
          <div className={`stat-card ${s.color}`} key={s.label}>
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid mb-4">
        {/* Lead Pipeline */}
        <div className="card">
          <div className="card-header"><h3>📊 Lead Pipeline</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipelineData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {pipelineData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Distribution */}
        <div className="card">
          <div className="card-header"><h3>⚡ Activity Distribution</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={activityData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {activityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid mb-6">
        {/* Leads Trend */}
        <div className="card">
          <div className="card-header"><h3>📈 Leads Trend</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Forecast */}
        <div className="card">
          <div className="card-header"><h3>📉 Sales Forecast</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Weighted Forecast', value: formatValue(stats?.weightedForecast, 'PKR'), icon: '🎯', color: 'var(--accent-purple)' },
                { label: 'Total Pipeline', value: formatValue(stats?.pipelineValue, 'PKR'), icon: '💼', color: 'var(--accent-blue)' },
                { label: 'Win Rate', value: `${stats?.winRate || 0}%`, icon: '🏆', color: 'var(--accent-green)' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Task Status Overview */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 8 }}>Task Status Overview</div>
            {[
              { label: 'Pending', pct: 85, color: '#f59e0b' },
              { label: 'In Progress', pct: 55, color: '#3b82f6' },
              { label: 'Completed', pct: 40, color: '#10b981' },
              { label: 'Overdue', pct: 25, color: '#ef4444' },
            ].map(b => (
              <div key={b.label} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 70, fontSize: 11, color: 'var(--text-muted)' }}>{b.label}</div>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{ width: `${b.pct}%`, height: '100%', background: b.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="charts-grid">
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Upcoming Tasks</h3>
            <a href="/tasks" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none' }}>View all →</a>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {tasks.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No upcoming tasks</div>
            ) : tasks.map((t, i) => (
              <div key={t.id} style={{ padding: '11px 16px', borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.lead_name} • {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</div>
                </div>
                <span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Distribution */}
        <div className="card">
          <div className="card-header"><h3>📡 Lead Sources</h3></div>
          <div className="card-body">
            {(stats?.bySource || []).map((s, i) => (
              <div key={s.source} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.source || 'Unknown'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{ width: `${(s.count / (stats?.totalLeads || 1)) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
