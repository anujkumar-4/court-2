const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    caseNo: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['criminal', 'civil', 'family', 'corporate', 'constitutional'],
      required: true
    },
    courtLevel: {
      type: String,
      enum: ['SC', 'HC', 'DC'],
      required: true
    },
    priorityScore: { type: Number, min: 1, max: 100, required: true },
    status: {
      type: String,
      enum: ['pending', 'hearing_scheduled', 'in_progress', 'disposed'],
      default: 'pending'
    },
    assignedToRole: {
      type: String,
      enum: ['judge', 'court_sc', 'court_hc', 'court_dc', 'police_station', 'advocate'],
      required: true
    },
    nextHearingDate: Date,
    summary: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Case', caseSchema);
