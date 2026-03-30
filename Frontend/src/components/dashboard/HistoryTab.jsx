import React, { useState } from "react";
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

/**
 * Donation history list with media badges, detail modal, replay, and ban actions.
 *
 * @param {object} props Component props.
 * @param {Array} props.history Array of donation history records.
 * @param {string} props.address The authenticated streamer wallet address.
 * @param {Array} props.bannedKeys Currently banned donor addresses.
 * @param {Function} props.banKey Adds a donor address to the ban list.
 * @param {Function} props.handleReplayAlert Replays a donation alert to OBS.
 * @param {boolean} props.loading Whether an action is in progress.
 * @returns {React.ReactElement} The history tab element.
 */
export default function HistoryTab({ history, address, bannedKeys, banKey, handleReplayAlert, loading }) {
  const [selectedDonation, setSelectedDonation] = useState(null);
  const glass = "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl";

  return (
    <div className="space-y-5 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Donation History</h2>
      {history.length === 0 ? (
        <p className={`text-center text-white/40 py-16 font-semibold ${glass}`}>No donations recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {history.map((item) => (
            <div key={item.id} className={`${glass} p-5 cursor-pointer hover:bg-white/10 transition-colors relative group`} onClick={() => setSelectedDonation(item)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm text-white/80">{item.donor_name || "Anonymous"}</p>
                  <p className="font-mono text-xs font-bold text-blue-300 truncate max-w-[200px]" title={item.donor_address}>{item.donor_address.slice(0, 8)}...{item.donor_address.slice(-6)}</p>
                  <p className="text-xs text-white/30 font-medium mt-1">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <span className="text-lg font-extrabold text-emerald-400 whitespace-nowrap">{ethers.formatEther(item.amount)} ETH</span>
              </div>
              {(item.media_url || item.youtube_url || item.vn_url || item.vn_data) && (
                <div className="flex gap-2 mb-3">
                  {(item.media_type === "youtube" || item.youtube_url) && <span className="bg-red-500/20 text-red-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-red-400/30">YouTube</span>}
                  {item.media_type === "tiktok" && <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-pink-400/30">TikTok</span>}
                  {(item.vn_url || item.vn_data) && <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-indigo-400/30">Has Audio</span>}
                </div>
              )}
              <p className="text-white/70 font-medium text-sm break-words leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">{item.filtered_message}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); banKey(item.donor_address); }}
                  disabled={bannedKeys.includes(item.donor_address)}
                  className="flex-1 text-xs font-bold text-red-300 bg-red-500/15 hover:bg-red-500/30 border border-red-400/30 px-3 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {bannedKeys.includes(item.donor_address) ? "Banned" : "Ban Key"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReplayAlert(item.id, address); }}
                  className="flex-1 text-xs font-bold text-sky-300 bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/30 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Replay on OBS
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDonation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedDonation(null)}>
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedDonation(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer">x</button>
            <h3 className="text-xl font-extrabold text-white mb-6">Donation Details</h3>
            <div className="space-y-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-white/40 font-bold uppercase mb-1">Donor</p>
                <p className="font-semibold text-white/90 mb-1">{selectedDonation.donor_name || "Anonymous"}</p>
                <p className="font-mono text-sm text-blue-300 break-all">{selectedDonation.donor_address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/40 font-bold uppercase mb-1">Amount</p>
                  <p className="text-xl font-extrabold text-emerald-400">{ethers.formatEther(selectedDonation.amount)} ETH</p>
                </div>
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/40 font-bold uppercase mb-1">Date</p>
                  <p className="text-sm font-bold text-white/80">{new Date(selectedDonation.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-white/40 font-bold uppercase mb-2">Message</p>
                <p className="text-base text-white/90 leading-relaxed font-medium">{selectedDonation.filtered_message}</p>
              </div>
              {(selectedDonation.media_url || selectedDonation.youtube_url) && (
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 overflow-hidden">
                  <p className="text-xs text-white/40 font-bold uppercase mb-2">Attached Media ({selectedDonation.media_type || "video"})</p>
                  <a href={selectedDonation.media_url || selectedDonation.youtube_url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 truncate block font-mono underline mb-2">{selectedDonation.media_url || selectedDonation.youtube_url}</a>
                  {selectedDonation.media_type === "youtube" && extractYoutubeId(selectedDonation.media_url || selectedDonation.youtube_url) && (
                    <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${extractYoutubeId(selectedDonation.media_url || selectedDonation.youtube_url)}`} allowFullScreen className="rounded-xl border border-white/10" />
                  )}
                </div>
              )}
              {(selectedDonation.vn_url || selectedDonation.vn_data) && (
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/40 font-bold uppercase mb-2">Voice Note</p>
                  <audio src={selectedDonation.vn_data || selectedDonation.vn_url} controls className="w-full" />
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { handleReplayAlert(selectedDonation.id, address); setSelectedDonation(null); }} className="flex-1 bg-sky-500/80 hover:bg-sky-400 text-white font-bold py-3 rounded-xl border border-sky-400/50 transition-all cursor-pointer">
                Replay on OBS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
