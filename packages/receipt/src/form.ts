const HEX64 = /^[0-9a-f]{64}$/;
const POSITIVE_DECIMAL = /^[1-9]\d*$/;
const STROOPS_PATTERN = /^(0|[1-9]\d*)$/;
/** Stellar StrKey account form only; no checksum verification (DEC-0010). */
const STELLAR_G56 = /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/;

export function assertHex64(name: string, value: string): void {
  if (!HEX64.test(value)) {
    throw new Error(`${name} must be a lowercase SHA-256 hex digest`);
  }
}

export function assertPositiveDecimal(name: string, value: string): void {
  if (!POSITIVE_DECIMAL.test(value)) {
    throw new Error(`${name} must be a positive decimal string without leading zeros`);
  }
}

export function assertStroopsField(name: string, value: string): void {
  if (!STROOPS_PATTERN.test(value)) {
    throw new Error(`${name} must be a decimal string without leading zeros`);
  }
}

export function assertStellarG56(name: string, value: string): void {
  if (!STELLAR_G56.test(value)) {
    throw new Error(`${name} must be a 56-character Stellar G public key`);
  }
}

export function assertNonEmptyString(name: string, value: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

export function assertBoundedMetadata(name: string, value: string, max: number): void {
  if (typeof value !== "string" || value.length > max) {
    throw new Error(`${name} exceeds maximum length`);
  }
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}
