import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL, WS_URL } from "../../utils/config";

const DURATION_PRESETS = [
  { label: "1s", seconds: 1 },
  { label: "5s", seconds: 5 },
  { label: "10s", seconds: 10 },
  { label: "30s", seconds: 30 },
  { label: "60s", seconds: 60 },
  { label: "10m", seconds: 600 },
  { label: "30m", seconds: 1800 },
  { label: "1h", seconds: 3600 },
];

const ADD_PRESETS = [
  { label: "+30s", seconds: 30 },
  { label: "+1m", seconds: 60 },
  { label: "+5m", seconds: 300 },
  { label: "+10m", seconds: 600 },
];

/**
 * Formats a total seconds value into a HH:MM:SS string.
 *
 * @param {number} totalSeconds The total seconds to format.
 * @returns {string} The formatted time string.
 */
const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

/**
 * Formats seconds into a short human-readable duration label.
 *
 * @param {number} seconds The total seconds.
 * @returns {string} A short label like "1m" or "1h".
 */
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
};

/**
 * Subathon tab providing countdown timer controls, donation-triggered time additions,
 * pricing template management, and WebSocket sync to the OBS overlay.
 *
 * @param {object} props Component props.
 * @param {string} props.address The authenticated streamer wallet address.
 * @param {Array} props.subathonConfig The current array of per-price duration templates.
 * @param {Function} props.setSubathonConfig Setter for subathonConfig.
 * @param {number} props.mediaPricePerSecond The streamer's media price per second in ETH.
 * @param {boolean} props.loading Whether a profile save is in progress.
 * @param {Function} props.handleSaveProfile Profile save handler.
 * @returns {React.ReactElement} The subathon tab element.
 */
export default function SubathonTab({
  address, subathonConfig, setSubathonConfig, mediaPricePerSecond, loading, handleSaveProfile,
}) {
  const [endTime, setEndTime] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [subathonTitle, setSubathonTitle] = useState("Subathon");
  const [syncStatus, setSyncStatus] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [priceEth, setPriceEth] = useState("");
  const [labelText, setLabelText] = useState("");
  const [addError, setAddError] = useState("");
  const [manualAddSeconds, setManualAddSeconds] = useState(0);

  const wsRef = useRef(null);
  const tickRef = useRef(null);
  const syncTimerRef = useRef(null);

  const glass = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl";
  const glassInput = "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all w-full";

  const config = Array.isArray(subathonConfig) ? subathonConfig : [];

  const getRemainingFromEnd = useCallback((et) => {
    if (!et) return 0;
    return Math.max(0, (et - Date.now()) / 1000);
  }, []);

  const broadcastState = useCallback((overrides = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = {
        remaining: overrides.remaining ?? remaining,
        isActive: overrides.isActive ?? isActive,
        endTime: overrides.endTime ?? endTime,
        title: subathonTitle,
      };
      console.log("Subathon [SYNC] dashboard->server:", payload);
      wsRef.current.send(JSON.stringify({
        type: "SUBATHON_SYNC",
        payload,
      }));
    }
  }, [remaining, isActive, endTime, subathonTitle]);

  const persistEndTime = useCallback(async (et) => {
    try {
      await axios.post(`${API_URL}/profile/${address}/subathon`, { subathon_end_time: et });
    } catch {
      // Non-fatal.
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const ws = new WebSocket(`${WS_URL}?streamer=${address}`);
    wsRef.current = ws;

    ws.onopen = () => {
      axios.get(`${API_URL}/profile/${address}`).then((res) => {
        const savedEnd = res.data?.subathon_end_time ? parseInt(res.data.subathon_end_time, 10) : null;
        if (savedEnd && savedEnd > Date.now()) {
          setEndTime(savedEnd);
          setIsActive(true);
          setRemaining(getRemainingFromEnd(savedEnd));
        }
      }).catch(() => {});
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "VERIFIED_DONATION" && isActive) {
          const ethAmount = parseFloat(data.payload?.amount
            ? (BigInt(data.payload.amount) / BigInt("1000000000000000000")).toString()
            : "0");
          const pricePerSec = mediaPricePerSecond ?? 0.0005;
          if (pricePerSec > 0 && ethAmount > 0) {
            const added = Math.floor(ethAmount / pricePerSec);
            if (added > 0) {
              setEndTime((prev) => {
                const base = (prev && prev > Date.now()) ? prev : Date.now();
                const next = base + added * 1000;
                persistEndTime(next);
                broadcastState({ endTime: next, remaining: getRemainingFromEnd(next) });
                return next;
              });
            }
          }
        }
      } catch {
        // Non-fatal.
      }
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (isActive && endTime) {
      tickRef.current = setInterval(() => {
        const r = getRemainingFromEnd(endTime);
        setRemaining(r);
        if (r <= 0) {
          setIsActive(false);
          clearInterval(tickRef.current);
        }
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [isActive, endTime, getRemainingFromEnd]);

  const handleStart = () => {
    if (remaining <= 0 && !endTime) return;
    const target = Date.now() + remaining * 1000;
    setEndTime(target);
    setIsActive(true);
    persistEndTime(target);
    broadcastState({ isActive: true, endTime: target, remaining });
  };

  const handlePause = () => {
    setIsActive(false);
    setEndTime(null);
    persistEndTime(null);
    broadcastState({ isActive: false, endTime: null });
  };

  const handleReset = () => {
    setIsActive(false);
    setEndTime(null);
    setRemaining(0);
    persistEndTime(null);
    broadcastState({ isActive: false, endTime: null, remaining: 0 });
  };

  const handleSetTime = (seconds) => {
    const now = Date.now();
    setRemaining(seconds);
    if (isActive) {
      const target = now + seconds * 1000;
      setEndTime(target);
      persistEndTime(target);
      broadcastState({ endTime: target, remaining: seconds });
    }
  };

  const handleAddTime = (seconds) => {
    const now = Date.now();
    const next = remaining + seconds;
    setRemaining(next);
    if (isActive && endTime) {
      const target = (endTime > now ? endTime : now) + seconds * 1000;
      setEndTime(target);
      persistEndTime(target);
      broadcastState({ endTime: target, remaining: getRemainingFromEnd(target) });
    } else {
      setRemaining(next);
    }
  };

  const handleSyncObs = () => {
    broadcastState({});
    setSyncStatus("Synced to OBS");
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncStatus(""), 2000);
  };

  const handleAddTemplate = () => {
    const price = parseFloat(priceEth);
    if (!priceEth || isNaN(price) || price <= 0) { setAddError("Enter a valid ETH price greater than 0."); return; }
    if (durationSeconds <= 0) { setAddError("Duration must be greater than 0 seconds."); return; }
    setAddError("");
    setSubathonConfig([...config, {
      duration_seconds: durationSeconds,
      price_eth: price,
      label: labelText.trim() || formatDuration(durationSeconds),
    }]);
    setPriceEth("");
    setLabelText("");
    setDurationSeconds(60);
  };

  const handleRemoveTemplate = (index) => setSubathonConfig(config.filter((_, i) => i !== index));

  const timerColor = remaining <= 60 ? "#f87171" : remaining <= 300 ? "#fbbf24" : "#34d399";

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Subathon Timer</h2>
        <p className="text-white/40 text-sm mt-1">Live countdown timer that extends as viewers donate.</p>
      </div>

      <div className={`${glass} p-6 space-y-5`}>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Live Timer</h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              {isActive ? "Running" : "Paused"}
            </span>
          </div>
        </div>

        <input
          type="text"
          value={subathonTitle}
          onChange={(e) => setSubathonTitle(e.target.value)}
          className={`${glassInput} text-center font-bold`}
          placeholder="Subathon title..."
        />

        <div
          className="text-center py-6 rounded-2xl border border-white/[0.06] bg-black/20"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <div
            className="text-7xl font-black tracking-widest tabular-nums transition-colors duration-500"
            style={{ color: timerColor, textShadow: `0 0 30px ${timerColor}55` }}
          >
            {formatClock(remaining)}
          </div>
          <p className="text-xs text-white/20 mt-2 font-semibold uppercase tracking-widest">
            {isActive && endTime ? `Ends at ${new Date(endTime).toLocaleTimeString()}` : "Timer inactive"}
          </p>
        </div>

        <div className="flex gap-3">
          {!isActive ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={remaining <= 0}
              className="flex-1 py-3 rounded-xl bg-green-600/20 border border-green-500/30 text-green-300 font-bold text-sm hover:bg-green-600/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 py-3 rounded-xl bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 font-bold text-sm hover:bg-yellow-600/30 transition-all cursor-pointer"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-600/20 transition-all cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSyncObs}
            className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
              syncStatus
                ? "bg-green-600/20 border-green-500/30 text-green-300"
                : "bg-blue-600/10 border-blue-500/20 text-blue-300 hover:bg-blue-600/20"
            }`}
          >
            {syncStatus || "Sync OBS"}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Set Timer</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => handleSetTime(p.seconds)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/80"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Add Time</label>
          <div className="flex items-center gap-2 flex-wrap">
            {ADD_PRESETS.map((p) => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => handleAddTime(p.seconds)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border bg-blue-600/10 border-blue-500/20 text-blue-300 hover:bg-blue-600/20"
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="number"
                min="1"
                value={manualAddSeconds || ""}
                onChange={(e) => setManualAddSeconds(parseInt(e.target.value) || 0)}
                className={`${glassInput} w-28 text-center`}
                placeholder="Sec"
              />
              <button
                type="button"
                onClick={() => { if (manualAddSeconds > 0) handleAddTime(manualAddSeconds); }}
                className="px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold text-sm hover:bg-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`${glass} p-6 space-y-5`}>
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/[0.06] pb-3">
          Donation-Triggered Time Templates
        </h3>
        <p className="text-xs text-white/30">When a donation meeting the price threshold is received, this many seconds are added automatically.</p>

        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Duration</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.seconds}
                type="button"
                onClick={() => setDurationSeconds(preset.seconds)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  durationSeconds === preset.seconds
                    ? "bg-blue-600/20 border-blue-500/50 text-white"
                    : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 1)}
            className={glassInput}
            placeholder="Duration in seconds"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Price (ETH)</label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={priceEth}
              onChange={(e) => setPriceEth(e.target.value)}
              className={glassInput}
              placeholder="0.001"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Label (optional)</label>
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              className={glassInput}
              placeholder="e.g. 1 Minute"
              maxLength={40}
            />
          </div>
        </div>

        {addError && <p className="text-red-400 text-xs font-semibold">{addError}</p>}

        <button
          type="button"
          onClick={handleAddTemplate}
          className="w-full py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold text-sm hover:bg-blue-600/30 transition-all cursor-pointer"
        >
          Add Template
        </button>

        {config.length > 0 && (
          <div className={`${glass} overflow-hidden`}>
            <div className="divide-y divide-white/[0.04]">
              {config.map((item, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                      {item.label || formatDuration(item.duration_seconds)}
                    </span>
                    <p className="text-xs text-white/40">{item.duration_seconds}s</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <p className="text-sm font-extrabold text-white">{item.price_eth} ETH</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveTemplate(i)}
                      className="text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14H6L5 6"></path>
                        <path d="M10 11v6"></path><path d="M14 11v6"></path>
                        <path d="M9 6V4h6v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSaveProfile}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold text-sm hover:bg-blue-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Subathon Settings"}
      </button>
    </div>
  );
}