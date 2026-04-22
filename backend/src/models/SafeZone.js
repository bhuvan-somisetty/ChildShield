const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SafeZone', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('home', 'school', 'relative', 'hospital', 'custom'),
      defaultValue: 'custom'
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    radiusMeters: {
      type: DataTypes.INTEGER,
      defaultValue: 200
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};
