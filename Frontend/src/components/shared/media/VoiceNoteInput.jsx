import React, { useState, useEffect, useRef } from "react";
import { useStreamVisualizer } from "../../../hooks/useAudioVisualizer";

/**
 * Component for handling Voice Note recording with a real-time audio visualizer and custom playback UI.
 *
 * @param {object} props Component properties.
 * @param {boolean} props.isRecording Indicates if recording is currently active.
 * @param {Function} props.startRecording Callback to start the audio recording process.
 * @param {Function} props.stopRecording Callback to stop the audio recording process.
 * @param {Blob|null} props.vnBlob The recorded audio data object.
 * @param {Function} props.setVnBlob Callback to update or clear the audio data.
 * @param {MediaStream|null} props.recordingStream The active microphone stream to visualize.
 * @returns {React.ReactElement} The Voice Note input element.
 */
export default function VoiceNoteInput({ isRecording, startRecording, stopRecording, vnBlob, setVnBlob, recordingStream }) {
  const waveHeights = useStreamVisualizer(recordingStream, 40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");
  const [audioUrl, setAudioUrl] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    if (!vnBlob) return;
    let isMounted = true;
    const url = URL.createObjectURL(vnBlob);
    
    // Safely update state using a microtask to avoid cascading render warnings
    Promise.resolve().then(() => {
      if (isMounted) setAudioUrl(url);
    });

    return () => {
      isMounted = false;
      URL.revokeObjectURL(url);
      Promise.resolve().then(() => setAudioUrl(""));
    };
  }, [vnBlob]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setProgress(dur > 0 ? (current / dur) * 100 : 0);

    const formatTime = (time) => {
      if (isNaN(time) || !isFinite(time)) return "0:00";
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };
    
    setCurrentTime(formatTime(current));
    setDuration(formatTime(dur));
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-full px-3 py-2 flex items-center gap-3 relative overflow-hidden shadow-inner w-full min-h-[60px]">
      {!isRecording && !vnBlob && (
        <div className="flex items-center gap-3 w-full px-1">
          <button
            type="button"
            onClick={startRecording}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 flex items-center justify-center border border-blue-500/30 transition-all cursor-pointer shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
          <span className="text-sm font-bold text-white/50">Tap mic to record</span>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-3 w-full px-1">
          <button
            type="button"
            onClick={stopRecording}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 cursor-pointer shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
          <div className="flex items-center justify-between h-8 flex-1 px-2 gap-[2px]">
            {waveHeights.map((height, i) => (
              <div 
                key={i} 
                className="w-[3px] bg-blue-400 rounded-full transition-all duration-75 ease-out" 
                style={{ height: `${height}%` }} 
              />
            ))}
          </div>
          <span className="text-xs font-mono text-red-400 font-bold animate-pulse">REC</span>
        </div>
      )}

      {vnBlob && audioUrl && (
        <div className="flex items-center gap-4 w-full px-1">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={handleTimeUpdate}
            className="hidden"
          />
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-lg"
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <div className="flex flex-col flex-1 justify-center gap-1.5 mt-0.5">
            <div className="w-full bg-white/10 rounded-full h-1.5 relative">
              <div className="bg-blue-400 h-1.5 rounded-full transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-all duration-100 ease-linear" style={{ left: `calc(${progress}% - 7px)` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-white/50 font-bold">
              <span>{currentTime}</span>
              <span>{duration}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setVnBlob(null); setIsPlaying(false); Promise.resolve().then(() => setAudioUrl("")); }}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}