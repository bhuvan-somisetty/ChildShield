const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Location', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    battery: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};
