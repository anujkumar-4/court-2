const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['judge', 'court_sc', 'court_hc', 'court_dc', 'police_station', 'advocate'],
      required: true
    },
    profile: {
      designation: String,
      badgeId: String,
      location: String,
      certificateId: String,
      certificateStatus: {
        type: String,
        enum: ['verified', 'pending', 'rejected'],
        default: 'pending'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
