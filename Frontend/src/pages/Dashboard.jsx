import React, { useState } from "react";
import axios from "axios";
import { connectWallet, signPayload } from "../utils/web3";
import { API_URL } from "../utils/config";
import { ethers } from "ethers";

/**
 * Streamer dashboard housing sidebar routing connecting profile metrics securely.
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
  const [milestoneTarget, setMilestoneTarget] = useState(0);
  const [blacklistText, setBlacklistText] = useState("");
  const [showObsUrl, setShowObsUrl] = useState(false);

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
      fetchData(userAddress.toLowerCase());
      setStatus("");
    } catch {
      setStatus("Login failed securely.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refreshes all metrics and profile details efficiently.
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
        
        let bl = [];
        try { bl = JSON.parse(res.data.custom_blacklist || "[]"); } catch { bl = []; }
        setBlacklistText(bl.join(", "));
      }
      
      const statsRes = await axios.get(`${API_URL}/stats/${userAddress}`);
      setStats(statsRes.data);

      const histRes = await axios.get(`${API_URL}/history/${userAddress}`);
      setHistory(histRes.data);
    } catch {
      setStatus("Warning: Background fetch synchronization degraded.");
    }
  };

  /**
   * Applies the exact active form settings persistently.
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
      };
      
      const signature = await signPayload(window.signerInstance, payload);
      
      await axios.post(`${API_URL}/profile/${address}`, {
        signature,
        payload
      });
      
      setStatus("Settings saved successfully!");
      fetchData(address);
    } catch {
      setStatus("Failed to commit settings stably.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Commands the endpoint securely generating a mock donation event.
   *
   * @returns {Promise<void>}
   */
  const triggerTestAlert = async () => {
    try {
      setLoading(true);
      const payload = { test: true, timestamp: Date.now() };
      const signature = await signPayload(window.signerInstance, payload);
      await axios.post(`${API_URL}/test-alert/${address}`, { signature, payload });
      setStatus("Test alert successfully dispatched!");
    } catch {
      setStatus("Failed to trigger alert.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Copies the provided text to the user's clipboard and triggers a brief status verification.
   *
   * @param {string} text The string payload targeting the clipboard.
   * @returns {void}
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatus("Link copied to clipboard!");
    setTimeout(() => setStatus(""), 3000);
  };

  /**
   * Cleanses current internal cache securely.
   *
   * @returns {void}
   */
  const logout = () => {
    setAuthenticated(false);
    setAddress("");
    window.signerInstance = null;
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-sm w-full border border-gray-100">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 mb-2 tracking-tight">Creator Hub</h1>
          <p className="text-gray-500 mb-8 text-sm font-medium">Authenticate your digital identity to securely access settings.</p>
          <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md mt-1 disabled:opacity-50">
            {loading ? "Approving Signatures..." : "Secure Login via MetaMask"}
          </button>
          {status && <p className="mt-4 text-red-500 text-sm font-bold bg-red-50 py-2 rounded-xl border border-red-100">{status}</p>}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview": {
        const publicUrl = window.location.origin + "/" + address;
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Financial Overview</h2>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">Public Donation Portal</h3>
              <p className="text-gray-600 font-medium mb-3 text-sm">Share this unique URL with your audience to start receiving tips!</p>
              <div className="flex items-center gap-3">
                <input readOnly value={publicUrl} className="flex-1 bg-white border border-blue-200 rounded-xl p-3 font-mono text-sm text-blue-900 outline-none shadow-inner" />
                <button onClick={() => copyToClipboard(publicUrl)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md">Copy Link</button>
              </div>
            </div>

            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="text-sm font-bold text-indigo-800 mb-2 uppercase tracking-wide">Monthly Revenue</h3>
                  <p className="text-3xl font-black text-indigo-600">{stats.total_month.toFixed(4)} <span className="text-lg">ETH</span></p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="text-sm font-bold text-emerald-800 mb-2 uppercase tracking-wide">Active Milestones</h3>
                  <p className="text-3xl font-black text-emerald-600">{stats.milestone_current.toFixed(4)} <span className="text-lg text-emerald-500 font-bold opacity-80">/ {stats.milestone_target} ETH</span></p>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">Top Supporter</h3>
                  <p className="text-lg font-mono font-black text-amber-600 truncate" title={stats.top_spender}>{stats.top_spender ? `${stats.top_spender.slice(0,6)}...${stats.top_spender.slice(-4)}` : "None"}</p>
                </div>
              </div>
            ) : <div className="text-center p-12 text-gray-400 font-bold animate-pulse">Loading Analytics Metrics...</div>}
          </div>
        );
      }
      case "pagesetup":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Page Identity configuration</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6 pt-2">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Display Name Title</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full border-gray-300 rounded-xl p-3.5 bg-white border outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800" placeholder="My Stream Tag" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Avatar Remote Graphic Link</label>
                <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full border-gray-300 rounded-xl p-3.5 bg-white border outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800" placeholder="https://..." />
              </div>
              <button disabled={loading} type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-8 rounded-xl transition-all shadow-md cursor-pointer">{loading ? "Signing..." : "Save Identity Setup"}</button>
            </form>
          </div>
        );
      case "overlay": {
        const secretKey = btoa(address);
        const obsUrl = window.location.origin + "/overlay/" + secretKey;
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">OBS Overlay Tuning</h2>
                <p className="text-gray-500 mt-2 font-medium">Fine-tune your transparent interactive notifications.</p>
              </div>
              <button onClick={triggerTestAlert} disabled={loading} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50">Fire Mock Test Alert</button>
            </div>
            
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wide">OBS Browser Source URL</h3>
                <button type="button" onClick={() => setShowObsUrl(!showObsUrl)} className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-100 px-3 py-1 rounded-lg transition-colors shadow-sm">
                  {showObsUrl ? "Hide Remote Key" : "Reveal Source Key"}
                </button>
              </div>
              <p className="text-gray-700 font-medium mb-3 text-sm">Add this protected unique link as a Browser Source in your streaming software! Make sure the background is completely transparent.</p>
              <div className="flex items-center gap-3">
                <input type={showObsUrl ? "text" : "password"} readOnly value={obsUrl} className="flex-1 bg-white border border-rose-200 rounded-xl p-3 font-mono text-sm text-rose-900 outline-none shadow-inner" />
                <button type="button" onClick={() => copyToClipboard(obsUrl)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md">Copy Link</button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Donor Message</label>
                  <div className="flex gap-2 bg-white border border-gray-300 rounded-xl p-1 shadow-sm"><input type="color" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded" /><input type="text" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-bold text-gray-700 outline-none uppercase" /></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Streamer Output</label>
                  <div className="flex gap-2 bg-white border border-gray-300 rounded-xl p-1 shadow-sm"><input type="color" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded" /><input type="text" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-bold text-gray-700 outline-none uppercase" /></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Notification Theme</label>
                  <div className="flex gap-2 bg-white border border-gray-300 rounded-xl p-1 shadow-sm"><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded" /><input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-bold text-gray-700 outline-none uppercase" /></div>
                </div>
              </div>
              <button disabled={loading} type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-8 rounded-xl transition-all shadow-md cursor-pointer">{loading ? "Synchronizing Web3..." : "Save Overlay Palette"}</button>
            </form>
          </div>
        );
      }
      case "milestones":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Growth Objectives Tracking</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6 pt-2 bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Absolute Network Tracking Minimums (ETH)</label>
                <input type="number" step="0.001" value={milestoneTarget} onChange={(e) => setMilestoneTarget(e.target.value)} className="w-full border-gray-300 rounded-xl p-3.5 bg-white border outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-gray-900" />
              </div>
              <button disabled={loading} type="submit" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-8 rounded-xl transition-all shadow-md">{loading ? "Validating Form..." : "Lock Milestone Values"}</button>
            </form>
          </div>
        );
      case "moderation":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI Logic Content Moderation</h2>
            <p className="text-gray-500 font-medium">Extend our universal gambling blacklists directly over custom terms explicitly input below.</p>
            <form onSubmit={handleSaveProfile} className="space-y-6 bg-rose-50 border border-rose-100 rounded-2xl p-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">JSON Parsed Custom Blacklist (Comma split terms)</label>
                <textarea value={blacklistText} onChange={(e) => setBlacklistText(e.target.value)} className="w-full border-gray-300 rounded-xl p-3.5 bg-white border outline-none focus:ring-2 focus:ring-rose-500 min-h-[160px] font-mono text-sm text-gray-700 leading-relaxed resize-none" placeholder="spam, profanity, political, bots" />
              </div>
              <button disabled={loading} type="submit" className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 px-8 rounded-xl transition-all shadow-md">{loading ? "Transmitting Limits..." : "Apply AI String Filters"}</button>
            </form>
          </div>
        );
      case "history":
        return (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-6">Verified Network Ledger Transactions</h2>
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-2xl bg-white">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-16 font-bold bg-gray-50/50">Empty network ledger outputs available for scanning.</p>
              ) : (
                <table className="min-w-full text-left bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200">
                      <th className="py-5 px-6 font-extrabold">Network Timestamp</th>
                      <th className="py-5 px-6 font-extrabold">Origin Donor Mask</th>
                      <th className="py-5 px-6 font-extrabold">Quantity (ETH)</th>
                      <th className="py-5 px-6 font-extrabold">Redacted Payload Transmission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap font-semibold">{new Date(item.created_at).toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm font-mono tracking-tight text-indigo-600 truncate max-w-[140px]" title={item.donor_address}>{item.donor_address.slice(0,8)}...{item.donor_address.slice(-6)}</td>
                        <td className="py-4 px-6 text-sm font-extrabold text-emerald-600">{ethers.formatEther(item.amount)}</td>
                        <td className="py-4 px-6 text-sm text-gray-800 break-words max-w-sm font-medium leading-relaxed">{item.filtered_message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const navItems = [
    { id: "overview", label: "Overview Tracking" },
    { id: "pagesetup", label: "Page Appearance" },
    { id: "overlay", label: "OBS Overlay Alerts" },
    { id: "milestones", label: "Financial Objective Limits" },
    { id: "history", label: "Complete Tipping Ledgers" },
    { id: "moderation", label: "String Filter Moderation" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 flex-shrink-0">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
            KasihinAja Hub
          </h2>
          <p className="text-xs font-mono font-bold text-gray-500 mt-2 truncate bg-gray-100 px-2 py-1 rounded-md">{address}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex text-left items-center px-5 py-3.5 rounded-xl font-bold transition-all border ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm' : 'text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <button onClick={logout} className="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-extrabold py-3.5 rounded-xl transition-colors border border-red-100 shadow-sm">Disconnect Web3</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto relative bg-gray-50">
        {status && (
          <div className="fixed top-8 right-8 bg-blue-600 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-2xl border border-blue-500 animate-fadeIn z-50 transform hover:scale-105 transition-transform cursor-default">
            {status}
          </div>
        )}
        <div className="p-8 md:p-12 pb-24 h-full">
          <div className="max-w-5xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100 min-h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
