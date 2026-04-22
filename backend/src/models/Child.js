const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Child', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
    gender: { type: DataTypes.ENUM('boy', 'girl', 'other'), allowNull: true },
    dailyLimitHours: { type: DataTypes.FLOAT, defaultValue: 5.0 },
    locationTrackingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    safeMode: { type: DataTypes.BOOLEAN, defaultValue: true },
    nightRestriction: { type: DataTypes.BOOLEAN, defaultValue: false },
    facePresenceEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    voiceEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    faceEnrollment1: { type: DataTypes.TEXT, allowNull: true },
    faceEnrollment2: { type: DataTypes.TEXT, allowNull: true },
    authorizedFaces: { 
      type: DataTypes.JSON, 
      allowNull: true,
      defaultValue: []
    },
    // Device Pairing & Control
    pairingCode: { type: DataTypes.STRING, allowNull: true },
    isPaired: { type: DataTypes.BOOLEAN, defaultValue: false },
    deviceState: {
      type: DataTypes.ENUM('active', 'paused', 'locked'),
      defaultValue: 'active'
    },
    lockReason: { type: DataTypes.STRING, allowNull: true },
    faceAlertAction: {
      type: DataTypes.ENUM('alert', 'pause', 'lock'),
      defaultValue: 'alert'
    },
    // Advanced Face Guard Settings
    faceMismatchAction: {
      type: DataTypes.ENUM('alert', 'pause', 'lock'),
      defaultValue: 'alert'
    },
    noFaceAction: {
      type: DataTypes.ENUM('alert', 'pause', 'lock'),
      defaultValue: 'pause'
    },
    noFaceTimeout: {
      type: DataTypes.INTEGER,
      defaultValue: 30 // seconds
    },
    faceMonitoringFrequency: {
      type: DataTypes.INTEGER,
      defaultValue: 30 // seconds
    },
    saveFaceSnapshots: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Timer fields
    timerEndTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    timerDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // App locking: JSON array of { appName, lockedAt, lockedBy }
    lockedApps: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });
};
