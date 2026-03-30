import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import { DONATION_ROUTER_ADDRESS, ROUTER_ABI, API_URL } from "../utils/config";

const PRESET_AMOUNTS = ["0.0005", "0.001", "0.01", "1.0"];
const MEDIA_OPTIONS = [
  { id: "none",       label: "None" },
  { id: "youtube",    label: "YouTube" },
  { id: "tiktok",     label: "TikTok" },
  { id: "vn",         label: "Voice Note" },
];

/**
 * Renders the public-facing tipping page with advanced form, dynamic validations, and modern media inputs.
 *
 * @returns {React.ReactElement} The visual React element.
 */
export default function PublicProfile() {
  const { streamerAddress } = useParams();
  const [profile, setProfile] = useState(null);

  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedMedia, setSelectedMedia] = useState("none");
  const [mediaLink, setMediaLink] = useState("");
  const [youtubeStart, setYoutubeStart] = useState(0);

  const [vnBlob, setVnBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const vnAutoStopRef = useRef(null);

  useEffect(() => {
    /**
     * Fetches the streamer profile from the backend API.
     *
     * @returns {Promise<void>}
     */
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile/${streamerAddress}`);
        setProfile(res.data);
      } catch {
        setProfile({ display_name: "Unknown Streamer", avatar_url: "" });
      }
    };
    if (streamerAddress) fetchProfile();
  }, [streamerAddress]);

  /**
   * Starts recording audio from the user's microphone for the Voice Note feature.
   *
   * @returns {Promise<void>}
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVnBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      vnAutoStopRef.current = setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          recorderRef.current.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch {
      setStatus("Microphone access denied.");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Stops the active audio recording and clears the 30-second auto-stop timer.
   *
   * @returns {void}
   */
  const stopRecording = () => {
    if (vnAutoStopRef.current) {
      clearTimeout(vnAutoStopRef.current);
      vnAutoStopRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * Handles amount input changes and validates if the input is a valid numeric format.
   *
   * @param {object} e The React input change event.
   * @returns {void}
   */
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    
    if (val && isNaN(val)) {
      setAmountError("Invalid amount. Please enter numbers only.");
    } else {
      setAmountError("");
    }
  };

  /**
   * Processes the donation transaction via the smart contract integration.
   *
   * @param {object} e The synthesized React submission event.
   * @returns {Promise<void>}
   */
  const handleDonate = async (e) => {
    e.preventDefault();
    
    if (amountError || isNaN(amount)) {
      setStatus("Please resolve the input errors before proceeding.");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    if (!window.ethereum) {
      setStatus("Please install MetaMask to proceed.");
      return;
    }
    if (parseFloat(amount) < 0.0005) {
      setStatus("Minimum tip is 0.0005 ETH.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Waiting for wallet confirmation...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const donorAddr = await signer.getAddress();

      let mediaData = null;
      let vnBase64 = null;

      if (selectedMedia === "youtube" && mediaLink) {
        mediaData = { youtube_url: mediaLink, youtube_start: youtubeStart };
      } else if (selectedMedia === "tiktok" && mediaLink) {
        mediaData = { tiktok_url: mediaLink };
      } else if (selectedMedia === "vn" && vnBlob) {
        vnBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(vnBlob);
        });
        mediaData = { vn_data: vnBase64 };
      }

      setStatus("Registering donation intent...");
      const intentRes = await axios.post(`${API_URL}/donation-intent`, {
        donor_address: donorAddr,
        streamer_address: streamerAddress,
        amount: amount,
        donorName: donorName,
        isAnonymous: isAnonymous,
        selectedMedia: selectedMedia,
        mediaLink: selectedMedia === "youtube" ? mediaLink : (selectedMedia === "tiktok" ? mediaLink : null),
        media_data: mediaData,
      });
      const donationToken = intentRes.data.token;

      const contract = new ethers.Contract(DONATION_ROUTER_ADDRESS, ROUTER_ABI, signer);
      const tx = await contract.donate(streamerAddress, message, donationToken, {
        value: ethers.parseEther(amount)
      });

      setStatus("Transaction submitted! Awaiting confirmation...");
      await tx.wait();

      setStatus("Donation confirmed successfully!");
      setAmount("");
      setMessage("");
      setDonorName("");
      setIsAnonymous(false);
      setSelectedMedia("none");
      setMediaLink("");
      setYoutubeStart(0);
      setVnBlob(null);
    } catch (err) {
      setStatus("Donation failed. " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center text-white/40 font-semibold animate-pulse text-lg">Loading...</div>;

  const glass = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg";
  const glassInput = "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 outline-none text-white placeholder-white/25 font-medium w-full transition-all";

  const amountNum = parseFloat(amount) || 0;
  const pricePerSec = parseFloat(profile.media_price_per_second) || 0;
  const allowedSeconds = pricePerSec > 0 && amountNum > 0 ? Math.floor(amountNum / pricePerSec) : null;

  const mediaEnabled = profile.enable_media_share || profile.enable_vn;
  const availableMediaOptions = MEDIA_OPTIONS.filter((opt) => {
    if (opt.id === "none") return true;
    if ((opt.id === "youtube" || opt.id === "tiktok") && profile.enable_media_share) return true;
    if (opt.id === "vn" && profile.enable_vn) return true;
    return false;
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className={`${glass} p-8 max-w-md w-full shadow-2xl`}>

        <div className="flex flex-col items-center mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-2xl border-2 border-white/30 mb-4 object-cover shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20 mb-4">
              <span className="text-white/40 text-3xl font-extrabold">?</span>
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">{profile.display_name}</h1>
          <p className="text-xs text-white/30 font-mono mt-2 bg-white/5 py-1.5 px-3.5 rounded-full border border-white/10">{streamerAddress}</p>

          {profile.milestone_target > 0 && (() => {
            const rawPct = ((profile.milestone_current || 0) / profile.milestone_target) * 100;
            const barPct = Math.min(100, rawPct);
            const overflowed = rawPct >= 100;
            return (
              <div className="w-full mt-6 px-1">
                <div className="flex justify-between text-xs font-bold text-white/50 mb-2 tracking-wide">
                  <span>{profile.milestone_current ? parseFloat(profile.milestone_current).toFixed(3) : "0.000"} ETH</span>
                  <span style={{ color: overflowed ? "#fbbf24" : "#7dd3fc" }}>
                    {rawPct.toFixed(1)}% of {parseFloat(profile.milestone_target).toFixed(3)} ETH
                  </span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2.5 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.max(2, barPct)}%`,
                      background: overflowed ? "#f59e0b" : "#0ea5e9",
                      boxShadow: overflowed ? "0 0 10px rgba(245,158,11,0.5)" : "0 0 10px rgba(14,165,233,0.4)"
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        <form onSubmit={handleDonate} className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              className={glassInput}
              value={isAnonymous ? "" : donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder={isAnonymous ? "Anonymous" : "Your name..."}
              disabled={isAnonymous}
              style={{ opacity: isAnonymous ? 0.4 : 1 }}
            />
            <div className="mt-2.5 flex justify-end px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-white/50 group-hover:text-white/80 transition-colors">Send as Anonymous</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Amount (ETH)</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setAmount(preset); setAmountError(""); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${amount === preset ? "bg-blue-500/50 border-blue-400/60 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              className={`${glassInput} ${amountError ? "border-red-500/60 focus:border-red-500/80 bg-red-500/5" : "focus:border-blue-400/50"}`}
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
            />
            {amountError && (
              <p className="text-xs text-red-400 font-bold mt-1.5">{amountError}</p>
            )}
            {!amountError && parseFloat(amount) > 0 && parseFloat(amount) < 0.0005 && (
              <p className="text-xs text-red-400 font-bold mt-1.5">Minimum tip is 0.0005 ETH</p>
            )}
            {!amountError && allowedSeconds !== null && (
              <p className="text-xs text-emerald-400 font-bold mt-1.5">Your tip allows for ~{allowedSeconds}s of media</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Message</label>
            <textarea
              required
              maxLength={200}
              className={`${glassInput} min-h-[90px] resize-none focus:border-blue-400/50`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keep up the great content!"
            />
          </div>

          {mediaEnabled && (
            <div>
              <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Media Share</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {availableMediaOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setSelectedMedia(opt.id); setMediaLink(""); setVnBlob(null); }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer border text-center ${selectedMedia === opt.id ? "bg-blue-500/40 border-blue-400/60 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {selectedMedia === "youtube" && (
                <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/20 rounded-2xl p-4 space-y-2">
                  <input
                    type="text"
                    className={`${glassInput} text-sm focus:border-red-400/50`}
                    value={mediaLink}
                    onChange={(e) => setMediaLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-red-300/80 whitespace-nowrap">Start at (sec):</label>
                    <input
                      type="number"
                      min="0"
                      className="w-24 bg-white/10 border border-white/20 rounded-lg p-2 outline-none text-white font-bold text-sm focus:border-red-400/50"
                      value={youtubeStart}
                      onChange={(e) => setYoutubeStart(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))}
                      onBlur={(e) => { if (e.target.value === "") setYoutubeStart(0); }}
                    />
                  </div>
                </div>
              )}

              {selectedMedia === "tiktok" && (
                <div className="bg-pink-500/10 backdrop-blur-sm border border-pink-400/20 rounded-2xl p-4">
                  <input
                    type="text"
                    className={`${glassInput} text-sm focus:border-pink-400/50`}
                    value={mediaLink}
                    onChange={(e) => setMediaLink(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..."
                  />
                </div>
              )}

              {selectedMedia === "vn" && (
                <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-full p-2 flex items-center gap-3 relative overflow-hidden shadow-inner">
                  <style>
                    {`
                      @keyframes waveform {
                        0%, 100% { height: 20%; }
                        50% { height: 100%; }
                      }
                      .wave-bar {
                        width: 3px;
                        background-color: #60a5fa;
                        border-radius: 4px;
                        animation: waveform 1s ease-in-out infinite;
                      }
                    `}
                  </style>

                  {!isRecording && !vnBlob && (
                    <div className="flex items-center gap-3 w-full px-2 py-1">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 flex items-center justify-center border border-blue-500/30 transition-all cursor-pointer shadow-lg"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                      </button>
                      <span className="text-sm font-semibold text-white/40">Tap mic to record</span>
                    </div>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-3 w-full px-2 py-1">
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 animate-pulse cursor-pointer shadow-lg"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                      </button>
                      <div className="flex items-center gap-[3px] h-6 flex-1 px-2">
                        {[...Array(15)].map((_, i) => (
                          <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 80 + 20}%` }} />
                        ))}
                      </div>
                      <span className="text-xs font-mono text-red-400 font-bold pr-2 animate-pulse">REC</span>
                    </div>
                  )}

                  {vnBlob && (
                    <div className="flex items-center gap-2 w-full px-1">
                      <audio controls src={URL.createObjectURL(vnBlob)} className="flex-1 h-10 custom-audio" />
                      <button
                        type="button"
                        onClick={() => setVnBlob(null)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all cursor-pointer mr-1"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!amountError}
            className="w-full bg-blue-500/70 hover:bg-blue-400 backdrop-blur-sm text-white font-extrabold py-4 px-4 rounded-xl border border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 tracking-wide shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {loading ? "Confirming Block..." : "Send Ethereum Tip"}
          </button>
        </form>

        {status && (
          <div className="mt-6 p-3.5 bg-white/5 backdrop-blur-sm text-white/90 border border-white/10 text-center rounded-xl text-sm break-words font-semibold">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}