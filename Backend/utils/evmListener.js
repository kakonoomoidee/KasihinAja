const { ethers } = require("ethers");
const { filterMessage } = require("./aiFilter");
const { DonationHistory, StreamerProfile, Leaderboard } = require("../models");
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
      customBlacklist = Array.isArray(profile.custom_blacklist)
        ? profile.custom_blacklist
        : [];
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
      media_start: parseInt(mediaPayload.youtube_start) || 0,
      media_duration: parseInt(mediaPayload.duration) || 5,
    });

    console.log(`Donation [SAVED] | ${donor} -> ${streamer} | ${ethAmount} ETH`);

    const [leaderEntry, created] = await Leaderboard.findOrCreate({
      where: {
        streamer_address: streamer.toLowerCase(),
        donor_address: donor.toLowerCase(),
      },
      defaults: {
        donor_name: donorName,
        total_amount_eth: ethAmount,
      },
    });
    if (!created) {
      leaderEntry.total_amount_eth = parseFloat(leaderEntry.total_amount_eth) + ethAmount;
      leaderEntry.donor_name = donorName;
      leaderEntry.updated_at = new Date();
      leaderEntry.changed("total_amount_eth", true);
      await leaderEntry.save();
    }

    if (profile) {
      const newCurrent = parseFloat(profile.milestone_current || 0) + parseFloat(ethAmount);
      const target = parseFloat(profile.milestone_target || 0);

      profile.milestone_current = newCurrent;

      if (profile.is_subathon_active) {
        const rules = Array.isArray(profile.subathon_config) ? profile.subathon_config : [];
        const matched = rules.find((rule) => Math.abs(parseFloat(rule.price_eth) - ethAmount) < 1e-9);
        if (matched) {
          const addedSecs = parseInt(matched.duration_seconds, 10);
          if (addedSecs > 0) {
            const now = Date.now();
            const currentEnd = profile.subathon_end_time ? parseInt(profile.subathon_end_time, 10) : now;
            const newEnd = (currentEnd > now ? currentEnd : now) + addedSecs * 1000;
            profile.subathon_end_time = newEnd;
            console.log(`Subathon [RULE-MATCH] | room=${streamer.toLowerCase()} | rule=${matched.price_eth}ETH -> +${addedSecs}s | newEnd=${new Date(newEnd).toISOString()}`);
            wss.clients.forEach((client) => {
              if (client.readyState === 1 && client.streamerRoom === streamer.toLowerCase()) {
                client.send(JSON.stringify({
                  type: "SUBATHON_UPDATE",
                  payload: {
                    endTime: newEnd,
                    remaining: Math.max(0, (newEnd - now) / 1000),
                    isActive: true,
                  },
                }));
              }
            });
          }
        } else {
          console.log(`Subathon [NO-MATCH] | room=${streamer.toLowerCase()} | amount=${ethAmount}ETH | no rule matched`);
        }
      }

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

    const bannedKeys = Array.isArray(profile?.banned_keys) ? profile.banned_keys : [];
    const isBanned = bannedKeys.includes(donor.toLowerCase());

    const broadcastPayload = isBanned
      ? {
          donor,
          donor_name: "BANNED USER",
          streamer,
          amount: amountWeiString,
          message: "",
          profile: profile ? profile.toJSON() : null,
          media_type: "none",
          media_url: null,
          vn_data: null,
          media_start: 0,
          media_duration: 5,
          media_data: {
            media_type: "none",
            media_link: null,
            youtube_url: null,
            youtube_start: 0,
            duration: 5,
            vn_data: null,
            vn_url: null,
          },
        }
      : {
          donor,
          donor_name: donorName,
          streamer,
          amount: amountWeiString,
          message: cleanMessage,
          profile: profile ? profile.toJSON() : null,
          media_type: mediaPayload.media_type || "none",
          media_url: mediaPayload.media_link || null,
          vn_data: mediaPayload.vn_data || null,
          media_start: parseInt(mediaPayload.youtube_start) || 0,
          media_duration: parseInt(mediaPayload.duration) || 5,
          media_data: {
            media_type: mediaPayload.media_type || "none",
            media_link: mediaPayload.media_link || null,
            youtube_url: mediaPayload.media_link || null,
            youtube_start: parseInt(mediaPayload.youtube_start) || 0,
            duration: parseInt(mediaPayload.duration) || 5,
            vn_data: mediaPayload.vn_data || null,
            vn_url: mediaPayload.vn_url || null,
          },
        };

    console.log(`Donation [BROADCAST] | banned=${isBanned} | room=${streamer.toLowerCase()}`);

    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.streamerRoom === streamer.toLowerCase()) {
        client.send(JSON.stringify({
          type: "VERIFIED_DONATION",
          payload: broadcastPayload,
        }));
      }
    });
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
