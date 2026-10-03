import { describe, expect, it } from "vitest";
import { parseStrandsDeciderJson } from "../src/strands-parse.js";

function sampleJson(overrides: Record<string, unknown> = {}): string {
  const base = {
    model: "strands-decider-0.1.0",
    answers: {
      noul_0: { type: "noul", noul: 0.9 },
      noul_1: { type: "noul", noul: 0.1 },
      noul_2: { type: "noul", noul: 0.1 },
      choice_0: {
        type: "choice",
        choice: "allow",
        probabilities: { allow: 0.9, escalate: 0.05, deny: 0.05 },
      },
      score_0: { type: "score", score: 0 },
    },
  };
  return JSON.stringify({ ...base, ...overrides });
}

describe("parseStrandsDeciderJson", () => {
  it("returns allow with ok when nouls are clear and choice is allow", () => {
    expect(parseStrandsDeciderJson(sampleJson())).toEqual({
      label: "allow",
      codes: ["ok"],
    });
  });

  it("adds untrusted_instruction when noul_1 is yes", () => {
    const json = sampleJson();
    const parsed = JSON.parse(json) as {
      answers: Record<string, unknown>;
    };
    parsed.answers.noul_1 = { type: "noul", noul: 0.91 };
    parsed.answers.choice_0 = {
      type: "choice",
      choice: "escalate",
      probabilities: { allow: 0.1, escalate: 0.8, deny: 0.1 },
    };
    expect(parseStrandsDeciderJson(JSON.stringify(parsed))).toEqual({
      label: "escalate",
      codes: ["untrusted_instruction"],
    });
  });

  it("escalates schema_invalid on wrong model", () => {
    expect(parseStrandsDeciderJson(sampleJson({ model: "other" }))).toEqual({
      label: "escalate",
      codes: ["schema_invalid"],
    });
  });

  it("rejects the checkpoint id in stdout model; the CLI writes the library version", () => {
    expect(
      parseStrandsDeciderJson(sampleJson({ model: "strands-decider-2B-hobson-v19" })),
    ).toEqual({
      label: "escalate",
      codes: ["schema_invalid"],
    });
  });

  it("parses JSON that rich colored with ANSI", () => {
    const colored = `\u001b[1m${sampleJson()}\u001b[0m`;
    expect(parseStrandsDeciderJson(colored)).toEqual({
      label: "allow",
      codes: ["ok"],
    });
  });

  it("escalates schema_invalid on choice probability tie", () => {
    const json = sampleJson();
    const parsed = JSON.parse(json) as {
      answers: Record<string, unknown>;
    };
    parsed.answers.choice_0 = {
      type: "choice",
      choice: "allow",
      probabilities: { allow: 0.5, escalate: 0.5, deny: 0 },
    };
    expect(parseStrandsDeciderJson(JSON.stringify(parsed))).toEqual({
      label: "escalate",
      codes: ["schema_invalid"],
    });
  });

  it("escalates schema_invalid when deny has no codes", () => {
    const json = sampleJson();
    const parsed = JSON.parse(json) as {
      answers: Record<string, unknown>;
    };
    parsed.answers.choice_0 = {
      type: "choice",
      choice: "deny",
      probabilities: { allow: 0.1, escalate: 0.1, deny: 0.8 },
    };
    expect(parseStrandsDeciderJson(JSON.stringify(parsed))).toEqual({
      label: "escalate",
      codes: ["schema_invalid"],
    });
  });
});
