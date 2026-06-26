import mongoose from 'mongoose';
import { POINT_SOURCES } from '../config/constants.js';

/**
 * Append-only audit trail. Every point change written by the points engine
 * creates one of these so totals are always explainable.
 */
const pointsHistorySchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    source: { type: String, enum: POINT_SOURCES, required: true },
    amount: { type: Number, required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const PointsHistory = mongoose.model('PointsHistory', pointsHistorySchema);
export default PointsHistory;
