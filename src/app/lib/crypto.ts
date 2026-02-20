/**
 * AES-GCM encryption with PBKDF2 key derivation.
 * The user's password is NEVER stored — it's used to derive the encryption key.
 * Without the correct password, the encrypted payload is unreadable.
 */

function b64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64decode(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedBundle {
  ciphertext: string; // base64
  salt: string;       // base64
  iv: string;         // base64
}

export async function encryptData(plaintext: string, password: string): Promise<EncryptedBundle> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const enc  = new TextEncoder();

  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: b64encode(ciphertextBuf),
    salt: b64encode(salt.buffer),
    iv:   b64encode(iv.buffer),
  };
}

export async function decryptData(bundle: EncryptedBundle, password: string): Promise<string> {
  const salt           = b64decode(bundle.salt);
  const iv             = b64decode(bundle.iv);
  const ciphertextBytes = b64decode(bundle.ciphertext);
  const key            = await deriveKey(password, salt);

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertextBytes
  );
  return new TextDecoder().decode(plaintextBuf);
}
