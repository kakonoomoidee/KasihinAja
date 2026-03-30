import React from "react";

/**
 * Milestone goal progress display and configuration form.
 *
 * @param {object} props Component props.
 * @param {object|null} props.stats The aggregated stats object from the API.
 * @param {string} props.milestoneName Current milestone title state.
 * @param {Function} props.setMilestoneName Setter for milestoneName.
 * @param {number|string} props.milestoneTarget Current milestone target state.
 * @param {Function} props.setMilestoneTarget Setter for milestoneTarget.
 * @param {boolean} props.loading Whether a save is in progress.
 * @param {Function} props.handleSaveProfile Form submission handler.
 * @param {Function} props.handleResetMilestone Resets milestone_current to 0.
 * @returns {React.ReactElement} The milestones tab element.
 */
export default function MilestonesTab({
  stats, milestoneName, setMilestoneName,
  milestoneTarget, setMilestoneTarget,
  loading, handleSaveProfile, handleResetMilestone,
}) {
  const mc = stats ? stats.milestone_current : 0;
  const mt = parseFloat(milestoneTarget) || 0;
  const rawPct = mt > 0 ? (mc / mt) * 100 : 0;
  const barPct = Math.min(100, rawPct);
  const completed = mt > 0 && mc >= mt;

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Milestones</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="col-span-1 md:col-span-2 relative p-8 rounded-[2rem] overflow-hidden"
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
          }}
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white/50 uppercase tracking-widest mb-1">Current Progress</h3>
              <p className="text-3xl font-extrabold text-white tracking-tight">{mc.toFixed(4)} <span className="text-xl text-white/40 font-mono">ETH</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold uppercase tracking-widest mb-1" style={{ color: completed ? "#fbbf24" : "#38bdf8" }}>{completed ? "Goal Surpassed!" : `Goal: ${mt.toFixed(4)} ETH`}</p>
              <p className="text-xl font-bold" style={{ color: completed ? "#fbbf24" : "rgba(255,255,255,0.5)" }}>{rawPct.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full h-6 rounded-full overflow-hidden p-1" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(2, barPct)}%`,
                background: completed ? "#f59e0b" : "#0ea5e9",
                boxShadow: completed ? "0 0 16px rgba(245,158,11,0.5)" : "0 0 16px rgba(14,165,233,0.4)"
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="col-span-1 md:col-span-2 bg-white/[0.04] backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
          <div className="mb-6">
            <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Milestone Title</label>
            <input type="text" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 outline-none text-white font-extrabold text-xl shadow-inner focus:border-white/30 transition-colors" placeholder="e.g. New Gaming Setup" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Set New Donation Goal (ETH)</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="number" step="0.001" value={milestoneTarget} onChange={(e) => setMilestoneTarget(e.target.value)} className="flex-1 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 outline-none text-white font-extrabold text-xl shadow-inner focus:border-white/30 transition-colors" />
              <button disabled={loading} type="submit" className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold py-4 px-8 rounded-2xl border border-white/10 shadow-lg transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap">
                {loading ? "Saving..." : "Save Milestone"}
              </button>
              <button type="button" onClick={handleResetMilestone} disabled={loading} className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300/80 hover:text-rose-200 font-bold py-4 px-8 rounded-2xl border border-rose-900/50 transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap">
                Reset Goal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
