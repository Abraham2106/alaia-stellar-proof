#!/usr/bin/env node
// Fixture executable: prints strands-decider ask --json shape (DEC-0016).

const mode = process.env.ALAIA_STRANDS_FIXTURE_MODE ?? "allow";

if (mode === "hang") {
  setInterval(() => {}, 60_000);
} else if (mode === "exit-error") {
  process.exit(2);
} else {
  const payloads = {
    allow: {
      model: "strands-decider-2B-hobson-v19",
      answers: {
        noul_0: { type: "noul", noul: 0.91 },
        noul_1: { type: "noul", noul: 0.08 },
        noul_2: { type: "noul", noul: 0.07 },
        choice_0: {
          type: "choice",
          choice: "allow",
          confidence: 0.82,
          probabilities: { allow: 0.82, escalate: 0.1, deny: 0.08 },
        },
        score_0: { type: "score", score: 0.2, confidence: 0.5 },
      },
    },
    deny_mismatch: {
      model: "strands-decider-2B-hobson-v19",
      answers: {
        noul_0: { type: "noul", noul: 0.12 },
        noul_1: { type: "noul", noul: 0.05 },
        noul_2: { type: "noul", noul: 0.04 },
        choice_0: {
          type: "choice",
          choice: "deny",
          confidence: 0.77,
          probabilities: { allow: 0.08, escalate: 0.15, deny: 0.77 },
        },
        score_0: { type: "score", score: 2.1, confidence: 0.4 },
      },
    },
    invalid_schema: {
      model: "strands-decider-2B-hobson-v19",
      answers: {
        noul_0: { type: "noul", noul: 0.5 },
        noul_1: { type: "noul", noul: 0.1 },
        noul_2: { type: "noul", noul: 0.1 },
        choice_0: {
          type: "choice",
          choice: "allow",
          probabilities: { allow: 0.9, escalate: 0.05, deny: 0.05 },
        },
        score_0: { type: "score", score: 0 },
      },
    },
  };

  const payload = payloads[mode] ?? payloads.allow;
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}
