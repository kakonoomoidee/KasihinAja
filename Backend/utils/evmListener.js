const { ethers } = require("ethers");
const { filterMessage } = require("./aiFilter");
const { DonationHistory, StreamerProfile } = require("../models");
const { verifyToken } = require("./token");

const DonationRouter = require("./DonationRouter.json");
const ROUTER_ABI = DonationRouter.abi;

/**
 * Processes an on-chain donation event, verifies the intent token, and broadcasts to OBS.
 *
 * @param {string} donor The donor wallet address.
 * @param {string} streamer The streamer wallet address.
 * @param {bigint} amount The donation amount in wei.
 * @param {string} message The donation message.
 * @param {string} donationToken The off-chain intent UUID.
 * @param {object} wss The WebSocket server instance.
 * @returns {Promise<void>}
 */
const handleEvent = async (donor, streamer, amount, message, donationToken, wss) => {
  try {
    const profile = await StreamerProfile.findByPk(streamer);

    let customBlacklist = [];
    if (profile && profile.custom_blacklist) {
      try { customBlacklist = JSON.parse(profile.custom_blacklist); } catch { customBlacklist = []; }
    }

    const cleanMessage = filterMessage(message, customBlacklist);
    const amountWeiString = amount.toString();
    const ethAmount = parseFloat(ethers.formatEther(amount));

    console.log(`Donation [ON-CHAIN] | ${donor} -> ${streamer} | ${ethAmount} ETH | token=${donationToken || "none"}`);

    let mediaPayload = { media_type: "none", media_link: null, vn_data: null };
    let donorName = "Anonymous";

    if (donationToken) {
      try {
        const decoded = verifyToken(donationToken);
        if (decoded) {
          donorName = decoded.donor_name || "Anonymous";
          if (decoded.media_data) {
            mediaPayload = decoded.media_data;
            console.log("[DEBUG 3] Decoded Token Media Data:", JSON.stringify(mediaPayload));
          } else {
            console.log("Intent [NO_MEDIA] token verified but no media_data present");
          }
        }
      } catch (tokenError) {
        console.error("Token verification failed (non-fatal):", tokenError.message);
      }
    }

    await DonationHistory.create({
      donor_address: donor,
      donor_name: donorName,
      streamer_address: streamer,
      amount: amountWeiString,
      filtered_message: cleanMessage,
      media_type: mediaPayload.media_type || "none",
      media_url: mediaPayload.media_link || null,
      vn_url: mediaPayload.vn_data || null,
    });

    console.log(`Donation [SAVED] | ${donor} -> ${streamer} | ${ethAmount} ETH`);

    if (profile) {
      const newCurrent = parseFloat(profile.milestone_current || 0) + parseFloat(ethAmount);
      const target = parseFloat(profile.milestone_target || 0);

      profile.milestone_current = newCurrent;
      await profile.save();

      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.streamerRoom === streamer.toLowerCase()) {
          client.send(JSON.stringify({
            type: "MILESTONE_UPDATE",
            payload: {
              milestone_current: newCurrent,
              milestone_target: target,
            }
          }));
        }
      });
    }

    const broadcastPayload = {
      donor,
      donor_name: donorName,
      streamer,
      amount: amountWeiString,
      message: cleanMessage,
      profile: profile ? profile.toJSON() : null,
      media_type: mediaPayload.media_type || "none",
      media_url: mediaPayload.media_link || null,
      vn_data: mediaPayload.vn_data || null,
    };

    console.log("[DEBUG 4] Broadcasting VERIFIED_DONATION payload:", JSON.stringify({ donor_name: broadcastPayload.donor_name, media_type: broadcastPayload.media_type, media_url: broadcastPayload.media_url, vn_data: broadcastPayload.vn_data ? "[BASE64_PRESENT]" : null }));

    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.streamerRoom === streamer.toLowerCase()) {
        client.send(JSON.stringify({
          type: "VERIFIED_DONATION",
          payload: broadcastPayload,
        }));
      }
    });

    console.log(`Donation [BROADCAST] | OBS notified for room=${streamer.toLowerCase()}`);
  } catch (error) {
    console.error("Event handler error:", error.message);
  }
};

/**
 * Initializes the EVM listener for on-chain donation events.
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

  contract.on("DonationReceived", (donor, streamer, amount, message, donationToken) => {
    handleEvent(donor, streamer, amount, message, donationToken, wss);
  });

  console.log("EVM listener active on", rpcUrl);
};

module.exports = { listenToEVM };
