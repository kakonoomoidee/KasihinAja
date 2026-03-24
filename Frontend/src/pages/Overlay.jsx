import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { WS_URL } from "../utils/config";
import { ethers } from "ethers";

/**
 * Renders the OBS overlay mounting an open WebSocket binding that triggers visual popups per donation.
 *
 * @returns {React.ReactElement} The visual React element designed for transparency.
 */
export default function Overlay() {
  const { streamerAddress } = useParams();
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    let isActive = true;
    let decodedAddress = streamerAddress;
    try { decodedAddress = atob(streamerAddress).toLowerCase(); } catch { decodedAddress = streamerAddress.toLowerCase(); }

    /**
     * Bootstraps the WebSocket connection listening securely to the configured backend stream.
     *
     * @returns {void}
     */
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
            
            setTimeout(() => {
              if (isActive) setAlerts((prev) => prev.filter((a) => a.id !== id));
            }, 5000);
          }
        } catch {
          // Discard irrelevant non-JSON stream bursts securely.
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
        const { profile, message, amount, donor } = alert;
        const msgColor = profile?.msg_color || "#ffffff";
        const userColor = profile?.user_color || "#ffeb3b";
        const bgColor = profile?.bg_color || "#0f172a";
        const ethAmount = ethers.formatEther(amount);

        return (
          <div 
            key={alert.id} 
            className="flex items-center gap-5 py-5 px-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] fade-in border-4 transform transition-all"
            style={{ backgroundColor: bgColor, borderColor: userColor }}
          >
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Profile Icon" className="w-20 h-20 rounded-full border-4 shadow-inner object-cover" style={{ borderColor: userColor }} />
            )}
            <div className="flex flex-col max-w-xl">
              <span className="text-2xl font-black uppercase tracking-widest drop-shadow-md" style={{ color: userColor }}>
                New Tip! {ethAmount} ETH
              </span>
              <span className="text-sm font-bold opacity-90 mb-2 font-mono drop-shadow-sm" style={{ color: userColor }}>
                From: {donor.slice(0,6)}...{donor.slice(-4)}
              </span>
              <p className="text-xl font-extrabold break-words leading-snug drop-shadow-md" style={{ color: msgColor }}>
                {message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
