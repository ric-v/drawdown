/**
 * WebCrypto helpers for BYOK API key encryption/decryption.
 *
 * Uses PBKDF2 key derivation → AES-GCM 256-bit encryption.
 * All values in the EncryptedKey envelope are base64-encoded.
 */

/** Envelope representing an encrypted API key at rest. */
export interface EncryptedKey {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
  v: 1; // version field for forward compatibility
}

/** Thrown when crypto.subtle is unavailable (non-secure context). */
export class BYOKCryptoUnavailableError extends Error {
  constructor() {
    super(
      'WebCrypto SubtleCrypto API is not available. ' +
        'BYOK encryption requires a secure context (HTTPS or localhost).'
    );
    this.name = 'BYOKCryptoUnavailableError';
  }
}

/** Number of PBKDF2 iterations for key derivation. */
const PBKDF2_ITERATIONS = 100_000;

/** AES-GCM IV length in bytes. */
const IV_LENGTH = 12;

/** Salt length in bytes. */
const SALT_LENGTH = 16;

/**
 * Asserts that crypto.subtle is available.
 * Throws BYOKCryptoUnavailableError if not in a secure context.
 */
function assertSubtleCryptoAvailable(): void {
  if (
    typeof globalThis.crypto === 'undefined' ||
    typeof globalThis.crypto.subtle === 'undefined'
  ) {
    throw new BYOKCryptoUnavailableError();
  }
}

/** Encode a Uint8Array to a base64 string. */
function toBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/** Decode a base64 string to a Uint8Array. */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an AES-GCM 256-bit CryptoKey from a secret string and salt
 * using PBKDF2 with SHA-256.
 */
export async function deriveKey(
  secret: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  assertSubtleCryptoAvailable();

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt an API key plaintext string using AES-GCM with a PBKDF2-derived key.
 * Returns a base64-encoded EncryptedKey envelope.
 */
export async function encryptApiKey(
  plaintext: string,
  secret: string
): Promise<EncryptedKey> {
  assertSubtleCryptoAvailable();

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(secret, salt);

  const encoder = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    v: 1,
  };
}

/**
 * Decrypt an EncryptedKey envelope back to the plaintext API key string.
 * Uses the same secret that was used during encryption.
 */
export async function decryptApiKey(
  envelope: EncryptedKey,
  secret: string
): Promise<string> {
  assertSubtleCryptoAvailable();

  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.ciphertext);
  const key = await deriveKey(secret, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    ciphertext as unknown as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
