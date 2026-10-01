export type JudgeLabel = "allow" | "escalate" | "deny";

export type JudgeCode =
  | "ok"
  | "recipient_mismatch"
  | "intent_ambiguous"
  | "untrusted_instruction"
  | "schema_invalid"
  | "runtime_unavailable";

export type JudgeVerdict = {
  label: JudgeLabel;
  codes: JudgeCode[];
};
