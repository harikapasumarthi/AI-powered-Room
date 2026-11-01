import mongoose from 'mongoose';
import { EVIDENCE_TYPES } from '../config/difficulty.js';

const { Schema } = mongoose;

const suspectSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    publicBio: { type: String, required: true },
    publicAlibi: { type: String, required: true },
    publicMotive: { type: String, required: true },
  },
  { _id: true },
);

const evidenceSchema = new Schema(
  {
    type: { type: String, enum: EVIDENCE_TYPES, required: true },
    title: { type: String, required: true },
    teaser: { type: String, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    source: { type: String, required: true },
    timestamp: { type: String, required: true },
    confidence: {
      type: String,
      enum: ['direct', 'circumstantial', 'testimonial'],
      required: true,
    },
  },
  { _id: true },
);

const timelineEventSchema = new Schema(
  {
    time: { type: String, required: true },
    event: { type: String, required: true },
    sourceEvidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Case.evidence' }],
  },
  { _id: false },
);

const caseSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    premise: { type: String, required: true, minlength: 20, maxlength: 500 },
    genre: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    setting: { type: String, required: true },
    briefing: { type: String, required: true },
    generationMode: { type: String, enum: ['live', 'mock'], required: true },
    suspects: { type: [suspectSchema], required: true },
    evidence: { type: [evidenceSchema], required: true },
    timeline: { type: [timelineEventSchema], required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    completedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, strict: 'throw' },
);

caseSchema.index({ createdAt: -1 });
caseSchema.index({ status: 1 });

export const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);
