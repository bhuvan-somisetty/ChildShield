const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FaceEventSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  childId: { type: String, ref: 'Child', required: true },
  type: { type: String, enum: ['mismatch', 'no-face', 'lock', 'recovery'], required: true },
  snapshot: { type: String },
  status: { type: String, required: true },
  actionTaken: { type: String, required: true },
  sessionContext: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  platform: { type: String, default: 'Mobile' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FaceEvent', FaceEventSchema);
