import { describe, expect, it } from "vitest";
import { confirmAnswers } from "../src/confirm.js";
import type { ConfirmActual, ConfirmGold } from "../src/types.js";

const allowGold: ConfirmGold = {
  recipient_match: 1,
  untrusted_instruction: 0,
  intent_ambiguous: 0,
  disposition: "allow",
  dispute_severity: 0,
};

const matchingActual = (overrides: Partial<ConfirmActual> = {}): ConfirmActual => ({
  recipient_match: 1,
  untrusted_instruction: 0,
  intent_ambiguous: 0,
  disposition: { allow: 0.9, escalate: 0.05, deny: 0.05 },
  dispute_severity: 0,
  ...overrides,
});

describe("confirmAnswers", () => {
  it("confirms when every noul is within band and disposition matches", () => {
    const result = confirmAnswers({
      gold: allowGold,
      actual: matchingActual({
        recipient_match: 0.88,
        untrusted_instruction: 0.1,
        intent_ambiguous: 0.12,
      }),
      neighborIds: ["other-case"],
      caseId: "human-allow",
    });
    expect(result.confirmed).toBe(true);
    expect(result.maxAbsDelta).toBe(0.12);
  });

  it("fails when a noul is outside the band", () => {
    const result = confirmAnswers({
      gold: allowGold,
      actual: matchingActual({ recipient_match: 0.5 }),
      neighborIds: [],
      caseId: "human-allow",
    });
    expect(result.confirmed).toBe(false);
    expect(result.maxAbsDelta).toBe(0.5);
  });

  it("fails when disposition argmax does not match gold", () => {
    const result = confirmAnswers({
      gold: allowGold,
      actual: matchingActual({
        disposition: { allow: 0.2, escalate: 0.5, deny: 0.3 },
      }),
      neighborIds: [],
      caseId: "human-allow",
    });
    expect(result.confirmed).toBe(false);
  });

  it("fails when neighborIds includes the case id", () => {
    const result = confirmAnswers({
      gold: allowGold,
      actual: matchingActual(),
      neighborIds: ["human-allow", "peer"],
      caseId: "human-allow",
    });
    expect(result.confirmed).toBe(false);
    expect(result.maxAbsDelta).toBe(0);
  });
});
