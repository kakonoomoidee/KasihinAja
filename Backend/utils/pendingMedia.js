const pendingMedia = new Map();

/**
 * Stores media data for a donor+streamer pair, auto-expires after 60 seconds.
 *
 * @param {string} donor The donor wallet address.
 * @param {string} streamer The streamer wallet address.
 * @param {object} data The media payload (youtube_url, youtube_start).
 * @returns {void}
 */
const addPendingMedia = (donor, streamer, data) => {
  const key = `${donor.toLowerCase()}-${streamer.toLowerCase()}`;
  pendingMedia.set(key, data);
  setTimeout(() => pendingMedia.delete(key), 60000);
};

/**
 * Retrieves and deletes stored media data for a donor+streamer pair.
 *
 * @param {string} donor The donor wallet address.
 * @param {string} streamer The streamer wallet address.
 * @returns {object|null} The media data or null if not found.
 */
const getPendingMedia = (donor, streamer) => {
  const key = `${donor.toLowerCase()}-${streamer.toLowerCase()}`;
  const data = pendingMedia.get(key);
  if (data) pendingMedia.delete(key);
  return data || null;
};

module.exports = { addPendingMedia, getPendingMedia };
