const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Postgres (Supabase / Railway / Neon etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Local dev: SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });
}

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

module.exports = { sequelize, Parent, Child, Activity, FaceEvent };
