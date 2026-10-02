import type { Receipt } from "./types.js";

export interface EvidenceEnvelope {
  xdr: string;
  hash: string;
}

export interface ModelArtifact {
  sha256: string;
  source: string;
  runtimeVersion: string;
}

export interface EvidenceBundle {
  version: 1;
  receipt: Receipt;
  memoHash: string;
  networkPassphrase: string;
  sourcePublic: string;
  sequence: string;
  judgeRequestJson?: string;
  envelope?: EvidenceEnvelope;
  transactionHash?: string;
  modelArtifact?: ModelArtifact;
  manifestHash: string;
}

export interface CreateEvidenceBundleInput {
  receipt: Receipt;
  networkPassphrase: string;
  sourcePublic: string;
  sequence: string;
  judgeRequestJson?: string;
  envelope?: EvidenceEnvelope;
  transactionHash?: string;
  modelArtifact?: ModelArtifact;
}
