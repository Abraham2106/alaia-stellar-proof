// DEC-0016: local strands-decider ask; no QVAC
// DEC-0017: Mapika checkpoint via decider.infer; see packages/judge/scripts/decider-ask.py

import type { JudgeCode, JudgeLabel, JudgeVerdict } from "./types.js";

const LABELS: ReadonlySet<string> = new Set(["allow", "escalate", "deny"]);
// stdout `model` is the inference library id, not the HF checkpoint (DEC-0017).
const ACCEPTED_CLI_MODELS: ReadonlySet<string> = new Set([
  "strands-decider-0.1.0",
  "decider-0.8b-v1",
]);

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
}

function schemaInvalidVerdict(): JudgeVerdict {
  return { label: "escalate", codes: ["schema_invalid"] };
}

function readNoulValue(answer: unknown): number | null {
  if (answer === null || typeof answer !== "object" || Array.isArray(answer)) {
    return null;
  }
  const record = answer as Record<string, unknown>;
  const value = record.noul;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    return null;
  }
  return value;
}

function noulYes(value: number): boolean | null {
  if (value > 0.5) return true;
  if (value < 0.5) return false;
  return null;
}

function choiceHasTie(probabilities: Record<string, unknown>): boolean {
  const numeric = Object.values(probabilities).filter(
    (entry): entry is number => typeof entry === "number" && Number.isFinite(entry),
  );
  if (numeric.length === 0) return true;
  const top = Math.max(...numeric);
  return numeric.filter((value) => value === top).length !== 1;
}

function readChoice(answer: unknown): JudgeLabel | null {
  if (answer === null || typeof answer !== "object" || Array.isArray(answer)) {
    return null;
  }
  const record = answer as Record<string, unknown>;
  const choice = record.choice;
  if (typeof choice !== "string" || !LABELS.has(choice)) {
    return null;
  }
  const probabilities = record.probabilities;
  if (
    probabilities === null ||
    typeof probabilities !== "object" ||
    Array.isArray(probabilities)
  ) {
    return null;
  }
  if (choiceHasTie(probabilities as Record<string, unknown>)) {
    return null;
  }
  return choice as JudgeLabel;
}

export function parseStrandsDeciderJson(text: string): JudgeVerdict {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripAnsi(text));
  } catch {
    return schemaInvalidVerdict();
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return schemaInvalidVerdict();
  }

  const root = parsed as Record<string, unknown>;
  if (typeof root.model !== "string" || !ACCEPTED_CLI_MODELS.has(root.model)) {
    return schemaInvalidVerdict();
  }

  const answers = root.answers;
  if (answers === null || typeof answers !== "object" || Array.isArray(answers)) {
    return schemaInvalidVerdict();
  }
  const answerMap = answers as Record<string, unknown>;

  const recipient = readNoulValue(answerMap.noul_0);
  const untrusted = readNoulValue(answerMap.noul_1);
  const ambiguous = readNoulValue(answerMap.noul_2);
  const label = readChoice(answerMap.choice_0);

  if (
    recipient === null ||
    untrusted === null ||
    ambiguous === null ||
    label === null
  ) {
    return schemaInvalidVerdict();
  }

  const recipientYes = noulYes(recipient);
  const untrustedYes = noulYes(untrusted);
  const ambiguousYes = noulYes(ambiguous);
  if (recipientYes === null || untrustedYes === null || ambiguousYes === null) {
    return schemaInvalidVerdict();
  }

  const codes: JudgeCode[] = [];
  if (!recipientYes) {
    codes.push("recipient_mismatch");
  }
  if (untrustedYes) {
    codes.push("untrusted_instruction");
  }
  if (ambiguousYes) {
    codes.push("intent_ambiguous");
  }

  if (label === "allow") {
    if (codes.length === 0) {
      return { label, codes: ["ok"] };
    }
    return { label, codes };
  }

  if (codes.length === 0) {
    return schemaInvalidVerdict();
  }

  return { label, codes };
}
