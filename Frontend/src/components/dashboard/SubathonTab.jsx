import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import { API_URL, WS_URL } from "../../utils/config";
import { formatClock } from "../../utils/timeUtils";
import ActionButton from "../shared/ActionButton";
import TimeInput from "../shared/TimeInput";
import AmountInput from "../shared/AmountInput";

/**
 * Subathon tab providing countdown timer controls, donation-triggered time additions,
 * pricing template management, master toggle, and WebSocket sync to the OBS overlay.
 *
 * @param {object} props Component props.
 * @param {string} props.address The authenticated streamer wallet address.
 * @param {Array} props.subathonConfig The current array of per-price duration templates.
 * @param {Function} props.setSubathonConfig Setter for subathonConfig.
 * @param {number} props.mediaPricePerSecond The streamer's fallback media price per second in ETH.
 * @param {boolean} props.loading Whether a profile save is in progress.
 * @param {Function} props.handleSaveProfile Profile save handler.
 * @returns {React.ReactElement} The subathon tab element.
 */
export default function SubathonTab({
  address, subathonConfig, setSubathonConfig, mediaPricePerSecond, loading, handleSaveProfile,
}) {
  const [endTime, setEndTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [subathonTitle, setSubathonTitle] = useState("Subathon");
  const [syncStatus, setSyncStatus] = useState("");

  const [isSubathonActive, setIsSubathonActive] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [setTimerSeconds, setSetTimerSeconds] = useState(0);
  const [ruleTimerSeconds, setRuleTimerSeconds] = useState(0);
  const [rulePrice, setRulePrice] = useState("");

  const [remaining, setRemaining] = useState(() => {
    return parseInt(localStorage.getItem(`subathon_paused_${address}`) || "0", 10);
  });

  const remainingRef = useRef(remaining);
  const isActiveRef = useRef(isActive);
  const endTimeRef = useRef(endTime);
  const subathonTitleRef = useRef(subathonTitle);
  const mediaPricePerSecondRef = useRef(mediaPricePerSecond);
  const wsRef = useRef(null);
  const tickRef = useRef(null);
  const syncTimerRef = useRef(null);

  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);
  useEffect(() => { subathonTitleRef.current = subathonTitle; }, [subathonTitle]);
  useEffect(() => { mediaPricePerSecondRef.current = mediaPricePerSecond; }, [mediaPricePerSecond]);

  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg";
  const glassInput = "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all w-full text-center";

  const config = useMemo(() => Array.isArray(subathonConfig) ? subathonConfig : [], [subathonConfig]);

  const handleStrictNumber = useCallback((setter) => (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) setter(val);
  }, []);

  const getRemainingFromEnd = useCallback((et) => {
    if (!et) return 0;
    return Math.max(0, (et - Date.now()) / 1000);
  }, []);

  const broadcastState = useCallback((overrides = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = {
        remaining: overrides.remaining !== undefined ? overrides.remaining : remainingRef.current,
        isActive: overrides.isActive !== undefined ? overrides.isActive : isActiveRef.current,
        endTime: overrides.endTime !== undefined ? overrides.endTime : endTimeRef.current,
        title: overrides.title !== undefined ? overrides.title : subathonTitleRef.current,
      };
      wsRef.current.send(JSON.stringify({ type: "SUBATHON_SYNC", payload }));
    }
  }, []);

  const persistSubathon = useCallback(async (fields) => {
    try {
      await axios.post(`${API_URL}/profile/${address}/subathon`, fields);
    } catch (err) {
      console.error(err);
    }
  }, [address]);

  useEffect(() => {
    if (!isActive) {
      localStorage.setItem(`subathon_paused_${address}`, remaining.toString());
    }
  }, [remaining, isActive, address]);

  useEffect(() => {
    if (!address) return;
    const ws = new WebSocket(`${WS_URL}?streamer=${address}`);
    wsRef.current = ws;

    ws.onopen = () => {
      axios.get(`${API_URL}/profile/${address}`).then((res) => {
        const data = res.data || {};
        setIsSubathonActive(!!data.is_subathon_active);
        const savedEnd = data.subathon_end_time ? parseInt(data.subathon_end_time, 10) : null;
        if (savedEnd && savedEnd > Date.now()) {
          setEndTime(savedEnd);
          setIsActive(true);
          const r = getRemainingFromEnd(savedEnd);
          setRemaining(r);
          broadcastState({ isActive: true, endTime: savedEnd, remaining: r });
        } else {
          const r = parseInt(localStorage.getItem(`subathon_paused_${address}`) || "0", 10);
          broadcastState({ isActive: false, endTime: null, remaining: r });
        }
      }).catch((err) => console.error(err));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "VERIFIED_DONATION" && isActiveRef.current) {
          const ethAmount = parseFloat(data.payload?.amount
            ? (BigInt(data.payload.amount) / BigInt("1000000000000000000")).toString()
            : "0");
          const pricePerSec = mediaPricePerSecondRef.current ?? 0.0005;
          if (pricePerSec > 0 && ethAmount > 0) {
            const added = Math.floor(ethAmount / pricePerSec);
            if (added > 0) {
              setEndTime((prev) => {
                const base = (prev && prev > Date.now()) ? prev : Date.now();
                const next = base + added * 1000;
                persistSubathon({ subathon_end_time: next });
                broadcastState({ endTime: next, remaining: getRemainingFromEnd(next) });
                return next;
              });
            }
          }
        }
        if (data.type === "SUBATHON_UPDATE") {
          const { endTime: et, remaining: r, isActive: active } = data.payload;
          if (active !== undefined) setIsActive(!!active);
          if (et && et > Date.now()) {
            setEndTime(et);
            setRemaining(Math.max(0, (et - Date.now()) / 1000));
          } else if (r !== undefined) {
            setRemaining(r);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => ws.close();
  }, [address, getRemainingFromEnd, broadcastState, persistSubathon]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (isActive && endTime) {
      tickRef.current = setInterval(() => {
        const r = getRemainingFromEnd(endTime);
        setRemaining(r);
        if (r <= 0) { setIsActive(false); clearInterval(tickRef.current); }
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [isActive, endTime, getRemainingFromEnd]);

  const handleStart = useCallback(() => {
    if (remainingRef.current <= 0 && !endTimeRef.current) return;
    const target = Date.now() + remainingRef.current * 1000;
    setEndTime(target);
    setIsActive(true);
    persistSubathon({ subathon_end_time: target });
    broadcastState({ isActive: true, endTime: target, remaining: remainingRef.current });
  }, [persistSubathon, broadcastState]);

  const handlePause = useCallback(() => {
    setIsActive(false);
    setEndTime(null);
    persistSubathon({ subathon_end_time: null });
    broadcastState({ isActive: false, endTime: null });
  }, [persistSubathon, broadcastState]);

  const handleReset = useCallback(() => {
    setIsActive(false);
    setEndTime(null);
    setRemaining(0);
    persistSubathon({ subathon_end_time: null });
    broadcastState({ isActive: false, endTime: null, remaining: 0 });
  }, [persistSubathon, broadcastState]);

  const applySetTime = useCallback(() => {
    const now = Date.now();
    setRemaining(setTimerSeconds);
    if (isActiveRef.current) {
      const target = now + setTimerSeconds * 1000;
      setEndTime(target);
      persistSubathon({ subathon_end_time: target });
      broadcastState({ endTime: target, remaining: setTimerSeconds });
    } else {
      broadcastState({ isActive: false, endTime: null, remaining: setTimerSeconds });
    }
  }, [setTimerSeconds, persistSubathon, broadcastState]);

  const handleSyncObs = useCallback(() => {
    broadcastState({});
    setSyncStatus("Synced to OBS");
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncStatus(""), 2000);
  }, [broadcastState]);

  /**
   * Immediately persists the master subathon toggle to the backend without requiring
   * the user to click the main Save button.
   *
   * @param {boolean} newValue The new active state.
   * @returns {Promise<void>}
   */
  const toggleSubathonStatus = useCallback(async (newValue) => {
    setIsSubathonActive(newValue);
    setToggleLoading(true);
    try {
      await persistSubathon({ is_subathon_active: newValue });
    } catch (err) {
      console.error(err);
      setIsSubathonActive(!newValue);
    } finally {
      setToggleLoading(false);
    }
  }, [persistSubathon]);

  const handleAddTemplate = useCallback(() => {
    const price = parseFloat(rulePrice);
    if (!rulePrice || isNaN(price) || price <= 0) return;
    if (ruleTimerSeconds <= 0) return;
    setSubathonConfig([...config, { duration_seconds: ruleTimerSeconds, price_eth: price }]);
    setRulePrice("");
    setRuleTimerSeconds(0);
  }, [rulePrice, ruleTimerSeconds, config, setSubathonConfig]);

  const handleRemoveTemplate = useCallback((index) => {
    setSubathonConfig(config.filter((_, i) => i !== index));
  }, [config, setSubathonConfig]);

  const timerColor = remaining <= 60 ? "#f87171" : remaining <= 300 ? "#fbbf24" : "#34d399";

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Subathon Timer</h2>
          <p className="text-white/40 text-sm mt-2 font-medium">Live countdown timer that extends automatically as viewers tip.</p>
        </div>
      </div>

      {/* Master Toggle Card */}
      <div
        className={`${glass} p-6 flex items-center justify-between transition-all duration-300 ${
          isSubathonActive ? "border-emerald-500/40 shadow-[0_0_30px_rgba(52,211,153,0.1)]" : ""
        }`}
      >
        <div>
          <h3 className={`text-sm font-black uppercase tracking-widest ${
            isSubathonActive ? "text-emerald-400" : "text-white/50"
          }`}>
            Subathon Master Switch
          </h3>
          <p className="text-xs text-white/30 mt-1 font-medium">
            {isSubathonActive
              ? "Active: donations automatically extend the timer via the backend."
              : "Inactive: donations will not automatically extend the timer."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleSubathonStatus(!isSubathonActive)}
          disabled={toggleLoading}
          className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 cursor-pointer border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isSubathonActive
              ? "bg-emerald-600 border-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              : "bg-white/10 border-white/20"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${
              isSubathonActive ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Live Timer Card */}
      <div className={`${glass} p-8 space-y-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Live Timer Control
          </h3>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-white/20"}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-emerald-400" : "text-white/40"}`}>
              {isActive ? "Running" : "Paused"}
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <input
            type="text"
            value={subathonTitle}
            onChange={(e) => { setSubathonTitle(e.target.value); broadcastState({ title: e.target.value }); }}
            className={`${glassInput} font-bold text-lg tracking-wide focus:border-blue-500/50`}
            placeholder="Subathon title..."
          />
        </div>

        <div className="text-center py-8 rounded-2xl border border-white/5 bg-black/40 shadow-inner relative z-10" style={{ fontFamily: "'Courier New', monospace" }}>
          <div
            className="text-6xl md:text-8xl font-black tracking-widest tabular-nums transition-colors duration-500 drop-shadow-lg"
            style={{ color: timerColor, textShadow: `0 0 40px ${timerColor}40` }}
          >
            {formatClock(remaining)}
          </div>
          <p className="text-xs text-white/30 mt-4 font-bold uppercase tracking-widest bg-white/5 inline-block px-4 py-1.5 rounded-full">
            {isActive && endTime ? `Ends at ${new Date(endTime).toLocaleTimeString()}` : "Timer inactive"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          {!isActive ? (
            <ActionButton
              onClick={handleStart}
              disabled={remaining <= 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
            >
              Start
            </ActionButton>
          ) : (
            <ActionButton
              onClick={handlePause}
              className="flex-1 bg-amber-600 hover:bg-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-white"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>}
            >
              Pause
            </ActionButton>
          )}
          <ActionButton
            onClick={handleReset}
            variant="danger"
            className="flex-1"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>}
          >
            Reset
          </ActionButton>
          <ActionButton
            onClick={handleSyncObs}
            variant="ghost"
            className={`flex-1 ${syncStatus ? "bg-blue-600/20 text-blue-400 border-blue-500/50" : ""}`}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>}
          >
            {syncStatus || "Sync OBS"}
          </ActionButton>
        </div>

        <div className="pt-6 relative z-10 border-t border-white/10 mt-6">
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Set Exact Timer</label>
          <TimeInput
            totalSeconds={setTimerSeconds}
            setTotalSeconds={setSetTimerSeconds}
            label="Duration"
          />
          <div className="mt-3">
            <ActionButton onClick={applySetTime} variant="primary" className="w-full">
              Apply Time
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Automation Rules Card */}
      <div className={`${glass} p-8 space-y-6 relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />

        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest border-b border-white/10 pb-4 relative z-10 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Automation Rules
        </h3>
        <p className="text-xs text-white/40 font-medium relative z-10">Define rules to automatically extend the timer when a specific ETH amount is received.</p>

        <div className="relative z-10 space-y-4 bg-black/20 p-5 rounded-xl border border-white/5">
          <div>
            <AmountInput
              label="Donation Amount (ETH)"
              amount={rulePrice}
              setAmount={setRulePrice}
              handleAmountChange={handleStrictNumber(setRulePrice)}
              presets={["0.001", "0.005", "0.01", "0.1"]}
              showMinTip={false}
              placeholder="0.01"
              glassInput={glassInput}
            />
          </div>
          <div>
            <TimeInput
              totalSeconds={ruleTimerSeconds}
              setTotalSeconds={setRuleTimerSeconds}
              label="Time to Add"
            />
          </div>
          <ActionButton
            onClick={handleAddTemplate}
            variant="ghost"
            className="w-full text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
          >
            Add Rule
          </ActionButton>
        </div>

        {config.length > 0 && (
          <div className="mt-6 border border-white/10 rounded-xl overflow-hidden bg-black/40 relative z-10">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 bg-white/5 text-[10px] font-black text-white/30 uppercase tracking-widest">
              <div className="col-span-3">Donation</div>
              <div className="col-span-1 text-center">=</div>
              <div className="col-span-6">Time Added</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            <div className="divide-y divide-white/5">
              {config.map((item, i) => {
                const d = Math.floor(item.duration_seconds / 86400);
                const h = Math.floor((item.duration_seconds % 86400) / 3600);
                const m = Math.floor((item.duration_seconds % 3600) / 60);
                const s = item.duration_seconds % 60;
                return (
                  <div key={i} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-white/[0.03] transition-colors">
                    <div className="col-span-3">
                      <span className="text-sm font-black text-white">{item.price_eth} <span className="text-[10px] text-white/40 font-bold ml-1">ETH</span></span>
                    </div>
                    <div className="col-span-1 text-center"><span className="text-white/20 font-bold">=</span></div>
                    <div className="col-span-6 flex gap-3 text-xs font-bold text-emerald-400">
                      {d > 0 && <span>{d}d</span>}
                      {h > 0 && <span>{h}h</span>}
                      {m > 0 && <span>{m}m</span>}
                      {(s > 0 || item.duration_seconds === 0) && <span>{s}s</span>}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveTemplate(i)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer border border-rose-500/20"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 pb-8">
        <ActionButton
          onClick={handleSaveProfile}
          disabled={loading}
          variant="primary"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>}
        >
          {loading ? "Saving Settings..." : "Save Subathon Settings"}
        </ActionButton>
      </div>
    </div>
  );
}