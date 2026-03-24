const express = require("express");
const { getProfile, updateProfile, getStats, testAlert } = require("../controllers/profileController");
const { getHistory } = require("../controllers/historyController");

const router = express.Router();

router.get("/profile/:address", getProfile);
router.post("/profile/:address", updateProfile);
router.get("/history/:address", getHistory);
router.get("/stats/:address", getStats);
router.post("/test-alert/:address", testAlert);

module.exports = router;
