import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { WS_URL } from "../utils/config";
import { ethers } from "ethers";

/**
 * Extracts a YouTube video ID from various URL formats.
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

/**
 * Renders a combined alert card with optional media on top and message bubble below.
 *
 * @param {object} props The alert data.
 * @returns {React.ReactElement} The combined alert element.
 */
const AlertCard = ({ alert }) => {
  const { profile, message, amount, donor } = alert;
  const msgColor = profile?.msg_color || "#ffffff";
  const userColor = profile?.user_color || "#60a5fa";
  const bgColor = profile?.bg_color || "#0f172a";
  const template = profile?.alert_template || "classic";
  const ethAmount = amount ? ethers.formatEther(amount) : "0";
  const youtubeId = extractYoutubeId(alert.youtube_url);
  const youtubeStart = alert.youtube_start || 0;

  return (
    <div className="flex flex-col items-center gap-0 fade-in max-w-lg w-full">
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
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-xl border-2 shadow-lg object-cover flex-shrink-0" style={{ borderColor: userColor + "60" }} />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-base font-extrabold uppercase tracking-wider" style={{ color: userColor }}>
                New Tip! {ethAmount} ETH
              </span>
              <span className="text-xs font-semibold opacity-70 font-mono" style={{ color: userColor }}>
                From: {donor.slice(0, 6)}...{donor.slice(-4)}
              </span>
              <p className="text-base font-bold break-words leading-snug mt-1" style={{ color: msgColor }}>
                {message}
              </p>
            </div>
          </div>
        )}
      </div>

      {alert.vn_url && (
        <audio autoPlay src={alert.vn_url} className="hidden" />
      )}
    </div>
  );
};

/**
 * Renders the OBS alert overlay with queued one-at-a-time display.
 *
 * @returns {React.ReactElement} The alert overlay React element.
 */
export default function AlertOverlay() {
  const { streamerAddress } = useParams();
  const [currentAlert, setCurrentAlert] = useState(null);
  const queueRef = useRef([]);
  const isShowingRef = useRef(false);
  const processQueueRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    document.body.style.background = "transparent";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    processQueueRef.current = () => {
      if (isShowingRef.current || queueRef.current.length === 0) return;

      isShowingRef.current = true;
      const next = queueRef.current.shift();
      setCurrentAlert(next);

      const hasMedia = next.youtube_url || next.vn_url;
      const timeout = hasMedia ? 15000 : 5000;

      setTimeout(() => {
        setCurrentAlert(null);
        isShowingRef.current = false;
        setTimeout(() => {
          if (processQueueRef.current) processQueueRef.current();
        }, 500);
      }, timeout);
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
          if (data.type === "NEW_DONATION") {
            const donation = data.payload;
            donation.id = Date.now().toString() + Math.random();
            queueRef.current.push(donation);
            if (processQueueRef.current) processQueueRef.current();
          }
        } catch {
          // Discard non-JSON payloads.
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
    return <div className="h-screen w-screen bg-transparent overflow-hidden" />;
  }

  return (
    <div className="h-screen w-screen bg-transparent overflow-hidden flex flex-col items-center justify-center p-10">
      <AlertCard alert={currentAlert} />
    </div>
  );
}
