import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().trim().optional().default(''),
  GEMINI_API_KEY: z.string().trim().optional().default(''),
  GEMINI_MODEL: z.string().trim().optional().default(''),
  GEMINI_MOCK_MODE: z.enum(['true', 'false']).default('false'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_SAME_SITE: z.enum(['lax', 'none']).default('lax'),
  SESSION_SECRET: z.string().optional().default(''),
  SESSION_MAX_AGE_DAYS: z.coerce.number().int().positive().default(30),
  CASE_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(60),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
});

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const values = parsed.data;

if (values.NODE_ENV === 'production') {
  if (!values.MONGODB_URI) throw new Error('MONGODB_URI is required in production.');
  if (values.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
  }
  if (values.GEMINI_MOCK_MODE === 'true') {
    throw new Error('GEMINI_MOCK_MODE is development-only.');
  }
}

export const env = Object.freeze({
  ...values,
  SESSION_SECRET:
    values.SESSION_SECRET || randomBytes(32).toString('hex'),
  geminiMockMode: values.GEMINI_MOCK_MODE === 'true',
  cookieSameSite: values.COOKIE_SAME_SITE,
});
