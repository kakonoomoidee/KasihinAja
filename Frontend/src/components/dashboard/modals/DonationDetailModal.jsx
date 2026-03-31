import React from "react";
import { ethers } from "ethers";
import ActionButton from "../../shared/ActionButton";

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
 * Modal to display full details of a specific donation history record.
 *
 * @param {object} props
 * @param {object} props.donation The donation object.
 * @param {Function} props.onClose Modal close handler.
 * @param {Function} props.onReplay Callback to trigger a replay.
 * @returns {React.ReactElement}
 */
export default function DonationDetailModal({ donation, onClose, onReplay }) {
  const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-8 bg-black/70 backdrop-blur-md animate-fade-in";
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl";

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className={`${glass} p-6 md:p-8 max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-full`} onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-2xl font-black text-white tracking-tight">Donation Details</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 relative z-10">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="bg-black/20 rounded-xl p-5 border border-white/5">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Donor Information</p>
              <p className="font-bold text-white text-lg mb-1">{donation.donor_name || "Anonymous"}</p>
              <p className="font-mono text-xs text-white/40 break-all">{donation.donor_address}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Tip Amount</p>
                <p className="text-2xl font-black text-white tracking-tight">{ethers.formatEther(donation.amount)} <span className="text-sm font-bold text-white/50">ETH</span></p>
              </div>
              <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Timestamp</p>
                <p className="text-sm font-bold text-white/80 mt-1">{new Date(donation.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="bg-black/20 rounded-xl p-5 border border-white/5">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">Accompanying Message</p>
              <p className="text-base text-white/90 leading-relaxed font-medium">{donation.filtered_message}</p>
            </div>

            {(donation.media_url || donation.youtube_url) && (
              <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">Attached Media ({donation.media_type || "video"})</p>
                <a href={donation.media_url || donation.youtube_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 truncate block font-mono underline mb-4">
                  {donation.media_url || donation.youtube_url}
                </a>
                {donation.media_type === "youtube" && extractYoutubeId(donation.media_url || donation.youtube_url) && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${extractYoutubeId(donation.media_url || donation.youtube_url)}`} 
                      allowFullScreen 
                      frameBorder="0"
                    />
                  </div>
                )}
              </div>
            )}

            {(donation.vn_url || donation.vn_data) && (
              <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">Voice Note Audio</p>
                <audio src={donation.vn_data || donation.vn_url} controls className="w-full" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end relative z-10 pt-4 border-t border-white/5">
          <ActionButton 
            onClick={onReplay} 
            variant="ghost"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            }
          >
            Replay Alert on OBS
          </ActionButton>
        </div>
      </div>
    </div>
  );
}