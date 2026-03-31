import React from "react";

const navItems = [
  { 
    id: "overview",   
    label: "Overview",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  },
  { 
    id: "pagesetup",  
    label: "Page Setup",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  },
  { 
    id: "overlay",    
    label: "OBS Overlay",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  },
  { 
    id: "milestones", 
    label: "Milestones",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  },
  { 
    id: "history",    
    label: "History",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  },
  { 
    id: "moderation", 
    label: "Moderation",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  },
  { 
    id: "leaderboard", 
    label: "Leaderboard",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  },
  { 
    id: "subathon", 
    label: "Subathon",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> // Timer icon for subathon
  },
];

export default function Sidebar({ address, activeTab, setActiveTab, logout }) {
  return (
    <aside className="w-64 bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col z-10 flex-shrink-0 shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-extrabold text-white tracking-tight">KasihinAja</h2>
        <p className="text-xs font-mono font-semibold text-white/30 mt-2 truncate" title={address}>{address}</p>
      </div>
      
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer group ${
              activeTab === item.id 
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <svg 
              className={`w-5 h-5 transition-colors ${activeTab === item.id ? "text-blue-400" : "text-white/30 group-hover:text-white/60"}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {item.icon}
            </svg>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={logout} 
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 font-bold py-3 rounded-xl border border-white/10 hover:border-red-500/30 transition-all text-sm cursor-pointer group"
        >
          <svg className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Disconnect
        </button>
      </div>
    </aside>
  );
}