import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import { DONATION_ROUTER_ADDRESS, ROUTER_ABI, API_URL } from "../utils/config";
import AmountInput from "../components/shared/AmountInput";
import YouTubeInput from "../components/shared/media/YouTubeInput";
import TikTokInput from "../components/shared/media/TikTokInput";
import VoiceNoteInput from "../components/shared/media/VoiceNoteInput";

const MEDIA_OPTIONS = [
  { id: "none",       label: "None" },
  { id: "youtube",    label: "YouTube" },
  { id: "tiktok",     label: "TikTok" },
  { id: "vn",         label: "Voice Note" },
];

/**
 * Renders the public-facing tipping page with a split-screen layout, dynamic validations, and modern media previews.
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
  const [recordingStream, setRecordingStream] = useState(null);
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
      setRecordingStream(stream);
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVnBlob(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      vnAutoStopRef.current = setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          recorderRef.current.stop();
          setIsRecording(false);
          setRecordingStream(null);
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
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
      setRecordingStream(null);
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

  const pricePerSec = parseFloat(profile.media_price_per_second) || 0;

  const mediaEnabled = profile.enable_media_share || profile.enable_vn;
  const availableMediaOptions = MEDIA_OPTIONS.filter((opt) => {
    if (opt.id === "none") return true;
    if ((opt.id === "youtube" || opt.id === "tiktok") && profile.enable_media_share) return true;
    if (opt.id === "vn" && profile.enable_vn) return true;
    return false;
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className={`${glass} p-8 flex flex-col items-center text-center`}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-3xl border-4 border-white/10 mb-6 object-cover shadow-2xl" />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-white/10 flex items-center justify-center border-4 border-white/10 mb-6 shadow-2xl">
                <span className="text-white/40 text-4xl font-extrabold">?</span>
              </div>
            )}
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{profile.display_name}</h1>
            <p className="text-xs text-white/40 font-mono mt-3 bg-white/5 py-2 px-4 rounded-full border border-white/10 break-all">{streamerAddress}</p>

            {profile.milestone_target > 0 && (() => {
              const rawPct = ((profile.milestone_current || 0) / profile.milestone_target) * 100;
              const barPct = Math.min(100, rawPct);
              const overflowed = rawPct >= 100;
              return (
                <div className="w-full mt-8 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-end mb-3">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Current</p>
                      <span className="text-sm font-extrabold text-white">{profile.milestone_current ? parseFloat(profile.milestone_current).toFixed(3) : "0.000"} ETH</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Goal</p>
                      <span className="text-xs font-bold" style={{ color: overflowed ? "#fbbf24" : "#7dd3fc" }}>
                        {rawPct.toFixed(1)}% of {parseFloat(profile.milestone_target).toFixed(3)} ETH
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-3 border border-white/10 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000 relative"
                      style={{
                        width: `${Math.max(2, barPct)}%`,
                        background: overflowed ? "linear-gradient(90deg, #d97706, #fbbf24)" : "linear-gradient(90deg, #0284c7, #38bdf8)",
                        boxShadow: overflowed ? "0 0 15px rgba(245,158,11,0.6)" : "0 0 15px rgba(14,165,233,0.5)"
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className={`${glass} p-8 shadow-2xl`}>
            <form onSubmit={handleDonate} className="flex flex-col gap-6">

              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Your Name</label>
                <div className="relative">
                  <input
                    type="text"
                    className={glassInput}
                    value={isAnonymous ? "" : donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={isAnonymous ? "Anonymous" : "Your name..."}
                    disabled={isAnonymous}
                    style={{ opacity: isAnonymous ? 0.4 : 1 }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none group bg-black/40 py-1.5 px-3 rounded-lg border border-white/10">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-[10px] uppercase font-bold text-white/60 group-hover:text-white/90 transition-colors">Anon</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <AmountInput 
                  amount={amount} 
                  setAmount={setAmount} 
                  handleAmountChange={handleAmountChange} 
                  amountError={amountError} 
                  glassInput={glassInput} 
                />

                {!amountError && (selectedMedia === "youtube" || selectedMedia === "tiktok") && pricePerSec > 0 && (
                  <div className="mt-3 bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Media Info</p>
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <p className="text-white/30 mb-0.5">Rate</p>
                        <p className="text-white/70">{pricePerSec} ETH/sec</p>
                      </div>
                      <div>
                        <p className="text-white/30 mb-0.5">Max Duration</p>
                        <p className="text-white/70">30 min (1800s)</p>
                      </div>
                    </div>
                    {parseFloat(amount) > 0 && (
                      <div className="bg-white/[0.06] rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-white/50 font-medium">Estimated Duration</span>
                        <span className="text-xs font-extrabold text-white">
                          {Math.min(1800, Math.floor(parseFloat(amount) / pricePerSec))}s
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Message</label>
                <div className="relative">
                  <textarea
                    required
                    maxLength={250}
                    className={`${glassInput} min-h-[100px] resize-none focus:border-blue-400/50 pb-8`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Keep up the great content!"
                  />
                  <span className={`absolute bottom-3 right-3 text-xs font-bold ${message.length === 250 ? 'text-red-400' : 'text-white/30'}`}>
                    {message.length}/250
                  </span>
                </div>
              </div>

              {mediaEnabled && (
                <div>
                  <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Media Share</label>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {availableMediaOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setSelectedMedia(opt.id); setMediaLink(""); setVnBlob(null); }}
                        className={`py-3 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer border text-center ${selectedMedia === opt.id ? "bg-blue-500/40 border-blue-400/60 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {selectedMedia === "youtube" && (
                    <YouTubeInput 
                      mediaLink={mediaLink} 
                      setMediaLink={setMediaLink} 
                      youtubeStart={youtubeStart} 
                      setYoutubeStart={setYoutubeStart} 
                      glassInput={glassInput} 
                    />
                  )}

                  {selectedMedia === "tiktok" && (
                    <TikTokInput 
                      mediaLink={mediaLink} 
                      setMediaLink={setMediaLink} 
                      glassInput={glassInput} 
                    />
                  )}

                  {selectedMedia === "vn" && (
                    <VoiceNoteInput 
                      isRecording={isRecording} 
                      startRecording={startRecording} 
                      stopRecording={stopRecording} 
                      vnBlob={vnBlob} 
                      setVnBlob={setVnBlob} 
                      recordingStream={recordingStream}
                    />
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!amountError}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 px-4 rounded-xl border border-blue-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                {loading ? "Confirming Block..." : "Send Ethereum Tip"}
              </button>
            </form>

            {status && (
              <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm text-white/90 border border-white/10 text-center rounded-xl text-sm break-words font-semibold shadow-inner">
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}