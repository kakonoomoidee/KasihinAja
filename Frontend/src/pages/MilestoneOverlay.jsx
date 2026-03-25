import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { WS_URL, API_URL } from "../utils/config";
import axios from "axios";

/**
 * Renders the transparent milestone progress bar overlay for OBS Browser Sources.
 *
 * @returns {React.ReactElement} The milestone overlay React element.
 */
export default function MilestoneOverlay() {
  const { streamerAddress } = useParams();
  const [milestoneTarget, setMilestoneTarget] = useState(0);
  const [milestoneCurrent, setMilestoneCurrent] = useState(0);
  const [streamerName, setStreamerName] = useState("");
  const wsRef = useRef(null);

  /**
   * Fetches the latest milestone data from the backend profile endpoint.
   *
   * @param {string} addr The resolved streamer wallet address.
   * @returns {Promise<void>}
   */
  const fetchMilestone = async (addr) => {
    try {
      const res = await axios.get(`${API_URL}/profile/${addr}`);
      if (res.data) {
        setMilestoneTarget(res.data.milestone_target || 0);
        setMilestoneCurrent(res.data.milestone_current || 0);
        setStreamerName(res.data.display_name || "");
      }
    } catch {
      // Silently handle fetch failures on overlay.
    }
  };

  useEffect(() => {
    document.body.style.background = "transparent";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    let isActive = true;
    let decodedAddress = streamerAddress;
    try { decodedAddress = atob(streamerAddress).toLowerCase(); } catch { decodedAddress = streamerAddress.toLowerCase(); }

    const connectWebsocket = () => {
      wsRef.current = new WebSocket(`${WS_URL}?streamer=${decodedAddress}`);

      wsRef.current.onopen = () => {
        if (isActive) fetchMilestone(decodedAddress);
      };

      wsRef.current.onmessage = () => {
        if (!isActive) return;
        fetchMilestone(decodedAddress);
      };

      wsRef.current.onclose = () => {
        if (isActive) setTimeout(connectWebsocket, 3000);
      };
    };

    connectWebsocket();

    return () => {
      isActive = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, [streamerAddress]);

  const percentage = milestoneTarget > 0 ? Math.min(100, (milestoneCurrent / milestoneTarget) * 100) : 0;
  const isCompleted = milestoneTarget > 0 && milestoneCurrent >= milestoneTarget;

  if (milestoneTarget <= 0) {
    return <div className="h-screen w-screen bg-transparent overflow-hidden" />;
  }

  return (
    <div className="h-screen w-screen bg-transparent overflow-hidden flex items-end justify-center p-6">
      <div className="w-full max-w-2xl">
        <div
          className="relative p-5 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: isCompleted ? "1px solid rgba(74, 222, 128, 0.3)" : "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: isCompleted
              ? "0 8px 32px rgba(74, 222, 128, 0.1)"
              : "0 8px 32px rgba(0, 0, 0, 0.15)"
          }}
        >
          {streamerName && (
            <p className="text-xs font-semibold text-white/40 mb-1 tracking-wider uppercase">{streamerName}</p>
          )}

          <div className="flex justify-between items-baseline mb-3">
            <span className="text-lg font-extrabold text-white tracking-tight">
              {milestoneCurrent.toFixed(4)} <span className="text-sm text-white/50">ETH</span>
            </span>
            <span className="text-sm font-bold tracking-wide" style={{ color: isCompleted ? "#4ade80" : "#93c5fd" }}>
              {isCompleted ? "GOAL REACHED!" : `Goal: ${milestoneTarget.toFixed(4)} ETH`}
            </span>
          </div>

          <div
            className="w-full rounded-full h-3.5 overflow-hidden"
            style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${percentage}%`,
                background: isCompleted
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)",
                boxShadow: isCompleted
                  ? "0 0 12px rgba(74, 222, 128, 0.5)"
                  : "0 0 12px rgba(96, 165, 250, 0.4)"
              }}
            />
          </div>

          <div className="flex justify-between mt-2">
            <span className="text-xs font-bold text-white/25">{percentage.toFixed(1)}%</span>
            <span className="text-xs font-bold text-white/25">{Math.max(0, milestoneTarget - milestoneCurrent).toFixed(4)} ETH remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}
