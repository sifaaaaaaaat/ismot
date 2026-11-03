/**
 * A unique id the browser can always produce.
 *
 * `crypto.randomUUID` only exists in a secure context, and the shop is tested
 * from a phone over plain http on a LAN address — which is not one. Calling it
 * there throws `crypto.randomUUID is not a function` and takes the whole order
 * page down, so fall back to `getRandomValues`, and to Math.random only as a
 * last resort. The value only has to be unique per submission, not a secret.
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  // Shape it like a v4 uuid: version nibble 4, variant nibble 8..b.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
