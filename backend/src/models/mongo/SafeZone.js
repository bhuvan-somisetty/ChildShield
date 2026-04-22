const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SafeZoneSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  childId: { type: String, ref: 'Child', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['home', 'school', 'relative', 'hospital', 'custom'], default: 'custom' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radiusMeters: { type: Number, default: 200 },
  address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SafeZone', SafeZoneSchema);
