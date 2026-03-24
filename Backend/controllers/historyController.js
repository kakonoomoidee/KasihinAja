const { DonationHistory } = require("../models");

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
    const history = await DonationHistory.findAll({
      where: { streamer_address: address },
      order: [["created_at", "DESC"]]
    });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getHistory
};
