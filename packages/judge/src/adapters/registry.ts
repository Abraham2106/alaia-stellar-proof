// DEC-0018: adapter registry; default id from ALAIA_JUDGE_ADAPTER

import { deciderAdapter } from "./decider.js";
import { registerStrandsCliAdapter } from "./strands-cli.js";
import type { SystemOneAdapter } from "./types.js";
import { UnknownAdapterError } from "./types.js";

const adapters = new Map<string, SystemOneAdapter>();

export function registerAdapter(adapter: SystemOneAdapter): void {
  adapters.set(adapter.id, adapter);
}

export function getAdapter(id: string): SystemOneAdapter {
  const adapter = adapters.get(id);
  if (!adapter) {
    throw new UnknownAdapterError(id);
  }
  return adapter;
}

export function activeAdapterId(): string {
  return process.env.ALAIA_JUDGE_ADAPTER ?? "decider-0.8b";
}

registerAdapter(deciderAdapter);
registerStrandsCliAdapter();
