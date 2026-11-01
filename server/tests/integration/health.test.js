import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('infrastructure health endpoint', () => {
  it('returns API health without exposing infrastructure secrets', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok', database: expect.any(String) } });
    expect(JSON.stringify(response.body)).not.toMatch(/mongodb|gemini|secret|key/i);
  });
});
