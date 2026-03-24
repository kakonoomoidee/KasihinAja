import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import { DONATION_ROUTER_ADDRESS, ROUTER_ABI, API_URL } from "../utils/config";

/**
 * Renders the public-facing streaming tipping page allowing authenticated interactions with EVM routers.
 *
 * @returns {React.ReactElement} The visual React element.
 */
export default function PublicProfile() {
  const { streamerAddress } = useParams();
  const [profile, setProfile] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    /**
     * Reaches the API sequentially retrieving existing setup templates for streamers.
     *
     * @returns {Promise<void>} 
     */
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile/${streamerAddress}`);
        setProfile(res.data);
      } catch (err) {
        setProfile({ display_name: "Unknown Streamer", avatar_url: "" });
      }
    };
    if (streamerAddress) {
      fetchProfile();
    }
  }, [streamerAddress]);

  /**
   * Evaluates input logic, connects to injected providers anonymously, and pays exact smart contract tips.
   *
   * @param {object} e The synthesized React submission object.
   * @returns {Promise<void>}
   */
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!window.ethereum) {
      setStatus("Please install MetaMask to proceed with Web3 tips");
      return;
    }

    try {
      setLoading(true);
      setStatus("Waiting for cryptographic wallet confirmation...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(DONATION_ROUTER_ADDRESS, ROUTER_ABI, signer);
      
      const tx = await contract.donate(streamerAddress, message, {
        value: ethers.parseEther(amount)
      });
      
      setStatus("Transaction authenticated! Awaiting block confirmation...");
      await tx.wait();
      
      setStatus("Donation successfully processed locally and globally!");
      setAmount("");
      setMessage("");
    } catch (err) {
      setStatus("Donation failed. " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="p-8 text-center animate-pulse text-lg text-gray-500 font-semibold">Loading Configuration Parameters...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4 font-sans">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 max-w-md w-full transition-transform transform hover:scale-[1.01] duration-300">
        <div className="flex flex-col items-center mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile Icon" className="w-24 h-24 rounded-full shadow-lg border-4 border-white mb-4 object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center shadow-lg border-4 border-white mb-4">
              <span className="text-blue-500 text-3xl font-extrabold">?</span>
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 text-center uppercase tracking-wider">
            {profile.display_name}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-2 bg-gray-100 py-1.5 px-3.5 rounded-full shadow-inner">{streamerAddress}</p>
          
          {profile.milestone_target > 0 && (
            <div className="w-full mt-5 mb-1 px-2">
              <div className="flex justify-between text-xs font-black text-gray-400 mb-1.5 tracking-wide uppercase">
                <span>{profile.milestone_current ? parseFloat(profile.milestone_current).toFixed(3) : "0.000"} ETH</span>
                <span className="text-indigo-500">GOAL: {parseFloat(profile.milestone_target).toFixed(3)} ETH</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-md" 
                  style={{ width: `${Math.min(100, ((profile.milestone_current || 0) / profile.milestone_target) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleDonate} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Cryptocurrency Amount (ETH)</label>
            <input
              type="number"
              step="0.0001"
              required
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-gray-800 font-medium"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Inspirational Message</label>
            <textarea
              required
              maxLength={200}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none transition-shadow outline-none text-gray-800 font-medium"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keep up the great string of content!"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg text-white font-extrabold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 mt-2 tracking-wide"
          >
            {loading ? "Confirming Network Block..." : "Send Ethereum Support"}
          </button>
        </form>
        
        {status && (
          <div className="mt-6 p-3.5 bg-indigo-50/50 text-indigo-800 border border-indigo-100 text-center rounded-xl text-sm break-words font-semibold animate-pulse shadow-sm">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
