import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import ActionButton from "../shared/ActionButton";
import ColorPickerInput from "../shared/ColorPickerInput";

const LIMIT_OPTIONS = [3, 5, 10];

const MOCK_ENTRIES = [
  { donor_name: "Nama saya bukan ada deh", total_amount_eth: 4.2069 },
  { donor_name: "Jefri JOJ", total_amount_eth: 2.1337 },
  { donor_name: "Simpenannya ALOY", total_amount_eth: 1.0500 },
  { donor_name: "TERAPIS LANGGANAN ALOY", total_amount_eth: 0.8800 },
  { donor_name: "Jafartrymaulana", total_amount_eth: 0.6942 },
  { donor_name: "DeFiDegen", total_amount_eth: 0.4200 },
  { donor_name: "GasStation", total_amount_eth: 0.3141 },
  { donor_name: "SatoshiJr", total_amount_eth: 0.2500 },
  { donor_name: "EthMaxi", total_amount_eth: 0.1337 },
  { donor_name: "L2Larry", total_amount_eth: 0.0500 },
];

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
  const visible = MOCK_ENTRIES.slice(0, displayLimit);

  return (
    <div className="w-[450px] mx-auto rounded-xl overflow-hidden font-sans select-none px-5 py-4"
      style={{
        background: `rgba(0, 0, 0, ${bgAlpha})`,
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-3">
        <span className="text-xl font-bold text-white tracking-wide">
          Leaderboard
        </span>
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          All Time - ∞
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2 mb-3 text-[11px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
        <div className="col-span-2 text-center">Rank</div>
        <div className="col-span-6 pl-1">Name</div>
        <div className="col-span-4 text-right pr-2">Amount</div>
      </div>

      <div className="space-y-3">
        {visible.map((entry, i) => {
          const rank = i + 1;
          const ethDisplay = entry.total_amount_eth.toFixed(4);
          const isTop3 = rank <= 3;
          const rankColor = isTop3 ? "#facc15" : accentColor; 

          return (
            <div key={i} className="grid grid-cols-12 gap-2 items-center hover:bg-white/5 p-1 rounded-lg transition-colors">
              <div className="col-span-2 flex justify-center">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm"
                  style={{ 
                    border: `2px solid ${rankColor}`, 
                    color: rankColor,
                    background: "rgba(0,0,0,0.3)" 
                  }}
                >
                  {rank}
                </div>
              </div>
              <div className="col-span-6 flex items-center gap-3 min-w-0 pl-1">
                <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <span className="text-sm font-bold text-white truncate drop-shadow-sm">
                  {entry.donor_name}
                </span>
              </div>
              <div className="col-span-4 text-right pr-2">
                <span className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                  {ethDisplay} <span className="text-[10px] text-white/50 ml-0.5">ETH</span>
                </span>
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
  const [displayLimit, setDisplayLimit] = useState(5);
  const [accentColor, setAccentColor] = useState("#22d3ee");
  const [overlayOpacity, setOverlayOpacity] = useState(60);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";
  const glassInput = "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all w-full";

  const overlayUrl = `${window.location.origin}/leaderboard-overlay/${address}?limit=${displayLimit}&color=${accentColor.replace("#", "")}&opacity=${overlayOpacity}`;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard/${address}?limit=${displayLimit}`);
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Leaderboard</h2>
        <p className="text-white/40 text-sm mt-2 font-medium">Your top supporters ranked by total ETH donated.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Section 1: Customization Settings */}
        <div className={`${glass} p-8`}>
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
             Design Overlay
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Display Limit</label>
              <div className="flex gap-2">
                {LIMIT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDisplayLimit(n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      displayLimit === n
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                    }`}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
            </div>

            <ColorPickerInput 
              color={accentColor} 
              setColor={setAccentColor} 
              label="Accent Color" 
              glassInput={glassInput} 
            />

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3 flex justify-between">
                <span>Bg Opacity</span>
                <span className="text-blue-400">{overlayOpacity}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                className="w-full h-2 bg-black/50 rounded-full appearance-none cursor-pointer border border-white/10"
                style={{ accentColor: accentColor }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Overlay URL */}
        <div className={`${glass} p-6 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3 mb-5 relative z-10 flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
             Overlay URL
          </h3>
          <p className="text-[11px] text-white/40 font-medium mb-3 relative z-10">Add a Browser Source in OBS and paste this link.</p>
          
          <div className="flex gap-3 relative z-10">
             <input
               type="text"
               readOnly
               value={overlayUrl}
               className={`w-full ${glassInput} text-[10px] font-mono text-white/50 py-3 bg-black/40`}
             />
             <ActionButton 
               onClick={handleCopy} 
               variant={copied ? "ghost" : "primary"} 
               className="px-6 text-[11px] flex-shrink-0"
             >
               {copied ? "Copied!" : "Copy"}
             </ActionButton>
          </div>
        </div>

        {/* Section 3: Live Preview */}
        <div className={`${glass} p-6`}>
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
             Live Preview
          </h3>
          <div className="flex justify-center p-8 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden" 
               style={{ backgroundImage: "linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111), linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 10px 10px" }}
          >
            <LeaderboardPreview
              displayLimit={displayLimit}
              accentColor={accentColor}
              overlayOpacity={overlayOpacity}
            />
          </div>
        </div>

        {/* Section 4: Current Standings Data */}
        <div className={`${glass} overflow-hidden`}>
          <div className="px-6 py-4 border-b border-white/10 bg-black/20">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
               Current Standings Data
            </h3>
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
            <div className="divide-y divide-white/5">
              <div className="grid grid-cols-12 px-6 py-3 bg-white/5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-4 pl-2">Name</div>
                <div className="col-span-3">Address</div>
                <div className="col-span-3 text-right">Amount</div>
              </div>
              {entries.slice(0, displayLimit).map((entry, i) => {
                const rank = i + 1;
                const ethDisplay = parseFloat(entry.total_amount_eth).toFixed(4);
                const isTop3 = rank <= 3;
                const rankColor = isTop3 ? "#facc15" : accentColor; 

                return (
                  <div
                    key={entry.donor_address}
                    className="grid grid-cols-12 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="col-span-2 flex justify-center">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                        style={{ 
                          border: `2px solid ${rankColor}`, 
                          color: rankColor,
                          background: "rgba(0,0,0,0.3)" 
                        }}
                      >
                        {rank}
                      </div>
                    </div>
                    <div className="col-span-4 pl-2">
                      <p className="text-sm font-bold text-white truncate pr-2">
                        {entry.donor_name || "Anonymous"}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <span className="text-[10px] font-mono text-white/30 bg-black/40 px-2 py-1 rounded border border-white/5">{truncateAddress(entry.donor_address)}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-sm font-black text-white">{ethDisplay}</span>
                      <span className="text-[10px] text-white/40 font-bold ml-1.5">ETH</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}