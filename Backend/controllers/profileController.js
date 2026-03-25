const { ethers } = require("ethers");
const { StreamerProfile, DonationHistory } = require("../models");

/**
 * Validates an Ethereum signature for authenticating profile edits.
 *
 * @param {string} address The wallet address of the streamer.
 * @param {string} signature The cryptographic signature of the setup payload.
 * @param {string} payloadString The JSON stringified payload data.
 * @returns {boolean} Returns true if the recovered signer matches the given address.
 */
const verifySignature = (address, signature, payloadString) => {
  try {
    const signer = ethers.verifyMessage(payloadString, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch (e) {
    return false;
  }
};

/**
 * Retrieves the setup profile for a specific streamer address.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const getProfile = async (req, res) => {
  try {
    const { address } = req.params;
    const profile = await StreamerProfile.findByPk(address);
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Updates the streamer profile setup data via cryptographic authentication.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const updateProfile = async (req, res) => {
  try {
    const { address } = req.params;
    const { signature, payload } = req.body;

    if (!verifySignature(address, signature, JSON.stringify(payload))) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const { display_name, avatar_url, msg_color, user_color, bg_color, custom_blacklist, milestone_target, enable_media_share, enable_vn, alert_template, banned_keys } = payload;

    const [profile, created] = await StreamerProfile.findOrCreate({
      where: { wallet_address: address },
      defaults: {
        display_name,
        avatar_url,
        msg_color,
        user_color,
        bg_color,
        custom_blacklist: custom_blacklist ? JSON.stringify(custom_blacklist) : "[]",
        milestone_target: milestone_target || 0,
        enable_media_share: enable_media_share || false,
        enable_vn: enable_vn || false,
        alert_template: alert_template || "classic",
        banned_keys: banned_keys ? JSON.stringify(banned_keys) : "[]"
      }
    });

    if (!created) {
      if (display_name !== undefined) profile.display_name = display_name;
      if (avatar_url !== undefined) profile.avatar_url = avatar_url;
      if (msg_color !== undefined) profile.msg_color = msg_color;
      if (user_color !== undefined) profile.user_color = user_color;
      if (bg_color !== undefined) profile.bg_color = bg_color;
      if (custom_blacklist !== undefined) profile.custom_blacklist = JSON.stringify(custom_blacklist);
      if (milestone_target !== undefined) profile.milestone_target = milestone_target;
      if (enable_media_share !== undefined) profile.enable_media_share = enable_media_share;
      if (enable_vn !== undefined) profile.enable_vn = enable_vn;
      if (alert_template !== undefined) profile.alert_template = alert_template;
      if (banned_keys !== undefined) profile.banned_keys = JSON.stringify(banned_keys);
      await profile.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Retrieves analytics statistics for a specific streamer address.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const getStats = async (req, res) => {
  try {
    const { address } = req.params;
    const profile = await StreamerProfile.findByPk(address);
    const history = await DonationHistory.findAll({ where: { streamer_address: address } });
    
    let totalMonth = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const spenders = {};
    
    for (const h of history) {
      const d = new Date(h.created_at);
      const val = parseFloat(ethers.formatEther(h.amount));
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        totalMonth += val;
      }
      spenders[h.donor_address] = (spenders[h.donor_address] || 0) + val;
    }
    
    let topSpender = null;
    let maxSpend = 0;
    for (const [donor, total] of Object.entries(spenders)) {
      if (total > maxSpend) {
        maxSpend = total;
        topSpender = donor;
      }
    }
    
    res.json({
      total_month: totalMonth,
      top_spender: topSpender,
      milestone_current: profile ? profile.milestone_current : 0,
      milestone_target: profile ? profile.milestone_target : 0
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Triggers a simulated WebSocket donation event for exact OBS overlay testing securely.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const testAlert = async (req, res) => {
  try {
    const { address } = req.params;
    const { signature, payload } = req.body;

    if (!verifySignature(address, signature, JSON.stringify(payload))) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const profile = await StreamerProfile.findByPk(address);
    const wss = req.app.locals.wss;

    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.streamerRoom === address.toLowerCase()) {
          client.send(JSON.stringify({
            type: "NEW_DONATION",
            payload: {
              donor: "0xTEST...ABCD",
              streamer: address,
              amount: ethers.parseEther("0.420").toString(),
              message: "This is a test alert to verify your OBS configuration!",
              profile: profile ? profile.toJSON() : null
            }
          }));
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Relays media share data to active OBS overlay WebSocket clients for a specific streamer.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const mediaAttach = async (req, res) => {
  try {
    const { address } = req.params;
    const { youtube_url, youtube_start, donor } = req.body;
    const { addPendingMedia } = require("../utils/pendingMedia");

    addPendingMedia(donor, address, {
      youtube_url: youtube_url || null,
      youtube_start: youtube_start || 0,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStats,
  testAlert,
  mediaAttach
};
