/**
 * Formats a total seconds value into a human-readable time string.
 * Includes days when the value is 86400 seconds or more.
 * Format: [Dd ]HH:MM:SS
 *
 * @param {number} totalSeconds The total seconds to format.
 * @returns {string} Zero-padded time string, e.g. "1d 02:30:00" or "02:30:00".
 */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const timeStr = [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
  return d > 0 ? `${d}d ${timeStr}` : timeStr;
}
