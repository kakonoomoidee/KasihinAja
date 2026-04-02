import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../utils/config";

const POLL_INTERVAL_MS = 10000;

/**
 * Renders an OBS browser-source leaderboard overlay.
 * Redesigned to match the clean tabular aesthetic.
 *
 * @returns {React.ReactElement} The transparent leaderboard overlay element.
 */
export default function LeaderboardOverlay() {
  const { streamerAddress } = useParams();
  const [searchParams] = useSearchParams();

  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const colorHex = "#" + (searchParams.get("color") || "22d3ee");
  const opacity = Math.min(100, Math.max(0, parseInt(searchParams.get("opacity") || "80", 10)));
  const bgAlpha = (opacity / 100).toFixed(2);

  const [entries, setEntries] = useState([]);
  const intervalRef = useRef(null);

  // Force absolute transparency for OBS (Nuking the root background)
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      :root, html, body, #root {
        background-color: transparent !important;
        background: transparent !important;
        background-image: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard/${streamerAddress}?limit=${limit}`);
      setEntries(res.data || []);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  }, [streamerAddress, limit]);

  useEffect(() => {
    if (!streamerAddress) return;
    (async () => { await fetchLeaderboard(); })();
    intervalRef.current = setInterval(() => { void fetchLeaderboard(); }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [streamerAddress, fetchLeaderboard]);

  return (
    <div className="w-[450px] p-4 font-sans select-none">
      <div
        className="rounded-xl overflow-hidden fade-in px-5 py-4"
        style={{
          background: `rgba(0, 0, 0, ${bgAlpha})`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top Title & Date */}
        <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-3">
          <span className="text-xl font-bold text-white tracking-wide">
            Leaderboard
          </span>
          <span className="text-xs font-bold" style={{ color: colorHex }}>
            All Time - ∞
          </span>
        </div>

        {/* Columns Header */}
        <div className="grid grid-cols-12 gap-2 mb-3 text-[11px] font-black uppercase tracking-widest" style={{ color: colorHex }}>
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-6 pl-1">Name</div>
          <div className="col-span-4 text-right pr-2">Amount</div>
        </div>

        {/* List Data */}
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-bold text-white/50">No donations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, limit).map((entry, i) => {
              const rank = i + 1;
              const ethDisplay = parseFloat(entry.total_amount_eth).toFixed(4);
              const donorLabel = entry.donor_name || "Anonymous";
              
              // Top 3 rank styling
              const isTop3 = rank <= 3;
              const rankColor = isTop3 ? "#facc15" : colorHex; 

              return (
                <div key={entry.donor_address} className="grid grid-cols-12 gap-2 items-center hover:bg-white/5 p-1 rounded-lg transition-colors">
                  {/* Rank Circle */}
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

                  {/* Name & Avatar */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0 pl-1">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <span className="text-sm font-bold text-white truncate drop-shadow-sm">
                      {donorLabel}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-4 text-right pr-2">
                    <span className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                      {ethDisplay} <span className="text-[10px] text-white/50 ml-0.5">ETH</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}