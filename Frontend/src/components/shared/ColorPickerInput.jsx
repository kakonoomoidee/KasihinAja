import React, { useRef } from "react";

/**
 * A custom color picker component that hides the native input and provides a sleek UI.
 *
 * @param {object} props
 * @param {string} props.color The current hex color value.
 * @param {Function} props.setColor Setter for the color value.
 * @param {string} props.label The label for the input.
 * @param {string} props.glassInput The base CSS class for the input text field.
 * @returns {React.ReactElement}
 */
export default function ColorPickerInput({ color, setColor, label, glassInput }) {
  const inputRef = useRef(null);

  const handleBoxClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {label && <label className="block text-xs font-bold text-white/50 uppercase tracking-wider">{label}</label>}
      <div className="flex items-center gap-3">
        {/* The visual color circle */}
        <div
          onClick={handleBoxClick}
          className="w-10 h-10 rounded-full border-2 border-white/20 flex-shrink-0 cursor-pointer relative shadow-inner hover:scale-105 transition-transform"
          style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}40` }}
        >
          {/* The hidden native input */}
          <input
            ref={inputRef}
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 m-0 border-0"
          />
        </div>
        {/* The hex text input */}
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className={`${glassInput} font-mono uppercase text-sm tracking-widest`}
          maxLength={7}
        />
      </div>
    </div>
  );
}