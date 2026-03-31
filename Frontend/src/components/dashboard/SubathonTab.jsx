import React from "react";

export default function SubathonTab() {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center";

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Subathon Timer</h2>
      <p className="text-white/50 text-sm">Automated streaming timer extended by donations.</p>
      
      <div className={glass}>
        <div className="flex flex-col items-center justify-center py-12 opacity-50">
          <svg className="w-16 h-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-sm font-medium text-white/60 max-w-md">
            Set up a dynamic timer that automatically adds time whenever someone tips you in ETH. Perfect for marathon streams!
          </p>
        </div>
      </div>
    </div>
  );
}