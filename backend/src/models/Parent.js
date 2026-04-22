const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Parent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentControlPasswordHash: {
      type: DataTypes.STRING,
      allowNull: false // Separate password to unlock devices/overrides
    },
    needsPasswordSetup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};
