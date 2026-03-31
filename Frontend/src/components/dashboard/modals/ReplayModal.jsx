import React from "react";
import { ethers } from "ethers";
import ActionButton from "../../shared/ActionButton";

/**
 * Modal asking the user to confirm a donation alert replay to OBS.
 *
 * @param {object} props
 * @param {object} props.donation The donation record to replay.
 * @param {Function} props.onConfirm Called when the user confirms the replay.
 * @param {Function} props.onClose Called when the user dismisses the modal.
 * @returns {React.ReactElement}
 */
export default function ReplayModal({ donation, onConfirm, onClose }) {
  const OVERLAY = "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in";
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl";

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className={`${glass} p-8 max-w-md w-full shadow-2xl relative overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Replay Alert</h3>
        <p className="text-sm text-white/50 font-medium mb-6">Broadcast this donation to your active OBS overlay?</p>
        
        <div className="space-y-4 mb-8 relative z-10">
          <div className="bg-black/20 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Donor</p>
            <p className="text-base font-bold text-white">{donation.donor_name || "Anonymous"}</p>
            <p className="text-xs font-mono text-white/40 truncate mt-1">{donation.donor_address}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-1">Amount</p>
              <p className="text-xl font-black text-white">{ethers.formatEther(donation.amount)} <span className="text-sm font-bold text-white/50">ETH</span></p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Date</p>
              <p className="text-sm font-bold text-white/80">{new Date(donation.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <ActionButton onClick={onClose} variant="ghost" className="flex-1">Cancel</ActionButton>
          <ActionButton 
            onClick={onConfirm} 
            variant="primary" 
            className="flex-1"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            }
          >
            Replay Now
          </ActionButton>
        </div>
      </div>
    </div>
  );
}