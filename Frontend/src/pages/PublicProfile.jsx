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
 * Renders the public-facing tipping page with v1.4 advanced form.
 *
 * @returns {React.ReactElement} The visual React element.
 */
export default function PublicProfile() {
  const { streamerAddress } = useParams();
  const [profile, setProfile] = useState(null);

  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
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
   * Starts recording audio from the user's microphone.
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
    } catch {
      setStatus("Microphone access denied.");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  /**
   * Stops the active audio recording.
   *
   * @returns {void}
   */
  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * Processes the donation transaction via the smart contract.
   *
   * @param {object} e The synthesized React submission event.
   * @returns {Promise<void>}
   */
  const handleDonate = async (e) => {
    e.preventDefault();
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

      console.log("[DEBUG 1] Payload sent to Intent API:", JSON.stringify({ selectedMedia, mediaData: mediaData ? { ...mediaData, vn_data: mediaData.vn_data ? "[BASE64]" : undefined } : null }));

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

      setStatus("Donation confirmed!");
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

  const glass = "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl";
  const glassInput = "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 outline-none text-white placeholder-white/40 font-medium w-full";

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

          {profile.milestone_target > 0 && (
            <div className="w-full mt-6 px-1">
              <div className="flex justify-between text-xs font-bold text-white/50 mb-2 tracking-wide">
                <span>{profile.milestone_current ? parseFloat(profile.milestone_current).toFixed(3) : "0.000"} ETH</span>
                <span className="text-blue-300">Goal: {parseFloat(profile.milestone_target).toFixed(3)} ETH</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 border border-white/10 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/30"
                  style={{ width: `${Math.min(100, ((profile.milestone_current || 0) / profile.milestone_target) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleDonate} className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Your Name</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                className={glassInput}
                value={isAnonymous ? "" : donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder={isAnonymous ? "Anonymous" : "Your name..."}
                disabled={isAnonymous}
                style={{ opacity: isAnonymous ? 0.4 : 1 }}
              />
              <label className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-400 cursor-pointer"
                />
                <span className="text-xs font-bold text-white/60">Anon</span>
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
                  onClick={() => setAmount(preset)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${amount === preset ? "bg-blue-500/50 border-blue-400/60 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="0.0001"
              min="0.0005"
              required
              className={glassInput}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            {parseFloat(amount) > 0 && parseFloat(amount) < 0.0005 && (
              <p className="text-xs text-red-400 font-bold mt-1.5">Minimum tip is 0.0005 ETH</p>
            )}
            {allowedSeconds !== null && (
              <p className="text-xs text-emerald-400 font-bold mt-1.5">Your tip allows for ~{allowedSeconds}s of media</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Message</label>
            <textarea
              required
              maxLength={200}
              className={`${glassInput} min-h-[90px] resize-none`}
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
                    className={`${glassInput} text-sm`}
                    value={mediaLink}
                    onChange={(e) => setMediaLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-red-300/80 whitespace-nowrap">Start at (sec):</label>
                    <input
                      type="number"
                      min="0"
                      className="w-24 bg-white/10 border border-white/20 rounded-lg p-2 outline-none text-white font-bold text-sm"
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
                    className={`${glassInput} text-sm`}
                    value={mediaLink}
                    onChange={(e) => setMediaLink(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..."
                  />
                </div>
              )}

              {selectedMedia === "vn" && (
                <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-400/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <button type="button" onClick={startRecording} className="bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 font-bold py-2 px-4 rounded-xl border border-amber-400/30 transition-all text-sm cursor-pointer">
                        Start Recording
                      </button>
                    ) : (
                      <button type="button" onClick={stopRecording} className="bg-red-500/30 hover:bg-red-500/50 text-red-200 font-bold py-2 px-4 rounded-xl border border-red-400/30 transition-all text-sm animate-pulse cursor-pointer">
                        Stop Recording
                      </button>
                    )}
                    {vnBlob && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2 py-1 rounded-lg border border-emerald-400/30">VN Attached</span>
                        <button type="button" onClick={() => setVnBlob(null)} className="text-xs font-bold text-red-300 hover:text-red-200 cursor-pointer">Remove</button>
                      </div>
                    )}
                  </div>
                  {vnBlob && (
                    <audio controls src={URL.createObjectURL(vnBlob)} className="mt-3 w-full h-10" />
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500/70 hover:bg-blue-400 backdrop-blur-sm text-white font-extrabold py-4 px-4 rounded-xl border border-white/20 transition-all disabled:opacity-40 mt-2 tracking-wide shadow-lg shadow-blue-500/20 cursor-pointer"
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
