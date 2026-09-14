/**
 * Provider phone numbers are the only piece of contact PII this app stores.
 * They are encrypted at rest (AES-GCM via the Workers Web Crypto API) and
 * decrypted only inside the Worker, immediately before a CALL-E dispatch or
 * masked-display computation. The plaintext E.164 number never reaches the
 * browser (see `src/domain/types.ts` `Provider.maskedPhone`).
 */

async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): ArrayBuffer {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
}

/** Ciphertext format: `<base64 iv>.<base64 ciphertext>`. */
export async function encryptPhone(
  phoneE164: string,
  encryptionKeyBase64: string,
): Promise<string> {
  const key = await importKey(encryptionKeyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(phoneE164);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptPhone(
  stored: string,
  encryptionKeyBase64: string,
): Promise<string> {
  const [ivPart, ciphertextPart] = stored.split('.');
  if (!ivPart || !ciphertextPart) {
    throw new Error('Malformed phone ciphertext');
  }
  const key = await importKey(encryptionKeyBase64);
  const iv = fromBase64(ivPart);
  const ciphertext = fromBase64(ciphertextPart);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/** Never render more than this; matches the frontend's `maskPhone` shape. */
export function last4(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  return digits.slice(-4);
}
