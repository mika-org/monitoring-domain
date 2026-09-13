/**
 * Domain parsing & sanitization utilities
 * Safe for use in both Client and Server components
 */

export function parseDomainInput(input: string): { host: string; port: number } {
  let cleaned = input.trim();

  // Remove protocols
  if (cleaned.startsWith('https://')) {
    cleaned = cleaned.slice(8);
  } else if (cleaned.startsWith('http://')) {
    cleaned = cleaned.slice(7);
  }

  // Remove URL paths, queries, fragments
  const slashIndex = cleaned.indexOf('/');
  if (slashIndex !== -1) {
    cleaned = cleaned.slice(0, slashIndex);
  }

  const queryIndex = cleaned.indexOf('?');
  if (queryIndex !== -1) {
    cleaned = cleaned.slice(0, queryIndex);
  }

  const hashIndex = cleaned.indexOf('#');
  if (hashIndex !== -1) {
    cleaned = cleaned.slice(0, hashIndex);
  }

  // Extract port if specified (e.g. example.com:8443)
  let port = 443;
  const colonIndex = cleaned.lastIndexOf(':');
  if (colonIndex !== -1 && !cleaned.includes(']')) {
    const portStr = cleaned.slice(colonIndex + 1);
    const parsedPort = parseInt(portStr, 10);
    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
      port = parsedPort;
      cleaned = cleaned.slice(0, colonIndex);
    }
  }

  return {
    host: cleaned.toLowerCase(),
    port,
  };
}
