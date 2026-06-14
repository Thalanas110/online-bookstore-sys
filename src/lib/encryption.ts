/**
 * AES-256-GCM Encryption/Decryption utilities using Web Crypto API
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a key to base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import a key from base64 string
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encodedData
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(encryptedString: string, key: CryptoKey): Promise<string> {
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, IV_LENGTH);
  const encryptedData = combined.slice(IV_LENGTH);

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
}

/**
 * Get or create encryption key for the session
 */
export async function getSessionKey(): Promise<CryptoKey> {
  const storedKey = sessionStorage.getItem('encryptionKey');
  
  if (storedKey) {
    return await importKey(storedKey);
  }

  const newKey = await generateKey();
  const exportedKey = await exportKey(newKey);
  sessionStorage.setItem('encryptionKey', exportedKey);
  
  return newKey;
}

/**
 * Clear encryption key from session
 */
export function clearSessionKey(): void {
  sessionStorage.removeItem('encryptionKey');
}
