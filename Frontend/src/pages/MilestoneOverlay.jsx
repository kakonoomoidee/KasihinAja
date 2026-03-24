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
      }
    } catch {
      // Silently handle fetch failures on overlay.
    }
  };

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

  if (milestoneTarget <= 0) {
    return <div className="h-screen w-screen bg-transparent overflow-hidden" />;
  }

  return (
    <div className="h-screen w-screen bg-transparent overflow-hidden flex items-end justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between text-sm font-bold mb-2 tracking-wide">
          <span className="text-white drop-shadow-lg">{milestoneCurrent.toFixed(4)} ETH</span>
          <span className="text-blue-300 drop-shadow-lg">Goal: {milestoneTarget.toFixed(4)} ETH</span>
        </div>
        <div className="w-full bg-white/10 backdrop-blur-xl rounded-full h-7 border border-white/20 overflow-hidden shadow-2xl">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg shadow-blue-500/40"
            style={{ width: `${percentage}%` }}
          >
            <span className="flex items-center justify-center h-full text-xs font-bold text-white drop-shadow-md">
              {percentage >= 10 ? `${percentage.toFixed(1)}%` : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
