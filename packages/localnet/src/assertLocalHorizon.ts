const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

/** DEC-0004: happy path must not use a public Horizon URL */
export function assertLocalHorizon(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid horizon URL: ${url}`);
  }

  const host = parsed.hostname.toLowerCase();
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Horizon must be 127.0.0.1 or localhost; refused host "${host}"`,
    );
  }
}
