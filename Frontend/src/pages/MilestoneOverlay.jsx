import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { WS_URL, API_URL } from "../utils/config";
import axios from "axios";

/**
 * Renders the transparent milestone progress bar overlay using dark glassmorphism for OBS.
 *
 * @returns {React.ReactElement} The milestone overlay React element.
 */
export default function MilestoneOverlay() {
  const { streamerAddress } = useParams();
  const [milestoneTarget, setMilestoneTarget] = useState(0);
  const [milestoneCurrent, setMilestoneCurrent] = useState(0);
  const [milestoneName, setMilestoneName] = useState("");
  const [streamerName, setStreamerName] = useState("");
  const wsRef = useRef(null);

  /**
   * Fetches the latest milestone data from the backend profile endpoint.
   *
   * @param {string} addr - The resolved streamer wallet address.
   * @returns {Promise<void>} A promise that resolves when the fetch is complete.
   */
  const fetchMilestone = async (addr) => {
    try {
      const res = await axios.get(`${API_URL}/profile/${addr}`);
      if (res.data) {
        setMilestoneTarget(res.data.milestone_target || 0);
        setMilestoneCurrent(res.data.milestone_current || 0);
        setMilestoneName(res.data.milestone_name || "");
        setStreamerName(res.data.display_name || "");
      }
    } catch {
      console.error("Failed to fetch milestone data");
    }
  };

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
      if (rootElement) {
        rootElement.style.removeProperty("background");
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    let decodedAddress = streamerAddress;
    try {
      decodedAddress = atob(streamerAddress).toLowerCase();
    } catch {
      decodedAddress = streamerAddress.toLowerCase();
    }

    const connectWebsocket = () => {
      wsRef.current = new WebSocket(`${WS_URL}?streamer=${decodedAddress}`);

      wsRef.current.onopen = () => {
        if (isActive) fetchMilestone(decodedAddress);
      };

      wsRef.current.onmessage = (event) => {
        if (!isActive) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "MILESTONE_UPDATE") {
            if (data.payload && data.payload.milestone_target !== undefined) {
              setMilestoneCurrent(data.payload.milestone_current);
              setMilestoneTarget(data.payload.milestone_target);
            } else {
              fetchMilestone(decodedAddress);
            }
          }
        } catch {
          console.error("Invalid WS message");
        }
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
    return <div className="absolute inset-0 bg-transparent overflow-hidden" />;
  }

  return (
    <div className="absolute inset-0 bg-transparent overflow-hidden flex flex-col justify-end items-center p-8 pb-12">
      <div className="w-full max-w-4xl">
        <div className="relative px-8 py-5 rounded-[40px] flex flex-col justify-center overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-end mb-3 px-2">
            <div>
              {milestoneName ? (
                <h2 className="text-2xl font-extrabold text-white drop-shadow-md">
                  {milestoneName}
                </h2>
              ) : (
                <h2 className="text-xl font-bold text-white drop-shadow-md">
                  {streamerName ? `${streamerName}'s Goal` : "Stream Goal"}
                </h2>
              )}
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-white drop-shadow-md">
                {parseFloat(milestoneCurrent).toFixed(2)} <span className="text-sm font-semibold opacity-80 text-white">/ {parseFloat(milestoneTarget).toFixed(2)} ETH</span>
              </span>
            </div>
          </div>

          <div className="w-full rounded-full h-6 overflow-hidden relative bg-black/60 border border-white/10 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-3 ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-gray-300 to-white'}`}
              style={{
                width: `${Math.max(5, percentage)}%`,
                boxShadow: isCompleted ? "0 0 15px rgba(52, 211, 153, 0.5)" : "0 0 15px rgba(255,255,255,0.3)"
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full" />
              {percentage >= 15 && (
                 <span className={`text-xs font-bold leading-none z-10 ${isCompleted ? 'text-white drop-shadow-sm' : 'text-black'}`}>
                    {percentage.toFixed(0)}%
                 </span>
              )}
            </div>
          </div>
          
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-1">
               <span className="text-4xl font-black text-white px-6 py-2 rounded-2xl animate-bounce bg-emerald-600/90 backdrop-blur-md shadow-lg">
                 GOAL REACHED
               </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}