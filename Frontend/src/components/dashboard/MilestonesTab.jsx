import React from "react";
import ActionButton from "../shared/ActionButton";
import AmountInput from "../shared/AmountInput";

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
 * @param {string} props.glassInput CSS utility string for glass-styled inputs.
 * @returns {React.ReactElement} The milestones tab element.
 */
export default function MilestonesTab({
  stats, milestoneName, setMilestoneName,
  milestoneTarget, setMilestoneTarget,
  loading, handleSaveProfile, handleResetMilestone,
  glassInput
}) {
  const mc = stats ? stats.milestone_current : 0;
  const mt = parseFloat(milestoneTarget) || 0;
  const rawPct = mt > 0 ? (mc / mt) * 100 : 0;
  const barPct = Math.min(100, rawPct);
  const completed = mt > 0 && mc >= mt;

  const handleStrictNumber = (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
      setMilestoneTarget(val);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Milestones</h2>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Progress Tracker Card */}
        <div
          className="relative p-8 rounded-[2xl] overflow-hidden group"
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}
        >
          <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4 relative z-10">
            <div>
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Current Progress
              </h3>
              <p className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                {mc.toFixed(4)} <span className="text-xl text-white/50 font-bold">ETH</span>
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: completed ? "#fbbf24" : "#38bdf8" }}>
                {completed ? "Goal Surpassed!" : `Goal: ${mt.toFixed(4)} ETH`}
              </p>
              <p className="text-2xl font-black drop-shadow-md" style={{ color: completed ? "#fbbf24" : "rgba(255,255,255,0.7)" }}>
                {rawPct.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="w-full h-6 rounded-full overflow-hidden p-1 relative z-10" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
              style={{
                width: `${Math.max(2, barPct)}%`,
                background: completed ? "linear-gradient(90deg, #d97706, #fbbf24)" : "linear-gradient(90deg, #0284c7, #38bdf8)",
                boxShadow: completed ? "0 0 16px rgba(245,158,11,0.5)" : "0 0 16px rgba(14,165,233,0.4)"
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full" />
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveProfile} className="bg-white/[0.04] backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Milestone Configuration
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Milestone Title</label>
              <input 
                type="text" 
                value={milestoneName} 
                onChange={(e) => setMilestoneName(e.target.value)} 
                className={`w-full ${glassInput} text-lg font-bold focus:border-blue-500/50`} 
                placeholder="e.g. New Gaming Setup" 
              />
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              <div className="flex-1">
                <AmountInput 
                  label="Set New Donation Goal (ETH)"
                  amount={milestoneTarget}
                  setAmount={setMilestoneTarget}
                  handleAmountChange={handleStrictNumber}
                  presets={[]}
                  showMinTip={false}
                  placeholder="1.0"
                  glassInput={`${glassInput} text-lg font-bold`}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2 lg:pt-0">
                <ActionButton 
                  type="submit" 
                  disabled={loading}
                  variant="primary"
                  className="flex-1 sm:flex-none"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  }
                >
                  {loading ? "Saving..." : "Save Milestone"}
                </ActionButton>
                
                <ActionButton 
                  onClick={handleResetMilestone} 
                  disabled={loading}
                  variant="danger"
                  className="flex-1 sm:flex-none"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                  }
                >
                  Reset Goal
                </ActionButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}