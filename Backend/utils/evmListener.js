const { ethers } = require("ethers");
const { filterMessage } = require("./aiFilter");
const { getPendingMedia } = require("./pendingMedia");
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
 * @param {object} wss The WebSocket server instance.
 * @returns {Promise<void>}
 */
const handleEvent = async (donor, streamer, amount, message, wss) => {
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
      const newCurrent = (profile.milestone_current || 0) + ethAmount;
      const target = profile.milestone_target || 0;

      if (target > 0 && newCurrent >= target) {
        profile.milestone_current = 0;
        console.log(`Milestone reached! Resetting for ${streamer}`);
      } else {
        profile.milestone_current = newCurrent;
      }
      await profile.save();
    }

    const media = getPendingMedia(donor, streamer);

    console.log(`Donation: ${donor} -> ${streamer} | ${ethAmount} ETH${media ? " [+media]" : ""}`);

    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.streamerRoom === streamer.toLowerCase()) {
        client.send(JSON.stringify({
          type: "NEW_DONATION",
          payload: {
            donor,
            streamer,
            amount: amountString,
            message: cleanMessage,
            profile: profile ? profile.toJSON() : null,
            youtube_url: media ? media.youtube_url : null,
            youtube_start: media ? media.youtube_start : 0
          }
        }));
      }
    });
  } catch (error) {
    console.error("Event handler error:", error);
  }
};

/**
 * Initializes the EVM listener using HTTP polling to subscribe to blockchain donation events.
 *
 * @param {object} wss The WebSocket server instance.
 * @returns {void}
 */
const listenToEVM = (wss) => {
  const rpcUrl = process.env.RPC_URL;
  let provider;

  if (rpcUrl.startsWith("ws://") || rpcUrl.startsWith("wss://")) {
    provider = new ethers.WebSocketProvider(rpcUrl);
  } else {
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  const contract = new ethers.Contract(process.env.DONATION_ROUTER_ADDRESS, ROUTER_ABI, provider);

  contract.on("DonationReceived", (donor, streamer, amount, message) => {
    handleEvent(donor, streamer, amount, message, wss);
  });

  console.log("EVM listener active on", rpcUrl);
};

module.exports = { listenToEVM };
