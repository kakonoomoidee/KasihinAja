const GAMBLING_TERMS = ["slot", "gacor", "zeus", "judi", "taruhan", "rtp"];

/**
 * Scans a message for global and custom restricted terms, replacing them safely with asterisks.
 *
 * @param {string} message The original text message from the donation.
 * @param {Array<string>} customBlacklist The customized array of banned words explicitly.
 * @returns {string} The filtered string.
 */
const filterMessage = (message, customBlacklist = []) => {
  if (!message) return "";
  let filtered = message;

  const allTerms = [...GAMBLING_TERMS, ...customBlacklist];

  for (const term of allTerms) {
    if (!term) continue;
    const regex = new RegExp(term, "gi");
    filtered = filtered.replace(regex, "***");
  }

  return filtered;
};

module.exports = { filterMessage };
