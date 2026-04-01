import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../utils/config";

const POLL_INTERVAL_MS = 10000;

/**
 * Renders an OBS browser-source leaderboard overlay.
 * Clean, minimalistic glassmorphism design.
 *
 * @returns {React.ReactElement} The transparent leaderboard overlay element.
 */
export default function LeaderboardOverlay() {
  const { streamerAddress } = useParams();
  const [searchParams] = useSearchParams();

  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const colorHex = "#" + (searchParams.get("color") || "22d3ee");
  const opacity = Math.min(100, Math.max(0, parseInt(searchParams.get("opacity") || "80", 10)));
  const bgAlpha = (opacity / 100).toFixed(2);

  const [entries, setEntries] = useState([]);
  const intervalRef = useRef(null);

  // Force body background to transparent for OBS (Mencegah background hitam)
  useEffect(() => {
    document.documentElement.style.setProperty("background", "transparent", "important");
    document.body.style.setProperty("background", "transparent", "important");
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.setProperty("background", "transparent", "important");
    }
    return () => {
      document.documentElement.style.removeProperty("background");
      document.body.style.removeProperty("background");
      if (rootElement) rootElement.style.removeProperty("background");
    };
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard/${streamerAddress}?limit=${limit}`);
      setEntries(res.data || []);
    } catch {
      // Retain stale data on error
    }
  }, [streamerAddress, limit]);

  useEffect(() => {
    if (!streamerAddress) return;
    (async () => { await fetchLeaderboard(); })();
    intervalRef.current = setInterval(() => { void fetchLeaderboard(); }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [streamerAddress, fetchLeaderboard]);

  return (
    <div className="bg-transparent w-[320px] p-4 font-sans select-none">
      <div
        className="rounded-2xl overflow-hidden fade-in"
        style={{
          background: `rgba(0, 0, 0, ${bgAlpha})`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 text-center bg-white/[0.02]">
          <span 
            className="text-xs font-black uppercase tracking-[0.2em]" 
            style={{ color: colorHex, textShadow: `0 0 12px ${colorHex}50` }}
          >
            Leaderboard
          </span>
        </div>

        {/* List */}
        {entries.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs font-medium text-white/30">No donations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {entries.slice(0, limit).map((entry, i) => {
              const rank = i + 1;
              const ethDisplay = parseFloat(entry.total_amount_eth).toFixed(4);
              const donorLabel = entry.donor_name || "Anonymous";

              return (
                <div
                  key={entry.donor_address}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-white/30 w-4 text-right">
                      {rank}.
                    </span>
                    <span className="text-sm font-bold text-white/90 truncate max-w-[120px]">
                      {donorLabel}
                    </span>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span 
                      className="text-sm font-black tracking-tight" 
                      style={{ color: colorHex }}
                    >
                      {ethDisplay}
                    </span>
                    <span className="text-[9px] font-bold text-white/30 ml-1">ETH</span>
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