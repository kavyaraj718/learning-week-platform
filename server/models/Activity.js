import mongoose from 'mongoose';
import { ACTIVITY_TYPES, DEFAULT_PARTICIPATION_POINTS } from '../config/constants.js';

const activitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    date: { type: Date, required: true },
    time: { type: String, default: '' }, // human-friendly, e.g. "10:00 AM"
    type: { type: String, enum: ACTIVITY_TYPES, default: 'Virtual' },
    participationPoints: { type: Number, default: DEFAULT_PARTICIPATION_POINTS },

    enrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    attended: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],

    winners: {
      first: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
      second: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
      third: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    },

    status: {
      type: String,
      enum: ['upcoming', 'running', 'completed'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

// Virtual: convenience count
activitySchema.virtual('enrolledCount').get(function () {
  return this.enrolled?.length || 0;
});

activitySchema.set('toJSON', { virtuals: true });
activitySchema.set('toObject', { virtuals: true });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
