import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { WS_URL } from "../utils/config";
import { formatClock } from "../utils/timeUtils";

/**
 * OBS browser-source subathon timer overlay.
 * Receives SUBATHON_UPDATE events via WebSocket and maintains its own
 * one-second tick to stay accurate between syncs. Respects isActive flag.
 *
 * @returns {React.ReactElement} The transparent subathon overlay element.
 */
export default function SubathonOverlay() {
  const { streamerAddress } = useParams();
  const [remaining, setRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState(null);
  
  // States for the "+X" animation
  const [addedSeconds, setAddedSeconds] = useState(0);
  const [showAdded, setShowAdded] = useState(false);

  const wsRef = useRef(null);
  const tickRef = useRef(null);
  const prevRemainingRef = useRef(null);
  const addedTimerRef = useRef(null);

  // Force body background to transparent for OBS
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

  useEffect(() => {
    if (!streamerAddress) return;

    const normalizedAddress = streamerAddress.toLowerCase();

    const connectWebsocket = () => {
      const ws = new WebSocket(`${WS_URL}?streamer=${normalizedAddress}`);

      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "SUBATHON_UPDATE") {
            const { remaining: r, isActive: active, endTime: et } = data.payload;
            setIsActive(!!active);

            let currentR = 0;
            if (et && et > Date.now()) {
              setEndTime(et);
              currentR = (et - Date.now()) / 1000;
            } else {
              setEndTime(null);
              currentR = typeof r === "number" ? r : 0;
            }

            // Detect if time was added (threshold of > 2 seconds to avoid tick sync issues)
            if (prevRemainingRef.current !== null) {
              const diff = currentR - prevRemainingRef.current;
              if (diff > 2) {
                setAddedSeconds(Math.round(diff));
                setShowAdded(true);
                clearTimeout(addedTimerRef.current);
                // Hide the "+X" text after 3 seconds for better visibility
                addedTimerRef.current = setTimeout(() => setShowAdded(false), 3000);
              }
            }
            
            prevRemainingRef.current = currentR;
            setRemaining(Math.max(0, currentR));
          }
        } catch {
          // Non-fatal.
        }
      };

      ws.onclose = () => {
        setTimeout(connectWebsocket, 3000);
      };
    };

    connectWebsocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [streamerAddress]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (isActive && endTime) {
      tickRef.current = setInterval(() => {
        const r = Math.max(0, (endTime - Date.now()) / 1000);
        setRemaining(r);
        prevRemainingRef.current = r;
        if (r <= 0) {
          setIsActive(false);
          clearInterval(tickRef.current);
        }
      }, 1000);
    } else if (isActive && !endTime) {
      tickRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) { 
            setIsActive(false); 
            clearInterval(tickRef.current); 
            prevRemainingRef.current = 0;
            return 0; 
          }
          prevRemainingRef.current = prev - 1;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [isActive, endTime]);

  // Color changes when time is running out
  const timerColor = remaining <= 60 ? "#f87171" : remaining <= 300 ? "#fbbf24" : "#ffffff";

  return (
    <div className="absolute inset-0 bg-transparent flex items-start justify-start p-8 overflow-hidden font-sans select-none">
      <style>
        {`
          @keyframes popInFadeOut {
            0% { opacity: 0; transform: scale(0.5) translateY(10px); }
            15% { opacity: 1; transform: scale(1.1) translateY(-2px); }
            30% { transform: scale(1) translateY(0); opacity: 1; }
            80% { transform: scale(1) translateY(0); opacity: 1; }
            100% { opacity: 0; transform: translateY(-5px); }
          }
          .animate-added-time {
            animation: popInFadeOut 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>

      <div className="flex items-center gap-6">
        {/* Timer Text (e.g., 1d 02h 30m 45s) */}
        <div 
          className="text-6xl font-black tabular-nums drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]"
          style={{ 
            fontFamily: "'Courier New', Courier, monospace",
            color: timerColor,
            textShadow: `0 0 20px ${timerColor}88`
          }}
        >
          {formatClock(remaining)}
        </div>

        {/* Added Time Pop-up (+Xs) */}
        {showAdded && (
          <div 
            className="text-5xl font-black text-emerald-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] animate-added-time"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              textShadow: "0 0 20px rgba(52,211,153,0.8)"
            }}
          >
            +{addedSeconds}s
          </div>
        )}
      </div>
    </div>
  );
}