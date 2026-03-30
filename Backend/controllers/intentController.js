const { signToken } = require("../utils/token");

/**
 * Creates a new donation intent as a stateless signed token.
 *
 * @param {object} req Express request with body: donor_address, streamer_address, amount, donorName, isAnonymous, selectedMedia, mediaLink, media_data.
 * @param {object} res Express response.
 * @returns {Promise<void>}
 */
const createIntent = async (req, res) => {
  try {
    const {
      donor_address,
      streamer_address,
      amount,
      donorName,
      isAnonymous,
      selectedMedia,
      mediaLink,
      media_data,
    } = req.body;

    if (!donor_address || !streamer_address || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (parseFloat(amount) < 0.0005) {
      return res.status(400).json({ error: "Minimum tip is 0.0005 ETH" });
    }

    const finalName = isAnonymous ? "Anonymous" : (donorName || "Anonymous");

    const resolvedMedia = media_data || {};

    if (selectedMedia && selectedMedia !== "none") {
      resolvedMedia.media_type = selectedMedia;
    }
    if (mediaLink) {
      resolvedMedia.media_link = mediaLink;
    }

    const payload = {
      donor_address: donor_address.toLowerCase(),
      streamer_address: streamer_address.toLowerCase(),
      amount: amount.toString(),
      donor_name: finalName,
      media_data: Object.keys(resolvedMedia).length > 0 ? resolvedMedia : null,
    };

    const token = signToken(payload);

    console.log("[DEBUG 2] Data encoded into Token:", JSON.stringify({ donor_name: payload.donor_name, media_data: payload.media_data }));

    res.json({ token });
  } catch (error) {
    console.error("Intent creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createIntent };


