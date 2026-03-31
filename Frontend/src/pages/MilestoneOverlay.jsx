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

  const rawPct = milestoneTarget > 0 ? (milestoneCurrent / milestoneTarget) * 100 : 0;
  const barPct = Math.min(100, rawPct);
  const isCompleted = milestoneTarget > 0 && milestoneCurrent >= milestoneTarget;

  if (milestoneTarget <= 0) {
    return <div className="absolute inset-0 bg-transparent overflow-hidden" />;
  }

  return (
    <div className="absolute inset-0 bg-transparent overflow-hidden flex flex-col justify-end items-center p-8 pb-12 font-sans">
      <style>
        {`
          @keyframes slide-right {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .shine-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: slide-right 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}
      </style>

      <div className="w-full max-w-2xl">
        <div className="relative px-6 py-5 rounded-2xl flex flex-col justify-center overflow-hidden bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          
          {/* Header Area */}
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-0.5">
                {isCompleted ? "Goal Completed" : "Current Goal"}
              </span>
              <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
                {milestoneName || (streamerName ? `${streamerName}'s Goal` : "Stream Goal")}
              </h2>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ color: isCompleted ? "#fbbf24" : "#38bdf8" }}>
                {rawPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-8 bg-black/80 rounded-xl overflow-hidden relative border border-white/10 shadow-inner">
            {/* The Animated Fill */}
            <div
              className="h-full rounded-xl transition-all duration-1000 ease-out relative overflow-hidden"
              style={{
                width: `${Math.max(2, barPct)}%`,
                background: isCompleted ? "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #0284c7, #0ea5e9, #38bdf8)",
                boxShadow: isCompleted ? "inset 0 2px 4px rgba(255,255,255,0.3), 0 0 20px rgba(245,158,11,0.6)" : "inset 0 2px 4px rgba(255,255,255,0.3), 0 0 20px rgba(56,189,248,0.5)"
              }}
            >
              {/* Shine Animation */}
              <div className="shine-effect" />
            </div>

            {/* Text Overlay inside Bar */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none mix-blend-difference text-white">
              <span className="text-sm font-black tracking-widest uppercase">
                {parseFloat(milestoneCurrent).toFixed(3)} ETH
              </span>
              <span className="text-sm font-black tracking-widest uppercase opacity-80">
                {parseFloat(milestoneTarget).toFixed(3)} ETH
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}