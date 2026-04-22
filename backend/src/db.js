const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;
let Parent, Child, Activity, FaceEvent, Location, SafeZone;

const isMongo = !!process.env.MONGODB_URI;

// Set global Mongoose options for robust connection
mongoose.set('strictQuery', false);

// Use default buffering (true) so queries wait for connection
mongoose.set('bufferCommands', true);

const connectDB = async () => {
  if (!isMongo) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds to connect
      socketTimeoutMS: 45000,
    });
    console.log('[Database] ✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[Database] ❌ MongoDB connection error:', err.message);
    throw err;
  }
};

if (isMongo) {
  const MongoParent = require('./models/mongo/Parent');
  const MongoChild = require('./models/mongo/Child');
  const MongoActivity = require('./models/mongo/Activity');
  const MongoFaceEvent = require('./models/mongo/FaceEvent');
  const MongoLocation = require('./models/mongo/Location');
  const MongoSafeZone = require('./models/mongo/SafeZone');

  const wrapModel = (Model) => {
    const wrapper = Model; 
    wrapper.findByPk = (id) => Model.findById(id);
    const originalFindOne = Model.findOne.bind(Model);
    wrapper.findOne = (query) => {
      if (query && query.where) return originalFindOne(query.where);
      return originalFindOne(query);
    };
    wrapper.findAll = async (query) => {
      let filter = {}; let sort = {}; let limit = null;
      if (query && query.where) filter = query.where;
      if (query && query.order) {
        query.order.forEach(([field, dir]) => { sort[field] = dir.toLowerCase() === 'desc' ? -1 : 1; });
      }
      if (query && query.limit) limit = query.limit;
      let q = Model.find(filter).sort(sort);
      if (limit) q = q.limit(limit);
      return q;
    };
    wrapper.count = (query) => {
      if (query && query.where) return Model.countDocuments(query.where);
      return Model.countDocuments(query || {});
    };
    return wrapper;
  };

  Parent = wrapModel(MongoParent);
  Child = wrapModel(MongoChild);
  Activity = wrapModel(MongoActivity);
  FaceEvent = wrapModel(MongoFaceEvent);
  Location = wrapModel(MongoLocation);
  SafeZone = wrapModel(MongoSafeZone);
} else {
  // Legacy SQL
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
    });
  } else {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, 'database.sqlite'),
      logging: false
    });
  }
  const createParentModel = require('./models/Parent');
  const createChildModel = require('./models/Child');
  const createActivityModel = require('./models/Activity');
  const createFaceEventModel = require('./models/FaceEvent');
  const createLocationModel = require('./models/Location');
  const createSafeZoneModel = require('./models/SafeZone');

  Parent = createParentModel(sequelize);
  Child = createChildModel(sequelize);
  Activity = createActivityModel(sequelize);
  FaceEvent = createFaceEventModel(sequelize);
  Location = createLocationModel(sequelize);
  SafeZone = createSafeZoneModel(sequelize);

  Parent.hasMany(Child, { foreignKey: 'parentId' });
  Child.belongsTo(Parent, { foreignKey: 'parentId' });
  Child.hasMany(Activity, { foreignKey: 'childId' });
  Activity.belongsTo(Child, { foreignKey: 'childId' });
  Child.hasMany(FaceEvent, { foreignKey: 'childId' });
  FaceEvent.belongsTo(Child, { foreignKey: 'childId' });
  Child.hasMany(Location, { foreignKey: 'childId' });
  Location.belongsTo(Child, { foreignKey: 'childId' });
  Child.hasMany(SafeZone, { foreignKey: 'childId' });
  SafeZone.belongsTo(Child, { foreignKey: 'childId' });
}

module.exports = { sequelize, mongoose, isMongo, connectDB, Parent, Child, Activity, FaceEvent, Location, SafeZone };
