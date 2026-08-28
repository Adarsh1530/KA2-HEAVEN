/**
 * Cryptographic helpers for Vault and E2EE.
 * Browser (WebCrypto) and Node.js compatible helpers.
 */

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== 'undefined'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');
}

// Helper to convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user PIN / Passphrase and Salt using PBKDF2.
 */
export async function deriveVaultKeyWeb(pin: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM in the browser.
 */
export async function encryptVaultDataWeb(
  plainText: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string; authTag?: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(plainText);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      tagLength: 128
    },
    key,
    encodedData as any
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypts AES-256-GCM ciphertext in the browser.
 */
export async function decryptVaultDataWeb(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer as any,
      tagLength: 128
    },
    key,
    ciphertextBuffer as any
  );

  return dec.decode(decryptedBuffer);
}
