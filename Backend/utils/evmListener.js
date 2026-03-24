const { ethers } = require("ethers");
const { filterMessage } = require("./aiFilter");
const { DonationHistory, StreamerProfile } = require("../models");

const ROUTER_ABI = [
  "event DonationReceived(address indexed donor, address indexed streamer, uint256 amount, string message)"
];

/**
 * Handles the extraction and storage of a donation event, communicating the changes to active WebSockets.
 *
 * @param {string} donor The address of the donor.
 * @param {string} streamer The addressed assigned to receive the stream tip.
 * @param {bigint} amount The amount sent as a tip.
 * @param {string} message The tip message.
 * @param {object} event The raw ethers event object.
 * @param {object} wss The WebSocket server instance.
 * @returns {Promise<void>}
 */
const handleEvent = async (donor, streamer, amount, message, event, wss) => {
  try {
    const cleanMessage = filterMessage(message);
    const amountString = amount.toString();

    await DonationHistory.create({
      donor_address: donor,
      streamer_address: streamer,
      amount: amountString,
      filtered_message: cleanMessage,
    });

    const profile = await StreamerProfile.findByPk(streamer);

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
 * Initializes the EVM listener to subscribe to blockchain tip events and stream them to connected WebSocket clients.
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
