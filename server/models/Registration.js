import mongoose from 'mongoose';
import { REGISTRATION_STATUS } from '../config/constants.js';

const registrationSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    status: { type: String, enum: REGISTRATION_STATUS, default: 'enrolled' },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// An employee can only register for a given activity once.
registrationSchema.index({ employee: 1, activity: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
