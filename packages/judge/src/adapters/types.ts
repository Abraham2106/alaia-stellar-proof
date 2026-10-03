// DEC-0018: System One adapter contract; pipeline is model-agnostic

import type { StrandsJudgeQuestion } from "../strands-questions.js";

export type SystemOneRequest = {
  checkpoint: string;
  state: string;
  questions: readonly StrandsJudgeQuestion[];
};

export type SystemOneAdapter = {
  id: string;
  modelId: string;
  checkpoint: string;
  ask(request: SystemOneRequest): Promise<string>;
};

export class UnknownAdapterError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`unknown judge adapter: ${id}`);
    this.name = "UnknownAdapterError";
    this.id = id;
  }
}
