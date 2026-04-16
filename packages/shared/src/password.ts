/**
 * Password hashing using scrypt via @noble/hashes.
 * Format: $scrypt$N=<N>,r=<r>,p=<p>$<salt_base64>$<hash_base64>
 */

import { scryptAsync } from "@noble/hashes/scrypt";
import { randomBytes } from "@noble/hashes/utils";

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_DKLEN = 32;

function encodeHash(salt: Uint8Array, hash: Uint8Array): string {
  const saltB64 = Buffer.from(salt).toString("base64");
  const hashB64 = Buffer.from(hash).toString("base64");
  return `$scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${saltB64}$${hashB64}`;
}

function parseHash(hashStr: string): { salt: Uint8Array; hash: Uint8Array; N: number; r: number; p: number } | null {
  const parts = hashStr.split("$");
  if (parts.length !== 5 || parts[1] !== "scrypt") return null;
  const params = parts[2];
  const saltB64 = parts[3];
  const hashB64 = parts[4];

  if (!params || !saltB64 || !hashB64) return null;

  const paramMap = new Map<string, number>();
  for (const kv of params.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) paramMap.set(k, Number(v));
  }

  const N = paramMap.get("N") ?? SCRYPT_N;
  const r = paramMap.get("r") ?? SCRYPT_R;
  const p = paramMap.get("p") ?? SCRYPT_P;

  return {
    salt: Uint8Array.from(Buffer.from(saltB64, "base64")),
    hash: Uint8Array.from(Buffer.from(hashB64, "base64")),
    N,
    r,
    p,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, dkLen: SCRYPT_DKLEN });
  return encodeHash(salt, hash);
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  const parsed = parseHash(hashStr);
  if (!parsed) return false;
  const { salt, hash, N, r, p } = parsed;
  const computed = await scryptAsync(password, salt, { N, r, p, dkLen: hash.length });
  if (computed.length !== hash.length) return false;
  let eq = 0;
  for (let i = 0; i < computed.length; i++) {
    eq |= (computed[i] ?? 0) ^ (hash[i] ?? 0);
  }
  return eq === 0;
}
