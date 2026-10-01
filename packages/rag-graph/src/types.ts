export type CorpusPayment = {
  from: string;
  to: string;
  asset: "native";
  amountStroops: string;
  feeStroops: string;
  memo: string;
};

export type PaymentCandidate = {
  from: string;
  to: string;
  memo?: string;
};

export type GraphStatus = "known" | "unknown";

export type AssessResult = {
  graph: GraphStatus;
  retrieveHits: number;
  accept: boolean;
};
