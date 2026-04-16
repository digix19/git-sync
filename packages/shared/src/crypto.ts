/**
 * AES-GCM-256 encryption/decryption using Web Crypto API.
 * The encryption key must be a 64-character hex string (32 bytes).
 * Ciphertext format: base64(iv):base64(ciphertext)
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 32; // 256 bits

async function getKey(keyHex: string): Promise<CryptoKey> {
  if (keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  const keyBuf = Uint8Array.from(Buffer.from(keyHex, "hex"));
  if (keyBuf.length !== KEY_LENGTH) {
    throw new Error("Invalid ENCRYPTION_KEY length");
  }
  return crypto.subtle.importKey("raw", keyBuf, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function bufToBase64(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64");
}

function base64ToBuf(str: string): ArrayBuffer {
  const b = Buffer.from(str, "base64");
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const key = await getKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
  return `${bufToBase64(iv.buffer)}:${bufToBase64(ciphertext)}`;
}

export async function decrypt(ciphertext: string, keyHex: string): Promise<string> {
  const key = await getKey(keyHex);
  const parts = ciphertext.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Invalid ciphertext format");
  }
  const iv = base64ToBuf(parts[0]);
  const data = base64ToBuf(parts[1]);
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
