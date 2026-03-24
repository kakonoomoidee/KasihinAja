import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import { DONATION_ROUTER_ADDRESS, ROUTER_ABI, API_URL } from "../utils/config";

/**
 * Renders the public-facing tipping page with Media Share and Voice Note capabilities.
 *
 * @returns {React.ReactElement} The visual React element.
 */
export default function PublicProfile() {
  const { streamerAddress } = useParams();
  const [profile, setProfile] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
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
    if (streamerAddress) {
      fetchProfile();
    }
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

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

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

    try {
      setLoading(true);
      setStatus("Waiting for wallet confirmation...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(DONATION_ROUTER_ADDRESS, ROUTER_ABI, signer);

      const tx = await contract.donate(streamerAddress, message, {
        value: ethers.parseEther(amount)
      });

      setStatus("Transaction submitted! Awaiting confirmation...");
      await tx.wait();

      if (youtubeUrl) {
        const donorAddr = await signer.getAddress();
        await axios.post(`${API_URL}/media-attach/${streamerAddress}`, {
          youtube_url: youtubeUrl,
          youtube_start: youtubeStart,
          donor: donorAddr
        });
      }

      setStatus("Donation confirmed!");
      setAmount("");
      setMessage("");
      setYoutubeUrl("");
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
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">
            {profile.display_name}
          </h1>
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
                ></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleDonate} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Amount (ETH)</label>
            <input
              type="number"
              step="0.0001"
              required
              className={glassInput}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Message</label>
            <textarea
              required
              maxLength={200}
              className={`${glassInput} min-h-[100px] resize-none`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keep up the great content!"
            />
          </div>

          {profile.enable_media_share && (
            <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-4">
              <label className="block text-xs font-bold text-purple-300 mb-2 uppercase tracking-wider">Media Share (YouTube)</label>
              <input
                type="text"
                className={`${glassInput} text-sm mb-2`}
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-purple-300/80 whitespace-nowrap">Start at (sec):</label>
                <input
                  type="number"
                  min="0"
                  className="w-24 bg-white/10 border border-white/20 rounded-lg p-2 outline-none text-white font-bold text-sm"
                  value={youtubeStart}
                  onChange={(e) => setYoutubeStart(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {profile.enable_vn && (
            <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-400/20 rounded-2xl p-4">
              <label className="block text-xs font-bold text-amber-300 mb-2 uppercase tracking-wider">Voice Note</label>
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
