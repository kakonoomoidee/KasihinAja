import React from "react";

/**
 * A versatile, styled button component that serves as the single source of truth for buttons.
 *
 * @param {object} props
 * @param {string} props.children Button text/content.
 * @param {Function} props.onClick Click handler.
 * @param {"primary"|"ghost"|"danger"} [props.variant="primary"] Visual style variant.
 * @param {string} [props.className] Additional CSS classes to append.
 * @param {boolean} [props.disabled] Disabled state.
 * @param {React.ReactNode} [props.icon] Optional SVG icon element to display before the text.
 * @param {string} [props.type="button"] HTML button type.
 * @returns {React.ReactElement} The styled button element.
 */
export default function ActionButton({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  disabled = false, 
  icon = null,
  type = "button"
}) {
  const baseStyles = "font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] py-3 px-6",
    ghost: "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] py-3 px-5",
    danger: "bg-rose-950/60 hover:bg-rose-900/80 text-rose-300/80 hover:text-rose-200 border border-rose-900/50 py-3 px-6"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
}