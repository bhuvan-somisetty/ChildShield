const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UrlEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    childId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false
    },
    host: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verdict: {
      type: DataTypes.ENUM('malicious', 'clean', 'unknown'),
      defaultValue: 'unknown'
    },
    threat: {
      type: DataTypes.STRING,
      allowNull: true
    },
    urlStatus: {
      type: DataTypes.STRING, // 'online' | 'offline'
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    blacklists: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'urlhaus'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};
