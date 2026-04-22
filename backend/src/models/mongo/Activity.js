const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ActivitySchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  childId: { type: String, ref: 'Child', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  app: { type: String, required: true },
  title: { type: String },
  platform: { type: String, default: 'Mobile' },
  activityType: { type: String, default: 'browse' },
  category: { type: String },
  durationMinutes: { type: Number, default: 0 },
  riskTag: { type: String, default: 'low' },
  alerts: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
