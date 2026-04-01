import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { WS_URL } from "../utils/config";

/**
 * Formats a total seconds value into a HH:MM:SS string.
 *
 * @param {number} totalSeconds The total seconds to format.
 * @returns {string} Zero-padded HH:MM:SS string.
 */
const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

/**
 * OBS browser-source subathon timer overlay.
 * Receives SUBATHON_UPDATE events via WebSocket and maintains its own
 * one-second tick so the display stays accurate between syncs.
 *
 * @returns {React.ReactElement} The transparent subathon overlay element.
 */
export default function SubathonOverlay() {
  const { streamerAddress } = useParams();
  const [remaining, setRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [title, setTitle] = useState("Subathon");
  const [endTime, setEndTime] = useState(null);
  const [syncFlash, setSyncFlash] = useState(false);

  const wsRef = useRef(null);
  const tickRef = useRef(null);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    if (!streamerAddress) return;

    const ws = new WebSocket(`${WS_URL}?streamer=${streamerAddress}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "SUBATHON_UPDATE") {
          const { remaining: r, isActive: active, endTime: et, title: t } = data.payload;
          if (t) setTitle(t);
          setIsActive(!!active);
          if (et && et > Date.now()) {
            setEndTime(et);
            setRemaining(Math.max(0, (et - Date.now()) / 1000));
          } else {
            setEndTime(null);
            setRemaining(typeof r === "number" ? r : 0);
          }
          setSyncFlash(true);
          clearTimeout(syncTimerRef.current);
          syncTimerRef.current = setTimeout(() => setSyncFlash(false), 2000);
        }
      } catch {
        // Non-fatal.
      }
    };

    return () => ws.close();
  }, [streamerAddress]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (isActive && endTime) {
      tickRef.current = setInterval(() => {
        const r = Math.max(0, (endTime - Date.now()) / 1000);
        setRemaining(r);
        if (r <= 0) {
          setIsActive(false);
          clearInterval(tickRef.current);
        }
      }, 1000);
    } else if (isActive && !endTime) {
      tickRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) { setIsActive(false); clearInterval(tickRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [isActive, endTime]);

  const timerColor = remaining <= 60 ? "#f87171" : remaining <= 300 ? "#fbbf24" : "#ffffff";
  const glowColor = remaining <= 60 ? "rgba(248,113,113,0.3)" : remaining <= 300 ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.1)";

  const [h, m, s] = formatClock(remaining).split(":");

  return (
    <div className="bg-transparent w-[380px] p-3 font-sans select-none">
      <div
        className="rounded-2xl overflow-hidden fade-in"
        style={{
          background: "rgba(5, 11, 20, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${glowColor}`,
        }}
      >
        <div
          className="px-5 py-2.5 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(125,211,252,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(125,211,252,0.7)" }}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {syncFlash && (
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#34d399" }}>
                Synced
              </span>
            )}
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isActive ? "#34d399" : "rgba(255,255,255,0.2)" }}
            />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isActive ? "#34d399" : "rgba(255,255,255,0.3)" }}>
              {isActive ? "Live" : "Paused"}
            </span>
          </div>
        </div>

        <div className="px-6 py-8 text-center" style={{ fontFamily: "'Courier New', monospace" }}>
          <div className="flex items-center justify-center gap-1">
            {[h, m, s].map((segment, i) => (
              <React.Fragment key={i}>
                <div
                  className="flex flex-col items-center"
                >
                  <div
                    className="text-6xl font-black tabular-nums leading-none px-2 py-2 rounded-xl min-w-[72px] text-center transition-colors duration-700"
                    style={{
                      color: timerColor,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      textShadow: `0 0 20px ${timerColor}66`,
                    }}
                  >
                    {segment}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {["Hrs", "Min", "Sec"][i]}
                  </span>
                </div>
                {i < 2 && (
                  <span
                    className="text-4xl font-black mb-6 select-none"
                    style={{ color: timerColor, opacity: isActive ? 0.7 : 0.2 }}
                  >
                    :
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {!isActive && remaining === 0 && (
          <div className="px-6 pb-5 text-center">
            <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>
              Timer ended
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
