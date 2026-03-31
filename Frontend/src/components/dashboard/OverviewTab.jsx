import React from "react";
import ActionButton from "../shared/ActionButton";

/**
 * Displays summary stats and the public donation link for the streamer.
 *
 * @param {object} props Component props.
 * @param {string} props.address The authenticated streamer wallet address.
 * @param {object|null} props.stats The aggregated stats object from the API.
 * @param {string} props.glassInput CSS utility string for glass-styled inputs.
 * @param {Function} props.copyToClipboard Copies text to clipboard.
 * @returns {React.ReactElement} The overview tab element.
 */
export default function OverviewTab({ address, stats, glassInput, copyToClipboard }) {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";
  const publicUrl = window.location.origin + "/" + address;

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Overview Board</h2>
      </div>

      <div className={`${glass} p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm">
          <h3 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Public Donation Link
          </h3>
          <p className="text-white/50 text-sm font-medium">Share this unique gateway with your audience to start receiving tips.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
          <input 
            readOnly 
            value={publicUrl} 
            className={`w-full sm:w-64 ${glassInput} text-sm font-mono text-white/70 focus:border-blue-500/50 py-3`} 
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <ActionButton 
              onClick={() => copyToClipboard(publicUrl)}
              variant="primary"
              className="flex-1 sm:flex-none"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              }
            >
              Copy
            </ActionButton>
            
            <ActionButton 
              onClick={() => window.open(publicUrl, '_blank')}
              variant="ghost"
              className="flex-1 sm:flex-none"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              }
            >
              Open
            </ActionButton>
          </div>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${glass} p-8 relative overflow-hidden group hover:bg-white/[0.06] transition-colors duration-300`}>
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-emerald-400 mb-4 uppercase tracking-widest relative z-10">Monthly Revenue</h3>
            <div className="flex items-baseline gap-2 relative z-10">
              <p className="text-4xl font-black text-white tracking-tight">{stats.total_month.toFixed(4)}</p>
              <span className="text-xl text-white/50 font-bold">ETH</span>
            </div>
          </div>

          <div className={`${glass} p-8 relative overflow-hidden group hover:bg-white/[0.06] transition-colors duration-300`}>
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-widest relative z-10">Current Goal</h3>
            <div className="flex items-baseline gap-2 relative z-10">
              <p className="text-4xl font-black text-white tracking-tight">{stats.milestone_current.toFixed(4)}</p>
            </div>
            <p className="text-sm font-bold text-white/40 mt-2 relative z-10">of {stats.milestone_target} ETH</p>
          </div>

          <div className={`${glass} p-8 relative overflow-hidden group hover:bg-white/[0.06] transition-colors duration-300`}>
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-amber-400 mb-4 uppercase tracking-widest relative z-10">Top Supporter</h3>
            {stats.top_spender ? (
              <div className="relative z-10">
                <p className="text-2xl font-mono font-bold text-white truncate drop-shadow-md" title={stats.top_spender}>
                  {stats.top_spender.slice(0, 6)}...{stats.top_spender.slice(-4)}
                </p>
                <p className="text-sm font-bold text-white/40 mt-2">Biggest fan this month</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white/30 relative z-10 mt-1">None yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-48 border border-white/10 rounded-2xl bg-white/[0.02] flex items-center justify-center text-white/40 font-semibold animate-pulse">
          Fetching board data...
        </div>
      )}
    </div>
  );
}