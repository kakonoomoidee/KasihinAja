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
 * Renders the classic-style glassmorphic alert card for OBS overlays.
 *
 * @param {object} props The alert data and styling props.
 * @returns {React.ReactElement} The classic template element.
 */
const ClassicTemplate = ({ alert }) => {
  const { profile, message, amount, donor } = alert;
  const msgColor = profile?.msg_color || "#ffffff";
  const userColor = profile?.user_color || "#60a5fa";
  const bgColor = profile?.bg_color || "#0f172a";
  const ethAmount = ethers.formatEther(amount);

  return (
    <div
      className="flex items-center gap-5 py-5 px-8 rounded-2xl fade-in border backdrop-blur-xl shadow-2xl"
      style={{ backgroundColor: bgColor + "cc", borderColor: userColor + "40" }}
    >
      {profile?.avatar_url && (
        <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-2xl border-2 shadow-lg object-cover" style={{ borderColor: userColor + "80" }} />
      )}
      <div className="flex flex-col max-w-xl">
        <span className="text-2xl font-extrabold uppercase tracking-wider drop-shadow-lg" style={{ color: userColor }}>
          New Tip! {ethAmount} ETH
        </span>
        <span className="text-sm font-semibold opacity-80 mb-2 font-mono" style={{ color: userColor }}>
          From: {donor.slice(0, 6)}...{donor.slice(-4)}
        </span>
        <p className="text-xl font-bold break-words leading-snug drop-shadow-md" style={{ color: msgColor }}>
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Renders the minimalist-style glassmorphic alert card for OBS overlays.
 *
 * @param {object} props The alert data and styling props.
 * @returns {React.ReactElement} The minimalist template element.
 */
const MinimalistTemplate = ({ alert }) => {
  const { profile, message, amount, donor } = alert;
  const msgColor = profile?.msg_color || "#e2e8f0";
  const userColor = profile?.user_color || "#60a5fa";
  const ethAmount = ethers.formatEther(amount);

  return (
    <div className="fade-in backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl py-4 px-6 shadow-2xl max-w-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-3 h-3 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: userColor, boxShadow: `0 0 12px ${userColor}` }} />
        <span className="text-base font-bold tracking-wide" style={{ color: userColor }}>
          {donor.slice(0, 6)}...{donor.slice(-4)} tipped {ethAmount} ETH
        </span>
      </div>
      <p className="text-lg font-semibold break-words leading-relaxed pl-6" style={{ color: msgColor }}>
        {message}
      </p>
    </div>
  );
};

/**
 * Renders the OBS alert overlay with template selection, YouTube iframe, and VN audio support.
 *
 * @returns {React.ReactElement} The alert overlay React element.
 */
export default function AlertOverlay() {
  const { streamerAddress } = useParams();
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);

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
            const id = Date.now().toString() + Math.random();
            donation.id = id;

            setAlerts((prev) => [...prev, donation]);

            const hasMedia = donation.youtube_url || donation.vn_url;
            const timeout = hasMedia ? 15000 : 5000;

            setTimeout(() => {
              if (isActive) setAlerts((prev) => prev.filter((a) => a.id !== id));
            }, timeout);
          }

          if (data.type === "MEDIA_SHARE") {
            const media = data.payload;
            const id = "media-" + Date.now().toString() + Math.random();

            setAlerts((prev) => [...prev, {
              id,
              isMediaOnly: true,
              youtube_url: media.youtube_url,
              youtube_start: media.youtube_start,
              donor: media.donor
            }]);

            setTimeout(() => {
              if (isActive) setAlerts((prev) => prev.filter((a) => a.id !== id));
            }, 30000);
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

  if (alerts.length === 0) {
    return <div className="h-screen w-screen bg-transparent overflow-hidden" />;
  }

  return (
    <div className="h-screen w-screen bg-transparent overflow-hidden flex flex-col items-center justify-end p-10 gap-6">
      {alerts.map((alert) => {
        if (alert.isMediaOnly) {
          const youtubeId = extractYoutubeId(alert.youtube_url);
          return youtubeId ? (
            <div key={alert.id} className="flex flex-col items-center gap-4 fade-in">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm">
                <iframe
                  width="400"
                  height="225"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${alert.youtube_start || 0}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Media Share"
                  className="block"
                />
              </div>
            </div>
          ) : null;
        }

        const template = alert.profile?.alert_template || "classic";
        const youtubeId = extractYoutubeId(alert.youtube_url);
        const youtubeStart = alert.youtube_start || 0;

        return (
          <div key={alert.id} className="flex flex-col items-center gap-4">
            {template === "minimalist" ? (
              <MinimalistTemplate alert={alert} />
            ) : (
              <ClassicTemplate alert={alert} />
            )}

            {youtubeId && (
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm fade-in">
                <iframe
                  width="400"
                  height="225"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${youtubeStart}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Media Share"
                  className="block"
                />
              </div>
            )}

            {alert.vn_url && (
              <audio autoPlay src={alert.vn_url} className="hidden" />
            )}
          </div>
        );
      })}
    </div>
  );
}
