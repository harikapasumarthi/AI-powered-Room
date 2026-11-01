import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateContent, clientOptions } = vi.hoisted(() => ({ generateContent: vi.fn(), clientOptions: [] }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
    constructor(options) { clientOptions.push(options); }
  },
}));

beforeEach(() => {
  vi.resetModules();
  generateContent.mockReset();
  clientOptions.length = 0;
  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'unit-test-key';
  process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  process.env.GEMINI_MOCK_MODE = 'false';
  process.env.GEMINI_TIMEOUT_MS = '120000';
});

describe('Gemini output repair', () => {
  it('defaults Gemini requests to a 120-second timeout', async () => {
    delete process.env.GEMINI_TIMEOUT_MS;
    const { env } = await import('../../src/config/env.js');
    expect(env.GEMINI_TIMEOUT_MS).toBe(120000);
  });

  it('repairs malformed JSON once and accepts a valid response', async () => {
    const { createMockCase } = await import('../../src/services/gemini/mockGenerator.js');
    const valid = createMockCase({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium' });
    generateContent
      .mockResolvedValueOnce({ text: '{not json' })
      .mockResolvedValueOnce({ text: JSON.stringify(valid) });

    const { generateMystery } = await import('../../src/services/gemini/geminiService.js');
    const result = await generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium', genre: 'theft', settingPreference: '' });

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(generateContent.mock.calls[0][0]).toMatchObject({
      model: 'gemini-3.8-flash',
      config: { responseMimeType: 'application/json', maxOutputTokens: 12000 },
    });
    expect(clientOptions[0]).toEqual({
      apiKey: 'unit-test-key',
      httpOptions: {
        timeout: 120000,
        retryOptions: { attempts: 1, httpStatusCodes: [503, 504] },
      },
    });
    expect(result.mode).toBe('live');
    expect(result.data.solution.culpritId).toBe(valid.solution.culpritId);
  });

  it('returns a safe invalid-output error after the single repair attempt fails', async () => {
    generateContent.mockResolvedValue({ text: '{broken' });
    const { generateMystery } = await import('../../src/services/gemini/geminiService.js');

    await expect(generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium', genre: 'theft', settingPreference: '' }))
      .rejects.toMatchObject({ code: 'GEMINI_INVALID_OUTPUT', status: 503 });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it.each([
    [400, 'API key not valid', 'configured API key or model access'],
    [404, 'models/gemini-unknown was not found', 'could not find this model'],
    [429, 'RESOURCE_EXHAUSTED: quota exceeded', 'quota is exhausted'],
    [408, 'request timed out', 'service timed out'],
  ])('classifies provider failure status %i without leaking prompt or credentials', async (status, providerMessage, safeMessage) => {
    const secret = 'unit-test-key';
    const premise = 'A sealed archive loses a rare handwritten map overnight.';
    const error = Object.assign(new Error(`${providerMessage}; ${secret}; ${premise}`), { status });
    generateContent.mockRejectedValue(error);
    const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { generateMystery } = await import('../../src/services/gemini/geminiService.js');

    await expect(generateMystery({ premise, difficulty: 'medium', genre: 'theft', settingPreference: '' }))
      .rejects.toMatchObject({ code: 'GEMINI_GENERATION_FAILED', message: expect.stringContaining(safeMessage) });
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.map(([line]) => line).join(' ')).toContain('"status":' + status);
    expect(logSpy.mock.calls.map(([line]) => line).join(' ')).not.toContain(secret);
    expect(logSpy.mock.calls.map(([line]) => line).join(' ')).not.toContain(premise);
    logSpy.mockRestore();
  });

  it('retries only 503/504 twice with exponential delays, then validates the result', async () => {
    const { createMockCase } = await import('../../src/services/gemini/mockGenerator.js');
    const valid = createMockCase({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'easy' });
    const delays = [];
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback, delay) => {
      delays.push(delay);
      queueMicrotask(callback);
      return 0;
    });
    const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    generateContent
      .mockRejectedValueOnce(Object.assign(new Error('temporarily unavailable'), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error('gateway timeout'), { status: 504 }))
      .mockResolvedValueOnce({ text: JSON.stringify(valid) });
    try {
      const { generateMystery } = await import('../../src/services/gemini/geminiService.js');
      const result = await generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'easy', genre: 'theft', settingPreference: '' });
      expect(result.data.suspects).toHaveLength(3);
      expect(result.data.evidence).toHaveLength(5);
      expect(result.data.hints).toHaveLength(2);
      expect(generateContent).toHaveBeenCalledTimes(3);
      expect(delays).toEqual([1000, 2000]);
    } finally {
      timeoutSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it('stops after two retries for repeated temporary provider errors', async () => {
    const delays = [];
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback, delay) => {
      delays.push(delay);
      queueMicrotask(callback);
      return 0;
    });
    const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    generateContent.mockRejectedValue(Object.assign(new Error('service unavailable'), { status: 503 }));
    try {
      const { generateMystery } = await import('../../src/services/gemini/geminiService.js');
      await expect(generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium', genre: 'theft', settingPreference: '' }))
        .rejects.toMatchObject({ code: 'GEMINI_GENERATION_FAILED' });
      expect(generateContent).toHaveBeenCalledTimes(3);
      expect(delays).toEqual([1000, 2000]);
    } finally {
      timeoutSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it('distinguishes an SDK request timeout from a Gemini gateway timeout', async () => {
    generateContent.mockRejectedValue(Object.assign(new Error('Request timed out'), { name: 'RequestTimeoutError' }));
    const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { generateMystery } = await import('../../src/services/gemini/geminiService.js');
    await expect(generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium', genre: 'theft', settingPreference: '' }))
      .rejects.toMatchObject({ message: expect.stringContaining('GEMINI_TIMEOUT_MS') });
    expect(logSpy.mock.calls.map(([line]) => line).join(' ')).toContain('"kind":"timeout"');
    logSpy.mockRestore();
  });

  it('classifies a bare AbortError without treating it as a retryable HTTP status', async () => {
    generateContent.mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
    const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { generateMystery } = await import('../../src/services/gemini/geminiService.js');
    await expect(generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium', genre: 'theft', settingPreference: '' }))
      .rejects.toMatchObject({ message: expect.stringContaining('request was aborted') });
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.map(([line]) => line).join(' ')).toContain('"kind":"request_aborted"');
    logSpy.mockRestore();
  });

  it('classifies fetch failures without logging the provider request', async () => {
    const cause = Object.assign(new Error('socket disconnected'), { code: 'ECONNRESET' });
    generateContent.mockRejectedValue(Object.assign(new TypeError('fetch failed'), { cause }));
    const logSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { generateMystery } = await import('../../src/services/gemini/geminiService.js');
    await expect(generateMystery({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium', genre: 'theft', settingPreference: '' }))
      .rejects.toMatchObject({ code: 'GEMINI_GENERATION_FAILED', message: expect.stringContaining('temporarily unavailable') });
    expect(logSpy.mock.calls.map(([line]) => line).join(' ')).toContain('"kind":"network_error"');
    logSpy.mockRestore();
  });
});
