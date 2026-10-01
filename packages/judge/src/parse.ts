import type { JudgeCode, JudgeLabel, JudgeVerdict } from "./types.js";

const LABELS: ReadonlySet<string> = new Set(["allow", "escalate", "deny"]);

const CODES: ReadonlySet<string> = new Set([
  "ok",
  "recipient_mismatch",
  "intent_ambiguous",
  "untrusted_instruction",
  "schema_invalid",
  "runtime_unavailable",
]);

function schemaInvalidVerdict(): JudgeVerdict {
  return { label: "escalate", codes: ["schema_invalid"] };
}

// DEC-0004: parse does not grant permission
export function parseJudgeVerdict(text: string): JudgeVerdict {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return schemaInvalidVerdict();
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return schemaInvalidVerdict();
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 2 || !keys.includes("label") || !keys.includes("codes")) {
    return schemaInvalidVerdict();
  }

  const { label, codes } = record;

  if (typeof label !== "string" || !LABELS.has(label)) {
    return schemaInvalidVerdict();
  }

  if (!Array.isArray(codes)) {
    return schemaInvalidVerdict();
  }

  const normalizedCodes: JudgeCode[] = [];
  for (const entry of codes) {
    if (typeof entry !== "string" || !CODES.has(entry)) {
      return schemaInvalidVerdict();
    }
    normalizedCodes.push(entry as JudgeCode);
  }

  return {
    label: label as JudgeLabel,
    codes: normalizedCodes,
  };
}
