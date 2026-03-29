const { ethers } = require("ethers");
const { DonationHistory, StreamerProfile } = require("../models");

/**
 * Validates an Ethereum signature for authenticating profile edits.
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
 * Retrieves the donation history for a specific streamer.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const getHistory = async (req, res) => {
  try {
    const { address } = req.params;
    const rows = await DonationHistory.findAll({
      where: { streamer_address: address },
      order: [["created_at", "DESC"]]
    });

    const history = rows.map((r) => ({
      ...r.toJSON(),
      youtube_url: r.media_url || null,
      vn_data: r.vn_url || null,
    }));

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Replays a historical donation by broadcasting to OBS.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const replayAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, payload } = req.body;
    
    if (!payload || !payload.address) {
      res.status(400).json({ error: "Missing address in payload" });
      return;
    }
    
    const address = payload.address;

    if (!verifySignature(address, signature, JSON.stringify(payload))) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const historyRecord = await DonationHistory.findByPk(id);
    if (!historyRecord || historyRecord.streamer_address.toLowerCase() !== address.toLowerCase()) {
      res.status(404).json({ error: "Record not found or unauthorized" });
      return;
    }

    const profile = await StreamerProfile.findByPk(address);
    const wss = req.app.locals.wss;

    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.streamerRoom === address.toLowerCase()) {
          client.send(JSON.stringify({
            type: "VERIFIED_DONATION",
            payload: {
              donor: historyRecord.donor_address,
              streamer: historyRecord.streamer_address,
              amount: historyRecord.amount,
              message: historyRecord.filtered_message,
              profile: profile ? profile.toJSON() : null,
              youtube_url: historyRecord.media_url || null,
              vn_url: historyRecord.vn_url || null,
              vn_data: historyRecord.vn_data || null,
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

module.exports = {
  getHistory,
  replayAlert
};
