const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('FaceEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    childId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('mismatch', 'no-face', 'lock', 'recovery'),
      allowNull: false
    },
    snapshot: {
      type: DataTypes.TEXT, // Base64 thumbnail
      allowNull: true
    },
    status: {
      type: DataTypes.STRING, // e.g., 'Unknown Face', 'Face Absent'
      allowNull: false
    },
    actionTaken: {
      type: DataTypes.STRING, // e.g., 'alert', 'pause', 'lock'
      allowNull: false
    },
    sessionContext: {
      type: DataTypes.STRING,
      allowNull: true
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    platform: {
      type: DataTypes.STRING,
      defaultValue: 'Mobile'
    },
    timestamp: {

      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};
