const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const hash = bcrypt.hashSync('password123', 10);
const now = new Date().toISOString();

const data = {
  users: [
    { id: uuid(), name: 'Admin User',  email: 'admin@crm.com',    password: hash, role: 'admin',   created_at: now, updated_at: now },
    { id: uuid(), name: 'Manager 1',   email: 'manager1@crm.com', password: hash, role: 'manager', created_at: now, updated_at: now },
    { id: uuid(), name: 'Agent 1',     email: 'agent1@crm.com',   password: hash, role: 'agent',   created_at: now, updated_at: now },
    { id: uuid(), name: 'Agent 2',     email: 'agent2@crm.com',   password: hash, role: 'agent',   created_at: now, updated_at: now },
    { id: uuid(), name: 'Agent 3',     email: 'agent3@crm.com',   password: hash, role: 'agent',   created_at: now, updated_at: now }
  ],
  accounts: [],
  leads: [],
  activities: [],
  tasks: [],
  payments: [],
  email_templates: [],
  email_triggers: []
};

const dbPath = path.join(__dirname, 'db', 'crm-data.json');
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

console.log('✅ crm-data.json created successfully!');
console.log('');
console.log('Login with:');
console.log('  Email:    admin@crm.com');
console.log('  Password: password123');
