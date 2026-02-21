const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { auth } = require('../middleware/auth');

// GET /api/leads - list with filters, search, pagination
router.get('/', auth, (req, res) => {
  const {
    page = 1, limit = 10, search = '',
    status, priority, source, assigned_to,
    date_from, date_to, sort = 'created_at', order = 'DESC'
  } = req.query;

  const allowedSorts = ['created_at', 'updated_at', 'name', 'estimated_value', 'status', 'priority'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let where = [];
  let params = [];

  if (search) {
    where.push(`(l.name LIKE ? OR l.email LIKE ? OR l.company LIKE ? OR l.phone LIKE ?)`);
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (status) { where.push(`l.status = ?`); params.push(status); }
  if (priority) { where.push(`l.priority = ?`); params.push(priority); }
  if (source) { where.push(`l.source = ?`); params.push(source); }
  if (assigned_to) { where.push(`l.assigned_to = ?`); params.push(assigned_to); }
  if (date_from) { where.push(`DATE(l.created_at) >= ?`); params.push(date_from); }
  if (date_to) { where.push(`DATE(l.created_at) <= ?`); params.push(date_to); }

  // Role-based: agents only see their own leads
  if (req.user.role === 'agent') {
    where.push(`l.assigned_to = ?`);
    params.push(req.user.id);
  }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM leads l ${whereStr}`).get(...params);
  const total = countRow.total;

  const leads = db.prepare(`
    SELECT l.*, u.name as assigned_name, u.role as assigned_role
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    ${whereStr}
    ORDER BY l.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    data: leads,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

// GET /api/leads/kanban - grouped by status
router.get('/kanban', auth, (req, res) => {
  let where = req.user.role === 'agent' ? `WHERE l.assigned_to = '${req.user.id}'` : '';
  const leads = db.prepare(`
    SELECT l.*, u.name as assigned_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    ${where}
    ORDER BY l.updated_at DESC
  `).all();

  const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  const kanban = {};
  statuses.forEach(s => { kanban[s] = []; });
  leads.forEach(l => {
    if (kanban[l.status]) kanban[l.status].push(l);
  });

  res.json(kanban);
});

// GET /api/leads/stats - dashboard stats
router.get('/stats', auth, (req, res) => {
  let userFilter = req.user.role === 'agent' ? `AND assigned_to = '${req.user.id}'` : '';

  const totalLeads = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE 1=1 ${userFilter}`).get().c;
  const activePipeline = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE status NOT IN ('Won','Lost') ${userFilter}`).get().c;
  const wonDeals = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE status = 'Won' ${userFilter}`).get().c;
  const totalValue = db.prepare(`SELECT COALESCE(SUM(estimated_value),0) as v FROM leads WHERE 1=1 ${userFilter}`).get().v;
  const activeTasks = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE status IN ('Pending','In Progress','Overdue') ${userFilter}`).get().c;
  const overdueTasks = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE status = 'Overdue' ${userFilter}`).get().c;

  // Pipeline value
  const pipelineValue = db.prepare(`SELECT COALESCE(SUM(estimated_value),0) as v FROM leads WHERE status NOT IN ('Won','Lost') ${userFilter}`).get().v;

  // Weighted forecast
  const weights = { 'New': 0.1, 'Contacted': 0.2, 'Qualified': 0.4, 'Proposal Sent': 0.6, 'Negotiation': 0.8, 'Won': 1.0 };
  const allActive = db.prepare(`SELECT status, estimated_value FROM leads WHERE status != 'Lost' ${userFilter}`).all();
  const weightedForecast = allActive.reduce((sum, l) => sum + (l.estimated_value * (weights[l.status] || 0)), 0);

  // Status distribution
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM leads WHERE 1=1 ${userFilter} GROUP BY status`).all();

  // Source distribution
  const bySource = db.prepare(`SELECT source, COUNT(*) as count FROM leads WHERE 1=1 ${userFilter} GROUP BY source ORDER BY count DESC LIMIT 6`).all();

  // Monthly trend (last 6 months)
  const trend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM leads WHERE 1=1 ${userFilter}
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all().reverse();

  // Activity distribution
  const activityDist = db.prepare(`SELECT type, COUNT(*) as count FROM activities GROUP BY type`).all();

  res.json({
    totalLeads, activePipeline, wonDeals, totalValue,
    activeTasks, overdueTasks, pipelineValue,
    weightedForecast: Math.round(weightedForecast),
    winRate: totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0,
    byStatus, bySource, trend, activityDist
  });
});

// GET /api/leads/:id
router.get('/:id', auth, (req, res) => {
  const lead = db.prepare(`
    SELECT l.*, u.name as assigned_name, u.email as assigned_email
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.id = ?
  `).get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json(lead);
});

// POST /api/leads
router.post('/', auth, (req, res) => {
  const {
    name, email, phone, phone_secondary, company, account_id,
    job_title, industry, source, status, priority,
    estimated_value, currency, assigned_to, follow_up, notes
  } = req.body;
  if (!name) return res.status(400).json({ error: 'Lead name is required.' });

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO leads (id,name,email,phone,phone_secondary,company,account_id,job_title,industry,source,status,priority,estimated_value,currency,assigned_to,follow_up,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, email||null, phone||null, phone_secondary||null, company||null, account_id||null,
         job_title||null, industry||null, source||null, status||'New', priority||'Medium',
         estimated_value||0, currency||'USD', assigned_to||req.user.id, follow_up||null, notes||null, now, now);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  res.status(201).json(lead);
});

// PUT /api/leads/:id
router.put('/:id', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lead not found.' });

  const fields = ['name','email','phone','phone_secondary','company','account_id','job_title',
                  'industry','source','status','priority','estimated_value','currency',
                  'assigned_to','follow_up','notes'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/leads/:id
router.delete('/:id', auth, (req, res) => {
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lead deleted.' });
});

module.exports = router;
