import React from "react";
import TimeInput from "../TimeInput";

/**
 * Component for handling YouTube media input with live preview and multi-part time selection.
 *
 * @param {object} props
 * @param {string} props.mediaLink Current YouTube URL.
 * @param {Function} props.setMediaLink Setter for YouTube URL.
 * @param {number|string} props.youtubeStart Start time in total seconds.
 * @param {Function} props.setYoutubeStart Setter for start time in total seconds.
 * @param {string} props.glassInput Base CSS for inputs.
 * @returns {React.ReactElement}
 */
export default function YouTubeInput({ mediaLink, setMediaLink, youtubeStart, setYoutubeStart, glassInput }) {
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const videoId = extractYoutubeId(mediaLink);

  const formatTime = (totalSeconds) => {
    const s = parseInt(totalSeconds) || 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  return (
    <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 space-y-4">
      <input
        type="text"
        className={`${glassInput} text-sm focus:border-red-400/50`}
        value={mediaLink}
        onChange={(e) => setMediaLink(e.target.value)}
        placeholder="Paste YouTube URL here..."
      />
      
      <TimeInput 
        totalSeconds={youtubeStart} 
        setTotalSeconds={setYoutubeStart} 
        label="Start Time" 
      />

      {videoId && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
              Video starts playing at <span className="text-white">{formatTime(youtubeStart)}</span>
            </p>
          </div>
          <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/50">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?start=${youtubeStart || 0}`}
              title="YouTube video preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}