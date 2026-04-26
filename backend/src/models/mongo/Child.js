const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ChildSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  parentId: { type: String, ref: 'Parent', required: false },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['boy', 'girl', 'other'] },
  dailyLimitHours: { type: Number, default: 5.0 },
  locationTrackingEnabled: { type: Boolean, default: false },
  safeMode: { type: Boolean, default: true },
  nightRestriction: { type: Boolean, default: false },
  facePresenceEnabled: { type: Boolean, default: false },
  voiceEnabled: { type: Boolean, default: true },
  faceEnrollment1: { type: String },
  faceEnrollment2: { type: String },
  authorizedFaces: { type: Array, default: [] },
  pairingCode: { type: String },
  isPaired: { type: Boolean, default: false },
  deviceState: { type: String, enum: ['active', 'paused', 'locked'], default: 'active' },
  lockReason: { type: String },
  faceAlertAction: { type: String, enum: ['alert', 'pause', 'lock'], default: 'alert' },
  faceMismatchAction: { type: String, enum: ['alert', 'pause', 'lock'], default: 'alert' },
  noFaceAction: { type: String, enum: ['alert', 'pause', 'lock'], default: 'pause' },
  noFaceTimeout: { type: Number, default: 30 },
  faceMonitoringFrequency: { type: Number, default: 30 },
  saveFaceSnapshots: { type: Boolean, default: true },
  timerEndTime: { type: Date },
  timerDurationMinutes: { type: Number },
  lockedApps: { type: Array, default: [] }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Child', ChildSchema);
