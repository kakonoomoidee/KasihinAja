import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";

const LIMIT_OPTIONS = [3, 5, 10];

const MOCK_ENTRIES = [
  { donor_name: "0xWhaleSan", total_amount_eth: 4.2069 },
  { donor_name: "CryptoKing", total_amount_eth: 2.1337 },
  { donor_name: "Anonymous", total_amount_eth: 1.0500 },
  { donor_name: "0xBigTipper", total_amount_eth: 0.8800 },
  { donor_name: "NightOwl", total_amount_eth: 0.6942 },
  { donor_name: "DeFiDegen", total_amount_eth: 0.4200 },
  { donor_name: "GasStation", total_amount_eth: 0.3141 },
  { donor_name: "SatoshiJr", total_amount_eth: 0.2500 },
  { donor_name: "EthMaxi", total_amount_eth: 0.1337 },
  { donor_name: "L2Larry", total_amount_eth: 0.0500 },
];

const RANK_COLORS = ["#facc15", "#cbd5e1", "#d97706"];

/**
 * Renders a live-preview snapshot of the leaderboard overlay using current customization state.
 *
 * @param {object} props
 * @param {number} props.displayLimit Number of entries to show.
 * @param {string} props.accentColor Hex accent color string.
 * @param {number} props.overlayOpacity Background opacity 0-100.
 * @returns {React.ReactElement}
 */
function LeaderboardPreview({ displayLimit, accentColor, overlayOpacity }) {
  const bgAlpha = (overlayOpacity / 100).toFixed(2);
  const r = parseInt(accentColor.slice(1, 3), 16);
  const g = parseInt(accentColor.slice(3, 5), 16);
  const b = parseInt(accentColor.slice(5, 7), 16);
  const accentRgba = `rgba(${r},${g},${b},0.7)`;
  const accentBorder = `rgba(${r},${g},${b},0.15)`;

  const visible = MOCK_ENTRIES.slice(0, displayLimit);

  return (
    <div className="w-[280px] mx-auto rounded-2xl overflow-hidden"
      style={{
        background: `rgba(15,23,42,${bgAlpha})`,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: accentBorder }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accentRgba} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: accentRgba }}>
          Top Supporters
        </span>
      </div>
      <div>
        {visible.map((entry, i) => {
          const rank = i + 1;
          const ringColor = RANK_COLORS[i] || "rgba(255,255,255,0.15)";
          return (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2"
              style={{ borderBottom: i < visible.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ border: `1.5px solid ${ringColor}`, color: ringColor, background: "rgba(255,255,255,0.03)" }}
              >
                {rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {entry.donor_name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[11px] font-extrabold" style={{ color: rank <= 3 ? ringColor : "rgba(255,255,255,0.7)" }}>
                  {entry.total_amount_eth.toFixed(3)}
                </span>
                <span className="text-[8px] ml-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>ETH</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Leaderboard tab: displays live donor rankings, customization controls, overlay URL generator, and a live preview.
 *
 * @param {object} props Component props.
 * @param {string} props.address The authenticated streamer wallet address.
 * @returns {React.ReactElement} The leaderboard tab element.
 */
export default function LeaderboardTab({ address }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [accentColor, setAccentColor] = useState("#22d3ee");
  const [overlayOpacity, setOverlayOpacity] = useState(80);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const glass = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl";
  const glassInput = "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all w-full";

  const overlayUrl = `${window.location.origin}/leaderboard-overlay/${address}?limit=${displayLimit}&color=${accentColor.replace("#", "")}&opacity=${overlayOpacity}`;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard/${address}?limit=${displayLimit}`);
      setEntries(res.data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [address, displayLimit]);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    (async () => { await fetchLeaderboard(); })();
  }, [address, fetchLeaderboard]);

  const truncateAddress = (addr) => {
    if (!addr) return "Unknown";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const rankColor = (rank) => {
    if (rank === 1) return "text-yellow-300 font-black";
    if (rank === 2) return "text-slate-300 font-bold";
    if (rank === 3) return "text-amber-600 font-bold";
    return "text-white/40 font-semibold";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Leaderboard</h2>
        <p className="text-white/40 text-sm mt-1">Your top supporters ranked by total ETH donated.</p>
      </div>

      <div className={`${glass} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="grid grid-cols-12 text-[10px] font-bold text-white/30 uppercase tracking-widest">
            <span className="col-span-1">Rank</span>
            <span className="col-span-4">Donor</span>
            <span className="col-span-4">Address</span>
            <span className="col-span-3 text-right">Total ETH</span>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-white/30 text-sm font-semibold animate-pulse">Loading leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-white/30 text-sm font-semibold">No donation data yet.</p>
            <p className="text-white/20 text-xs mt-1">Your leaderboard will populate as donations are received.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {entries.slice(0, displayLimit).map((entry, i) => {
              const rank = i + 1;
              const ethDisplay = parseFloat(entry.total_amount_eth).toFixed(5);
              return (
                <div
                  key={entry.donor_address}
                  className="grid grid-cols-12 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`col-span-1 text-lg ${rankColor(rank)}`}>{rank}</div>
                  <div className="col-span-4">
                    <p className="text-sm font-bold text-white truncate max-w-[140px]">
                      {entry.donor_name || "Anonymous"}
                    </p>
                  </div>
                  <div className="col-span-4">
                    <span className="text-xs font-mono text-white/40">{truncateAddress(entry.donor_address)}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-sm font-extrabold text-white">{ethDisplay}</span>
                    <span className="text-[10px] text-white/30 ml-1">ETH</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`${glass} p-6 space-y-6`}>
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/[0.06] pb-3">
          Overlay Customization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Display Limit</label>
            <div className="flex gap-2">
              {LIMIT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDisplayLimit(n)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    displayLimit === n
                      ? "bg-blue-600/20 border-blue-500/50 text-white"
                      : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Accent Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0 cursor-pointer relative overflow-hidden"
                style={{ background: accentColor }}
              >
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className={`${glassInput} font-mono uppercase text-xs`}
                maxLength={7}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
              Background Opacity — <span className="text-white/70">{overlayOpacity}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor }}
            />
          </div>
        </div>
      </div>

      <div className={`${glass} p-6 space-y-4`}>
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/[0.06] pb-3">
          OBS Browser Source URL
        </h3>
        <p className="text-xs text-white/30">Copy this URL into an OBS Browser Source. Dimensions: 350 x {displayLimit * 54 + 48}px.</p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            readOnly
            value={overlayUrl}
            className={`flex-1 ${glassInput} text-[11px] font-mono text-white/60 py-3`}
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-shrink-0 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              copied
                ? "bg-green-600/20 border-green-500/40 text-green-300"
                : "bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
            }`}
          >
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
      </div>

      <div className={`${glass} p-6`}>
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/[0.06] pb-3 mb-6">
          Live Preview
        </h3>
        <div className="flex justify-center py-4 rounded-xl bg-black/30 border border-white/[0.04]">
          <LeaderboardPreview
            displayLimit={displayLimit}
            accentColor={accentColor}
            overlayOpacity={overlayOpacity}
          />
        </div>
      </div>
    </div>
  );
}