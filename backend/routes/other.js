const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
// GET /api/accounts
router.get('/accounts', auth, (req, res) => {
  const { search, sector, page = 1, limit = 10 } = req.query;
  let where = [];
  let params = [];
  if (search) { where.push('account LIKE ?'); params.push(`%${search}%`); }
  if (sector) { where.push('sector = ?'); params.push(sector); }
  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total = db.prepare(`SELECT COUNT(*) as c FROM accounts ${whereStr}`).get(...params).c;
  const accounts = db.prepare(`SELECT * FROM accounts ${whereStr} ORDER BY account ASC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);
  res.json({ data: accounts, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});

// GET /api/accounts/all (for dropdowns)
router.get('/accounts/all', auth, (req, res) => {
  const accounts = db.prepare('SELECT id, account, sector, office_location FROM accounts ORDER BY account ASC').all();
  res.json(accounts);
});

// POST /api/accounts
router.post('/accounts', auth, (req, res) => {
  const { account, sector, year_established, revenue, employees, office_location, subsidiary_of } = req.body;
  if (!account) return res.status(400).json({ error: 'Account name required.' });
  const id = uuidv4();
  db.prepare(`INSERT INTO accounts (id,account,sector,year_established,revenue,employees,office_location,subsidiary_of) VALUES (?,?,?,?,?,?,?,?)`).run(id, account, sector||null, year_established||null, revenue||null, employees||null, office_location||null, subsidiary_of||null);
  res.status(201).json(db.prepare('SELECT * FROM accounts WHERE id = ?').get(id));
});

// PUT /api/accounts/:id
router.put('/accounts/:id', auth, (req, res) => {
  const fields = ['account','sector','year_established','revenue','employees','office_location','subsidiary_of'];
  const updates = []; const values = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
  values.push(req.params.id);
  db.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id));
});

// DELETE /api/accounts/:id
router.delete('/accounts/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Account deleted.' });
});

// ─── USERS ────────────────────────────────────────────────────────────────────
// GET /api/users
router.get('/users', auth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users ORDER BY name ASC').all();
  res.json(users);
});

// PUT /api/users/:id (admin or self)
router.put('/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { name, avatar } = req.body;
  const updates = []; const values = [];
  if (name) { updates.push('name = ?'); values.push(name); }
  if (avatar) { updates.push('avatar = ?'); values.push(avatar); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT id,name,email,role,avatar FROM users WHERE id = ?').get(req.params.id));
});

// DELETE /api/users/:id (admin only)
router.delete('/users/:id', auth, adminOnly, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted.' });
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
// GET /api/payments?lead_id=xxx
router.get('/payments', auth, (req, res) => {
  const { lead_id } = req.query;
  if (!lead_id) return res.status(400).json({ error: 'lead_id required.' });
  const payments = db.prepare('SELECT * FROM payments WHERE lead_id = ? ORDER BY created_at DESC').all(lead_id);
  const totals = db.prepare('SELECT COALESCE(SUM(amount),0) as total_amount, COALESCE(SUM(paid),0) as total_paid FROM payments WHERE lead_id = ?').get(lead_id);
  res.json({ payments, ...totals, balance: totals.total_amount - totals.total_paid, count: payments.length });
});

// POST /api/payments
router.post('/payments', auth, (req, res) => {
  const { lead_id, amount, currency, paid, payment_date, notes } = req.body;
  if (!lead_id || !amount) return res.status(400).json({ error: 'lead_id and amount required.' });
  const id = uuidv4();
  const balance = (parseFloat(amount) - parseFloat(paid || 0)).toFixed(2);
  db.prepare(`INSERT INTO payments (id,lead_id,amount,currency,paid,balance,payment_date,notes) VALUES (?,?,?,?,?,?,?,?)`).run(id, lead_id, amount, currency||'USD', paid||0, balance, payment_date||null, notes||null);
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
});

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────
router.get('/email-templates', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM email_templates ORDER BY created_at DESC').all());
});

router.post('/email-templates', auth, (req, res) => {
  const { name, subject, body } = req.body;
  if (!name || !subject || !body) return res.status(400).json({ error: 'name, subject and body required.' });
  const id = uuidv4();
  db.prepare('INSERT INTO email_templates (id,name,subject,body,created_by) VALUES (?,?,?,?,?)').run(id, name, subject, body, req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id));
});

router.delete('/email-templates/:id', auth, (req, res) => {
  db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id);
  res.json({ message: 'Template deleted.' });
});

// ─── EMAIL TRIGGERS ───────────────────────────────────────────────────────────
router.get('/email-triggers', auth, (req, res) => {
  res.json(db.prepare('SELECT et.*, emt.name as template_name FROM email_triggers et LEFT JOIN email_templates emt ON et.template_id = emt.id ORDER BY et.created_at DESC').all());
});

router.post('/email-triggers', auth, (req, res) => {
  const { name, trigger_on, template_id, is_active } = req.body;
  if (!name || !trigger_on) return res.status(400).json({ error: 'name and trigger_on required.' });
  const id = uuidv4();
  db.prepare('INSERT INTO email_triggers (id,name,trigger_on,template_id,is_active) VALUES (?,?,?,?,?)').run(id, name, trigger_on, template_id||null, is_active !== undefined ? is_active : 1);
  res.status(201).json(db.prepare('SELECT * FROM email_triggers WHERE id = ?').get(id));
});

module.exports = router;
