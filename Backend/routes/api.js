const express = require("express");
const { getProfile, updateProfile, getStats, resetMilestone, testAlert, banDonor, updateSubathonEndTime } = require("../controllers/profileController");
const { getHistory, replayAlert } = require("../controllers/historyController");
const { createIntent } = require("../controllers/intentController");
const { getLeaderboard } = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/profile/:address", getProfile);
router.post("/profile/:address", updateProfile);
router.get("/history/:address", getHistory);
router.get("/stats/:address", getStats);
router.post("/test-alert/:address", testAlert);
router.post("/profile/:address/reset-milestone", resetMilestone);
router.post("/replay-alert/:id", replayAlert);
router.post("/donation-intent", createIntent);
router.post("/profile/:address/ban", banDonor);
router.get("/leaderboard/:streamer_address", getLeaderboard);
router.post("/profile/:address/subathon", updateSubathonEndTime);

module.exports = router;
