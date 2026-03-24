import React, { useState, useEffect } from "react";
import axios from "axios";
import { connectWallet, signPayload } from "../utils/web3";
import { API_URL } from "../utils/config";
import { ethers } from "ethers";

/**
 * Streamer dashboard with glassmorphic sidebar, bento grid layout, and advanced controls.
 *
 * @returns {React.ReactElement} The dashboard React node.
 */
export default function Dashboard() {
  const [address, setAddress] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msgColor, setMsgColor] = useState("#ffffff");
  const [userColor, setUserColor] = useState("#4f46e5");
  const [bgColor, setBgColor] = useState("#000000");
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
        milestone_target: parseFloat(milestoneTarget),
        custom_blacklist: blArray,
        alert_template: alertTemplate,
        enable_media_share: enableMediaShare,
        enable_vn: enableVn,
        banned_keys: bannedKeys,
      };

      const signature = await signPayload(window.signerInstance, payload);

      await axios.post(`${API_URL}/profile/${address}`, {
        signature,
        payload
      });

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
   * Cleanses current session.
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
  const glassLight = "bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl";
  const glassInput = "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 outline-none text-white placeholder-white/40 font-medium";
  const btnPrimary = "bg-blue-500/80 hover:bg-blue-400 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-40";
  const btnGhost = "bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-5 rounded-xl border border-white/20 transition-all cursor-pointer";

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

  const renderContent = () => {
    switch (activeTab) {
      case "overview": {
        const publicUrl = window.location.origin + "/" + address;
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Overview</h2>
            <div className={`${glass} p-6`}>
              <h3 className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Public Donation Link</h3>
              <p className="text-white/50 text-sm mb-3">Share this with your audience</p>
              <div className="flex items-center gap-2">
                <input readOnly value={publicUrl} className={`flex-1 ${glassInput} text-sm font-mono`} />
                <button onClick={() => copyToClipboard(publicUrl)} className={btnPrimary}>Copy</button>
              </div>
            </div>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${glass} p-6`}>
                  <h3 className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Monthly Revenue</h3>
                  <p className="text-3xl font-extrabold text-white">{stats.total_month.toFixed(4)} <span className="text-lg text-white/50">ETH</span></p>
                </div>
                <div className={`${glass} p-6`}>
                  <h3 className="text-xs font-bold text-emerald-300 mb-2 uppercase tracking-wider">Milestone</h3>
                  <p className="text-3xl font-extrabold text-white">{stats.milestone_current.toFixed(4)} <span className="text-lg text-white/40">/ {stats.milestone_target} ETH</span></p>
                </div>
                <div className={`${glass} p-6`}>
                  <h3 className="text-xs font-bold text-amber-300 mb-2 uppercase tracking-wider">Top Supporter</h3>
                  <p className="text-lg font-mono font-bold text-white truncate" title={stats.top_spender}>{stats.top_spender ? `${stats.top_spender.slice(0, 6)}...${stats.top_spender.slice(-4)}` : "None"}</p>
                </div>
              </div>
            ) : <div className="text-center p-12 text-white/40 font-semibold animate-pulse">Loading analytics...</div>}
          </div>
        );
      }
      case "pagesetup":
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Page Setup</h2>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className={`${glass} p-6`}>
                <label className="block text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Avatar</label>
                <div className="flex items-center gap-5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl border-2 border-white/30 object-cover shadow-lg" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                      <span className="text-white/40 text-2xl font-extrabold">?</span>
                    </div>
                  )}
                  <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className={`flex-1 ${glassInput}`} placeholder="https://example.com/avatar.png" />
                </div>
              </div>
              <div className={`${glass} p-6`}>
                <label className="block text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`w-full ${glassInput}`} placeholder="My Stream Name" />
              </div>
              <div className={`${glass} p-6`}>
                <label className="block text-xs font-bold text-blue-300 mb-4 uppercase tracking-wider">Donor Features</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={enableMediaShare} onChange={(e) => setEnableMediaShare(e.target.checked)} className="w-5 h-5 rounded accent-blue-400 cursor-pointer" />
                    <span className="font-semibold text-white/80">Enable Media Share (YouTube)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={enableVn} onChange={(e) => setEnableVn(e.target.checked)} className="w-5 h-5 rounded accent-blue-400 cursor-pointer" />
                    <span className="font-semibold text-white/80">Enable Voice Note</span>
                  </label>
                </div>
              </div>
              <button disabled={loading} type="submit" className={btnPrimary}>{loading ? "Signing..." : "Save Setup"}</button>
            </form>
          </div>
        );
      case "overlay": {
        const secretKey = btoa(address);
        const alertUrl = window.location.origin + "/overlay/alert/" + secretKey;
        const milestoneUrl = window.location.origin + "/overlay/milestone/" + secretKey;
        return (
          <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">OBS Overlay</h2>
                <p className="text-white/40 mt-1 text-sm">Configure alerts and grab your overlay URLs</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(!showPreview)} className={btnGhost}>{showPreview ? "Hide Preview" : "Preview"}</button>
                <button onClick={triggerTestAlert} disabled={loading} className={btnPrimary}>Fire Alert</button>
              </div>
            </div>

            {showPreview && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <p className="text-xs text-white/30 font-bold uppercase tracking-widest mb-4">Live Preview</p>
                {alertTemplate === "minimalist" ? (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 px-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: userColor }} />
                      <span className="text-base font-bold tracking-wide" style={{ color: userColor }}>0xABC1...EF42 tipped 0.42 ETH</span>
                    </div>
                    <p className="text-lg font-semibold break-words leading-relaxed pl-6" style={{ color: msgColor }}>This is a preview of your alert!</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-5 py-5 px-8 rounded-2xl border-2 bg-white/5 backdrop-blur-xl" style={{ borderColor: userColor + "40" }}>
                    {avatarUrl && <img src={avatarUrl} alt="Preview" className="w-16 h-16 rounded-2xl border-2 object-cover shadow-lg" style={{ borderColor: userColor }} />}
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold uppercase tracking-wider" style={{ color: userColor }}>New Tip! 0.42 ETH</span>
                      <span className="text-sm font-semibold opacity-70 mb-1 font-mono" style={{ color: userColor }}>From: 0xABC1...EF42</span>
                      <p className="text-lg font-bold break-words" style={{ color: msgColor }}>This is a preview of your alert!</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${glass} p-6`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Alert URL</h3>
                  <button type="button" onClick={() => setShowAlertUrl(!showAlertUrl)} className="text-xs font-bold text-white/50 hover:text-white bg-white/10 px-3 py-1 rounded-lg transition-colors cursor-pointer">{showAlertUrl ? "Hide" : "Reveal"}</button>
                </div>
                <div className="flex items-center gap-2">
                  <input type={showAlertUrl ? "text" : "password"} readOnly value={alertUrl} className={`flex-1 ${glassInput} text-xs font-mono`} />
                  <button type="button" onClick={() => copyToClipboard(alertUrl)} className={btnPrimary}>Copy</button>
                </div>
              </div>
              <div className={`${glass} p-6`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Milestone URL</h3>
                  <button type="button" onClick={() => setShowMilestoneUrl(!showMilestoneUrl)} className="text-xs font-bold text-white/50 hover:text-white bg-white/10 px-3 py-1 rounded-lg transition-colors cursor-pointer">{showMilestoneUrl ? "Hide" : "Reveal"}</button>
                </div>
                <div className="flex items-center gap-2">
                  <input type={showMilestoneUrl ? "text" : "password"} readOnly value={milestoneUrl} className={`flex-1 ${glassInput} text-xs font-mono`} />
                  <button type="button" onClick={() => copyToClipboard(milestoneUrl)} className={btnPrimary}>Copy</button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className={`${glass} p-6`}>
                <label className="block text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Alert Template</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setAlertTemplate("classic")} className={`py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border ${alertTemplate === "classic" ? "bg-blue-500/40 border-blue-400/60 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>Classic</button>
                  <button type="button" onClick={() => setAlertTemplate("minimalist")} className={`py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border ${alertTemplate === "minimalist" ? "bg-blue-500/40 border-blue-400/60 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>Minimalist</button>
                </div>
              </div>
              <div className={`${glass} p-6`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Message Color</label>
                    <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1"><input type="color" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg" /><input type="text" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Username Color</label>
                    <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1"><input type="color" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg" /><input type="text" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-3 uppercase tracking-wider">Background Color</label>
                    <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1"><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg" /><input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" /></div>
                  </div>
                </div>
              </div>
              <button disabled={loading} type="submit" className={btnPrimary}>{loading ? "Saving..." : "Save Overlay Settings"}</button>
            </form>
          </div>
        );
      }
      case "milestones":
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Milestones</h2>
            <form onSubmit={handleSaveProfile} className={`space-y-5 ${glass} p-6`}>
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-3 uppercase tracking-wider">Donation Goal (ETH)</label>
                <input type="number" step="0.001" value={milestoneTarget} onChange={(e) => setMilestoneTarget(e.target.value)} className={`w-full ${glassInput} font-extrabold`} />
              </div>
              <button disabled={loading} type="submit" className="bg-emerald-500/70 hover:bg-emerald-400 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-40">{loading ? "Saving..." : "Set Milestone"}</button>
            </form>
          </div>
        );
      case "history":
        return (
          <div className="space-y-5 fade-in">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Donation History</h2>
            {history.length === 0 ? (
              <p className={`text-center text-white/40 py-16 font-semibold ${glass}`}>No donations recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {history.map((item) => (
                  <div key={item.id} className={`${glass} p-5`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-blue-300 truncate max-w-[200px]" title={item.donor_address}>{item.donor_address.slice(0, 8)}...{item.donor_address.slice(-6)}</p>
                        <p className="text-xs text-white/30 font-medium mt-1">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <span className="text-lg font-extrabold text-emerald-400 whitespace-nowrap">{ethers.formatEther(item.amount)} ETH</span>
                    </div>
                    <p className="text-white/70 font-medium text-sm break-words leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">{item.filtered_message}</p>
                    <button
                      onClick={() => banKey(item.donor_address)}
                      disabled={bannedKeys.includes(item.donor_address)}
                      className="mt-3 text-xs font-bold text-red-300 bg-red-500/15 hover:bg-red-500/30 border border-red-400/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {bannedKeys.includes(item.donor_address) ? "Already Banned" : "Ban Public Key"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "moderation":
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Moderation</h2>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className={`${glass} p-6`}>
                <label className="block text-xs font-bold text-rose-300 mb-3 uppercase tracking-wider">Custom Banned Words</label>
                <textarea value={blacklistText} onChange={(e) => setBlacklistText(e.target.value)} className={`w-full ${glassInput} min-h-[120px] font-mono text-sm leading-relaxed resize-none`} placeholder="spam, profanity, political" />
              </div>
              <div className={`${glass} p-6`}>
                <label className="block text-xs font-bold text-orange-300 mb-3 uppercase tracking-wider">Banned Public Keys</label>
                {bannedKeys.length === 0 ? (
                  <p className="text-sm text-white/30 font-medium">No banned addresses. Use the History tab to ban donors.</p>
                ) : (
                  <div className="space-y-2">
                    {bannedKeys.map((key) => (
                      <div key={key} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                        <span className="font-mono text-sm font-bold text-white/70 truncate max-w-[300px]" title={key}>{key.slice(0, 10)}...{key.slice(-8)}</span>
                        <button type="button" onClick={() => unbanKey(key)} className="text-xs font-bold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Unban</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button disabled={loading} type="submit" className="bg-rose-500/70 hover:bg-rose-400 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-40">{loading ? "Saving..." : "Apply Rules"}</button>
            </form>
          </div>
        );
      default: return null;
    }
  };

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "pagesetup", label: "Page Setup" },
    { id: "overlay", label: "OBS Overlay" },
    { id: "milestones", label: "Milestones" },
    { id: "history", label: "History" },
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
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
