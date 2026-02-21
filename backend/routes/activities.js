const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { auth } = require('../middleware/auth');

// GET /api/activities - with optional lead filter
router.get('/', auth, (req, res) => {
  const { lead_id, type, page = 1, limit = 20 } = req.query;
  let where = [];
  let params = [];

  if (lead_id) { where.push('a.lead_id = ?'); params.push(lead_id); }
  if (type) { where.push('a.type = ?'); params.push(type); }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as c FROM activities a ${whereStr}`).get(...params).c;
  const activities = db.prepare(`
    SELECT a.*, l.name as lead_name, u.name as performed_by_name
    FROM activities a
    LEFT JOIN leads l ON a.lead_id = l.id
    LEFT JOIN users u ON a.performed_by = u.id
    ${whereStr}
    ORDER BY a.date DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ data: activities, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});

// POST /api/activities
router.post('/', auth, (req, res) => {
  const { lead_id, type, subject, description, outcome, next_action, duration, participants, attachment_url, date } = req.body;
  if (!lead_id || !type || !subject) return res.status(400).json({ error: 'lead_id, type and subject required.' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO activities (id,lead_id,type,subject,description,outcome,next_action,duration,participants,attachment_url,performed_by,date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, lead_id, type, subject, description||null, outcome||null, next_action||null,
         duration||null, participants||null, attachment_url||null, req.user.id, date||new Date().toISOString());

  // Update lead updated_at
  db.prepare('UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(lead_id);

  const activity = db.prepare(`
    SELECT a.*, u.name as performed_by_name FROM activities a
    LEFT JOIN users u ON a.performed_by = u.id WHERE a.id = ?
  `).get(id);
  res.status(201).json(activity);
});

// DELETE /api/activities/:id
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ message: 'Activity deleted.' });
});

module.exports = router;
