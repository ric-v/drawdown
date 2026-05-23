import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'node:util';
import {
  deriveKey,
  encryptApiKey,
  decryptApiKey,
  BYOKCryptoUnavailableError,
  EncryptedKey,
} from '../crypto';

// Polyfill WebCrypto and TextEncoder/TextDecoder for jsdom test environment
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: true,
      configurable: true,
    });
  }
  if (typeof globalThis.TextEncoder === 'undefined') {
    Object.defineProperty(globalThis, 'TextEncoder', {
      value: TextEncoder,
      writable: true,
      configurable: true,
    });
  }
  if (typeof globalThis.TextDecoder === 'undefined') {
    Object.defineProperty(globalThis, 'TextDecoder', {
      value: TextDecoder,
      writable: true,
      configurable: true,
    });
  }
});

describe('byok/crypto', () => {
  describe('BYOKCryptoUnavailableError', () => {
    it('throws when crypto.subtle is unavailable', async () => {
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(encryptApiKey('test', 'secret')).rejects.toThrow(
        BYOKCryptoUnavailableError
      );

      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it('throws when crypto.subtle is undefined', async () => {
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        value: { getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto) },
        writable: true,
        configurable: true,
      });

      await expect(encryptApiKey('test', 'secret')).rejects.toThrow(
        BYOKCryptoUnavailableError
      );

      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it('has the correct error name', () => {
      const error = new BYOKCryptoUnavailableError();
      expect(error.name).toBe('BYOKCryptoUnavailableError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('deriveKey', () => {
    it('derives a CryptoKey from a secret and salt', async () => {
      const salt = new Uint8Array(16).fill(1);
      const key = await deriveKey('my-secret', salt);

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
      expect(key.usages).toContain('encrypt');
      expect(key.usages).toContain('decrypt');
      expect(key.extractable).toBe(false);
    });

    it('produces deterministic keys for the same inputs', async () => {
      const salt = new Uint8Array(16).fill(42);
      const secret = 'same-secret';

      // Encrypt with key derived from same inputs twice and verify both can decrypt
      const plaintext = 'test-data-for-determinism';
      const encoder = new TextEncoder();
      const iv = new Uint8Array(12).fill(7);

      const key1 = await deriveKey(secret, salt);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        encoder.encode(plaintext)
      );

      const key2 = await deriveKey(secret, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key2,
        encrypted
      );

      expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
    });

    it('produces different keys for different secrets', async () => {
      const salt = new Uint8Array(16).fill(42);
      const iv = new Uint8Array(12).fill(7);
      const encoder = new TextEncoder();
      const plaintext = 'test-data';

      const key1 = await deriveKey('secret-a', salt);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        encoder.encode(plaintext)
      );

      const key2 = await deriveKey('secret-b', salt);
      // Decrypting with a different key should fail
      await expect(
        crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted)
      ).rejects.toThrow();
    });

    it('produces different keys for different salts', async () => {
      const salt1 = new Uint8Array(16).fill(1);
      const salt2 = new Uint8Array(16).fill(2);
      const iv = new Uint8Array(12).fill(7);
      const encoder = new TextEncoder();
      const plaintext = 'test-data';

      const key1 = await deriveKey('same-secret', salt1);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        encoder.encode(plaintext)
      );

      const key2 = await deriveKey('same-secret', salt2);
      // Decrypting with a key from different salt should fail
      await expect(
        crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted)
      ).rejects.toThrow();
    });
  });

  describe('encryptApiKey', () => {
    it('returns an EncryptedKey envelope with all required fields', async () => {
      const result = await encryptApiKey('sk-test-key-12345', 'user-secret');

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(result.v).toBe(1);
    });

    it('produces base64-encoded strings', async () => {
      const result = await encryptApiKey('sk-test-key-12345', 'user-secret');

      // Base64 strings should only contain valid base64 characters
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(result.ciphertext).toMatch(base64Regex);
      expect(result.iv).toMatch(base64Regex);
      expect(result.salt).toMatch(base64Regex);
    });

    it('produces different ciphertexts for the same input (random IV/salt)', async () => {
      const result1 = await encryptApiKey('same-key', 'same-secret');
      const result2 = await encryptApiKey('same-key', 'same-secret');

      // Due to random IV and salt, ciphertexts should differ
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it('ciphertext does not contain the plaintext', async () => {
      const plaintext = 'sk-super-secret-api-key-value';
      const result = await encryptApiKey(plaintext, 'user-secret');

      // The base64-encoded ciphertext should not contain the plaintext
      expect(result.ciphertext).not.toContain(plaintext);
    });
  });

  describe('decryptApiKey', () => {
    it('round-trips: decrypt(encrypt(plaintext)) === plaintext', async () => {
      const plaintext = 'sk-1234567890abcdef';
      const secret = 'user@example.com+session-token';

      const envelope = await encryptApiKey(plaintext, secret);
      const decrypted = await decryptApiKey(envelope, secret);

      expect(decrypted).toBe(plaintext);
    });

    it('round-trips with various key lengths', async () => {
      const testCases = [
        'sk-short1234567890123', // 20 chars (minimum)
        'sk-' + 'a'.repeat(509), // 512 chars (maximum)
        'sk-medium-length-key-with-special-chars!@#$%^&*()',
      ];

      for (const plaintext of testCases) {
        const envelope = await encryptApiKey(plaintext, 'secret');
        const decrypted = await decryptApiKey(envelope, 'secret');
        expect(decrypted).toBe(plaintext);
      }
    });

    it('fails with wrong secret', async () => {
      const envelope = await encryptApiKey('my-api-key-12345678', 'correct-secret');

      await expect(
        decryptApiKey(envelope, 'wrong-secret')
      ).rejects.toThrow();
    });

    it('fails with tampered ciphertext', async () => {
      const envelope = await encryptApiKey('my-api-key-12345678', 'secret');

      const tampered: EncryptedKey = {
        ...envelope,
        ciphertext: envelope.ciphertext.slice(0, -4) + 'AAAA',
      };

      await expect(decryptApiKey(tampered, 'secret')).rejects.toThrow();
    });

    it('fails with tampered IV', async () => {
      const envelope = await encryptApiKey('my-api-key-12345678', 'secret');

      const tampered: EncryptedKey = {
        ...envelope,
        iv: 'AAAAAAAAAAAAAAAA', // 12 bytes base64
      };

      await expect(decryptApiKey(tampered, 'secret')).rejects.toThrow();
    });
  });
});
