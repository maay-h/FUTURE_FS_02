import React, { useState, useEffect } from 'react';
import { getCalendarTasks } from '../api';
import { Loading, TaskBadge } from '../components/UI';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    setLoading(true);
    getCalendarTasks({ month: String(month + 1).padStart(2,'0'), year: String(year) })
      .then(r => setTasks(r.data))
      .finally(() => setLoading(false));
  }, [month, year]);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const tasksByDay = {};
  tasks.forEach(t => {
    if (!t.due_date) return;
    const d = new Date(t.due_date).getDate();
    if (!tasksByDay[d]) tasksByDay[d] = [];
    tasksByDay[d].push(t);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const totalActivities = tasks.length;
  const totalTaskItems = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>📅 Calendar</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>View tasks and activities on calendar</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 15, minWidth: 160, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}>›</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        {[
          { label: 'Activities', value: totalActivities, color: '#3b82f6' },
          { label: 'Tasks', value: totalTaskItems, color: '#f59e0b' },
          { label: 'Overdue', value: overdue, color: '#ef4444' },
          { label: 'Completed', value: completed, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div className="card">
          <div className="calendar-grid">
            {DAYS.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
            {cells.map((day, i) => (
              <div key={i} className={`calendar-day${!day ? ' other-month' : ''}${day && isToday(day) ? ' today' : ''}`}>
                {day && (
                  <>
                    <div className="calendar-day-num">{day}</div>
                    {(tasksByDay[day] || []).slice(0, 3).map(t => (
                      <div
                        key={t.id}
                        className={`calendar-task ${t.status === 'Overdue' ? 'overdue' : t.status === 'Completed' ? 'completed' : 'task'}`}
                        title={`${t.title} - ${t.lead_name || ''}`}
                        onClick={() => setSelectedTask(t)}
                      >
                        {t.title}
                      </div>
                    ))}
                    {(tasksByDay[day] || []).length > 3 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 4 }}>+{tasksByDay[day].length - 3} more</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Popup */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Task Details</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            <div className="modal-body">
              {[
                { label: 'TITLE', value: selectedTask.title },
                { label: 'TYPE', value: <span className="badge badge-progress">{selectedTask.type || 'Task'}</span> },
                { label: 'DATE', value: selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleString() : '—' },
                { label: 'LEAD', value: selectedTask.lead_name || '—' },
                { label: 'STATUS', value: <TaskBadge status={selectedTask.status} /> },
                { label: 'PRIORITY', value: selectedTask.priority },
                { label: 'ASSIGNED TO', value: selectedTask.assigned_name || '—' },
                { label: 'NOTES', value: selectedTask.notes || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center' }}>
                  <div style={{ width: 90, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <button className="btn btn-ghost" onClick={() => setSelectedTask(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
