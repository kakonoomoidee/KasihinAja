const { signToken } = require("../utils/token");

/**
 * Creates a new donation intent as a stateless signed token.
 * This does not save to the database, avoiding the need for a migration.
 * @param {object} req Express request with body: donor_address, streamer_address, amount, media_data.
 * @param {object} res Express response.
 * @returns {Promise<void>}
 */
const createIntent = async (req, res) => {
  try {
    const { donor_address, streamer_address, amount, media_data } = req.body;

    if (!donor_address || !streamer_address || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = {
      donor_address: donor_address.toLowerCase(),
      streamer_address: streamer_address.toLowerCase(),
      amount: amount.toString(),
      media_data: media_data || null,
    };

    const token = signToken(payload);

    console.log("[DEBUG 2] Data encoded into Token:", JSON.stringify(payload.media_data));

    res.json({ token });
  } catch (error) {
    console.error("Intent creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createIntent };

