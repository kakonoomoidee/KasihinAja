import React from "react";

/**
 * Shared component for ethereum amount input with optional preset buttons and validation feedback.
 *
 * @param {object} props The component props.
 * @param {string|number} props.amount The current amount value.
 * @param {Function} props.setAmount Function to directly set the amount value.
 * @param {Function} props.handleAmountChange Function to handle manual input changes with validation.
 * @param {string} [props.amountError] Validation error message to display.
 * @param {string} props.glassInput The base CSS class for the input field.
 * @param {string} [props.label="Amount (ETH)"] Custom label for the input.
 * @param {Array<string>} [props.presets=["0.0005", "0.001", "0.01", "1.0"]] Array of preset values.
 * @param {boolean} [props.showMinTip=true] Whether to show the minimum tip warning.
 * @param {string} [props.placeholder="0.00"] Placeholder text.
 * @returns {React.ReactElement} The reusable amount input element.
 */
export default function AmountInput({ 
  amount, 
  setAmount, 
  handleAmountChange, 
  amountError = "", 
  glassInput,
  label = "Amount (ETH)",
  presets = ["0.0005", "0.001", "0.01", "1.0"],
  showMinTip = true,
  placeholder = "0.00"
}) {
  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">{label}</label>
      
      {presets && presets.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => { setAmount(preset); handleAmountChange({ target: { value: preset } }); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${amount === preset ? "bg-blue-500/50 border-blue-400/60 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
      
      <input
        type="text"
        required
        className={`${glassInput} w-full ${amountError ? "border-red-500/60 focus:border-red-500/80 bg-red-500/5" : "focus:border-blue-400/50"}`}
        value={amount}
        onChange={handleAmountChange}
        placeholder={placeholder}
      />
      
      {amountError && (
        <p className="text-xs text-red-400 font-bold mt-1.5">{amountError}</p>
      )}
      
      {showMinTip && !amountError && parseFloat(amount) > 0 && parseFloat(amount) < 0.0005 && (
        <p className="text-xs text-red-400 font-bold mt-1.5">Minimum tip is 0.0005 ETH</p>
      )}
    </div>
  );
}