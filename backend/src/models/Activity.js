const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Activity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    app: DataTypes.STRING,
    title: DataTypes.STRING,
    category: DataTypes.STRING,
    startTime: DataTypes.STRING,
    duration: DataTypes.STRING, // e.g., '25m'
    risk: DataTypes.STRING, // e.g., 'low', 'high'
    alerts: {
      type: DataTypes.STRING, // JSON stringified array of alerts
      allowNull: true
    }
  });
};
