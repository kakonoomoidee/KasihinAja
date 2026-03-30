import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";

const CARD = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg";
const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md";

/**
 * Extracts the YouTube video ID from standard, short, or embed URLs.
 *
 * @param {string} url - The YouTube URL string.
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
 * Modal asking the user to confirm a donation alert replay to OBS.
 *
 * @param {object} props - Component props.
 * @param {object} props.donation - The donation record to replay.
 * @param {Function} props.onConfirm - Called when the user confirms the replay.
 * @param {Function} props.onClose - Called when the user dismisses the modal.
 * @returns {React.ReactElement} The confirmation modal element.
 */
const ReplayConfirmationModal = ({ donation, onConfirm, onClose }) => (
  <div className={OVERLAY} onClick={onClose}>
    <div className="bg-[#0d1630] border border-white/[0.08] rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-extrabold text-white mb-1 tracking-tight">Replay Alert on OBS?</h3>
      <p className="text-xs text-white/40 font-medium mb-6">This will broadcast the following donation to your active OBS overlay.</p>
      <div className="space-y-3 mb-7">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Donor</p>
          <p className="text-sm font-semibold text-white">{donation.donor_name || "Anonymous"}</p>
          <p className="text-xs font-mono text-white/30 truncate mt-0.5">{donation.donor_address}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Amount</p>
            <p className="text-base font-extrabold text-white">{ethers.formatEther(donation.amount)} ETH</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Date</p>
            <p className="text-xs font-bold text-white/70">{new Date(donation.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Message</p>
          <p className="text-sm text-white/80 leading-relaxed">{donation.filtered_message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white font-bold py-3 rounded-xl border border-white/[0.08] transition-all cursor-pointer text-sm">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 bg-white/90 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-all cursor-pointer text-sm">
          Replay Now
        </button>
      </div>
    </div>
  </div>
);

/**
 * Modal asking the user to confirm banning a donor's wallet address.
 *
 * @param {object} props - Component props.
 * @param {object} props.donation - The donation record whose donor address will be banned.
 * @param {Function} props.onConfirm - Called when the user confirms the ban.
 * @param {Function} props.onClose - Called when the user dismisses the modal.
 * @returns {React.ReactElement} The ban confirmation modal element.
 */
const BanKeyConfirmationModal = ({ donation, onConfirm, onClose }) => (
  <div className={OVERLAY} onClick={onClose}>
    <div className="bg-[#0d1630] border border-white/[0.08] rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-extrabold text-white mb-1 tracking-tight">Ban This Donor?</h3>
      <p className="text-xs text-white/40 font-medium mb-6">This address will be added to your blocked list. Save settings to persist the ban.</p>
      <div className="space-y-3 mb-7">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Donor</p>
          <p className="text-sm font-semibold text-white">{donation.donor_name || "Anonymous"}</p>
        </div>
        <div className="bg-white/[0.03] border border-rose-900/30 rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Address to Ban</p>
          <p className="text-xs font-mono font-bold text-rose-300/80 break-all">{donation.donor_address}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white font-bold py-3 rounded-xl border border-white/[0.08] transition-all cursor-pointer text-sm">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white font-bold py-3 rounded-xl border border-rose-900/60 transition-all cursor-pointer text-sm">
          Confirm Ban
        </button>
      </div>
    </div>
  </div>
);

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
      <div className="space-y-5 fade-in">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Donation History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${CARD} p-5 space-y-3 animate-pulse`}>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-white/[0.06] rounded-lg" />
                  <div className="h-2.5 w-36 bg-white/[0.04] rounded-lg" />
                  <div className="h-2 w-20 bg-white/[0.03] rounded-lg" />
                </div>
                <div className="h-5 w-20 bg-white/[0.06] rounded-lg" />
              </div>
              <div className="h-12 w-full bg-white/[0.03] rounded-xl" />
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-white/[0.03] rounded-lg" />
                <div className="flex-1 h-8 bg-white/[0.03] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Donation History</h2>
      {history.length === 0 ? (
        <p className={`text-center text-white/30 py-16 font-semibold ${CARD}`}>No donations recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {history.map((item) => (
            <div key={item.id} className={`${CARD} p-5 cursor-pointer hover:bg-white/[0.05] transition-colors`} onClick={() => setSelectedDonation(item)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm text-white/80">{item.donor_name || "Anonymous"}</p>
                  <p className="font-mono text-xs font-bold text-white/30 truncate max-w-[200px]" title={item.donor_address}>{item.donor_address.slice(0, 8)}...{item.donor_address.slice(-6)}</p>
                  <p className="text-xs text-white/25 font-medium mt-1">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <span className="text-sm font-extrabold text-white whitespace-nowrap">{ethers.formatEther(item.amount)} ETH</span>
              </div>
              {(item.media_url || item.youtube_url || item.vn_url || item.vn_data) && (
                <div className="flex gap-2 mb-3">
                  {(item.media_type === "youtube" || item.youtube_url) && <span className="bg-white/[0.04] text-white/40 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-white/[0.06]">YouTube</span>}
                  {item.media_type === "tiktok" && <span className="bg-white/[0.04] text-white/40 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-white/[0.06]">TikTok</span>}
                  {(item.vn_url || item.vn_data) && <span className="bg-white/[0.04] text-white/40 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-white/[0.06]">Audio</span>}
                </div>
              )}
              <p className="text-white/60 font-medium text-sm break-words leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">{item.filtered_message}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setBanTarget(item); }}
                  disabled={bannedKeys.includes(item.donor_address)}
                  className="flex-1 text-xs font-bold text-white/40 hover:text-rose-300/80 bg-white/[0.03] hover:bg-rose-950/40 border border-white/[0.06] hover:border-rose-900/50 px-3 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {bannedKeys.includes(item.donor_address) ? "Banned" : "Ban Key"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setReplayTarget(item); }}
                  className="flex-1 text-xs font-bold text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Replay on OBS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDonation && createPortal(
        <div className={OVERLAY} onClick={() => setSelectedDonation(null)}>
          <div className="bg-[#0d1630] border border-white/[0.08] rounded-3xl p-8 max-w-3xl w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedDonation(null)} className="absolute top-4 right-4 text-white/30 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer text-sm">x</button>
            <h3 className="text-xl font-extrabold text-white mb-6">Donation Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                  <p className="text-xs text-white/40 font-bold uppercase mb-1">Donor</p>
                  <p className="font-semibold text-white/90 mb-1">{selectedDonation.donor_name || "Anonymous"}</p>
                  <p className="font-mono text-sm text-white/40 break-all">{selectedDonation.donor_address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                    <p className="text-xs text-white/40 font-bold uppercase mb-1">Amount</p>
                    <p className="text-xl font-extrabold text-white">{ethers.formatEther(selectedDonation.amount)} ETH</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                    <p className="text-xs text-white/40 font-bold uppercase mb-1">Date</p>
                    <p className="text-sm font-bold text-white/70">{new Date(selectedDonation.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                  <p className="text-xs text-white/40 font-bold uppercase mb-2">Message</p>
                  <p className="text-base text-white/80 leading-relaxed font-medium">{selectedDonation.filtered_message}</p>
                </div>
                {(selectedDonation.media_url || selectedDonation.youtube_url) && (
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] overflow-hidden">
                    <p className="text-xs text-white/40 font-bold uppercase mb-2">Attached Media ({selectedDonation.media_type || "video"})</p>
                    <a href={selectedDonation.media_url || selectedDonation.youtube_url} target="_blank" rel="noreferrer" className="text-sm text-white/50 hover:text-white truncate block font-mono underline mb-2">{selectedDonation.media_url || selectedDonation.youtube_url}</a>
                    {selectedDonation.media_type === "youtube" && extractYoutubeId(selectedDonation.media_url || selectedDonation.youtube_url) && (
                      <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${extractYoutubeId(selectedDonation.media_url || selectedDonation.youtube_url)}`} allowFullScreen className="rounded-xl border border-white/[0.06]" />
                    )}
                  </div>
                )}
                {(selectedDonation.vn_url || selectedDonation.vn_data) && (
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                    <p className="text-xs text-white/40 font-bold uppercase mb-2">Voice Note</p>
                    <audio src={selectedDonation.vn_data || selectedDonation.vn_url} controls className="w-full" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setReplayTarget(selectedDonation); setSelectedDonation(null); }}
                className="w-full md:w-auto px-8 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white font-bold py-3 rounded-xl border border-white/[0.08] transition-all cursor-pointer text-sm"
              >
                Replay on OBS
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {replayTarget && createPortal(
        <ReplayConfirmationModal
          donation={replayTarget}
          onClose={() => setReplayTarget(null)}
          onConfirm={() => { handleReplayAlert(replayTarget.id, address); setReplayTarget(null); }}
        />,
        document.body
      )}

      {banTarget && createPortal(
        <BanKeyConfirmationModal
          donation={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={() => { banKey(banTarget.donor_address); setBanTarget(null); }}
        />,
        document.body
      )}
    </div>
  );
}