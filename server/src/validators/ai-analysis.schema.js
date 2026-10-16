import { z } from 'zod';

export const IssueCategoryEnum = z.enum([
  'BUG',
  'FEATURE_REQUEST',
  'ENHANCEMENT',
  'DOCUMENTATION',
  'QUESTION',
  'OTHER',
]);

export const IssuePriorityEnum = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]);

export const MissingInfoItemSchema = z.object({
  field: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  importance: z.enum(['required', 'recommended']),
});

export const RawAiAnalysisResponseSchema = z.object({
  category: IssueCategoryEnum,
  priority: IssuePriorityEnum,
  summary: z.string().min(5).max(1000),
  reasoning: z.string().min(5).max(2000),
  suggestedLabels: z.array(z.string()),
  missingInformation: z.array(MissingInfoItemSchema).default([]),
  clarificationCommentDraft: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const IssueAnalysisResultSchema = RawAiAnalysisResponseSchema.extend({
  duplicateCandidates: z.array(z.object({
    issueId: z.string(),
    issueNumber: z.number(),
    title: z.string(),
    similarityScore: z.number(),
    htmlUrl: z.string().url(),
  })).default([]),
});
