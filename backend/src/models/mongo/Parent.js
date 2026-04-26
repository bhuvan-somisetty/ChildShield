const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ParentSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  parentControlPasswordHash: { type: String, required: true },
  needsPasswordSetup: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Parent', ParentSchema);
