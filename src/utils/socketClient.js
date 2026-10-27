/**
 * Socket.IO expects http(s) base URL — not ws(s).
 * Always use HTTPS long-polling (no wss upgrade) — prod proxy blocks WebSocket.
 */

export function normalizeSocketIoUrl(url) {
  if (!url) return "";
  const trimmed = String(url).trim().replace(/\/$/, "");
  if (trimmed.startsWith("wss://")) return `https://${trimmed.slice(6)}`;
  if (trimmed.startsWith("ws://")) return `http://${trimmed.slice(5)}`;
  return trimmed;
}

/** HTTPS polling only — never upgrade to wss:// */
export function getSocketIoClientOptions(overrides = {}) {
  return {
    transports: ["polling"],
    upgrade: false,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    timeout: 20000,
    ...overrides,
  };
}
