const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Activity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    childId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY, // '2026-04-08'
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    time: {
      type: DataTypes.STRING, // '08:45 PM'
      allowNull: false
    },
    app: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    platform: {
      type: DataTypes.STRING,
      defaultValue: 'Mobile'
    },
    activityType: {
      type: DataTypes.STRING, // 'watch', 'search', 'play', 'browse', 'chat'
      defaultValue: 'browse'
    },
    category: {
      type: DataTypes.STRING, // 'Entertainment', 'Gaming', 'Education', 'Social', 'Search'
      allowNull: true
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    riskTag: {
      type: DataTypes.STRING, // 'low', 'medium', 'high'
      defaultValue: 'low'
    },
    alerts: {
      type: DataTypes.STRING, // JSON stringified array of alerts
      allowNull: true
    }
  });
};
