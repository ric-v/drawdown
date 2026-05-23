import { maskApiKey } from '../mask';

describe('maskApiKey', () => {
  it('masks all but the last 4 characters with a uniform glyph', () => {
    expect(maskApiKey('sk-abc123456789xyz')).toBe('••••••••••••••9xyz');
  });

  it('uses the bullet glyph (•) as the mask character', () => {
    const result = maskApiKey('abcdefgh');
    expect(result.slice(0, 4)).toBe('••••');
  });

  it('reveals exactly the last 4 characters', () => {
    const key = 'sk-1234567890abcdef';
    const result = maskApiKey(key);
    expect(result.slice(-4)).toBe('cdef');
  });

  it('preserves the total string length', () => {
    const key = 'sk-proj-abcdefghijklmnop';
    const result = maskApiKey(key);
    expect(result.length).toBe(key.length);
  });

  it('returns the full string when length is exactly 4', () => {
    expect(maskApiKey('abcd')).toBe('abcd');
  });

  it('returns the full string when length is less than 4', () => {
    expect(maskApiKey('ab')).toBe('ab');
    expect(maskApiKey('a')).toBe('a');
  });

  it('returns an empty string for empty input', () => {
    expect(maskApiKey('')).toBe('');
  });

  it('masks a 5-character string showing only the last 4', () => {
    expect(maskApiKey('12345')).toBe('•2345');
  });

  it('handles a typical OpenAI key format', () => {
    const key = 'sk-proj-abc123def456ghi789jkl012mno345pqr678';
    const result = maskApiKey(key);
    expect(result.slice(-4)).toBe('r678');
    expect(result.slice(0, -4)).toBe('•'.repeat(key.length - 4));
  });
});
