import mongoose from 'mongoose';
import { DEFAULT_PARTICIPATION_POINTS, DEFAULT_WINNER_POINTS } from '../config/constants.js';

/**
 * Singleton config doc holding the live, admin-editable point values.
 */
const pointsConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    participationPoints: { type: Number, default: DEFAULT_PARTICIPATION_POINTS },
    winnerPoints: {
      first: { type: Number, default: DEFAULT_WINNER_POINTS.first },
      second: { type: Number, default: DEFAULT_WINNER_POINTS.second },
      third: { type: Number, default: DEFAULT_WINNER_POINTS.third },
    },
  },
  { timestamps: true }
);

// Get the single config doc, creating it with defaults if missing.
pointsConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findOne({ key: 'global' });
  if (!cfg) cfg = await this.create({ key: 'global' });
  return cfg;
};

const PointsConfig = mongoose.model('PointsConfig', pointsConfigSchema);
export default PointsConfig;
