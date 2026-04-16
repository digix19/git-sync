/**
 * HMAC-SHA256 signing and verification using Web Crypto API.
 * Signatures are returned and expected as lowercase hex strings.
 */

const ALGORITHM = { name: "HMAC", hash: "SHA-256" };

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey("raw", encoder.encode(secret), ALGORITHM, false, [
    "sign",
    "verify",
  ]);
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(str: string): ArrayBuffer {
  const bytes = new Uint8Array(str.length / 2);
  for (let i = 0; i < str.length; i += 2) {
    bytes[i / 2] = parseInt(str.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export async function sign(message: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(ALGORITHM.name, key, encoder.encode(message));
  return bufToHex(signature);
}

export async function verify(
  message: string,
  signatureHex: string,
  secret: string
): Promise<boolean> {
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const signature = hexToBuf(signatureHex);
  return crypto.subtle.verify(ALGORITHM.name, key, signature, encoder.encode(message));
}
