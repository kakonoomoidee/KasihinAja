const { Leaderboard } = require("../models");

/**
 * Retrieves the top 10 donors for a specific streamer sorted by total ETH donated.
 *
 * @param {object} req The Express request object with params.streamer_address.
 * @param {object} res The Express response object.
 * @returns {Promise<void>}
 */
const getLeaderboard = async (req, res) => {
  try {
    const { streamer_address } = req.params;
    const rows = await Leaderboard.findAll({
      where: { streamer_address: streamer_address.toLowerCase() },
      order: [["total_amount_eth", "DESC"]],
      limit: 10,
    });
    res.json(rows.map((r) => r.toJSON()));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getLeaderboard };
