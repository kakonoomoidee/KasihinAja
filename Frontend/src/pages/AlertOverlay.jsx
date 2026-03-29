import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { WS_URL } from "../utils/config";
import { ethers } from "ethers";

/**
 * Extracts the YouTube video ID from standard, short, or embed URLs.
 *
 * @param {string} url The YouTube URL string.
 * @returns {string|null} The extracted video ID or null.
 */
const extractYoutubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
};

const VN_BAR_DELAYS = [0, 0.15, 0.3, 0.05, 0.25, 0.1, 0.4, 0.2, 0.35, 0.08, 0.45, 0.18];
const VN_BAR_DURATIONS = [0.6, 0.8, 0.5, 0.9, 0.65, 0.75, 0.55, 0.85, 0.7, 0.6, 0.45, 0.8];

/**
 * Renders an animated waveform bar visualizer for active voice note playback.
 *
 * @param {object} props Component props.
 * @param {string} props.color The hex or CSS color to apply to the bars.
 * @returns {React.ReactElement} The waveform visualizer element.
 */
const VoiceNoteVisualizer = ({ color }) => {
  return (
    <div className="flex items-center justify-center gap-[3px] h-8 px-3 py-1 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
      {VN_BAR_DELAYS.map((delay, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: "100%",
            borderRadius: "2px",
            backgroundColor: color,
            opacity: 0.85,
            animation: `vnBar ${VN_BAR_DURATIONS[i]}s ease-in-out ${delay}s infinite alternate`,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
};

/**
 * Renders the alert card with donor info, media, and voice note visualizer.
 *
 * @param {object} props Component props.
 * @param {object} props.alert The alert payload object.
 * @param {string} props.phase The current animation phase: "enter" | "exit" | "idle".
 * @param {Function} props.onMediaEnd Callback invoked when the voice note audio finishes.
 * @returns {React.ReactElement} The combined alert card element.
 */
const AlertCard = ({ alert, phase, onMediaEnd }) => {
  const { profile, message, amount, donor } = alert;
  const msgColor = profile?.msg_color || "#ffffff";
  const userColor = profile?.user_color || "#60a5fa";
  const template = profile?.alert_template || "classic";
  const ethAmount = amount ? ethers.formatEther(amount) : "0";
  const youtubeId = extractYoutubeId(alert.media_data?.youtube_url || alert.youtube_url || alert.media_url);
  const youtubeStart = alert.media_data?.youtube_start || alert.youtube_start || 0;
  const vnSrc = alert.media_data?.vn_data || alert.vn_data || alert.vn_url || alert.media_data?.vn_url || null;

  const animClass = phase === "enter" ? "alert-enter" : phase === "exit" ? "alert-exit" : "";

  return (
    <div className={`flex flex-col items-center gap-0 max-w-lg w-full ${animClass}`}>
      {youtubeId && (
        <div
          className="rounded-t-2xl overflow-hidden w-full"
          style={{
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderBottom: "none"
          }}
        >
          <iframe
            width="100%"
            height="225"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${youtubeStart}`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Media Share"
            className="block"
          />
        </div>
      )}

      <div
        className="w-full p-4"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: youtubeId ? "0 0 16px 16px" : "16px",
          borderTop: youtubeId ? "none" : undefined,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)"
        }}
      >
        {template === "minimalist" ? (
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: userColor, boxShadow: `0 0 10px ${userColor}` }} />
              <span className="text-sm font-bold tracking-wide" style={{ color: userColor }}>
                {donor.slice(0, 6)}...{donor.slice(-4)} tipped {ethAmount} ETH
              </span>
            </div>
            <p className="text-base font-semibold break-words leading-relaxed pl-5" style={{ color: msgColor }}>
              {message}
            </p>
            {vnSrc && (
              <div className="mt-2 pl-5">
                <VoiceNoteVisualizer color={userColor} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-xl border-2 shadow-lg object-cover flex-shrink-0" style={{ borderColor: userColor + "60" }} />
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-extrabold uppercase tracking-wider" style={{ color: userColor }}>
                New Tip! {ethAmount} ETH
              </span>
              <span className="text-xs font-semibold opacity-70 font-mono" style={{ color: userColor }}>
                From: {donor.slice(0, 6)}...{donor.slice(-4)}
              </span>
              <p className="text-base font-bold break-words leading-snug mt-1" style={{ color: msgColor }}>
                {message}
              </p>
              {vnSrc && (
                <div className="mt-2">
                  <VoiceNoteVisualizer color={userColor} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {vnSrc && (
        <audio autoPlay src={vnSrc} className="hidden" onEnded={onMediaEnd} />
      )}
    </div>
  );
};

/**
 * Renders the OBS alert overlay with queued, animated alert display.
 *
 * @returns {React.ReactElement} The overlay root element.
 */
export default function AlertOverlay() {
  const { streamerAddress } = useParams();
  const [currentAlert, setCurrentAlert] = useState(null);
  const [phase, setPhase] = useState("idle");
  const queueRef = useRef([]);
  const isShowingRef = useRef(false);
  const processQueueRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const wsRef = useRef(null);

  const triggerDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setPhase("exit");
    setTimeout(() => {
      setCurrentAlert(null);
      setPhase("idle");
      isShowingRef.current = false;
      setTimeout(() => {
        if (processQueueRef.current) processQueueRef.current();
      }, 300);
    }, 400);
  };

  useEffect(() => {
    document.body.style.background = "transparent";
    const style = document.createElement("style");
    style.textContent = `
      @keyframes alertSlideIn {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes alertSlideOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-20px) scale(0.95); }
      }
      @keyframes vnBar {
        from { transform: scaleY(0.15); }
        to { transform: scaleY(1); }
      }
      .alert-enter { animation: alertSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .alert-exit { animation: alertSlideOut 0.35s cubic-bezier(0.55, 0, 1, 0.45) forwards; }
    `;
    document.head.appendChild(style);
    return () => {
      document.body.style.background = "";
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    processQueueRef.current = () => {
      if (isShowingRef.current || queueRef.current.length === 0) return;

      isShowingRef.current = true;
      const next = queueRef.current.shift();
      setCurrentAlert(next);
      setPhase("enter");

      const hasVn = !!(next.media_data?.vn_data || next.vn_data || next.vn_url || next.media_data?.vn_url);
      const hasYoutube = !!(next.media_data?.youtube_url || next.youtube_url || next.media_url);

      if (hasVn) {
        return;
      }

      const displayTime = hasYoutube ? 15000 : 5000;
      dismissTimerRef.current = setTimeout(triggerDismiss, displayTime);
    };
  });

  useEffect(() => {
    let isActive = true;
    let decodedAddress = streamerAddress;
    try { decodedAddress = atob(streamerAddress).toLowerCase(); } catch { decodedAddress = streamerAddress.toLowerCase(); }

    const connectWebsocket = () => {
      wsRef.current = new WebSocket(`${WS_URL}?streamer=${decodedAddress}`);

      wsRef.current.onmessage = (event) => {
        if (!isActive) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "VERIFIED_DONATION") {
            console.log("[DEBUG 5] Received Alert Payload:", data.payload);
            const donation = data.payload;
            donation.id = Date.now().toString() + Math.random();
            queueRef.current.push(donation);
            if (processQueueRef.current) processQueueRef.current();
          }
        } catch {
          /* discard */
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

  if (!currentAlert) {
    return <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", background: "transparent", overflow: "hidden" }} />;
  }

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", background: "transparent", overflow: "hidden" }} className="flex flex-col items-center justify-center p-10">
      <AlertCard alert={currentAlert} phase={phase} onMediaEnd={triggerDismiss} />
    </div>
  );
}
