// DEC-0009: encrypted signer backup v1 (scrypt + AES-256-GCM, no secret logging).
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";

const BACKUP_VERSION = 1;
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 128 * 1024 * 1024;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const SEED_UTF8_LEN = 56;
const MIN_PASSPHRASE_LEN = 12;
const MAX_PUBLIC_KEY_LEN = 56;
const MAX_B64_FIELD_LEN = 512;
const MAX_BACKUP_JSON_LEN = 4096;

const ALLOWED_BACKUP_KEYS = new Set([
  "version",
  "publicKey",
  "kdf",
  "cipher",
  "saltB64",
  "ivB64",
  "tagB64",
  "ciphertextB64",
]);

const ALLOWED_KDF_KEYS = new Set(["name", "N", "r", "p"]);

export type SignerBackupV1 = {
  version: 1;
  publicKey: string;
  kdf: { name: "scrypt"; N: 32768; r: 8; p: 1 };
  cipher: "aes-256-gcm";
  saltB64: string;
  ivB64: string;
  tagB64: string;
  ciphertextB64: string;
};

function assertPassphrase(passphrase: string): void {
  if (typeof passphrase !== "string" || passphrase.length < MIN_PASSPHRASE_LEN) {
    throw new Error(`passphrase must be at least ${MIN_PASSPHRASE_LEN} characters`);
  }
}

function backupAad(publicKey: string): Buffer {
  return Buffer.from(
    `alaia-signer-backup-v1|${publicKey}|scrypt|N=${SCRYPT_N};r=${SCRYPT_R};p=${SCRYPT_P}`,
    "utf8",
  );
}

function deriveKeyForUse(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
}

function assertPublicKey(publicKey: string): void {
  if (
    typeof publicKey !== "string" ||
    publicKey.length === 0 ||
    publicKey.length > MAX_PUBLIC_KEY_LEN ||
    !publicKey.startsWith("G")
  ) {
    throw new Error("invalid publicKey in backup");
  }
  Keypair.fromPublicKey(publicKey);
}

function decodeB64Field(label: string, value: string, exactLen?: number): Buffer {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_B64_FIELD_LEN) {
    throw new Error(`invalid ${label}`);
  }
  const buf = Buffer.from(value, "base64");
  if (buf.toString("base64") !== value) {
    throw new Error(`invalid ${label}`);
  }
  if (exactLen !== undefined && buf.length !== exactLen) {
    throw new Error(`invalid ${label} length`);
  }
  return buf;
}

export function parseSignerBackupV1(raw: unknown): SignerBackupV1 {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("backup must be a JSON object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_BACKUP_KEYS.has(key)) {
      throw new Error("backup has unknown fields");
    }
  }
  const json = JSON.stringify(obj);
  if (json.length > MAX_BACKUP_JSON_LEN) {
    throw new Error("backup payload too large");
  }
  if (obj.version !== BACKUP_VERSION) {
    throw new Error("unsupported backup version");
  }
  if (obj.cipher !== "aes-256-gcm") {
    throw new Error("unsupported cipher");
  }
  const kdf = obj.kdf;
  if (kdf === null || typeof kdf !== "object" || Array.isArray(kdf)) {
    throw new Error("unsupported KDF parameters");
  }
  const kdfObj = kdf as Record<string, unknown>;
  for (const key of Object.keys(kdfObj)) {
    if (!ALLOWED_KDF_KEYS.has(key)) {
      throw new Error("backup has unknown fields");
    }
  }
  if (
    kdfObj.name !== "scrypt" ||
    kdfObj.N !== SCRYPT_N ||
    kdfObj.r !== SCRYPT_R ||
    kdfObj.p !== SCRYPT_P
  ) {
    throw new Error("unsupported KDF parameters");
  }
  const publicKey = obj.publicKey;
  if (typeof publicKey !== "string") {
    throw new Error("invalid publicKey in backup");
  }
  assertPublicKey(publicKey);
  const saltB64 = obj.saltB64;
  const ivB64 = obj.ivB64;
  const tagB64 = obj.tagB64;
  const ciphertextB64 = obj.ciphertextB64;
  if (
    typeof saltB64 !== "string" ||
    typeof ivB64 !== "string" ||
    typeof tagB64 !== "string" ||
    typeof ciphertextB64 !== "string"
  ) {
    throw new Error("backup missing ciphertext fields");
  }
  decodeB64Field("saltB64", saltB64, SALT_LEN);
  decodeB64Field("ivB64", ivB64, IV_LEN);
  decodeB64Field("tagB64", tagB64, TAG_LEN);
  decodeB64Field("ciphertextB64", ciphertextB64, SEED_UTF8_LEN);
  return {
    version: 1,
    publicKey,
    kdf: { name: "scrypt", N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
    cipher: "aes-256-gcm",
    saltB64,
    ivB64,
    tagB64,
    ciphertextB64,
  };
}

export function createSignerBackup(seed: string, passphrase: string): SignerBackupV1 {
  assertPassphrase(passphrase);
  const keypair = Keypair.fromSecret(seed);
  const publicKey = keypair.publicKey();
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const aad = backupAad(publicKey);
  const derived = deriveKeyForUse(passphrase, salt);
  try {
    const cipher = createCipheriv("aes-256-gcm", derived, iv, { authTagLength: TAG_LEN });
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([
      cipher.update(seed, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    if (tag.length !== TAG_LEN) {
      throw new Error("unexpected auth tag length");
    }
    return {
      version: 1,
      publicKey,
      kdf: { name: "scrypt", N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      cipher: "aes-256-gcm",
      saltB64: salt.toString("base64"),
      ivB64: iv.toString("base64"),
      tagB64: tag.toString("base64"),
      ciphertextB64: ciphertext.toString("base64"),
    };
  } finally {
    derived.fill(0);
  }
}

export function restoreSignerBackup(
  backup: SignerBackupV1 | unknown,
  passphrase: string,
  expectedPublicKey: string,
): string {
  assertPassphrase(passphrase);
  const parsed = parseSignerBackupV1(backup);
  assertPublicKey(expectedPublicKey);
  if (parsed.publicKey !== expectedPublicKey) {
    throw new Error("public key does not match backup");
  }
  const salt = decodeB64Field("saltB64", parsed.saltB64, SALT_LEN);
  const iv = decodeB64Field("ivB64", parsed.ivB64, IV_LEN);
  const tag = decodeB64Field("tagB64", parsed.tagB64, TAG_LEN);
  const ciphertext = decodeB64Field("ciphertextB64", parsed.ciphertextB64);
  const aad = backupAad(parsed.publicKey);
  const derived = deriveKeyForUse(passphrase, salt);
  let plainBuf: Buffer | undefined;
  try {
    const decipher = createDecipheriv("aes-256-gcm", derived, iv, {
      authTagLength: TAG_LEN,
    });
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    plainBuf = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    if (plainBuf.length !== SEED_UTF8_LEN) {
      throw new Error("restored secret does not match expected public key");
    }
    const plain = plainBuf.toString("utf8");
    const restored = Keypair.fromSecret(plain);
    if (restored.publicKey() !== expectedPublicKey) {
      throw new Error("restored secret does not match expected public key");
    }
    return plain;
  } catch (err) {
    if (err instanceof Error && err.message === "public key does not match backup") {
      throw err;
    }
    if (
      err instanceof Error &&
      err.message === "restored secret does not match expected public key"
    ) {
      throw err;
    }
    throw new Error("backup decryption failed");
  } finally {
    if (plainBuf !== undefined) {
      plainBuf.fill(0);
    }
    derived.fill(0);
  }
}
