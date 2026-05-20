import { useState, type ReactNode } from 'react';
import { Menu, Bell, Search, Settings, HelpCircle, UserPlus, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TopBarProps {
  onMenuClick: () => void;
  onActivityClick: () => void;
  unreadCount?: number;
  onBack?: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, onActivityClick, unreadCount = 2, onBack, title }: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleActivity = () => {
    // If onActivityClick is specified, trigger it directly to transition tabs smoothly
    if (onActivityClick) {
      onActivityClick();
    } else {
      setIsActivityOpen(!isActivityOpen);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          {onBack ? (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          ) : (
            <button 
              onClick={toggleMenu}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <div className="flex items-center gap-2">
            {title ? (
               <span className="font-bold text-xl tracking-tight text-gray-900">{title}</span>
            ) : (
              <span className="font-bold text-xl tracking-tight text-gray-950">LANDRO<span className="text-indigo-600"> DIGITAL</span></span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!onBack && (
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-650">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          {/* Notifications Notification Bell with real badge */}
          <button 
            onClick={toggleActivity}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-650 relative"
            id="top-bar-notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-black scale-95 border border-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white z-[70] shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-xl">Menu</span>
                <button onClick={toggleMenu} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-4">
                <MenuLink icon={<Settings className="w-5 h-5" />} label="Paramètres" onClick={toggleMenu} />
                <MenuLink icon={<HelpCircle className="w-5 h-5" />} label="Aide" onClick={toggleMenu} />
                <MenuLink icon={<UserPlus className="w-5 h-5" />} label="Admin" onClick={toggleMenu} />
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Activity Drawer */}
      <AnimatePresence>
        {isActivityOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleActivity}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white z-[70] shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-xl">Activité</span>
                <button onClick={toggleActivity} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Notifications</h3>
                  <p className="text-sm text-gray-500 italic">Voir l'onglet Activité pour plus de détails</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Messages</h3>
                  <p className="text-sm text-gray-500 italic">2 nouveaux messages en attente</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuLink({ icon, label, onClick }: { icon: ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 hover:bg-gray-50 rounded-xl transition-colors text-gray-700"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
