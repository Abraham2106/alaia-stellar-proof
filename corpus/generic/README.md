# Generic payment corpus

Synthetic Classic XLM payment cases for ALAIA judge and policy review. Files are grouped by expected outcome:

- `approved/` — cases that should pass deterministic `budget-v1` policy and Mapika/decider-0.8b Verify questions with disposition **allow**.
- `rejected/` — cases another agent maintains for expected **deny** or **escalate** outcomes.

Each JSON file has `id`, `expected` (`allow` or `deny`), and `state`: the same object `consider()` serializes for the judge (network, source, sequence, policy, payment, `userIntent`, `untrustedEvidence`).

**Character budget:** keep `JSON.stringify(state)` under **900** characters so the state plus the five fixed judge questions fit the decider context with margin.

**Review:** an external reviewer runs Stellar MCP and other checks before anything is committed; this folder is not self-certifying.

Do not copy hidden grader goldens from `docs/graders/goldens/`.
