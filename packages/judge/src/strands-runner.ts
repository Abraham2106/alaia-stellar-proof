// DEC-0016: local strands-decider ask; no QVAC

import { spawn } from "node:child_process";
import { buildStrandsAskArgv, type StrandsJudgeRequest } from "./strands-request.js";

function deciderSpawn(): { command: string; prefixArgs: string[] } {
  const configured = process.env.ALAIA_STRANDS_DECIDER ?? "strands-decider";
  if (configured.endsWith(".mjs") || configured.endsWith(".js")) {
    return { command: process.execPath, prefixArgs: [configured] };
  }
  return { command: configured, prefixArgs: [] };
}

function timeoutMs(): number {
  const value = Number(process.env.ALAIA_STRANDS_TIMEOUT_MS ?? "30000");
  if (!Number.isInteger(value) || value < 1 || value > 120_000) {
    throw new Error("invalid strands timeout");
  }
  return value;
}

export async function runStrandsDecider(request: StrandsJudgeRequest): Promise<string> {
  const { command, prefixArgs } = deciderSpawn();
  const argv = [...prefixArgs, ...buildStrandsAskArgv(request)];

  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, argv, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("strands-decider timed out"));
    }, timeoutMs());

    child.on("error", (error: Error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || "strands-decider exited with error"));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error("empty strands-decider stdout"));
        return;
      }
      resolve(stdout);
    });
  });
}
