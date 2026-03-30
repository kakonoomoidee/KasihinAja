import React from "react";

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
 * @param {string} props.btnPrimary CSS utility string for primary buttons.
 * @param {string} props.btnGhost CSS utility string for ghost buttons.
 * @returns {React.ReactElement} The OBS overlay tab element.
 */
export default function ObsOverlayTab({
  address, alertTemplate, setAlertTemplate,
  msgColor, setMsgColor, userColor, setUserColor, bgColor, setBgColor,
  avatarUrl, showPreview, setShowPreview,
  showAlertUrl, setShowAlertUrl, showMilestoneUrl, setShowMilestoneUrl,
  loading, handleSaveProfile, triggerTestAlert, copyToClipboard,
  glassInput, btnPrimary, btnGhost,
}) {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl";
  const secretKey = btoa(address);
  const alertUrl = window.location.origin + "/overlay/alert/" + secretKey;
  const milestoneUrl = window.location.origin + "/overlay/milestone/" + secretKey;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">OBS Overlay</h2>
          <p className="text-white/40 mt-1 text-sm">Configure alerts and grab your overlay URLs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className={btnGhost}>{showPreview ? "Hide Preview" : "Preview"}</button>
          <button onClick={triggerTestAlert} disabled={loading} className={btnPrimary}>Fire Alert</button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <p className="text-xs text-white/30 font-bold uppercase tracking-widest mb-4">Live Preview</p>
          {alertTemplate === "minimalist" ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 px-6 max-w-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: userColor }} />
                <span className="text-base font-bold tracking-wide" style={{ color: userColor }}>0xABC1...EF42 tipped 0.42 ETH</span>
              </div>
              <p className="text-lg font-semibold break-words leading-relaxed pl-6" style={{ color: msgColor }}>This is a preview of your alert!</p>
            </div>
          ) : (
            <div className="flex items-center gap-5 py-5 px-8 rounded-2xl border-2 bg-white/5 backdrop-blur-xl" style={{ borderColor: userColor + "40" }}>
              {avatarUrl && <img src={avatarUrl} alt="Preview" className="w-16 h-16 rounded-2xl border-2 object-cover shadow-lg" style={{ borderColor: userColor }} />}
              <div className="flex flex-col">
                <span className="text-xl font-extrabold uppercase tracking-wider" style={{ color: userColor }}>New Tip! 0.42 ETH</span>
                <span className="text-sm font-semibold opacity-70 mb-1 font-mono" style={{ color: userColor }}>From: 0xABC1...EF42</span>
                <p className="text-lg font-bold break-words" style={{ color: msgColor }}>This is a preview of your alert!</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${glass} p-6`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Alert URL</h3>
            <button type="button" onClick={() => setShowAlertUrl(!showAlertUrl)} className="text-xs font-bold text-white/50 hover:text-white bg-white/10 px-3 py-1 rounded-lg transition-colors cursor-pointer">{showAlertUrl ? "Hide" : "Reveal"}</button>
          </div>
          <div className="flex items-center gap-2">
            <input type={showAlertUrl ? "text" : "password"} readOnly value={alertUrl} className={`flex-1 ${glassInput} text-xs font-mono`} />
            <button type="button" onClick={() => copyToClipboard(alertUrl)} className={btnPrimary}>Copy</button>
          </div>
        </div>
        <div className={`${glass} p-6`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Milestone URL</h3>
            <button type="button" onClick={() => setShowMilestoneUrl(!showMilestoneUrl)} className="text-xs font-bold text-white/50 hover:text-white bg-white/10 px-3 py-1 rounded-lg transition-colors cursor-pointer">{showMilestoneUrl ? "Hide" : "Reveal"}</button>
          </div>
          <div className="flex items-center gap-2">
            <input type={showMilestoneUrl ? "text" : "password"} readOnly value={milestoneUrl} className={`flex-1 ${glassInput} text-xs font-mono`} />
            <button type="button" onClick={() => copyToClipboard(milestoneUrl)} className={btnPrimary}>Copy</button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-5">
        <div className={`${glass} p-6`}>
          <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Alert Template</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setAlertTemplate("classic")} className={`py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border ${alertTemplate === "classic" ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/70"}`}>Classic</button>
            <button type="button" onClick={() => setAlertTemplate("minimalist")} className={`py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border ${alertTemplate === "minimalist" ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/70"}`}>Minimalist</button>
          </div>
        </div>
        <div className={`${glass} p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Message Color</label>
              <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1"><input type="color" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg" /><input type="text" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" /></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Username Color</label>
              <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1"><input type="color" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg" /><input type="text" value={userColor} onChange={(e) => setUserColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" /></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Background Color</label>
              <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1"><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-10 cursor-pointer p-0 border-0 rounded-lg" /><input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-transparent px-2 font-mono font-semibold text-white outline-none uppercase text-sm" /></div>
            </div>
          </div>
        </div>
        <button disabled={loading} type="submit" className={btnPrimary}>{loading ? "Saving..." : "Save Overlay Settings"}</button>
      </form>
    </div>
  );
}
