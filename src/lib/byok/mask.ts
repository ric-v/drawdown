/**
 * Masks an API key, rendering all but the last 4 characters as a uniform mask glyph.
 *
 * @param plaintext - The full API key string to mask
 * @returns The masked string with only the last 4 characters visible
 *
 * @example
 * maskApiKey('sk-abc123456789xyz') // '•••••••••••••xyz'
 * maskApiKey('short') // '•hort'
 * maskApiKey('abcd') // 'abcd'
 * maskApiKey('ab') // 'ab'
 */
export function maskApiKey(plaintext: string): string {
  const MASK_GLYPH = '•';
  const VISIBLE_TAIL = 4;

  if (plaintext.length <= VISIBLE_TAIL) {
    return plaintext;
  }

  const maskedLength = plaintext.length - VISIBLE_TAIL;
  const tail = plaintext.slice(-VISIBLE_TAIL);

  return MASK_GLYPH.repeat(maskedLength) + tail;
}
