import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectWallet, signPayload } from "../utils/web3";

/**
 * Renders the rebranded standalone login page for authenticating streamers.
 *
 * @returns {React.ReactElement} The login page React component.
 */
export default function Login() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("kasihinaja_session");
    if (saved) {
      navigate("/dashboard");
    }
  }, [navigate]);

  /**
   * Cryptographically establishes user identity and redirects to dashboard.
   *
   * @returns {Promise<void>}
   */
  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatus("Awaiting wallet approval...");
      
      const signer = await connectWallet();
      const userAddress = await signer.getAddress();
      const payload = { timestamp: Date.now() };
      
      await signPayload(signer, payload);
      window.signerInstance = signer;
      
      localStorage.setItem("kasihinaja_session", userAddress.toLowerCase());
      setStatus("Authentication successful. Redirecting...");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
      
    } catch {
      setStatus("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#091520] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-12 text-center max-w-md w-full rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="mb-8 mt-4">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
            Kasihin<span className="text-blue-400">Aja</span>
          </h1>
          <p className="text-white/40 text-sm font-medium leading-relaxed px-4">
            The next generation Web3 streaming toolkit. Connect your wallet to access your creator dashboard.
          </p>
        </div>

        <button 
          onClick={handleLogin} 
          disabled={loading} 
          className="w-full bg-white/90 hover:bg-white text-slate-900 font-extrabold py-4 px-6 rounded-2xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-base tracking-wide flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="animate-pulse">Authenticating...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              Connect MetaMask
            </>
          )}
        </button>

        <div className="mt-8 h-8">
          {status && (
            <p className="text-white/70 text-sm font-semibold animate-fade-in px-4 py-2 bg-white/5 rounded-lg border border-white/10 inline-block">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}