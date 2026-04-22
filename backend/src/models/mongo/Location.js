const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const LocationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  childId: { type: String, ref: 'Child', required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  speed: { type: Number },
  battery: { type: Number },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Location', LocationSchema);
