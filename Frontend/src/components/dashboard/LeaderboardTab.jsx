import React from "react";

export default function LeaderboardTab() {
  const glass = "bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center";

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">Leaderboard</h2>
      <p className="text-white/50 text-sm">Your top supporters and largest donations.</p>
      
      <div className={glass}>
        <div className="flex flex-col items-center justify-center py-12 opacity-50">
          <svg className="w-16 h-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
          <p className="text-sm font-medium text-white/60 max-w-md">
            We are building a comprehensive leaderboard system to track your all-time top donors and their total contributions.
          </p>
        </div>
      </div>
    </div>
  );
}