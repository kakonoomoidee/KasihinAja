import React from "react";
import ActionButton from "../shared/ActionButton";

/**
 * OBS Overlay configuration tab with URL management and alert preview.
 *
 * @param {object} props Component props.
 * @param {string} props.address The authenticated streamer wallet address.
 * @param {string} props.alertTemplate Active template selection ("classic" | "minimalist").
 * @param {Function} props.setAlertTemplate Setter for alertTemplate.
 * @param {string} props.msgColor Active message color hex.
 * @param {Function} props.setMsgColor Setter for msgColor.
 * @param {string} props.userColor Active username color hex.
 * @param {Function} props.setUserColor Setter for userColor.
 * @param {string} props.bgColor Active background color hex.
 * @param {Function} props.setBgColor Setter for bgColor.
 * @param {string} props.avatarUrl Current avatar URL.
 * @param {boolean} props.showPreview Whether the preview is visible.
 * @param {Function} props.setShowPreview Setter for showPreview.
 * @param {boolean} props.showAlertUrl Whether the alert URL is revealed.
 * @param {Function} props.setShowAlertUrl Setter for showAlertUrl.
 * @param {boolean} props.showMilestoneUrl Whether the milestone URL is revealed.
 * @param {Function} props.setShowMilestoneUrl Setter for showMilestoneUrl.
 * @param {boolean} props.loading Whether a save is in progress.
 * @param {Function} props.handleSaveProfile Form submission handler.
 * @param {Function} props.triggerTestAlert Dispatches a test alert to OBS.
 * @param {Function} props.copyToClipboard Copies text to clipboard.
 * @param {string} props.glassInput CSS utility string for glass-styled inputs.
 * @returns {React.ReactElement} The OBS overlay tab element.
 */
export default function ObsOverlayTab({
  address, alertTemplate, setAlertTemplate,
  msgColor, setMsgColor, userColor, setUserColor, bgColor, setBgColor,
  avatarUrl, showPreview, setShowPreview,
  showAlertUrl, setShowAlertUrl, showMilestoneUrl, setShowMilestoneUrl,
  loading, handleSaveProfile, triggerTestAlert, copyToClipboard,
  glassInput,
}) {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";
  const secretKey = btoa(address);
  const alertUrl = window.location.origin + "/overlay/alert/" + secretKey;
  const milestoneUrl = window.location.origin + "/overlay/milestone/" + secretKey;

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">OBS Overlay</h2>
          <p className="text-white/40 mt-2 text-sm font-medium">Configure alerts and grab your overlay URLs</p>
        </div>
        <div className="flex gap-3">
          <ActionButton 
            onClick={() => setShowPreview(!showPreview)} 
            variant="ghost"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
              </svg>
            }
          >
            {showPreview ? "Hide Preview" : "Live Preview"}
          </ActionButton>
          <ActionButton 
            onClick={triggerTestAlert} 
            disabled={loading} 
            variant="primary"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            }
          >
            Fire Test Alert
          </ActionButton>
        </div>
      </div>

      {showPreview && (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          <p className="text-xs text-white/30 font-bold uppercase tracking-widest mb-6">Preview Canvas</p>
          
          <div className="flex items-center justify-center min-h-[150px] p-4 border border-white/5 border-dashed rounded-xl">
            {alertTemplate === "minimalist" ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 px-6 max-w-lg shadow-2xl animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: userColor, color: userColor }} />
                  <span className="text-base font-bold tracking-wide" style={{ color: userColor }}>0xABC1...EF42 tipped 0.42 ETH</span>
                </div>
                <p className="text-lg font-semibold break-words leading-relaxed pl-6" style={{ color: msgColor }}>This is a preview of your alert!</p>
              </div>
            ) : (
              <div className="flex items-center gap-5 py-5 px-8 rounded-2xl border-2 bg-white/5 backdrop-blur-xl shadow-2xl animate-fade-in" style={{ borderColor: userColor + "40" }}>
                {avatarUrl && <img src={avatarUrl} alt="Preview" className="w-16 h-16 rounded-2xl border-2 object-cover shadow-[0_0_15px_currentColor]" style={{ borderColor: userColor, color: userColor }} />}
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold uppercase tracking-wider drop-shadow-md" style={{ color: userColor }}>New Tip! 0.42 ETH</span>
                  <span className="text-sm font-semibold opacity-70 mb-1 font-mono" style={{ color: userColor }}>From: 0xABC1...EF42</span>
                  <p className="text-lg font-bold break-words" style={{ color: msgColor }}>This is a preview of your alert!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${glass} p-8`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Donation Alert URL</h3>
            <button 
              type="button" 
              onClick={() => setShowAlertUrl(!showAlertUrl)} 
              className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {showAlertUrl ? "Hide" : "Reveal"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type={showAlertUrl ? "text" : "password"} 
              readOnly 
              value={alertUrl} 
              className={`flex-1 ${glassInput} text-xs font-mono text-white/70 py-3`} 
            />
            <ActionButton 
              onClick={() => copyToClipboard(alertUrl)} 
              variant="primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              }
            >
              Copy
            </ActionButton>
          </div>
        </div>

        <div className={`${glass} p-8`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Milestone Goal URL</h3>
            <button 
              type="button" 
              onClick={() => setShowMilestoneUrl(!showMilestoneUrl)} 
              className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {showMilestoneUrl ? "Hide" : "Reveal"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type={showMilestoneUrl ? "text" : "password"} 
              readOnly 
              value={milestoneUrl} 
              className={`flex-1 ${glassInput} text-xs font-mono text-white/70 py-3`} 
            />
            <ActionButton 
              onClick={() => copyToClipboard(milestoneUrl)} 
              variant="primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              }
            >
              Copy
            </ActionButton>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className={`${glass} p-8`}>
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest border-b border-white/10 pb-4">
            Visual Style
          </h3>
          
          <div className="mb-8">
            <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Alert Template</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => setAlertTemplate("classic")} 
                className={`py-4 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border flex flex-col items-center gap-2 ${alertTemplate === "classic" ? "bg-blue-600/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/[0.05] hover:text-white/70"}`}
              >
                <div className="w-full h-12 rounded bg-white/5 border border-white/10 flex items-center px-3 gap-2 opacity-70">
                  <div className="w-6 h-6 rounded bg-white/20" />
                  <div className="h-2 w-16 bg-white/20 rounded" />
                </div>
                Classic Box
              </button>
              <button 
                type="button" 
                onClick={() => setAlertTemplate("minimalist")} 
                className={`py-4 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border flex flex-col items-center gap-2 ${alertTemplate === "minimalist" ? "bg-blue-600/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/[0.05] hover:text-white/70"}`}
              >
                <div className="w-full h-12 rounded bg-white/5 border border-white/10 flex items-center px-3 gap-2 opacity-70">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <div className="h-2 w-16 bg-white/20 rounded" />
                </div>
                Minimalist Line
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Message Color</label>
              <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 focus-within:border-blue-400/50 transition-colors">
                <input type="color" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg bg-transparent" />
                <input type="text" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Username Color</label>
              <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 focus-within:border-blue-400/50 transition-colors">
                <input type="color" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg bg-transparent" />
                <input type="text" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Background Color</label>
              <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 focus-within:border-blue-400/50 transition-colors">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg bg-transparent" />
                <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-2 pb-6">
          <ActionButton 
            type="submit" 
            disabled={loading}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            }
          >
            {loading ? "Saving..." : "Save Overlay Settings"}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}