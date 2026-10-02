const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

function resolvePort(port: string): number | null {
  if (port === "") {
    return 80;
  }
  const value = Number(port);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    return null;
  }
  return value;
}

/** DEC-0011: loopback Horizon URL policy before any fetch */
export function assertLocalHorizon(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid horizon URL: ${url}`);
  }

  if (parsed.protocol !== "http:") {
    throw new Error(
      `Horizon must use http; refused scheme "${parsed.protocol.replace(":", "")}"`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new Error("Horizon URL must not include credentials");
  }

  if (parsed.hash) {
    throw new Error("Horizon URL must not include a fragment");
  }

  const host = parsed.hostname.toLowerCase();
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Horizon must be 127.0.0.1 or localhost; refused host "${host}"`,
    );
  }

  if (resolvePort(parsed.port) === null) {
    throw new Error(
      `Horizon must use a valid port; refused port "${parsed.port}"`,
    );
  }
}
