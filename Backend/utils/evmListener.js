const { ethers } = require("ethers");
const { filterMessage } = require("./aiFilter");
const { DonationHistory, StreamerProfile } = require("../models");

const ROUTER_ABI = [
  "event DonationReceived(address indexed donor, address indexed streamer, uint256 amount, string message)"
];

/**
 * Handles the extraction and storage of a donation event, updates milestones, and broadcasts to WebSockets.
 *
 * @param {string} donor The address of the donor.
 * @param {string} streamer The address assigned to receive the stream tip.
 * @param {bigint} amount The amount sent as a tip.
 * @param {string} message The tip message.
 * @param {object} event The raw ethers event object.
 * @param {object} wss The WebSocket server instance.
 * @returns {Promise<void>}
 */
const handleEvent = async (donor, streamer, amount, message, event, wss) => {
  try {
    const profile = await StreamerProfile.findByPk(streamer);

    let customBlacklist = [];
    if (profile && profile.custom_blacklist) {
      try { customBlacklist = JSON.parse(profile.custom_blacklist); } catch { customBlacklist = []; }
    }

    const cleanMessage = filterMessage(message, customBlacklist);
    const amountString = amount.toString();
    const ethAmount = parseFloat(ethers.formatEther(amount));

    await DonationHistory.create({
      donor_address: donor,
      streamer_address: streamer,
      amount: amountString,
      filtered_message: cleanMessage,
    });

    if (profile) {
      profile.milestone_current = (profile.milestone_current || 0) + ethAmount;
      await profile.save();
    }

    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.streamerRoom === streamer.toLowerCase()) {
        client.send(JSON.stringify({
          type: "NEW_DONATION",
          payload: {
            donor,
            streamer,
            amount: amountString,
            message: cleanMessage,
            profile: profile ? profile.toJSON() : null
          }
        }));
      }
    });
  } catch (error) {
    console.error(error);
  }
};

/**
 * Initializes the EVM listener to subscribe to blockchain tip events.
 *
 * @param {object} wss The WebSocket server instance.
 * @returns {void}
 */
const listenToEVM = (wss) => {
  const provider = new ethers.WebSocketProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.DONATION_ROUTER_ADDRESS, ROUTER_ABI, provider);

  contract.on("DonationReceived", (donor, streamer, amount, message, event) => {
    handleEvent(donor, streamer, amount, message, event, wss);
  });
};

module.exports = { listenToEVM };
