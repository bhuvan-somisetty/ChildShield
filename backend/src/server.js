require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./db');

const authRoutes = require('./routes/auth');
const childRoutes = require('./routes/children');
const apiRoutes = require('./routes/api');
const deviceRoutes = require('./routes/device');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Force alter:true to pick up new columns without losing data
sequelize.sync({ alter: true }).then(() => {
  console.log('[Database] SQLite models synchronized (alter mode).');
  app.listen(PORT, () => console.log(`[ChildShield] Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('[Database] Sync error:', err.message);
  // Fallback: try without alter
  sequelize.sync().then(() => {
    app.listen(PORT, () => console.log(`[ChildShield] Server running on http://localhost:${PORT}`));
  });
});
