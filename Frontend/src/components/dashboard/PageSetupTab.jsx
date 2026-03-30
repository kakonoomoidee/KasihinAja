import React from "react";

/**
 * Form for configuring the streamer's public profile and feature toggles.
 *
 * @param {object} props Component props.
 * @param {string} props.avatarUrl Current avatar URL state.
 * @param {Function} props.setAvatarUrl Setter for avatarUrl.
 * @param {string} props.displayName Current display name state.
 * @param {Function} props.setDisplayName Setter for displayName.
 * @param {boolean} props.enableMediaShare Whether media share is enabled.
 * @param {Function} props.setEnableMediaShare Setter for enableMediaShare.
 * @param {boolean} props.enableVn Whether voice notes are enabled.
 * @param {Function} props.setEnableVn Setter for enableVn.
 * @param {boolean} props.loading Whether a save is in progress.
 * @param {Function} props.handleSaveProfile Form submission handler.
 * @param {string} props.glassInput CSS utility string for glass-styled inputs.
 * @param {string} props.btnPrimary CSS utility string for primary buttons.
 * @returns {React.ReactElement} The page setup tab element.
 */
export default function PageSetupTab({
  avatarUrl, setAvatarUrl,
  displayName, setDisplayName,
  enableMediaShare, setEnableMediaShare,
  enableVn, setEnableVn,
  loading, handleSaveProfile,
  glassInput, btnPrimary,
}) {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl";

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Page Setup</h2>
      <form onSubmit={handleSaveProfile} className="space-y-5">
        <div className={`${glass} p-6`}>
          <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Avatar</label>
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl border-2 border-white/30 object-cover shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                <span className="text-white/40 text-2xl font-extrabold">?</span>
              </div>
            )}
            <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className={`flex-1 ${glassInput}`} placeholder="https://example.com/avatar.png" />
          </div>
        </div>
        <div className={`${glass} p-6`}>
          <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`w-full ${glassInput}`} placeholder="My Stream Name" />
        </div>
        <div className={`${glass} p-6`}>
          <label className="block text-xs font-bold text-white/50 mb-4 uppercase tracking-wider">Donor Features</label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={enableMediaShare} onChange={(e) => setEnableMediaShare(e.target.checked)} className="w-5 h-5 rounded accent-white cursor-pointer" />
              <span className="font-semibold text-white/80">Enable Media Share (YouTube / TikTok)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={enableVn} onChange={(e) => setEnableVn(e.target.checked)} className="w-5 h-5 rounded accent-white cursor-pointer" />
              <span className="font-semibold text-white/80">Enable Voice Note</span>
            </label>
          </div>
        </div>
        <button disabled={loading} type="submit" className={btnPrimary}>{loading ? "Signing..." : "Save Setup"}</button>
      </form>
    </div>
  );
}
