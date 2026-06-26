import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const socialMetricsSchema = new mongoose.Schema(
  {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'employee' },

    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    lob: { type: String, required: true, trim: true }, // Line of Business
    manager: { type: String, required: true, trim: true }, // People Manager (name)
    designation: { type: String, required: true, trim: true },

    // Score buckets — the points engine is the only writer of these.
    participationPoints: { type: Number, default: 0 },
    winnerPoints: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    socialPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0, index: true }, // denormalized = sum of buckets

    activitiesJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
    activitiesWon: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],

    badges: [{ type: String }],
    participationPct: { type: Number, default: 0 }, // derived: joined / total activities

    socialMetrics: { type: socialMetricsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

employeeSchema.index({ department: 1 });
employeeSchema.index({ location: 1 });
employeeSchema.index({ manager: 1 });

// Hash password whenever a plain `password` virtual is set.
employeeSchema.virtual('password').set(function (plain) {
  this._plainPassword = plain;
});

// Hash on pre('validate') (runs BEFORE validation) so the required
// passwordHash field is populated before Mongoose validates the document.
employeeSchema.pre('validate', async function (next) {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
  next();
});

employeeSchema.methods.matchPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak the hash to clients
employeeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
