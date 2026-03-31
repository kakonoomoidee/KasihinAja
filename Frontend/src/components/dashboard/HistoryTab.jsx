import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";

// Modals
import ReplayModal from "./modals/ReplayModal";
import BanModal from "./modals/BanModal";
import DonationDetailModal from "./modals/DonationDetailModal";

const CARD = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";

/**
 * Donation history list with media badges, detail modal, replay and ban confirmation modals.
 *
 * @param {object} props - Component props.
 * @param {Array} props.history - Array of donation history records.
 * @param {string} props.address - The authenticated streamer wallet address.
 * @param {Array} props.bannedKeys - Currently banned donor addresses.
 * @param {Function} props.banKey - Adds a donor address to the ban list.
 * @param {Function} props.handleReplayAlert - Replays a donation alert to OBS.
 * @param {boolean} props.loading - Whether an action is in progress.
 * @returns {React.ReactElement} The history tab element.
 */
export default function HistoryTab({ history, address, bannedKeys, banKey, handleReplayAlert, loading }) {
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [replayTarget, setReplayTarget] = useState(null);
  const [banTarget, setBanTarget] = useState(null);

  if (loading) {
    return (
      <div className="space-y-8 fade-in">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Donation History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${CARD} p-6 space-y-4 animate-pulse`}>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded-lg" />
                  <div className="h-3 w-48 bg-white/5 rounded-lg" />
                </div>
                <div className="h-6 w-24 bg-white/10 rounded-lg" />
              </div>
              <div className="h-16 w-full bg-white/5 rounded-xl" />
              <div className="flex gap-3 pt-2">
                <div className="h-10 w-24 bg-white/5 rounded-xl" />
                <div className="h-10 w-32 bg-white/5 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Donation History</h2>
      
      {history.length === 0 ? (
        <div className={`${CARD} py-24 flex flex-col items-center justify-center text-center opacity-70`}>
          <svg className="w-16 h-16 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-bold text-white/50">No donations yet.</p>
          <p className="text-sm font-medium text-white/30 mt-1">Start streaming and sharing your link!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {history.map((item) => (
            <div 
              key={item.id} 
              className={`${CARD} p-6 cursor-pointer hover:bg-white/[0.06] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] border-white/5 hover:border-white/20`} 
              onClick={() => setSelectedDonation(item)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-base text-white/90">{item.donor_name || "Anonymous"}</p>
                  <p className="font-mono text-[10px] font-bold text-white/40 truncate mt-0.5" title={item.donor_address}>
                    {item.donor_address.slice(0, 6)}...{item.donor_address.slice(-4)}
                  </p>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-lg font-black text-emerald-400 drop-shadow-sm whitespace-nowrap">
                  {ethers.formatEther(item.amount)} <span className="text-xs text-white/50">ETH</span>
                </span>
              </div>

              {(item.media_url || item.youtube_url || item.vn_url || item.vn_data) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {(item.media_type === "youtube" || item.youtube_url) && <span className="bg-red-500/20 text-red-300 text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded border border-red-500/30">YouTube</span>}
                  {item.media_type === "tiktok" && <span className="bg-pink-500/20 text-pink-300 text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded border border-pink-500/30">TikTok</span>}
                  {(item.vn_url || item.vn_data) && <span className="bg-blue-500/20 text-blue-300 text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded border border-blue-500/30">Voice Note</span>}
                </div>
              )}

              <p className="text-white/70 font-medium text-sm break-words leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 line-clamp-3">
                {item.filtered_message}
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setBanTarget(item); }}
                  disabled={bannedKeys.includes(item.donor_address)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-black text-white/40 hover:text-rose-400 bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-900/50 py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                  {bannedKeys.includes(item.donor_address) ? "Banned" : "Ban"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setReplayTarget(item); }}
                  className="flex-[2] flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-black text-white/60 hover:text-blue-400 bg-white/5 hover:bg-blue-900/20 border border-white/5 hover:border-blue-500/30 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDonation && createPortal(
        <DonationDetailModal 
          donation={selectedDonation}
          onClose={() => setSelectedDonation(null)}
          onReplay={() => { setReplayTarget(selectedDonation); setSelectedDonation(null); }}
        />,
        document.body
      )}

      {replayTarget && createPortal(
        <ReplayModal
          donation={replayTarget}
          onClose={() => setReplayTarget(null)}
          onConfirm={() => { handleReplayAlert(replayTarget.id, address); setReplayTarget(null); }}
        />,
        document.body
      )}

      {banTarget && createPortal(
        <BanModal
          donation={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={() => { banKey(banTarget.donor_address); setBanTarget(null); }}
        />,
        document.body
      )}
    </div>
  );
}