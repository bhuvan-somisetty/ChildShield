const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UrlEventSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  childId: { type: String, ref: 'Child', required: true },
  url: { type: String, required: true },
  host: { type: String },
  verdict: { type: String, enum: ['malicious', 'clean', 'unknown'], default: 'unknown' },
  threat: { type: String },
  urlStatus: { type: String },          // 'online' | 'offline'
  tags: { type: [String], default: [] },
  blacklists: { type: mongoose.Schema.Types.Mixed, default: {} },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  source: { type: String, default: 'urlhaus' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UrlEvent', UrlEventSchema);
