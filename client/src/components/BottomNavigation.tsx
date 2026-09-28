import React from 'react';
import { Home, Compass, Briefcase, Sparkles, Settings } from 'lucide-react';

export type NavTab = 'home' | 'radar' | 'jobs' | 'walkins' | 'settings';

interface BottomNavigationProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  walkInCount: number;
  jobsCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChangeTab,
  walkInCount,
  jobsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 max-w-xl mx-auto">
      <div className="grid grid-cols-5 gap-1">
        {/* 🏠 Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-press ${
            activeTab === 'home'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
        </button>

        {/* 📡 Radar */}
        <button
          onClick={() => onChangeTab('radar')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-press ${
            activeTab === 'radar'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 ${activeTab === 'radar' ? 'stroke-[2.5] animate-spin-slow' : 'stroke-2'}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Radar</span>
        </button>

        {/* 💼 Jobs */}
        <button
          onClick={() => onChangeTab('jobs')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-press ${
            activeTab === 'jobs'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Briefcase className={`w-5 h-5 ${activeTab === 'jobs' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {jobsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-emerald-600 text-slate-950 font-bold text-[9px] leading-tight font-mono">
                {jobsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Jobs</span>
        </button>

        {/* 🔴 Walk-ins */}
        <button
          onClick={() => onChangeTab('walkins')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-press ${
            activeTab === 'walkins'
              ? 'text-red-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${activeTab === 'walkins' ? 'stroke-[2.5] text-red-400 animate-pulse' : 'stroke-2'}`} />
            {walkInCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-red-500 text-white font-bold text-[9px] leading-tight font-mono animate-pulse">
                {walkInCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Walk-ins</span>
        </button>

        {/* ⚙️ Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all touch-press ${
            activeTab === 'settings'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};
