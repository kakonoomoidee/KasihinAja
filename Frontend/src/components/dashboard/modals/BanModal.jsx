import React from "react";
import ActionButton from "../../shared/ActionButton";

/**
 * Modal asking the user to confirm banning a donor's wallet address.
 *
 * @param {object} props
 * @param {object} props.donation The donation record whose donor address will be banned.
 * @param {Function} props.onConfirm Called when the user confirms the ban.
 * @param {Function} props.onClose Called when the user dismisses the modal.
 * @returns {React.ReactElement}
 */
export default function BanModal({ donation, onConfirm, onClose }) {
  const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in";
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl";

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className={`${glass} p-8 max-w-md w-full shadow-2xl relative overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Ban Donor?</h3>
        <p className="text-sm text-white/50 font-medium mb-6">This address will be blocked from sending further tips. Save settings to persist.</p>
        
        <div className="space-y-4 mb-8 relative z-10">
          <div className="bg-black/20 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Donor Name</p>
            <p className="text-base font-bold text-white">{donation.donor_name || "Anonymous"}</p>
          </div>
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4">
            <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wider mb-1">Target Address</p>
            <p className="text-sm font-mono font-bold text-rose-200/90 break-all">{donation.donor_address}</p>
          </div>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <ActionButton onClick={onClose} variant="ghost" className="flex-1">Cancel</ActionButton>
          <ActionButton 
            onClick={onConfirm} 
            variant="danger" 
            className="flex-1"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            }
          >
            Confirm Ban
          </ActionButton>
        </div>
      </div>
    </div>
  );
}