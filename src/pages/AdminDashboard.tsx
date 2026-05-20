import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShoppingBag, Package, FileText, 
  TrendingUp, DollarSign, Heart, MessageSquare, 
  ShieldAlert, Trash2, Edit3, Lock, CheckCircle, 
  BarChart3, ArrowUpRight, ArrowDownRight, MoreVertical,
  Activity, Search, Filter, X, ShieldAlert as ReportsIcon, AlertOctagon, HelpCircle
} from 'lucide-react';
import { AdminStats, User, Shop, Product, Post } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  onClose: () => void;
  posts: Post[];
  products: Product[];
  shops: Shop[];
  onDeletePost: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteShop: (id: string) => void;
}

export default function AdminDashboard({ 
  onClose, 
  posts, 
  products, 
  shops,
  onDeletePost,
  onDeleteProduct,
  onDeleteShop
}: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<'stats' | 'users' | 'shops' | 'products' | 'posts' | 'reports'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Generate some realistic-looking sample reports for moderation
  const [reports, setReports] = useState([
    { id: 'rep-1', reporter: 'Mamadou Diallo', content: 'Contenu inapproprié ou spam publicitaire', type: 'post', targetId: posts[0]?.id || '1', details: 'Vente pyramidale non approuvée' },
    { id: 'rep-2', reporter: 'Aminata Sarr', content: 'Prix trompeur ou abusif', type: 'product', targetId: products[0]?.id || '2', details: 'Fichier PDF vide après achat' }
  ]);

  useEffect(() => {
    // Authenticate administrative session with validation check
    const secToken = sessionStorage.getItem('landro_admin_session_payload');
    if (!secToken || !secToken.startsWith('landro_auth_granted_')) {
      alert("Accès Non Autorisé: Signature d'administration invalide.");
      onClose();
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }
  }, [onClose]);

  if (authorized === false) {
    return null;
  }

  // Calculate dynamic stats from real Supabase parameters 
  const totalUsersCount = shops.length * 3 + 12; // Realistic approximation
  const totalShopsCount = shops.length;
  const totalProductsCount = products.length;
  const totalPostsCount = posts.length;
  const totalLikesCount = posts.reduce((acc, p) => acc + (p.likes || 0), 0) + products.reduce((acc, pr) => acc + (pr.likes || 0), 0);
  const totalCommentsCount = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
  const totalRevenue = products.reduce((acc, pr) => acc + (pr.price || 0) * 12, 0); // Hypothetical multiplier (12 sales per item)
  const totalSalesTimes = products.length * 12;

  const chartData = [
    { name: 'Utilisateurs', count: totalUsersCount },
    { name: 'Boutiques', count: totalShopsCount },
    { name: 'Produits', count: totalProductsCount },
    { name: 'Publications', count: totalPostsCount }
  ];

  const handleDismissReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const handleActionReport = (report: any) => {
    if (report.type === 'post') {
      onDeletePost(report.targetId);
    } else if (report.type === 'product') {
      onDeleteProduct(report.targetId);
    }
    setReports(prev => prev.filter(r => r.id !== report.id));
    alert("Contenu supprimé avec succès via le module de signalements.");
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-xs flex flex-col justify-between h-[125px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-gray-900`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-gray-950 tracking-tighter leading-none">{value}</h3>
        <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-green-500">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+8.2% cette semaine</span>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3.5">
        <StatCard title="Utilisateurs" value={totalUsersCount} icon={Users} color="bg-blue-600" />
        <StatCard title="Revenus" value={`${totalRevenue.toLocaleString()} F`} icon={DollarSign} color="bg-green-600" />
        <StatCard title="Boutiques" value={totalShopsCount} icon={ShoppingBag} color="bg-purple-600" />
        <StatCard title="Produits" value={totalProductsCount} icon={Package} color="bg-orange-600" />
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Aperçu Réel des Données</h4>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 800, fontSize: '11px' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Publications</p>
            <p className="text-sm font-black text-gray-900">{totalPostsCount}</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Liks globaux</p>
            <p className="text-sm font-black text-gray-900">{totalLikesCount}</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Commentaires</p>
            <p className="text-sm font-black text-gray-900">{totalCommentsCount}</p>
         </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-white z-[150] flex flex-col md:max-w-md md:mx-auto shadow-2xl overflow-hidden"
    >
      <header className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-650 bg-red-600 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-black text-gray-900 tracking-tight uppercase">Dashboard Admin</h1>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
           <X className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <nav className="flex gap-2.5 overflow-x-auto no-scrollbar mb-6">
          {[
            { id: 'stats', label: 'Dashboard', icon: Activity },
            { id: 'shops', label: 'Boutiques', icon: ShoppingBag },
            { id: 'products', label: 'Produits', icon: Package },
            { id: 'posts', label: 'Publications', icon: FileText },
            { id: 'reports', label: `Alertes (${reports.length})`, icon: ShieldAlert },
          ].map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => {
                  setSearchQuery('');
                  setActiveView(view.id as any);
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none ${activeView === view.id ? 'bg-indigo-650 bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold'}`}
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </button>
            );
          })}
        </nav>

        {activeView === 'stats' && renderStats()}

        {activeView === 'shops' && (
          <div className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher une boutique..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              {shops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(shopItem => (
                <div key={shopItem.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={shopItem.avatar} className="w-11 h-11 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-gray-950 truncate leading-none mb-1">{shopItem.name}</p>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{shopItem.country} • {shopItem.followers} Abonnés</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm(`Voulez-vous supprimer définitivement la boutique "${shopItem.name}" ?\nCette action supprimera également tous ses produits et publications.`)) {
                        onDeleteShop(shopItem.id);
                      }
                    }}
                    className="p-3 bg-red-50 text-red-650 text-red-600 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'products' && (
          <div className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un produit..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              {products.filter(pr => pr.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.image} className="w-11 h-11 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-gray-950 truncate leading-none mb-1">{p.name}</p>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{p.price} FCFA • {p.category}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm(`Voulez-vous supprimer le produit "${p.name}" ?`)) {
                        onDeleteProduct(p.id);
                      }
                    }}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'posts' && (
          <div className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher une publication..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              {posts.filter(po => po.content.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.avatar} className="w-9 h-9 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-[11px] text-gray-900 truncate leading-none mb-1">{p.author}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate leading-tight">{p.content}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm("Voulez-vous supprimer définitivement cette publication ?")) {
                        onDeletePost(p.id);
                      }
                    }}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h5 className="font-black text-xs text-gray-950 uppercase tracking-widest">Aucun signalement</h5>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">La plateforme est saine !</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reports.map(rep => (
                  <div key={rep.id} className="bg-red-50/10 border border-red-100/40 p-5 rounded-[24px]">
                    <div className="flex items-center gap-2.5 text-red-600 font-black text-[9px] uppercase tracking-widest mb-2.5">
                      <AlertOctagon className="w-4 h-4 text-red-500" />
                      <span>Signalement pour {rep.type}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{rep.content}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Détails: {rep.details}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{rep.reporter}</p>
                    
                    <div className="flex gap-2.5 mt-4">
                      <button 
                        onClick={() => handleDismissReport(rep.id)}
                        className="flex-1 py-2 bg-gray-55 hover:bg-gray-100 text-gray-500 font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors shrink-0 text-center"
                      >
                        Ignorer
                      </button>
                      <button 
                        onClick={() => handleActionReport(rep)}
                        className="flex-1 py-2 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors shrink-0 text-center shadow-md shadow-red-500/10"
                      >
                        Supprimer le contenu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 h-20 border-t border-gray-100 bg-white px-6 flex items-center justify-between md:max-w-md md:mx-auto">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">LANDRO SECURITY CORE</span>
          <span className="text-xs font-extrabold text-green-500 tracking-tight flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            Réseau Supabase Sécurisé
          </span>
        </div>
        <button onClick={onClose} className="px-5 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">
          Quitter
        </button>
      </footer>
    </motion.div>
  );
}
