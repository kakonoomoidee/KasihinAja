const { signToken } = require("../utils/token");
const { StreamerProfile } = require("../models");

/**
 * Creates a new donation intent as a stateless signed token with computed media duration capped at 30 minutes.
 *
 * @param {object} req Express request with body: donor_address, streamer_address, amount, donorName, isAnonymous, selectedMedia, mediaLink, youtube_start, media_data.
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
      youtube_start,
      media_data,
    } = req.body;

    if (!donor_address || !streamer_address || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountFloat = parseFloat(amount);

    if (amountFloat < 0.0005) {
      return res.status(400).json({ error: "Minimum tip is 0.0005 ETH" });
    }

    const profile = await StreamerProfile.findByPk(streamer_address.toLowerCase());
    const pricePerSec = profile?.media_price_per_second ?? 0.0005;
    const vnFixedPrice = profile?.vn_fixed_price ?? 0.01;

    let duration = null;

    if (selectedMedia === "vn") {
      if (amountFloat < vnFixedPrice) {
        return res.status(400).json({
          error: `Voice Note requires a minimum tip of ${vnFixedPrice} ETH`,
        });
      }
      duration = 30;
    } else if (selectedMedia === "youtube" || selectedMedia === "tiktok") {
      if (pricePerSec > 0) {
        const rawDuration = Math.floor(amountFloat / pricePerSec);
        duration = Math.min(1800, rawDuration);
      }
      if (!duration || duration < 1) {
        return res.status(400).json({
          error: `Minimum amount for media is ${pricePerSec} ETH (1 second)`,
        });
      }
    }

    const finalName = isAnonymous ? "Anonymous" : (donorName || "Anonymous");
    const resolvedMedia = media_data ? { ...media_data } : {};

    if (selectedMedia && selectedMedia !== "none") {
      resolvedMedia.media_type = selectedMedia;
    }
    if (mediaLink) {
      resolvedMedia.media_link = mediaLink;
    }
    if (duration !== null) {
      resolvedMedia.duration = duration;
    }
    if (youtube_start !== undefined) {
      resolvedMedia.youtube_start = parseInt(youtube_start) || 0;
    }

    const payload = {
      donor_address: donor_address.toLowerCase(),
      streamer_address: streamer_address.toLowerCase(),
      amount: amount.toString(),
      donor_name: finalName,
      media_data: Object.keys(resolvedMedia).length > 0 ? resolvedMedia : null,
    };

    const token = signToken(payload);
    res.json({ token });
  } catch (error) {
    console.error("Intent creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createIntent };
