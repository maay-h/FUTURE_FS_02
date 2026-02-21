const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { auth } = require('../middleware/auth');

// GET /api/tasks
router.get('/', auth, (req, res) => {
  const { lead_id, status, assigned_to, page = 1, limit = 20 } = req.query;
  let where = [];
  let params = [];

  if (lead_id) { where.push('t.lead_id = ?'); params.push(lead_id); }
  if (status) { where.push('t.status = ?'); params.push(status); }
  if (assigned_to) { where.push('t.assigned_to = ?'); params.push(assigned_to); }
  if (req.user.role === 'agent') { where.push('t.assigned_to = ?'); params.push(req.user.id); }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total = db.prepare(`SELECT COUNT(*) as c FROM tasks t ${whereStr}`).get(...params).c;

  const tasks = db.prepare(`
    SELECT t.*, l.name as lead_name, l.company, u.name as assigned_name
    FROM tasks t
    LEFT JOIN leads l ON t.lead_id = l.id
    LEFT JOIN users u ON t.assigned_to = u.id
    ${whereStr}
    ORDER BY t.due_date ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ data: tasks, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});

// GET /api/tasks/calendar - tasks for calendar view
router.get('/calendar', auth, (req, res) => {
  const { month, year } = req.query;
  let where = month && year
    ? `WHERE strftime('%m', t.due_date) = ? AND strftime('%Y', t.due_date) = ?`
    : '';
  let params = month && year ? [month.padStart(2,'0'), year] : [];
  if (req.user.role === 'agent') {
    where += where ? ` AND t.assigned_to = ?` : `WHERE t.assigned_to = ?`;
    params.push(req.user.id);
  }

  const tasks = db.prepare(`
    SELECT t.*, l.name as lead_name, u.name as assigned_name
    FROM tasks t
    LEFT JOIN leads l ON t.lead_id = l.id
    LEFT JOIN users u ON t.assigned_to = u.id
    ${where}
    ORDER BY t.due_date ASC
  `).all(...params);

  res.json(tasks);
});

// POST /api/tasks
router.post('/', auth, (req, res) => {
  const { lead_id, title, type, status, priority, due_date, assigned_to, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required.' });
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO tasks (id,lead_id,title,type,status,priority,due_date,assigned_to,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, lead_id||null, title, type||'Task', status||'Pending', priority||'Medium',
         due_date||null, assigned_to||req.user.id, notes||null, now, now);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const fields = ['title','type','status','priority','due_date','assigned_to','notes'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted.' });
});

module.exports = router;
