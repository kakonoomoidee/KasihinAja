import React from "react";

/**
 * Banned words and donor key moderation controls.
 *
 * @param {object} props Component props.
 * @param {string} props.blacklistText Comma-separated banned words string.
 * @param {Function} props.setBlacklistText Setter for blacklistText.
 * @param {Array} props.bannedKeys Currently banned donor addresses.
 * @param {Function} props.unbanKey Removes a donor address from the ban list.
 * @param {boolean} props.loading Whether a save is in progress.
 * @param {Function} props.handleSaveProfile Form submission handler.
 * @param {string} props.glassInput CSS utility string for glass-styled inputs.
 * @returns {React.ReactElement} The moderation tab element.
 */
export default function ModerationTab({ blacklistText, setBlacklistText, bannedKeys, unbanKey, loading, handleSaveProfile, glassInput }) {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl";

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Moderation</h2>
      <form onSubmit={handleSaveProfile} className="space-y-5">
        <div className={`${glass} p-6`}>
          <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Custom Banned Words</label>
          <textarea value={blacklistText} onChange={(e) => setBlacklistText(e.target.value)} className={`w-full ${glassInput} min-h-[120px] font-mono text-sm leading-relaxed resize-none`} placeholder="spam, profanity, political" />
        </div>
        <div className={`${glass} p-6`}>
          <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">Banned Public Keys</label>
          {bannedKeys.length === 0 ? (
            <p className="text-sm text-white/30 font-medium">No banned addresses. Use the History tab to ban donors.</p>
          ) : (
            <div className="space-y-2">
              {bannedKeys.map((key) => (
                <div key={key} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="font-mono text-sm font-bold text-white/70 truncate max-w-[300px]" title={key}>{key.slice(0, 10)}...{key.slice(-8)}</span>
                  <button type="button" onClick={() => unbanKey(key)} className="text-xs font-bold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Unban</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button disabled={loading} type="submit" className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-all cursor-pointer disabled:opacity-40">{loading ? "Saving..." : "Apply Rules"}</button>
      </form>
    </div>
  );
}
