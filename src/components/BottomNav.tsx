import { Home, ShoppingBag, Inbox, User as UserIcon, Film } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

export type Tab = 'home' | 'marketing' | 'videos' | 'activity' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
}

export default function BottomNav({ activeTab, setActiveTab, user }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Feed' },
    { id: 'marketing', icon: ShoppingBag, label: 'Shop' },
    { id: 'videos', icon: Film, label: 'Vidéos' },
    { id: 'activity', icon: Inbox, label: 'Inbox' },
    { id: 'profile', icon: UserIcon, label: 'Moi' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around h-20 pb-4 px-2 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isCenter = tab.id === 'videos';

        if (isCenter) {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className="flex flex-col items-center justify-center w-full h-full relative"
              id="btn-nav-videos"
            >
              <div className="relative -mt-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all transform duration-300 ${
                  isActive 
                  ? 'bg-gradient-to-tr from-indigo-700 via-indigo-650 to-indigo-500 text-white scale-110 shadow-indigo-500/20' 
                  : 'bg-black text-white hover:bg-neutral-900 scale-100 hover:scale-105 shadow-black/20'
                }`}>
                  <Icon className="w-5 h-5 animate-pulse" />
                </div>
                {/* TikTok-style neon border backdrop effect */}
                <span className="absolute -inset-[2px] bg-gradient-to-r from-cyan-400 to-rose-400 rounded-2xl -z-10 opacity-70 blur-[1px] transition-opacity" />
              </div>
              <span className={`text-[10px] font-black tracking-widest uppercase mt-1.5 transition-all ${isActive ? 'text-indigo-650 opacity-100' : 'text-gray-400 opacity-60'}`}>
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            id={`btn-nav-${tab.id}`}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex flex-col items-center justify-center w-full h-full relative space-y-1 transition-all ${
              isActive ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              {tab.id === 'profile' && user.isLoggedIn ? (
                <div className={`w-6 h-6 rounded-lg overflow-hidden border-2 transition-all ${isActive ? 'border-indigo-600' : 'border-gray-200'}`}>
                  <img src={user.avatar} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
              )}
              
              {tab.id === 'activity' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
            <span className={`text-[10px] font-black tracking-widest uppercase transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
