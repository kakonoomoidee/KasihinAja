import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../utils/config";

const POLL_INTERVAL_MS = 10000;

const RANK_STYLES = [
  { ring: "#facc15", label: "#facc15", shadow: "0 0 12px rgba(250,204,21,0.35)" },
  { ring: "#cbd5e1", label: "#cbd5e1", shadow: "0 0 10px rgba(203,213,225,0.25)" },
  { ring: "#d97706", label: "#d97706", shadow: "0 0 10px rgba(217,119,6,0.25)" },
];

const DEFAULT_RANK_STYLE = { ring: "rgba(255,255,255,0.1)", label: "rgba(255,255,255,0.35)", shadow: "none" };

/**
 * Renders an OBS browser-source leaderboard overlay.
 * Reads display limit, accent color, and background opacity from URL search params.
 * Polls the leaderboard API every 10 seconds to stay current during live streams.
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
  const cr = parseInt(colorHex.slice(1, 3), 16);
  const cg = parseInt(colorHex.slice(3, 5), 16);
  const cb = parseInt(colorHex.slice(5, 7), 16);
  const accentRgba = `rgba(${cr},${cg},${cb},0.75)`;
  const accentBorder = `rgba(${cr},${cg},${cb},0.12)`;

  const [entries, setEntries] = useState([]);
  const intervalRef = useRef(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard/${streamerAddress}?limit=${limit}`);
      setEntries(res.data || []);
    } catch {
      // Non-fatal: retain stale data until next successful poll.
    }
  }, [streamerAddress, limit]);

  useEffect(() => {
    if (!streamerAddress) return;
    (async () => { await fetchLeaderboard(); })();
    intervalRef.current = setInterval(() => { void fetchLeaderboard(); }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [streamerAddress, fetchLeaderboard]);

  const rankStyle = (rank) => RANK_STYLES[rank - 1] || DEFAULT_RANK_STYLE;

  return (
    <div className="bg-transparent w-[350px] p-3 font-sans">
      <div
        className="rounded-2xl overflow-hidden fade-in"
        style={{
          background: `rgba(15,23,42,${bgAlpha})`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2 border-b"
          style={{ borderColor: accentBorder }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentRgba} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: accentRgba }}
          >
            Top Supporters
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.2)" }}>
              No donations yet.
            </p>
          </div>
        ) : (
          <div>
            {entries.slice(0, limit).map((entry, i) => {
              const rank = i + 1;
              const style = rankStyle(rank);
              const ethDisplay = parseFloat(entry.total_amount_eth).toFixed(4);
              const donorLabel = entry.donor_name || "Anonymous";
              const isTopThree = rank <= 3;

              return (
                <div
                  key={entry.donor_address}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderBottom: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                    style={{
                      border: `1.5px solid ${isTopThree ? style.ring : accentRgba}`,
                      color: isTopThree ? style.label : accentRgba,
                      boxShadow: isTopThree ? style.shadow : "none",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    {rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold truncate leading-tight"
                      style={{ color: "rgba(255,255,255,0.92)" }}
                    >
                      {donorLabel}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span
                      className="text-sm font-extrabold"
                      style={{ color: isTopThree ? style.label : accentRgba }}
                    >
                      {ethDisplay}
                    </span>
                    <span
                      className="text-[9px] font-bold ml-1"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      ETH
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
