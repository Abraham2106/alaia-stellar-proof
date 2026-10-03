// DEC-0016: strands-decider CLI (StrandsAgents/strands-decider-2B-hobson-v19)
// DEC-0018: historical 2B System One adapter

import { spawn } from "node:child_process";
import type { SystemOneAdapter, SystemOneRequest } from "./types.js";

function buildStrandsAskArgv(request: SystemOneRequest): string[] {
  const argv = ["ask", request.checkpoint, "--state", request.state];
  for (const question of request.questions) {
    if (question.type === "noul") {
      argv.push("--noul", question.text);
    } else if (question.type === "choice") {
      argv.push("--choice", question.text);
    } else {
      argv.push("--score", question.text);
    }
  }
  argv.push("--json");
  return argv;
}

const DEFAULT_STRANDS_DECIDER = "strands-decider";

function strandsDeciderSpawn(): {
  command: string;
  prefixArgs: string[];
  env: NodeJS.ProcessEnv;
} {
  const configured = process.env.ALAIA_STRANDS_DECIDER ?? DEFAULT_STRANDS_DECIDER;
  const env: NodeJS.ProcessEnv = { ...process.env, USE_HUB_KERNELS: "NO" };
  if (configured.endsWith(".mjs") || configured.endsWith(".js")) {
    return { command: process.execPath, prefixArgs: [configured], env };
  }
  if (configured.endsWith(".py")) {
    const python = process.env.ALAIA_STRANDS_PYTHON ?? "python3";
    return { command: python, prefixArgs: [configured], env };
  }
  return { command: configured, prefixArgs: [], env };
}

function timeoutMs(): number {
  const value = Number(process.env.ALAIA_STRANDS_TIMEOUT_MS ?? "30000");
  if (!Number.isInteger(value) || value < 1 || value > 120_000) {
    throw new Error("invalid strands timeout");
  }
  return value;
}

async function askStrandsCli(request: SystemOneRequest): Promise<string> {
  const { command, prefixArgs, env } = strandsDeciderSpawn();
  const argv = [...prefixArgs, ...buildStrandsAskArgv(request)];

  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, argv, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      env,
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

export const strandsCliAdapter: SystemOneAdapter = {
  id: "strands-decider",
  modelId: "strands-decider-2B-hobson-v19",
  checkpoint: "StrandsAgents/strands-decider-2B-hobson-v19",
  ask: askStrandsCli,
};

export function registerStrandsCliAdapter(
  register: (adapter: SystemOneAdapter) => void,
): void {
  register(strandsCliAdapter);
}
