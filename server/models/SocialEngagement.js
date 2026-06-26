import mongoose from 'mongoose';

/**
 * Mirror of data pulled from the organization's existing social engagement
 * platform. `engagementPoints` is folded into the employee total on sync.
 */
const socialEngagementSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true }, // matches Employee.employeeId
    engagementPoints: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const SocialEngagement = mongoose.model('SocialEngagement', socialEngagementSchema);
export default SocialEngagement;
