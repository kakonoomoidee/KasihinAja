import React, { useState, useEffect } from "react";
import axios from "axios";
import { connectWallet, signPayload } from "../utils/web3";
import { API_URL } from "../utils/config";
import OverviewTab from "../components/dashboard/OverviewTab";
import PageSetupTab from "../components/dashboard/PageSetupTab";
import ObsOverlayTab from "../components/dashboard/ObsOverlayTab";
import MilestonesTab from "../components/dashboard/MilestonesTab";
import HistoryTab from "../components/dashboard/HistoryTab";
import ModerationTab from "../components/dashboard/ModerationTab";

/**
 * Streamer dashboard layout wrapper and shared state manager.
 *
 * @returns {React.ReactElement} The dashboard React node.
 */
export default function Dashboard() {
  const [address, setAddress] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
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
  const [bannedKeys, setBannedKeys] = useState([]);
  const [showAlertUrl, setShowAlertUrl] = useState(false);
  const [showMilestoneUrl, setShowMilestoneUrl] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("kasihinaja_session");
    if (saved && window.ethereum) {
      restoreSession(saved);
    }
  }, []);

  /**
   * Restores a previously authenticated wallet session from localStorage.
   *
   * @param {string} savedAddress The wallet address stored in local storage.
   * @returns {Promise<void>}
   */
  const restoreSession = async (savedAddress) => {
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress) {
        const signer = await provider.getSigner();
        window.signerInstance = signer;
        setAddress(savedAddress);
        setAuthenticated(true);
        fetchData(savedAddress);
      } else {
        localStorage.removeItem("kasihinaja_session");
      }
    } catch {
      localStorage.removeItem("kasihinaja_session");
    }
  };

  /**
   * Cryptographically establishes user identity.
   *
   * @returns {Promise<void>}
   */
  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatus("Awaiting wallet approval...");
      const signer = await connectWallet();
      const userAddress = await signer.getAddress();
      const payload = { timestamp: Date.now() };
      await signPayload(signer, payload);
      window.signerInstance = signer;
      setAddress(userAddress.toLowerCase());
      setAuthenticated(true);
      localStorage.setItem("kasihinaja_session", userAddress.toLowerCase());
      fetchData(userAddress.toLowerCase());
      setStatus("");
    } catch {
      setStatus("Login failed.");
    } finally {
      setLoading(false);
    }
  };

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
   * Cleanses the current session.
   *
   * @returns {void}
   */
  const logout = () => {
    setAuthenticated(false);
    setAddress("");
    localStorage.removeItem("kasihinaja_session");
    window.signerInstance = null;
  };

  const glass = "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl";
  const glassInput = "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 outline-none text-white placeholder-white/40 font-medium";
  const btnPrimary = "bg-blue-500/80 hover:bg-blue-400 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-40";
  const btnGhost = "bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-5 rounded-xl border border-white/20 transition-all cursor-pointer";

  const sharedProps = {
    address, stats, history, loading,
    glassInput, btnPrimary, btnGhost,
    handleSaveProfile, copyToClipboard,
    avatarUrl, setAvatarUrl, displayName, setDisplayName,
    msgColor, setMsgColor, userColor, setUserColor, bgColor, setBgColor,
    milestoneName, setMilestoneName, milestoneTarget, setMilestoneTarget,
    alertTemplate, setAlertTemplate,
    enableMediaShare, setEnableMediaShare, enableVn, setEnableVn,
    blacklistText, setBlacklistText, bannedKeys,
    showAlertUrl, setShowAlertUrl, showMilestoneUrl, setShowMilestoneUrl,
    showPreview, setShowPreview,
    handleResetMilestone, handleReplayAlert, triggerTestAlert,
    banKey, unbanKey,
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`${glass} p-12 text-center max-w-sm w-full shadow-2xl`}>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">KasihinAja</h1>
          <p className="text-white/50 mb-8 text-sm font-medium">Connect your wallet to access dashboard</p>
          <button onClick={handleLogin} disabled={loading} className={`w-full ${btnPrimary} py-4 text-sm tracking-wide`}>
            {loading ? "Signing..." : "Connect MetaMask"}
          </button>
          {status && <p className="mt-6 text-white/90 text-sm font-semibold bg-red-500/20 backdrop-blur-sm py-3 rounded-xl border border-red-400/30">{status}</p>}
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "overview":     return <OverviewTab {...sharedProps} />;
      case "pagesetup":    return <PageSetupTab {...sharedProps} />;
      case "overlay":      return <ObsOverlayTab {...sharedProps} />;
      case "milestones":   return <MilestonesTab {...sharedProps} />;
      case "history":      return <HistoryTab {...sharedProps} />;
      case "moderation":   return <ModerationTab {...sharedProps} />;
      default:             return null;
    }
  };

  const navItems = [
    { id: "overview",   label: "Overview" },
    { id: "pagesetup",  label: "Page Setup" },
    { id: "overlay",    label: "OBS Overlay" },
    { id: "milestones", label: "Milestones" },
    { id: "history",    label: "History" },
    { id: "moderation", label: "Moderation" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col z-10 flex-shrink-0 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-extrabold text-white tracking-tight">KasihinAja</h2>
          <p className="text-xs font-mono font-semibold text-white/30 mt-2 truncate">{address}</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex text-left items-center px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === item.id ? "bg-blue-500/30 text-white border border-blue-400/30 shadow-lg shadow-blue-500/10" : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 font-bold py-3 rounded-xl border border-red-400/20 transition-all text-sm cursor-pointer">Disconnect</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto relative">
        {status && (
          <div className="fixed top-6 right-6 bg-white/10 backdrop-blur-2xl text-white font-semibold py-3 px-6 rounded-2xl border border-white/20 z-50 shadow-2xl text-sm">
            {status}
          </div>
        )}
        <div className="p-6 md:p-10 pb-24 h-full">
          <div className="max-w-5xl mx-auto">
            {renderTab()}
          </div>
        </div>
      </main>
    </div>
  );
}
