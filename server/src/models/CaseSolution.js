import mongoose from 'mongoose';

const { Schema } = mongoose;

const privateClueSchema = new Schema(
  {
    evidenceId: { type: Schema.Types.ObjectId, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
);

const relationshipSchema = new Schema(
  {
    evidenceId: { type: Schema.Types.ObjectId, required: true },
    suspectIds: [{ type: Schema.Types.ObjectId, required: true }],
  },
  { _id: false },
);

const timelineSchema = new Schema(
  {
    time: { type: String, required: true },
    event: { type: String, required: true },
    sourceEvidenceIds: [{ type: Schema.Types.ObjectId, required: true }],
  },
  { _id: false },
);

const solutionSchema = new Schema(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      unique: true,
      required: true,
    },
    culpritId: { type: Schema.Types.ObjectId, required: true },
    motive: { type: String, required: true },
    method: { type: String, required: true },
    explanation: { type: String, required: true },
    completeTimeline: { type: [timelineSchema], required: true },
    timelineReconstruction: { type: [String], required: true },
    decisiveEvidenceIds: [{ type: Schema.Types.ObjectId, required: true }],
    privateClueExplanations: { type: [privateClueSchema], required: true },
    redHerringExplanations: { type: [String], required: true },
    hints: { type: [String], required: true },
    relatedSuspectIdsByEvidence: { type: [relationshipSchema], required: true },
  },
  { timestamps: true, strict: 'throw' },
);

export const CaseSolution =
  mongoose.models.CaseSolution || mongoose.model('CaseSolution', solutionSchema);
