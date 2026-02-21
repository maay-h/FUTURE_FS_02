require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/leads',      require('./routes/leads'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/tasks',      require('./routes/tasks'));
app.use('/api',            require('./routes/other'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'JSON file' }));
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CRM Backend → http://localhost:${PORT}`);
  console.log(`   Seed first: node db/seed.js\n`);
});
