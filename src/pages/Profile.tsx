import { 
  UserCircle2, Store, ArrowRight, LayoutDashboard, 
  LogIn, UserPlus, Lock, Bell, BellOff, Settings, 
  ShieldCheck, HelpCircle, LogOut, ChevronRight, User as UserIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Shop, Post, Product, Story } from '../types';
import { useState, useEffect } from 'react';
import { notificationManager } from '../lib/notificationManager';
import ShopDetail from '../components/ShopDetail';

interface ProfileProps {
  user: User;
  shop?: Shop;
  stories?: Story[];
  onLogin: () => void;
  onLogout: () => void;
  onCreateShop: () => void;
  onViewShop: () => void;
  onAdminAccess: () => void;
  onAddPost?: (post: Post) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateShop?: (updatedFields: Partial<Shop>) => Promise<void>;
  onDeleteStory?: (id: string) => void;
  onUpdateStoryList?: (id: string, updatedFields: Partial<Story>) => void;
  key?: string;
}

export default function Profile({ 
  user, shop, stories, onLogin, onLogout, onCreateShop, onViewShop, onAdminAccess, onAddPost, onAddProduct, onUpdateShop,
  onDeleteStory, onUpdateStoryList
}: ProfileProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(window.Notification.permission === 'granted');
    }
  }, []);

  const handleTogglePush = async () => {
    const granted = await notificationManager.requestPermission();
    setPushEnabled(granted);
    if (granted) {
       notificationManager.notify(
         'post',
         'LANDRO',
         'Notifications push activées avec succès !',
         'https://api.dicebear.com/7.x/avataaars/svg?seed=landro'
       );
    }
  };

  if (!user.isLoggedIn) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 pt-20 pb-10 flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mb-8 border border-blue-100 shadow-sm relative">
           <div className="absolute -inset-4 bg-blue-50/30 rounded-full blur-2xl animate-pulse" />
           <UserCircle2 className="w-12 h-12 text-blue-600 relative z-10" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 italic">Bienvenue sur LANDRO</h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10 max-w-[280px]">
          Rejoignez la plus grande communauté digitale d'Afrique pour vendre, acheter et échanger.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={onLogin}
            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group"
          >
            Se Connecter
            <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="w-full py-5 bg-white text-gray-900 border border-gray-100 rounded-[24px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
            Créer un compte
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // If logged in and has shop, show ShopDetail as the profile
  if (user.hasShop && shop) {
    return (
      <div className="relative">
        <div className="fixed top-20 right-6 z-[100]">
           <button 
             onClick={() => setShowSettings(!showSettings)}
             className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
           >
             {showSettings ? <ArrowRight className="w-6 h-6 text-gray-900 rotate-180" /> : <Settings className="w-6 h-6 text-gray-900" />}
           </button>
        </div>

        {showSettings ? (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-white z-[150] pt-20 px-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Paramètres</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-50 rounded-xl">
                <ChevronRight className="w-6 h-6 rotate-180 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Compte & Sécurité</h3>
                <div className="space-y-2">
                   <SettingItem icon={UserIcon} label="Informations personnelles" />
                   <SettingItem icon={ShieldCheck} label="Sécurité du compte" />
                   <button 
                    onClick={handleTogglePush}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl group"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                         {pushEnabled ? <Bell className="w-5 h-5 text-blue-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                       </div>
                       <span className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-widest">Alertes Push</span>
                     </div>
                     <div className={`w-8 h-5 rounded-full p-1 transition-colors ${pushEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
                     </div>
                   </button>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Support</h3>
                <div className="space-y-2">
                   <SettingItem icon={HelpCircle} label="Centre d'aide" />
                   <SettingItem icon={Lock} label="Confidentialité" />
                </div>
              </section>

              <section className="pt-10">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-[24px] font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-red-100"
                >
                  <LogOut className="w-5 h-5" />
                  Déconnexion
                </button>
                <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-6">LANDRO DIGITAL V2.0.4</p>
              </section>
            </div>
          </motion.div>
        ) : (
          <ShopDetail 
            shop={shop} 
            isOwner={true} 
            onAddPost={onAddPost} 
            onAddProduct={onAddProduct} 
            onUpdateShop={onUpdateShop}
            stories={stories}
            onDeleteStory={onDeleteStory}
            onUpdateStoryList={onUpdateStoryList}
          />
        )}
      </div>
    );
  }

  // Fallback if logged in but no shop
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 pb-20 pt-10"
    >
      <header className="flex items-center gap-5 mb-10">
        <div className="relative">
          <img src={user.avatar} className="w-24 h-24 rounded-[32px] object-cover shadow-xl border-4 border-white" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{user.name}</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Ambassadeur Landro</p>
          
          <div className="flex gap-6 mt-4">
             <div className="flex flex-col items-center">
                <span className="text-sm font-black text-gray-900">{user.followersCount}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase">Abonnés</span>
             </div>
             <div className="flex flex-col items-center border-l border-gray-100 pl-6">
                <span className="text-sm font-black text-gray-900">{user.followingIds?.length || 0}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase">Abonnements</span>
             </div>
          </div>
        </div>
      </header>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 text-center mb-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <Store className="w-24 h-24 text-blue-600" />
        </div>
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
          <Store className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-black text-gray-900 tracking-tighter mb-2">Prêt à vendre ?</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
           Ouvrez votre boutique Landro en 2 minutes et commencez à gagner de l'argent.
        </p>
        <button 
          onClick={onCreateShop}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          Créer ma boutique
        </button>
      </div>

      <div className="space-y-3 mb-10">
        <button 
          onClick={() => onAdminAccess()}
          className="w-full p-5 bg-gray-50 rounded-[28px] flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Lock className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Administration</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Accès réservé</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={onLogout}
          className="w-full p-5 bg-red-50 text-red-600 rounded-[28px] border border-red-100 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </motion.div>
  );
}

function SettingItem({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl group transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <span className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
    </button>
  );
}
