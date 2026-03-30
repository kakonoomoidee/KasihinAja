import React from "react";

/**
 * Displays summary stats and the public donation link for the streamer.
 *
 * @param {object} props Component props.
 * @param {string} props.address The authenticated streamer wallet address.
 * @param {object|null} props.stats The aggregated stats object from the API.
 * @param {string} props.glassInput CSS utility string for glass-styled inputs.
 * @param {string} props.btnPrimary CSS utility string for primary buttons.
 * @param {Function} props.copyToClipboard Copies text to clipboard.
 * @returns {React.ReactElement} The overview tab element.
 */
export default function OverviewTab({ address, stats, glassInput, btnPrimary, copyToClipboard }) {
  const glass = "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl";
  const publicUrl = window.location.origin + "/" + address;

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Overview</h2>
      <div className={`${glass} p-6`}>
        <h3 className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Public Donation Link</h3>
        <p className="text-white/50 text-sm mb-3">Share this with your audience</p>
        <div className="flex items-center gap-2">
          <input readOnly value={publicUrl} className={`flex-1 ${glassInput} text-sm font-mono`} />
          <button onClick={() => copyToClipboard(publicUrl)} className={btnPrimary}>Copy</button>
        </div>
      </div>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${glass} p-6`}>
            <h3 className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Monthly Revenue</h3>
            <p className="text-3xl font-extrabold text-white">{stats.total_month.toFixed(4)} <span className="text-lg text-white/50">ETH</span></p>
          </div>
          <div className={`${glass} p-6`}>
            <h3 className="text-xs font-bold text-emerald-300 mb-2 uppercase tracking-wider">Milestone</h3>
            <p className="text-3xl font-extrabold text-white">{stats.milestone_current.toFixed(4)} <span className="text-lg text-white/40">/ {stats.milestone_target} ETH</span></p>
          </div>
          <div className={`${glass} p-6`}>
            <h3 className="text-xs font-bold text-amber-300 mb-2 uppercase tracking-wider">Top Supporter</h3>
            <p className="text-lg font-mono font-bold text-white truncate" title={stats.top_spender}>
              {stats.top_spender ? `${stats.top_spender.slice(0, 6)}...${stats.top_spender.slice(-4)}` : "None"}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 text-white/40 font-semibold animate-pulse">Loading analytics...</div>
      )}
    </div>
  );
}
