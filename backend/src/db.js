const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;
let Parent, Child, Activity, FaceEvent, Location, SafeZone;

// Auto-fix if the user accidentally pasted "MONGODB_URI=" inside the value field
let uri = process.env.MONGODB_URI;
if (uri && uri.startsWith('MONGODB_URI=')) {
  uri = uri.replace('MONGODB_URI=', '');
  process.env.MONGODB_URI = uri; // Update it globally
}

const isMongo = !!uri;

if (isMongo) {
  if (uri.includes('<') || uri.includes('>')) {
    console.error('\n=============================================================');
    console.error('❌ CRITICAL ERROR: Invalid MONGODB_URI detected!');
    console.error('It looks like your connection string contains placeholder text.');
    console.error('Please replace <password> and <your_cluster_url> with real values.');
    console.error('=============================================================\n');
    process.exit(1);
  }
  const redacted = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`[Database] MONGODB_URI detected: ${redacted}`);
} else {
  console.log('[Database] MONGODB_URI not detected. Falling back to SQL mode.');
}

// ── Mongoose global options ────────────────────────────────────────────────────
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', true); // Queue ops while reconnecting

// Track connection state to avoid duplicate connect() calls
let _isConnecting = false;
let _connectionPromise = null;

// ── Mongoose event listeners (attached once) ──────────────────────────────────
mongoose.connection.on('connected', () => {
  console.log('[Database] ✅ MongoDB connected');
  _isConnecting = false;
  _connectionPromise = null;
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] ⚠️  MongoDB disconnected — will auto-reconnect');
  _isConnecting = false;
  _connectionPromise = null;
  // Auto-reconnect after 3s if URI is available
  if (isMongo) {
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        connectDB().catch(err =>
          console.error('[Database] Auto-reconnect failed:', err.message)
        );
      }
    }, 3000);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] ❌ MongoDB error:', err.message);
  _isConnecting = false;
  _connectionPromise = null;
});

// ── connectDB ─────────────────────────────────────────────────────────────────
const connectDB = async () => {
  if (!isMongo) return;

  // Already connected
  if (mongoose.connection.readyState === 1) return;

  // Already connecting — return same promise to avoid race conditions
  if (_isConnecting && _connectionPromise) return _connectionPromise;

  _isConnecting = true;
  _connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 60000,
    // Connection pool settings for stability
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 20000,
    heartbeatFrequencyMS: 10000,
    // Auto-reconnect
    retryWrites: true,
    retryReads: true,
  });

  try {
    await _connectionPromise;
    console.log('[Database] ✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[Database] ❌ MongoDB connection error:', err.message);
    _isConnecting = false;
    _connectionPromise = null;
    throw err;
  }

  return _connectionPromise;
};

// ── getDBStatus ───────────────────────────────────────────────────────────────
const getDBStatus = () => {
  if (!isMongo) {
    return { type: 'sqlite/postgres', status: 'connected', readyState: 1 };
  }
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const rs = mongoose.connection.readyState;
  return {
    type: 'mongodb',
    status: states[rs] || 'unknown',
    readyState: rs,
    isConnected: rs === 1,
  };
};

// ── Model wiring ──────────────────────────────────────────────────────────────
if (isMongo) {
  const MongoParent   = require('./models/mongo/Parent');
  const MongoChild    = require('./models/mongo/Child');
  const MongoActivity = require('./models/mongo/Activity');
  const MongoFaceEvent = require('./models/mongo/FaceEvent');
  const MongoLocation = require('./models/mongo/Location');
  const MongoSafeZone = require('./models/mongo/SafeZone');

  const wrapModel = (Model) => {
    const wrapper = Model;
    wrapper.findByPk = (id) => Model.findById(id);
    const originalFindOne = Model.findOne.bind(Model);

    const fixFilter = (f) => {
      if (!f) return {};
      const newFilter = { ...f };
      if (newFilter.id !== undefined) {
        newFilter._id = newFilter.id;
        delete newFilter.id;
      }
      return newFilter;
    };

    wrapper.findOne = (query) => {
      let filter = query && query.where ? query.where : query;
      return originalFindOne(fixFilter(filter));
    };
    wrapper.findAll = async (query) => {
      let filter = {}; let sort = {}; let limit = null;
      if (query && query.where) filter = query.where;
      filter = fixFilter(filter);
      if (query && query.order) {
        query.order.forEach(([field, dir]) => {
          sort[field] = dir.toLowerCase() === 'desc' ? -1 : 1;
        });
      }
      if (query && query.limit) limit = query.limit;
      let q = Model.find(filter).sort(sort);
      if (limit) q = q.limit(limit);
      return q;
    };
    wrapper.count = (query) => {
      let filter = query && query.where ? query.where : query || {};
      return Model.countDocuments(fixFilter(filter));
    };
    wrapper.destroy = (query) => {
      let filter = query && query.where ? query.where : query || {};
      return Model.deleteMany(fixFilter(filter));
    };
    return wrapper;
  };

  Parent    = wrapModel(MongoParent);
  Child     = wrapModel(MongoChild);
  Activity  = wrapModel(MongoActivity);
  FaceEvent = wrapModel(MongoFaceEvent);
  Location  = wrapModel(MongoLocation);
  SafeZone  = wrapModel(MongoSafeZone);
} else {
  // Legacy SQL
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
      pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    });
  } else {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, 'database.sqlite'),
      logging: false,
    });
  }
  const createParentModel    = require('./models/Parent');
  const createChildModel     = require('./models/Child');
  const createActivityModel  = require('./models/Activity');
  const createFaceEventModel = require('./models/FaceEvent');
  const createLocationModel  = require('./models/Location');
  const createSafeZoneModel  = require('./models/SafeZone');

  Parent    = createParentModel(sequelize);
  Child     = createChildModel(sequelize);
  Activity  = createActivityModel(sequelize);
  FaceEvent = createFaceEventModel(sequelize);
  Location  = createLocationModel(sequelize);
  SafeZone  = createSafeZoneModel(sequelize);

  Parent.hasMany(Child,    { foreignKey: 'parentId' });
  Child.belongsTo(Parent,  { foreignKey: 'parentId' });
  Child.hasMany(Activity,  { foreignKey: 'childId' });
  Activity.belongsTo(Child,{ foreignKey: 'childId' });
  Child.hasMany(FaceEvent, { foreignKey: 'childId' });
  FaceEvent.belongsTo(Child,{ foreignKey: 'childId' });
  Child.hasMany(Location,  { foreignKey: 'childId' });
  Location.belongsTo(Child,{ foreignKey: 'childId' });
  Child.hasMany(SafeZone,  { foreignKey: 'childId' });
  SafeZone.belongsTo(Child,{ foreignKey: 'childId' });
}

module.exports = {
  sequelize, mongoose, isMongo,
  connectDB, getDBStatus,
  Parent, Child, Activity, FaceEvent, Location, SafeZone,
};
