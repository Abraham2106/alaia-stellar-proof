import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import {
  createSignerBackup,
  parseSignerBackupV1,
  restoreSignerBackup,
} from "../src/index.ts";

const PASS = "correct-horse-battery";

describe("createSignerBackup / restoreSignerBackup", () => {
  it("roundtrips a signer secret with distinct salt and IV per backup", () => {
    const kp = Keypair.random();
    const a = createSignerBackup(kp.secret(), PASS);
    const b = createSignerBackup(kp.secret(), PASS);
    expect(a.saltB64).not.toBe(b.saltB64);
    expect(a.ivB64).not.toBe(b.ivB64);
    expect(a.ciphertextB64).not.toBe(b.ciphertextB64);
    const restored = restoreSignerBackup(a, PASS, kp.publicKey());
    expect(restored).toBe(kp.secret());
  });

  it("rejects short passphrases on create", () => {
    const kp = Keypair.random();
    expect(() => createSignerBackup(kp.secret(), "short")).toThrow(/12/);
  });

  it("rejects wrong passphrase on restore", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    expect(() =>
      restoreSignerBackup(backup, "wrong-passphrase-12", kp.publicKey()),
    ).toThrow(/decryption failed/);
  });

  it("rejects expected public key mismatch", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const other = Keypair.random().publicKey();
    expect(() => restoreSignerBackup(backup, PASS, other)).toThrow(
      /public key/,
    );
  });

  it("rejects tampered ciphertext", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const tampered = {
      ...backup,
      ciphertextB64: Buffer.from("tampered").toString("base64"),
    };
    expect(() => restoreSignerBackup(tampered, PASS, kp.publicKey())).toThrow(
      /decryption failed|invalid ciphertextB64/,
    );
  });

  it("rejects unknown backup version", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const bad = { ...backup, version: 2 };
    expect(() => restoreSignerBackup(bad, PASS, kp.publicKey())).toThrow(
      /version/,
    );
  });

  it("rejects non-canonical base64 with ignored suffix garbage", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const withGarbage = { ...backup, saltB64: `${backup.saltB64}AA==` };
    expect(() => parseSignerBackupV1(withGarbage)).toThrow(/saltB64/);
  });

  it("rejects base64 fields with interior whitespace", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const spaced = {
      ...backup,
      ivB64: `${backup.ivB64.slice(0, 4)} ${backup.ivB64.slice(4)}`,
    };
    expect(() => parseSignerBackupV1(spaced)).toThrow(/ivB64/);
  });

  it("rejects non-canonical base64 without padding when required", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const unpadded = backup.tagB64.replace(/=+$/, "");
    if (unpadded === backup.tagB64) {
      return;
    }
    const bad = { ...backup, tagB64: unpadded };
    expect(() => parseSignerBackupV1(bad)).toThrow(/tagB64/);
  });

  it("rejects extra nested KDF fields", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const extraKdf = {
      ...backup,
      kdf: { ...backup.kdf, cost: 999 },
    };
    expect(() => parseSignerBackupV1(extraKdf)).toThrow(/unknown fields/);
  });

  it("rejects extra top-level backup fields", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const extra = { ...backup, note: "surprise" };
    expect(() => parseSignerBackupV1(extra)).toThrow(/unknown fields/);
  });

  it("rejects tampered salt, iv, tag, and publicKey on restore", () => {
    const kp = Keypair.random();
    const backup = createSignerBackup(kp.secret(), PASS);
    const saltFlip = {
      ...backup,
      saltB64: Buffer.from(
        Buffer.from(backup.saltB64, "base64").map((b) => b ^ 0xff),
      ).toString("base64"),
    };
    expect(() => restoreSignerBackup(saltFlip, PASS, kp.publicKey())).toThrow(
      /decryption failed/,
    );
    const ivFlip = {
      ...backup,
      ivB64: Buffer.from(
        Buffer.from(backup.ivB64, "base64").map((b) => b ^ 0xff),
      ).toString("base64"),
    };
    expect(() => restoreSignerBackup(ivFlip, PASS, kp.publicKey())).toThrow(
      /decryption failed/,
    );
    const tagFlip = {
      ...backup,
      tagB64: Buffer.from(
        Buffer.from(backup.tagB64, "base64").map((b) => b ^ 0xff),
      ).toString("base64"),
    };
    expect(() => restoreSignerBackup(tagFlip, PASS, kp.publicKey())).toThrow(
      /decryption failed/,
    );
    const pkSwap = {
      ...backup,
      publicKey: Keypair.random().publicKey(),
    };
    expect(() => restoreSignerBackup(pkSwap, PASS, kp.publicKey())).toThrow(
      /public key/,
    );
  });
});
