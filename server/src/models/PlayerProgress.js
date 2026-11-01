import mongoose from 'mongoose';

const { Schema } = mongoose;

const progressSchema = new Schema(
  {
    caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    sessionTokenHash: { type: String, required: true },
    discoveredEvidenceIds: [{ type: Schema.Types.ObjectId, required: true }],
    pinnedEvidenceIds: [{ type: Schema.Types.ObjectId, required: true }],
    hintsUsed: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '', maxlength: 10000 },
    accusation: {
      suspectId: { type: Schema.Types.ObjectId, default: null },
      reasoning: { type: String, default: '', maxlength: 500 },
      isCorrect: { type: Boolean, default: null },
      submittedAt: { type: Date, default: null },
    },
    score: { type: Number, default: null, min: 0 },
    scoreBreakdown: {
      basePoints: { type: Number, default: 0, min: 0 },
      evidencePoints: { type: Number, default: 0, min: 0 },
      hintPenalty: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: null, min: 0 },
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    lastActivityAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, strict: 'throw' },
);

progressSchema.index({ caseId: 1, sessionTokenHash: 1 }, { unique: true });
progressSchema.index({ expiresAt: 1 });

export const PlayerProgress =
  mongoose.models.PlayerProgress || mongoose.model('PlayerProgress', progressSchema);
