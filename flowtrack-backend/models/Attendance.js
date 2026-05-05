const mongoose = require('mongoose');

const selfieCheckSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    notifiedAt: { type: Date, default: null },
    responseDeadline: { type: Date, required: true },

    selfieImage: { type: String, default: '' },
    status: {
      type: String,
      // added "skipped"
      enum: ['pending', 'verified', 'failed', 'missed', 'skipped'],
      default: 'pending',
    },
    verifiedAt: { type: Date, default: null },
    reason: { type: String, default: '' },
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },

    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },

    // normal day status
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Late'],
      default: 'Present',
    },
    totalHours: { type: Number, default: 0 },

    // ---- OVERTIME ----
    overtimeCheckIn: { type: Date, default: null },
    overtimeCheckOut: { type: Date, default: null },
    overtimeHours: { type: Number, default: 0 },

    // ---- SELFIE VERIFICATION ----
    // Updated: Random 5 checks between 10AM-6PM after employee check-in
    selfieChecks: { type: [selfieCheckSchema], default: [] },

    autoCheckoutReason: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);