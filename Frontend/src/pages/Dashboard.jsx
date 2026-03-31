import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signPayload } from "../utils/web3";
import { API_URL } from "../utils/config";

// UI Components
import Sidebar from "../components/dashboard/ui/Sidebar";

// Tabs
import OverviewTab from "../components/dashboard/OverviewTab";
import PageSetupTab from "../components/dashboard/PageSetupTab";
import ObsOverlayTab from "../components/dashboard/ObsOverlayTab";
import MilestonesTab from "../components/dashboard/MilestonesTab";
import HistoryTab from "../components/dashboard/HistoryTab";
import ModerationTab from "../components/dashboard/ModerationTab";
import LeaderboardTab from "../components/dashboard/LeaderboardTab";
import SubathonTab from "../components/dashboard/SubathonTab";

/**
 * Streamer dashboard layout wrapper and shared state manager.
 *
 * @returns {React.ReactElement} The dashboard React node.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msgColor, setMsgColor] = useState("#ffffff");
  const [userColor, setUserColor] = useState("#4f46e5");
  const [bgColor, setBgColor] = useState("#000000");
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneTarget, setMilestoneTarget] = useState(0);
  const [blacklistText, setBlacklistText] = useState("");
  const [alertTemplate, setAlertTemplate] = useState("classic");
  const [enableMediaShare, setEnableMediaShare] = useState(false);
  const [enableVn, setEnableVn] = useState(false);
  const [mediaPricePerSecond, setMediaPricePerSecond] = useState(0.0005);
  const [vnFixedPrice, setVnFixedPrice] = useState(0.01);
  const [bannedKeys, setBannedKeys] = useState([]);
  const [showAlertUrl, setShowAlertUrl] = useState(false);
  const [showMilestoneUrl, setShowMilestoneUrl] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 1. Initial Load & Auth Check
  useEffect(() => {
    const savedAddress = localStorage.getItem("kasihinaja_session");
    if (!savedAddress || !window.ethereum) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        
        if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress) {
          if (!window.signerInstance) {
            window.signerInstance = await provider.getSigner();
          }
          setAddress(savedAddress);
          fetchData(savedAddress);
        } else {
          localStorage.removeItem("kasihinaja_session");
          navigate("/login");
        }
      } catch {
        localStorage.removeItem("kasihinaja_session");
        navigate("/login");
      }
    })();
  }, [navigate]);

  // 2. TRIGGER BARU: Fetch fresh data from DB every time user switches tabs!
  useEffect(() => {
    if (address) {
      fetchData(address);
    }
  }, [activeTab, address]);

  /**
   * Refreshes all metrics and profile details.
   *
   * @param {string} userAddress The wallet address.
   * @returns {Promise<void>}
   */
  const fetchData = async (userAddress) => {
    try {
      const res = await axios.get(`${API_URL}/profile/${userAddress}`);
      if (res.data) {
        setDisplayName(res.data.display_name || "");
        setAvatarUrl(res.data.avatar_url || "");
        setMsgColor(res.data.msg_color || "#ffffff");
        setUserColor(res.data.user_color || "#4f46e5");
        setBgColor(res.data.bg_color || "#000000");
        setMilestoneName(res.data.milestone_name || "");
        setMilestoneTarget(res.data.milestone_target || 0);
        setAlertTemplate(res.data.alert_template || "classic");
        setEnableMediaShare(!!res.data.enable_media_share);
        setEnableVn(!!res.data.enable_vn);
        setMediaPricePerSecond(res.data.media_price_per_second ?? 0.0005);
        setVnFixedPrice(res.data.vn_fixed_price ?? 0.01);
        let bl = [];
        try { bl = JSON.parse(res.data.custom_blacklist || "[]"); } catch { bl = []; }
        setBlacklistText(bl.join(", "));
        let bk = [];
        try { bk = JSON.parse(res.data.banned_keys || "[]"); } catch { bk = []; }
        setBannedKeys(bk);
      }
      const statsRes = await axios.get(`${API_URL}/stats/${userAddress}`);
      setStats(statsRes.data);
      const histRes = await axios.get(`${API_URL}/history/${userAddress}`);
      setHistory(histRes.data);
    } catch {
      setStatus("Background fetch degraded.");
    }
  };

  /**
   * Applies active form settings persistently via Web3 signature.
   *
   * @param {object} e The synthesized React form event.
   * @returns {Promise<void>}
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const blArray = blacklistText.split(",").map(s => s.trim()).filter(s => s.length > 0);
      const payload = {
        display_name: displayName,
        avatar_url: avatarUrl,
        msg_color: msgColor,
        user_color: userColor,
        bg_color: bgColor,
        milestone_name: milestoneName,
        milestone_target: parseFloat(milestoneTarget),
        custom_blacklist: blArray,
        alert_template: alertTemplate,
        enable_media_share: enableMediaShare,
        enable_vn: enableVn,
        banned_keys: bannedKeys,
        media_price_per_second: parseFloat(mediaPricePerSecond),
        vn_fixed_price: parseFloat(vnFixedPrice),
      };
      const signature = await signPayload(window.signerInstance, payload);
      await axios.post(`${API_URL}/profile/${address}`, { signature, payload });
      setStatus("Settings saved successfully!");
      fetchData(address);
    } catch {
      setStatus("Failed to save settings.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Resets the milestone securely using Web3 signature.
   *
   * @returns {Promise<void>}
   */
  const handleResetMilestone = async () => {
    try {
      setLoading(true);
      const payload = { timestamp: Date.now() };
      const signature = await signPayload(window.signerInstance, payload);
      await axios.post(`${API_URL}/profile/${address}/reset-milestone`, { signature, payload });
      setStatus("Milestone reset successfully!");
      fetchData(address);
    } catch {
      setStatus("Reset failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Triggers a replay of a past donation securely via Web3 signature.
   *
   * @param {string} id The donation history ID.
   * @param {string} streamer_address The streamer's address.
   * @returns {Promise<void>}
   */
  const handleReplayAlert = async (id, streamer_address) => {
    try {
      setLoading(true);
      const payload = { timestamp: Date.now(), address: streamer_address };
      const signature = await signPayload(window.signerInstance, payload);
      await axios.post(`${API_URL}/replay-alert/${id}`, { signature, payload });
      setStatus("Alert replayed on OBS!");
    } catch {
      setStatus("Replay failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Triggers a mock WebSocket donation event on the backend for OBS testing.
   *
   * @returns {Promise<void>}
   */
  const triggerTestAlert = async () => {
    try {
      setLoading(true);
      const payload = { test: true, timestamp: Date.now() };
      const signature = await signPayload(window.signerInstance, payload);
      await axios.post(`${API_URL}/test-alert/${address}`, { signature, payload });
      setStatus("Test alert dispatched!");
    } catch {
      setStatus("Alert dispatch failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Copies text to clipboard and shows brief confirmation.
   *
   * @param {string} text The string to copy.
   * @returns {void}
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard!");
    setTimeout(() => setStatus(""), 3000);
  };

  /**
   * Adds a donor public key to the banned list.
   *
   * @param {string} key The public key to ban.
   * @returns {void}
   */
  const banKey = (key) => {
    if (!bannedKeys.includes(key)) {
      setBannedKeys([...bannedKeys, key]);
      setStatus("Key queued for ban. Save to persist.");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Removes a donor public key from the banned list.
   *
   * @param {string} key The public key to unban.
   * @returns {void}
   */
  const unbanKey = (key) => {
    setBannedKeys(bannedKeys.filter(k => k !== key));
    setStatus("Key removed. Save to persist.");
    setTimeout(() => setStatus(""), 3000);
  };

  /**
   * Cleanses the current session and redirects to login.
   *
   * @returns {void}
   */
  const logout = () => {
    setAddress("");
    localStorage.removeItem("kasihinaja_session");
    window.signerInstance = null;
    navigate("/login");
  };

  if (!address) return null;

  const glassInput = "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 outline-none text-white placeholder-white/25 font-medium";

  const sharedProps = {
    address, stats, history, loading,
    glassInput,
    handleSaveProfile, copyToClipboard,
    avatarUrl, setAvatarUrl, displayName, setDisplayName,
    msgColor, setMsgColor, userColor, setUserColor, bgColor, setBgColor,
    milestoneName, setMilestoneName, milestoneTarget, setMilestoneTarget,
    alertTemplate, setAlertTemplate,
    enableMediaShare, setEnableMediaShare, enableVn, setEnableVn,
    mediaPricePerSecond, setMediaPricePerSecond, vnFixedPrice, setVnFixedPrice,
    blacklistText, setBlacklistText, bannedKeys,
    showAlertUrl, setShowAlertUrl, showMilestoneUrl, setShowMilestoneUrl,
    showPreview, setShowPreview,
    handleResetMilestone, handleReplayAlert, triggerTestAlert,
    banKey, unbanKey,
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":     return <OverviewTab {...sharedProps} />;
      case "pagesetup":    return <PageSetupTab {...sharedProps} />;
      case "overlay":      return <ObsOverlayTab {...sharedProps} />;
      case "milestones":   return <MilestonesTab {...sharedProps} />;
      case "history":      return <HistoryTab {...sharedProps} />;
      case "moderation":   return <ModerationTab {...sharedProps} />;
      case "leaderboard":  return <LeaderboardTab {...sharedProps} />;
      case "subathon":     return <SubathonTab {...sharedProps} />;
      default:             return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#091520]">
      <Sidebar 
        address={address} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        logout={logout} 
      />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-32">
        {status && (
          <div className="fixed top-6 right-6 bg-white/10 backdrop-blur-2xl text-white font-semibold py-3 px-6 rounded-2xl border border-white/20 z-50 shadow-2xl text-sm animate-fade-in">
            {status}
          </div>
        )}
        <div className="p-6 md:p-10 h-full">
          <div className="max-w-5xl mx-auto">
            {renderTab()}
          </div>
        </div>
      </main>
    </div>
  );
}