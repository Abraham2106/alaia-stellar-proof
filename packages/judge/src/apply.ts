import type { JudgeVerdict } from "./types.js";

export function applyJudge(
  policyDecision: "allow" | "deny",
  verdict: JudgeVerdict,
): "allow" | "deny" | "escalate" {
  if (policyDecision === "deny") {
    return "deny";
  }

  if (
    verdict.codes.includes("schema_invalid") ||
    verdict.codes.includes("runtime_unavailable")
  ) {
    return "escalate";
  }

  if (verdict.label === "allow") {
    const onlyOk =
      verdict.codes.length === 0 ||
      (verdict.codes.length === 1 && verdict.codes[0] === "ok");
    if (onlyOk) {
      return "allow";
    }
    return "escalate";
  }

  return "escalate";
}
