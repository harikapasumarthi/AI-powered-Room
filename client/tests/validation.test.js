import { describe, expect, it } from 'vitest';
import { validatePremise } from '../src/utils/validation.js';

describe('case premise validation', () => {
  it('requires at least 20 non-space characters', () => {
    expect(validatePremise('too short')).toMatch(/20 and 500/);
    expect(validatePremise('   '.padEnd(25))).toMatch(/20 and 500/);
  });

  it('accepts premise lengths from 20 through 500', () => {
    expect(validatePremise('A'.repeat(20))).toBe('');
    expect(validatePremise('A'.repeat(500))).toBe('');
  });

  it('rejects overlong premises', () => {
    expect(validatePremise('A'.repeat(501))).toMatch(/20 and 500/);
  });
});
