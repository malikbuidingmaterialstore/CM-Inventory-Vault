import React from 'react';
import { ViewMode } from '../types';
import { LayoutDashboard, Building2, Plus, Search, Video } from 'lucide-react';

interface BottomNavProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  pendingSyncCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
}) => {
  const tabs = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'my_properties' as ViewMode,
      label: 'Listings',
      icon: Building2,
    },
    {
      id: 'add_property' as ViewMode,
      label: 'Add Plot',
      icon: Plus,
      isPrimary: true,
    },
    {
      id: 'videos' as ViewMode,
      label: 'Videos',
      icon: Video,
    },
    {
      id: 'search' as ViewMode,
      label: 'Search',
      icon: Search,
    },
  ];

  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 theme-bg-card/95 backdrop-blur-md theme-text-main border-t theme-border shadow-2xl transition-colors duration-200"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
    >
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id || (tab.id === 'videos' && currentView === 'tiktok_videos');
          const Icon = tab.icon;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="relative flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] active:scale-90 transition-transform focus:outline-none"
                aria-label="Add New Property Plot"
              >
                <div className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-sky-700 via-sky-600 to-cyan-500 hover:from-sky-600 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 border-2 border-white dark:border-slate-900 transition-all">
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 mt-0.5 tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition-all active:scale-95 focus:outline-none ${
                isActive 
                  ? 'text-amber-700 dark:text-amber-400 font-bold' 
                  : 'theme-text-tertiary hover:theme-text-main'
              }`}
              aria-label={tab.label}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-amber-500/15 dark:bg-amber-500/25' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
