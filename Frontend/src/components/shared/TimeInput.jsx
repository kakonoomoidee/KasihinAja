import React, { useState, useEffect } from "react";

/**
 * A reusable component for inputting time in HH:MM:SS format, styled consistently with the main app.
 * Converts the visual representation into total seconds for the parent state.
 *
 * @param {object} props
 * @param {number|string} props.totalSeconds The current total time in seconds.
 * @param {Function} props.setTotalSeconds Setter for the total seconds.
 * @param {string} props.label The text label for the input.
 * @returns {React.ReactElement} The visual time input elements.
 */
export default function TimeInput({ totalSeconds, setTotalSeconds, label }) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const s = parseInt(totalSeconds) || 0;
      if (s === 0) {
        setHours("");
        setMinutes("");
        setSeconds("");
      } else {
        setHours(Math.floor(s / 3600).toString());
        setMinutes(Math.floor((s % 3600) / 60).toString());
        setSeconds((s % 60).toString());
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [totalSeconds]);

  const updateParent = (h, m, s) => {
    const total = (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
    setTotalSeconds(total);
  };

  const handleFocus = (e) => e.target.select();

  return (
    <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/[0.08]">
      <span className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-wider">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <input
            type="text"
            placeholder="00"
            className="w-12 bg-white/[0.03] border border-white/[0.08] rounded-lg py-1.5 text-center outline-none text-white font-medium text-sm focus:border-red-400/50 transition-colors placeholder:text-white/20"
            value={hours}
            onFocus={handleFocus}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setHours(val);
              updateParent(val, minutes, seconds);
            }}
          />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Hr</span>
        </div>
        <span className="text-white/40 font-bold mb-5">:</span>
        <div className="flex flex-col items-center gap-1">
          <input
            type="text"
            placeholder="00"
            className="w-12 bg-white/[0.03] border border-white/[0.08] rounded-lg py-1.5 text-center outline-none text-white font-medium text-sm focus:border-red-400/50 transition-colors placeholder:text-white/20"
            value={minutes}
            onFocus={handleFocus}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, "").slice(0, 2);
              if (parseInt(val) > 59) val = "59";
              setMinutes(val);
              updateParent(hours, val, seconds);
            }}
          />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Min</span>
        </div>
        <span className="text-white/40 font-bold mb-5">:</span>
        <div className="flex flex-col items-center gap-1">
          <input
            type="text"
            placeholder="00"
            className="w-12 bg-white/[0.03] border border-white/[0.08] rounded-lg py-1.5 text-center outline-none text-white font-medium text-sm focus:border-red-400/50 transition-colors placeholder:text-white/20"
            value={seconds}
            onFocus={handleFocus}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, "").slice(0, 2);
              if (parseInt(val) > 59) val = "59";
              setSeconds(val);
              updateParent(hours, minutes, val);
            }}
          />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Sec</span>
        </div>
      </div>
    </div>
  );
}