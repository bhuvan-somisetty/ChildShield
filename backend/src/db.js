const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('[Database] Could not set custom DNS servers:', e.message);
}
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;
let Parent, Child, Activity, FaceEvent, Location, SafeZone;

const isMongo = !!process.env.MONGODB_URI;
if (isMongo) mongoose.set('bufferCommands', false); // Fail fast if DB not connected

if (isMongo) {
  // Connection logic has been moved to server.js to ensure it connects before server starts
  const MongoParent = require('./models/mongo/Parent');
  const MongoChild = require('./models/mongo/Child');
  const MongoActivity = require('./models/mongo/Activity');
  const MongoFaceEvent = require('./models/mongo/FaceEvent');
  const MongoLocation = require('./models/mongo/Location');
  const MongoSafeZone = require('./models/mongo/SafeZone');

  // Compatibility Layer: Make Mongoose models behave like Sequelize models
  const wrapModel = (Model) => {
    // We proxy the model to handle both Mongoose and Sequelize-style calls
    const wrapper = Model; 

    // Add Sequelize-style helpers
    wrapper.findByPk = (id) => Model.findById(id);
    
    // Override findOne to handle { where: { ... } }
    const originalFindOne = Model.findOne.bind(Model);
    wrapper.findOne = (query) => {
      if (query && query.where) return originalFindOne(query.where);
      return originalFindOne(query);
    };

    // Add findAll as an alias for find
    wrapper.findAll = async (query) => {
      let filter = {};
      let sort = {};
      let limit = null;

      if (query && query.where) filter = query.where;
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

    // Add count with where support
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
  // Legacy SQL Connection (Postgres/SQLite)
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

  // Define Relationships
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

module.exports = { sequelize, mongoose, isMongo, Parent, Child, Activity, FaceEvent, Location, SafeZone };
