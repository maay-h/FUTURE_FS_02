require('dotenv').config();
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding database...');

const hashedPassword = bcrypt.hashSync('password123', 10);

const users = [
  { id: uuidv4(), name: 'Admin User',  email: 'admin@crm.com',    role: 'admin'   },
  { id: uuidv4(), name: 'Manager 1',   email: 'manager1@crm.com', role: 'manager' },
  { id: uuidv4(), name: 'Agent 1',     email: 'agent1@crm.com',   role: 'agent'   },
  { id: uuidv4(), name: 'Agent 2',     email: 'agent2@crm.com',   role: 'agent'   },
  { id: uuidv4(), name: 'Agent 3',     email: 'agent3@crm.com',   role: 'agent'   },
];
users.forEach(u => {
  db.prepare('INSERT OR IGNORE INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)')
    .run(u.id, u.name, u.email, hashedPassword, u.role);
});
console.log(`✅ ${users.length} users`);

const accountsData = [
  ["Acme Corporation","technolgy",1996,1100.04,2822,"United States",""],
  ["Betasoloin","medical",1999,251.41,495,"United States",""],
  ["Betatech","medical",1986,647.18,1185,"Kenya",""],
  ["Bioholding","medical",2012,587.34,1356,"Philipines",""],
  ["Bioplex","medical",1991,326.82,1016,"United States",""],
  ["Blackzim","retail",2009,497.11,1588,"United States",""],
  ["Bluth Company","technolgy",1993,1242.32,3027,"United States","Acme Corporation"],
  ["Bubba Gump","software",2002,987.39,2253,"United States",""],
  ["Cancity","retail",2001,718.62,2448,"United States",""],
  ["Cheers","entertainment",1993,4269.9,6472,"United States","Massive Dynamic"],
  ["Codehow","software",1998,2714.9,2641,"United States","Acme Corporation"],
  ["Condax","medical",2017,4.54,9,"United States",""],
  ["Conecom","technolgy",2005,1520.66,1806,"United States",""],
  ["Dontechi","software",1982,4618,10083,"United States",""],
  ["Fasehatice","retail",1990,4968.91,7523,"United States",""],
  ["Faxquote","telecommunications",1995,1825.82,5595,"United States","Sonron"],
  ["Finhigh","finance",2006,1102.43,1759,"United States",""],
  ["Funholding","finance",1991,2819.5,7227,"United States","Golddex"],
  ["Ganjaflex","retail",1995,5158.71,17479,"Japan",""],
  ["Gekko & Co","retail",1990,2520.83,3502,"United States",""],
  ["Globex Corporation","technolgy",2000,1223.72,2497,"Norway",""],
  ["Golddex","finance",2008,52.5,165,"United States",""],
  ["Goodsilron","marketing",2000,2952.73,5107,"United States",""],
  ["Hottechi","technolgy",1997,8170.38,16499,"Korea",""],
  ["Initech","telecommunications",1994,6395.05,20275,"United States",""],
  ["Inity","marketing",1986,2403.58,8801,"United States",""],
  ["Isdom","medical",2002,3178.24,4540,"United States",""],
  ["Kan-code","software",1982,11698.03,34288,"United States",""],
  ["Konex","technolgy",1980,7708.38,13756,"United States",""],
  ["Massive Dynamic","entertainment",1989,665.06,1095,"United States",""],
  ["Sonron","telecommunications",1999,1699.85,5108,"United States",""],
  ["Umbrella Corporation","finance",1998,2022.14,5113,"United States",""],
  ["Zotware","software",1979,4478.47,13809,"United States",""],
];
accountsData.forEach(([account, sector, year, revenue, employees, location, subsidiary]) => {
  db.prepare('INSERT OR IGNORE INTO accounts (id,account,sector,year_established,revenue,employees,office_location,subsidiary_of) VALUES (?,?,?,?,?,?,?,?)')
    .run(uuidv4(), account, sector, year, revenue, employees, location, subsidiary || null);
});
console.log(`✅ ${accountsData.length} accounts`);

const allUsers = db.prepare('SELECT id, name FROM users').all();
const adminUser = allUsers.find(u => u.name === 'Admin User');
const agent1    = allUsers.find(u => u.name === 'Agent 1');
const agent2    = allUsers.find(u => u.name === 'Agent 2');
const agent3    = allUsers.find(u => u.name === 'Agent 3');
const manager1  = allUsers.find(u => u.name === 'Manager 1');
const agents = [agent1, agent2, agent3, manager1].filter(Boolean);

const statuses   = ['New','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'];
const priorities = ['Low','Medium','High'];
const sources    = ['Website','LinkedIn','Referral','Cold Call','Google Ads','Trade Show','Social Media','WhatsApp'];

const leadDefs = [
  ['Customer 1','Company Alpha','customer1@example.com','920000000101'],
  ['Customer 2','Company Beta','customer2@example.com','920000000102'],
  ['Customer 3','Company Gamma','customer3@example.com','920000000104'],
  ['Customer 4','Company Delta','customer4@example.com','920000000105'],
  ['Customer 5','Company Epsilon','customer5@example.com','920000000106'],
  ['Customer 6','Company Zeta','customer6@example.com','920000000108'],
  ['Customer 7','Company Eta','customer7@example.com','920000000109'],
  ['Customer 8','Company Theta','customer8@example.com','920000000110'],
  ['Customer 9','Company Iota','customer9@example.com','920000000111'],
  ['Customer 10','Company Kappa','customer10@example.com','920000000112'],
  ['Customer 11','Company Lambda','customer11@example.com','920000000113'],
  ['Customer 12','Company Mu','customer12@example.com','920000000114'],
  ['Customer 13','Company Nu','customer13@example.com','920000000115'],
  ['Customer 14','Company Xi','customer14@example.com','920000000116'],
  ['Customer 15','Company Omicron','customer15@example.com','920000000119'],
  ['Demo Lead','MR','demo@example.com','332222'],
];

const leadIds = [];
leadDefs.forEach(([name, company, email, phone], i) => {
  const id = uuidv4(); leadIds.push(id);
  const agent = agents[i % agents.length];
  const createdAt = new Date(); createdAt.setDate(createdAt.getDate() - i * 2);
  const followUp = new Date(); followUp.setDate(followUp.getDate() + (i % 7) + 1);
  db.prepare('INSERT OR IGNORE INTO leads (id,name,email,phone,company,source,status,priority,estimated_value,currency,assigned_to,follow_up,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, name, email, phone, company,
      sources[i % sources.length], statuses[i % statuses.length], priorities[i % priorities.length],
      Math.floor(Math.random() * 900000) + 50000,
      i < 14 ? 'PKR' : 'USD',
      agent?.id || adminUser?.id,
      followUp.toISOString(), createdAt.toISOString(), createdAt.toISOString());
});
console.log(`✅ ${leadIds.length} leads`);

const actTypes = ['Call','Email','Meeting','Note','Video Call'];
const outcomes = ['Positive','Neutral','Interested','Not Interested'];
const subjects = ['Initial discovery call','Follow-up on referral','Design requirements meeting','Sent product brochure','Proposal sent','Mockup delivery','Decision maker call','Revised quotation sent','Project scope review','Demo scheduling call'];
leadIds.slice(0,10).forEach((leadId, i) => {
  const d = new Date(); d.setDate(d.getDate() - i * 2);
  db.prepare('INSERT OR IGNORE INTO activities (id,lead_id,type,subject,outcome,duration,performed_by,date) VALUES (?,?,?,?,?,?,?,?)')
    .run(uuidv4(), leadId, actTypes[i % actTypes.length], subjects[i % subjects.length],
      outcomes[i % outcomes.length], [null,15,25,35,45,55][i % 6],
      agents[i % agents.length]?.id || adminUser?.id, d.toISOString());
});
console.log('✅ activities');

const taskTitles = ['Call for portfolio discussion','Send thank you note','Send mockup revisions','Send revised quotation','Send technical specifications','Follow up CRM demo','Schedule introductory call','Schedule demo call','Finalize SOW document','Send project invoice'];
const taskStatuses = ['Pending','In Progress','Completed','Overdue','Cancelled'];
leadIds.forEach((leadId, i) => {
  const d = new Date(); d.setDate(d.getDate() + (i % 3 === 0 ? -2 : i));
  db.prepare('INSERT OR IGNORE INTO tasks (id,lead_id,title,status,priority,due_date,assigned_to,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(uuidv4(), leadId, taskTitles[i % taskTitles.length], taskStatuses[i % taskStatuses.length],
      priorities[i % priorities.length], d.toISOString(),
      agents[i % agents.length]?.id || adminUser?.id,
      new Date().toISOString(), new Date().toISOString());
});
console.log('✅ tasks');

[['Welcome Email','Welcome to Our Services','Dear {{name}},\n\nThank you for your interest.\n\nBest,\nThe Team'],
 ['Follow-up Email','Following Up on Our Discussion','Hi {{name}},\n\nJust following up on our conversation.\n\nBest,\n{{agent}}'],
 ['Proposal Sent','Proposal for {{company}}','Dear {{name}},\n\nPlease find our proposal attached.\n\nRegards,\n{{agent}}'],
].forEach(([name, subject, body]) => {
  db.prepare('INSERT OR IGNORE INTO email_templates (id,name,subject,body,created_by) VALUES (?,?,?,?,?)')
    .run(uuidv4(), name, subject, body, adminUser?.id);
});
console.log('✅ email templates');

console.log('\n🎉 Done! Login with:');
console.log('   admin@crm.com / password123');
