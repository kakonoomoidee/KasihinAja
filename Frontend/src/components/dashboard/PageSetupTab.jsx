import React from "react";
import ActionButton from "../shared/ActionButton";
import AmountInput from "../shared/AmountInput";

/**
 * Form for configuring the streamer's public profile, feature toggles, and media pricing.
 *
 * @param {object} props - Component props.
 * @param {string} props.avatarUrl - Current avatar URL state.
 * @param {Function} props.setAvatarUrl - Setter for avatarUrl.
 * @param {string} props.displayName - Current display name state.
 * @param {Function} props.setDisplayName - Setter for displayName.
 * @param {boolean} props.enableMediaShare - Whether media share is enabled.
 * @param {Function} props.setEnableMediaShare - Setter for enableMediaShare.
 * @param {boolean} props.enableVn - Whether voice notes are enabled.
 * @param {Function} props.setEnableVn - Setter for enableVn.
 * @param {number|string} props.mediaPricePerSecond - ETH price per second of media.
 * @param {Function} props.setMediaPricePerSecond - Setter for mediaPricePerSecond.
 * @param {number|string} props.vnFixedPrice - Fixed ETH price for a Voice Note.
 * @param {Function} props.setVnFixedPrice - Setter for vnFixedPrice.
 * @param {boolean} props.loading - Whether a save is in progress.
 * @param {Function} props.handleSaveProfile - Form submission handler.
 * @param {string} props.glassInput - CSS utility string for glass-styled inputs.
 * @returns {React.ReactElement} The page setup tab element.
 */
export default function PageSetupTab({
  avatarUrl, setAvatarUrl,
  displayName, setDisplayName,
  enableMediaShare, setEnableMediaShare,
  enableVn, setEnableVn,
  mediaPricePerSecond, setMediaPricePerSecond,
  vnFixedPrice, setVnFixedPrice,
  loading, handleSaveProfile,
  glassInput,
}) {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";

  const handleStrictNumber = (setter) => (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
      setter(val);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Page Setup</h2>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Profile Section */}
        <div className={`${glass} p-8`}>
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Public Identity
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider">Avatar URL</label>
              <div className="flex items-center gap-5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover shadow-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center border-2 border-white/[0.08] flex-shrink-0">
                    <span className="text-white/30 text-xl font-extrabold">?</span>
                  </div>
                )}
                <input 
                  type="text" 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)} 
                  className={`flex-1 ${glassInput} focus:border-blue-500/50`} 
                  placeholder="https://example.com/avatar.png" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider">Display Name</label>
              <input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                className={`w-full ${glassInput} focus:border-blue-500/50 mt-1`} 
                placeholder="My Stream Name" 
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={`${glass} p-8`}>
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Interactive Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-white mb-1">Media Share</p>
                <p className="text-xs text-white/50 font-medium leading-relaxed">Allow viewers to share YouTube or TikTok videos directly onto your stream overlay.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                <input 
                  type="checkbox" 
                  checked={enableMediaShare} 
                  onChange={(e) => setEnableMediaShare(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-white/10"></div>
              </label>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-white mb-1">Voice Notes</p>
                <p className="text-xs text-white/50 font-medium leading-relaxed">Let supporters record and send short audio messages that play on your stream.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                <input 
                  type="checkbox" 
                  checked={enableVn} 
                  onChange={(e) => setEnableVn(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-white/10"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className={`${glass} p-8`}>
          <h3 className="text-sm font-bold text-blue-400 mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Monetization Rules
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <AmountInput 
                  label="Video Price Per Second (ETH)"
                  amount={mediaPricePerSecond}
                  setAmount={setMediaPricePerSecond}
                  handleAmountChange={handleStrictNumber(setMediaPricePerSecond)}
                  presets={[]}
                  showMinTip={false}
                  placeholder="0.0005"
                  glassInput={`${glassInput} pl-12`}
                />
                <span className="absolute left-4 top-[38px] text-white/30 font-bold pointer-events-none">Ξ</span>
              </div>
              <p className="text-[11px] text-white/40 font-medium mt-[-4px]">Duration is calculated as Tip Amount ÷ Price. <br/>Default: 0.0005 ETH/sec</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <AmountInput 
                  label="Voice Note Fixed Price (ETH)"
                  amount={vnFixedPrice}
                  setAmount={setVnFixedPrice}
                  handleAmountChange={handleStrictNumber(setVnFixedPrice)}
                  presets={[]}
                  showMinTip={false}
                  placeholder="0.01"
                  glassInput={`${glassInput} pl-12`}
                />
                <span className="absolute left-4 top-[38px] text-white/30 font-bold pointer-events-none">Ξ</span>
              </div>
              <p className="text-[11px] text-white/40 font-medium mt-[-4px]">Fixed base price for sending a 30s Voice Note. <br/>Default: 0.01 ETH</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
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
            {loading ? "Signing..." : "Save Setup"}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}