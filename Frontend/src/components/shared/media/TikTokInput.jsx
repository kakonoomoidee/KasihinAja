import React, { useRef, useState } from "react";

/**
 * Component for handling TikTok media input with clean live preview via custom native video player.
 * Note: Preview relies on third-party public scraping APIs to get raw mp4.
 *
 * @param {object} props
 * @param {string} props.mediaLink Current TikTok URL.
 * @param {Function} props.setMediaLink Setter for TikTok URL.
 * @param {string} props.glassInput Base CSS for inputs.
 * @returns {React.ReactElement}
 */
export default function TikTokInput({ mediaLink, setMediaLink, glassInput }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const extractTiktokId = (url) => {
    if (!url) return null;
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : null;
  };

  const videoId = extractTiktokId(mediaLink);
  const previewVideoUrl = videoId ? `https://tikwm.com/video/media/play/${videoId}.mp4` : null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="bg-pink-500/5 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-4 space-y-4">
      <input
        type="text"
        className={`${glassInput} text-sm focus:border-pink-400/50`}
        value={mediaLink}
        onChange={(e) => setMediaLink(e.target.value)}
        placeholder="Paste TikTok video URL here..."
      />

      {videoId && (
        <div className="w-full max-w-[280px] aspect-[9/16] mx-auto rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/80 flex flex-col items-center justify-center relative group">
          
          {/* Top Badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-20 flex items-center gap-2 transition-opacity duration-300 opacity-100 group-hover:opacity-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-pink-400">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.91-.43 3.86-1.41 5.48-1.58 2.62-4.63 4.21-7.74 4.09-3.03-.13-5.83-1.8-7.39-4.32-1.39-2.25-1.66-5.11-.64-7.55 1.01-2.43 3.2-4.3 5.75-4.9 1.48-.35 3.03-.3 4.46.15v4.12c-1.07-.35-2.26-.34-3.27.12-.87.4-1.58 1.11-1.92 1.99-.45 1.16-.36 2.51.27 3.6.61 1.05 1.69 1.75 2.87 1.98 1.17.23 2.42.06 3.42-.51 1.06-.61 1.78-1.65 1.99-2.84.14-.77.16-1.56.16-2.34V.02z"/>
            </svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Preview</span>
          </div>
          
          {/* Video Element without native controls */}
          <video
            ref={videoRef}
            src={previewVideoUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer relative z-10"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.querySelector('.fallback-ui').style.display = 'flex';
              e.target.parentElement.querySelector('.custom-controls').style.display = 'none';
            }}
          />

          {/* Big Play Button Overlay (when paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/30 backdrop-blur-sm transition-all duration-300">
              <div className="w-16 h-16 bg-pink-500/80 backdrop-blur-md rounded-full flex items-center justify-center pl-1 border border-white/20 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-100 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
            </div>
          )}

          {/* Custom Control Bar (Appears on Hover) */}
          <div className="custom-controls absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 z-30 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <button onClick={togglePlay} className="text-white hover:text-pink-400 transition-colors cursor-pointer p-1 outline-none">
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-pink-400 transition-colors cursor-pointer p-1 outline-none">
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              )}
            </button>
          </div>

          {/* Error Fallback */}
          <div className="fallback-ui hidden absolute inset-0 flex-col items-center justify-center p-6 text-center bg-black/90 z-40">
             <p className="text-sm font-bold text-white/50 mb-2">Raw Video Preview Unavailable</p>
             <p className="text-xs text-white/30">The proxy failed to fetch the clean MP4. It will still attempt to play on the OBS overlay.</p>
          </div>
        </div>
      )}
    </div>
  );
}