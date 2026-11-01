import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    sessionTokenHash: { type: String, required: true, unique: true },
    lastActivityAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: 'throw' },
);

export const PlayerSession =
  mongoose.models.PlayerSession || mongoose.model('PlayerSession', sessionSchema);
