export type DispositionKey = "allow" | "escalate" | "deny";

export type ConfirmGold = {
  recipient_match: 0 | 1;
  untrusted_instruction: 0 | 1;
  intent_ambiguous: 0 | 1;
  disposition: DispositionKey;
  dispute_severity: number;
};

export type DispositionProbabilities = {
  allow: number;
  escalate: number;
  deny: number;
};

export type ConfirmActual = {
  recipient_match: number;
  untrusted_instruction: number;
  intent_ambiguous: number;
  disposition: DispositionProbabilities;
  dispute_severity: number;
};

export type ConfirmAnswersInput = {
  gold: ConfirmGold;
  actual: ConfirmActual;
  neighborIds: readonly string[];
  caseId: string;
};

export type ConfirmAnswersResult = {
  confirmed: boolean;
  maxAbsDelta: number;
};
