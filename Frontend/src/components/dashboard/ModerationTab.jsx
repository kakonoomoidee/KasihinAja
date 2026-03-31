import React, { useState } from "react";
import ActionButton from "../shared/ActionButton";

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
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";
  const [wordInput, setWordInput] = useState("");

  const bannedWordsArray = blacklistText
    .split(",")
    .map(w => w.trim())
    .filter(w => w.length > 0);

  const addWord = (e) => {
    if (e) e.preventDefault();
    const newWord = wordInput.trim();
    if (newWord && !bannedWordsArray.includes(newWord)) {
      const updatedWords = [...bannedWordsArray, newWord];
      setBlacklistText(updatedWords.join(", "));
      setWordInput("");
    }
  };

  const removeWord = (wordToRemove) => {
    const updatedWords = bannedWordsArray.filter(w => w !== wordToRemove);
    setBlacklistText(updatedWords.join(", "));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWord();
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Moderation Rules</h2>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        <div className={`${glass} p-8 relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform duration-500 group-hover:scale-125" />
          
          <h3 className="text-sm font-bold text-rose-400 mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Content Filters
          </h3>
          
          <div className="relative z-10">
            <label className="block text-xs font-bold text-white/50 mb-1 uppercase tracking-wider">
              Blokir Kata ({bannedWordsArray.length}/500)
            </label>
            <p className="text-[11px] text-white/40 font-medium mb-4">
              Pesan yang mengandung kata-kata ini bakal diblokir secara otomatis.
            </p>
            
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <input 
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value.slice(0, 250))}
                  onKeyDown={handleKeyDown}
                  className={`w-full ${glassInput} focus:border-rose-500/50 py-3`}
                  placeholder="Masukkan kata yang mau kamu blokir..."
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20">
                  {wordInput.length}/250
                </span>
              </div>
              <button 
                type="button" 
                onClick={addWord}
                disabled={!wordInput.trim()}
                className="w-12 h-[48px] flex items-center justify-center bg-rose-600/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-black/20 rounded-xl border border-white/5">
              {bannedWordsArray.length === 0 ? (
                <span className="text-sm font-medium text-white/20 italic my-auto">Belum ada kata yang diblokir.</span>
              ) : (
                bannedWordsArray.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-rose-500/30 rounded-lg px-3 py-1.5 transition-colors group">
                    <span className="text-xs font-bold text-white/70">{word}</span>
                    <button 
                      type="button" 
                      onClick={() => removeWord(word)} 
                      className="text-white/30 group-hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={`${glass} p-8 relative overflow-hidden group`}>
          <div className="absolute top-0 left-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none transition-transform duration-500 group-hover:scale-125" />
          
          <h3 className="text-sm font-bold text-rose-400 mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Banned Public Keys
          </h3>
          
          <div className="relative z-10">
            {bannedKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-60">
                <svg className="w-12 h-12 text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm text-white/60 font-semibold">No banned addresses.</p>
                <p className="text-xs text-white/40 mt-1">Use the History tab to permanently block disruptive donors.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Blocked Addresses ({bannedKeys.length})</p>
                {bannedKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between bg-black/20 border border-rose-900/30 rounded-xl p-4 transition-colors hover:border-rose-500/30">
                    <span className="font-mono text-sm font-bold text-rose-200/80 truncate max-w-[250px] sm:max-w-md" title={key}>
                      {key}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => unbanKey(key)} 
                      className="text-xs font-black text-white/50 hover:text-white uppercase tracking-wider bg-white/5 hover:bg-rose-900/40 border border-white/5 hover:border-rose-500/50 px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Unban
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 pb-6">
          <ActionButton 
            type="submit" 
            disabled={loading}
            variant="danger"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            }
          >
            {loading ? "Applying Rules..." : "Apply Rules"}
          </ActionButton>
        </div>

      </form>
    </div>
  );
}