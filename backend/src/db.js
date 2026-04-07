const { Sequelize } = require('sequelize');
const path = require('path');

// Configure Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false, // Set to console.log to see SQL queries during dev
});

// Import Models
const createParentModel = require('./models/Parent');
const createChildModel = require('./models/Child');
const createActivityModel = require('./models/Activity');
const createFaceEventModel = require('./models/FaceEvent');

// Initialize Models
const Parent = createParentModel(sequelize);
const Child = createChildModel(sequelize);
const Activity = createActivityModel(sequelize);
const FaceEvent = createFaceEventModel(sequelize);

// Define Relationships
Parent.hasMany(Child, { foreignKey: 'parentId' });
Child.belongsTo(Parent, { foreignKey: 'parentId' });

Child.hasMany(Activity, { foreignKey: 'childId' });
Activity.belongsTo(Child, { foreignKey: 'childId' });

Child.hasMany(FaceEvent, { foreignKey: 'childId' });
FaceEvent.belongsTo(Child, { foreignKey: 'childId' });

module.exports = {
  sequelize,
  Parent,
  Child,
  Activity,
  FaceEvent
};
