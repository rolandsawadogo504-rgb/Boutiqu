import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, ShoppingBag, Grid, MoreVertical, Plus, Image as ImageIcon, Send, X, Phone, Heart, MessageSquare, Share2, Play, Film } from 'lucide-react';
import { Shop, Post, Product, Story } from '../types';
import ProductCard from './ProductCard';
import FeedItem from './FeedItem';
import CreateProductModal from './CreateProductModal';
import EditShopModal from './EditShopModal';
import { notificationManager } from '../lib/notificationManager';
import { dataService } from '../lib/dataService';

interface ShopDetailProps {
  shop: Shop;
  isOwner?: boolean;
  onAddPost?: (post: Post) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateShop?: (updatedFields: Partial<Shop>) => Promise<void>;
  stories?: Story[];
  onDeleteStory?: (id: string) => void;
  onUpdateStoryList?: (id: string, updatedFields: Partial<Story>) => void;
  key?: string;
}

export default function ShopDetail({ 
  shop, 
  isOwner = true, 
  onAddPost, 
  onAddProduct, 
  onUpdateShop, 
  stories = [],
  onDeleteStory,
  onUpdateStoryList
}: ShopDetailProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'products' | 'videos'>('posts');
  const [isPosting, setIsPosting] = useState(false);
  const [activeWatchVideo, setActiveWatchVideo] = useState<Story | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image: '' });
  const [localPosts, setLocalPosts] = useState<Post[]>(shop.posts || []);
  const [localProducts, setLocalProducts] = useState<Product[]>(shop.products || []);
  const [followersCount, setFollowersCount] = useState(shop.followers);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Video Parameters (like TikTok)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editVideoText, setEditVideoText] = useState('');

  const shopVideos = stories.filter(st => st.isShortVideo && (st.userId === shop.id || st.userName?.toLowerCase() === shop.name?.toLowerCase()));

  const handleDeleteVideo = async () => {
    if (!activeWatchVideo) return;
    if (window.confirm("Voulez-vous supprimer définitivement ce Short Vidéo ? Cette action est irréversible.")) {
      try {
        const success = await dataService.deleteStory(activeWatchVideo.id);
        if (success) {
          if (onDeleteStory) {
            onDeleteStory(activeWatchVideo.id);
          }
          setActiveWatchVideo(null);
          setIsMenuOpen(false);
          alert("La vidéo a été supprimée avec succès.");
        } else {
          alert("Erreur lors de la suppression de la vidéo du serveur.");
        }
      } catch (err) {
        console.error("Failed to delete story:", err);
        alert("Une erreur est survenue lors de la suppression.");
      }
    }
  };

  const handleSaveVideoEdit = async () => {
    if (!activeWatchVideo) return;
    try {
      const updatedFields = { text: editVideoText };
      const success = await dataService.updateStory(activeWatchVideo.id, updatedFields);
      if (success) {
        if (onUpdateStoryList) {
          onUpdateStoryList(activeWatchVideo.id, updatedFields);
        }
        setActiveWatchVideo(prev => prev ? { ...prev, ...updatedFields } : null);
        setIsEditingVideo(false);
        alert("La vidéo a été modifiée avec succès.");
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error("Failed to update story:", err);
      alert("Une erreur est survenue lors de la mise à jour.");
    }
  };

  useEffect(() => {
    setLocalPosts(shop.posts || []);
  }, [shop.posts]);

  useEffect(() => {
    setLocalProducts(shop.products || []);
  }, [shop.products]);

  useEffect(() => {
    setFollowersCount(shop.followers);
  }, [shop.followers]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (!newPost.content && !newPost.image) return;
    
    const post: Post = {
      id: Date.now().toString(),
      author: shop.name,
      authorId: shop.id,
      avatar: shop.avatar,
      content: newPost.content,
      image: newPost.image || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2342&auto=format&fit=crop',
      likes: 0,
      commentsCount: 0,
      comments: [],
      shares: 0,
      isFollowing: true,
      timestamp: "À l'instant"
    };

    setLocalPosts([post, ...localPosts]);
    if (onAddPost) onAddPost(post);
    setNewPost({ content: '', image: '' });
    setIsPosting(false);
  };

  const handleProductComplete = (productData: Partial<Product>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      category: productData.category || 'Digital',
      views: 0,
      likes: 0
    } as Product;

    setLocalProducts([newProduct, ...localProducts]);
    if (onAddProduct) onAddProduct(newProduct);
    setIsCreatingProduct(false);

    // Notify about new product launch
    setTimeout(() => {
      notificationManager.notify(
        'post',
        shop.name,
        `Vient de mettre en ligne : ${newProduct.name} !`,
        shop.avatar
      );
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Shop Header */}
      <div className="relative h-48 bg-gray-100">
        <img src={shop.banner} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
           <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
             <Share2 className="w-5 h-5" />
           </button>
           <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
             <MoreVertical className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl overflow-hidden">
              <img src={shop.avatar} className="w-full h-full object-cover rounded-[22px]" />
            </div>
          </div>
          <div className="flex gap-2">
            {!isOwner ? (
                <button 
                  onClick={() => {
                    setIsFollowing(!isFollowing);
                    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
                  }}
                  className={`px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isFollowing ? 'border border-gray-100 bg-white text-gray-400' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                >
                {isFollowing ? 'Suivi' : 'Suivre'}
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 border border-gray-100 bg-white text-gray-900 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                Modifier
              </button>
            )}
            <a 
              href={`https://wa.me/${shop.whatsapp.replace(/\s+/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-11 h-11 bg-green-500 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">{shop.name}</h1>
          <p className="text-gray-500 text-sm mb-4 leading-relaxed">{shop.bio}</p>
          
          <div className="flex gap-6 mb-8">
            <div>
              <span className="block font-black text-gray-900 text-lg">{followersCount}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Abonnés</span>
            </div>
            <div>
              <span className="block font-black text-gray-900 text-lg">{localProducts.length}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Produits</span>
            </div>
            <div>
              <span className="block font-black text-gray-900 text-lg">{shop.country}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pays</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[64px] bg-white border-b border-gray-50 z-20">
        <div className="flex gap-8 px-6">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`py-4 text-sm font-bold uppercase tracking-widest relative transition-colors ${activeTab === 'posts' ? 'text-gray-900' : 'text-gray-300'}`}
          >
            Publications
            {activeTab === 'posts' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
          <button 
           onClick={() => setActiveTab('products')}
            className={`py-4 text-sm font-bold uppercase tracking-widest relative transition-colors ${activeTab === 'products' ? 'text-gray-900' : 'text-gray-300'}`}
          >
            Produits
            {activeTab === 'products' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('videos')}
            className={`py-4 text-sm font-bold uppercase tracking-widest relative transition-colors flex items-center gap-1.5 ${activeTab === 'videos' ? 'text-gray-900' : 'text-gray-300'}`}
          >
            Vidéos
            <span className="bg-neutral-100 text-neutral-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
              {shopVideos.length}
            </span>
            {activeTab === 'videos' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {isOwner && (
              <button 
                onClick={() => setIsPosting(true)}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-3xl flex items-center gap-4 text-gray-400 text-left active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Partagez quelque chose avec vos abonnés...</span>
              </button>
            )}

            {localPosts.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="text-gray-300 w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Aucune publication</h3>
                <p className="text-sm text-gray-500">Commencez à poster du contenu pour vos abonnés.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {localPosts.map(post => (
                  <FeedItem key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-2 gap-4">
            {isOwner && (
              <button 
                onClick={() => setIsCreatingProduct(true)}
                className="aspect-[4/5] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-3 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                   <Plus />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Nouveau Produit</span>
              </button>
            )}
            {localProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            {shopVideos.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Film className="text-gray-350 w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Aucun Short Vidéo</h3>
                <p className="text-sm text-gray-500">Partagez votre premier short vidéo de démonstration produit.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shopVideos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => setActiveWatchVideo(video)}
                    className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-100 shadow-sm text-left group active:scale-[0.98] transition-all flex flex-col justify-end"
                  >
                    <video 
                      src={video.mediaUrl} 
                      preload="metadata"
                      muted 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
                    
                    {/* Top right likes badge */}
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm shadow-xs px-2 py-1 rounded-full flex items-center gap-1 z-20">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                      <span className="text-[10px] font-black text-white">{video.likes?.length || 0}</span>
                    </div>

                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom details context */}
                    <div className="p-3 z-20 relative text-white w-full">
                      {video.text && (
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight drop-shadow-sm mb-0.5">{video.text}</p>
                      )}
                      <span className="text-[8px] font-black tracking-widest uppercase opacity-75">{video.userName}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {isPosting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] p-4 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-xl">Nouvelle publication</h3>
                <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 flex-1 max-h-[70vh] overflow-y-auto space-y-4">
                <textarea 
                  value={newPost.content}
                  onChange={e => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Quoi de neuf ?"
                  className="w-full text-lg border-none focus:ring-0 resize-none min-h-[120px] p-0"
                />

                {newPost.image ? (
                  <div className="relative aspect-video rounded-3xl overflow-hidden group">
                    <img src={newPost.image} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setNewPost({...newPost, image: ''})}
                      className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs font-bold uppercase tracking-widest">Ajouter une photo</span>
                  </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="p-6 pt-0">
                <button 
                  onClick={handlePublish}
                  disabled={!newPost.content && !newPost.image}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  Publier sur mon feed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatingProduct && (
          <CreateProductModal 
            onClose={() => setIsCreatingProduct(false)}
            onComplete={handleProductComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <EditShopModal 
            shop={shop}
            onClose={() => setIsEditing(false)}
            onComplete={async (updatedFields) => {
              if (onUpdateShop) {
                await onUpdateShop(updatedFields);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* FULLSCREEN SHOP REELS WATCH MODAL */}
      <AnimatePresence>
        {activeWatchVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[250] flex flex-col items-center justify-center p-0 md:p-4 font-sans"
          >
            <div className="relative w-full h-full max-w-sm bg-neutral-950 flex flex-col md:rounded-[40px] overflow-hidden border border-neutral-900 shadow-2xl">
              {/* Header section with closing element */}
              <div className="absolute top-5 inset-x-5 flex justify-between items-center z-50 p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase">
                    {activeWatchVideo.userName?.substring(0,2)}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-white uppercase tracking-wider leading-none mb-0.5">{activeWatchVideo.userName}</h5>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Aperçu Short</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && (
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
                      title="Paramètres de la vidéo"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setActiveWatchVideo(null);
                      setIsMenuOpen(false);
                      setIsEditingVideo(false);
                    }}
                    className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Central screen-scaled Video Player */}
              <div className="flex-1 relative flex items-center justify-center">
                <video 
                  src={activeWatchVideo.mediaUrl}
                  autoPlay
                  loop
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay shadow for context protection */}
                <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                
                {/* Description card */}
                {!isEditingVideo && !isMenuOpen && (
                  <div className="absolute bottom-6 inset-x-5 p-4 bg-black/45 backdrop-blur-md border border-white/10 waves-all-side-padding-1.5 rounded-2xl z-30 text-white select-text">
                    <p className="text-xs font-bold leading-relaxed uppercase tracking-wider">{activeWatchVideo.text}</p>
                    {activeWatchVideo.emoji && (
                      <span className="inline-block mt-2 text-lg bg-white/10 px-2 py-1 rounded-xl">{activeWatchVideo.emoji}</span>
                    )}
                  </div>
                )}

                {/* Vertical action drawer (menu) */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute bottom-6 inset-x-5 p-5 bg-neutral-900/95 border border-neutral-800 rounded-3xl z-45 text-white select-none space-y-3 shadow-2xl"
                    >
                      <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 text-center">Options de la Vidéo</h5>
                      <button 
                        onClick={() => {
                          setEditVideoText(activeWatchVideo.text || '');
                          setIsEditingVideo(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full py-3.5 bg-neutral-850 hover:bg-neutral-800 font-extrabold text-[10px] uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 border border-neutral-800"
                      >
                        Modifier vidéo 📝
                      </button>
                      <button 
                        onClick={handleDeleteVideo}
                        className="w-full py-3.5 bg-rose-955 hover:bg-rose-950 text-rose-400 border border-rose-900/40 font-extrabold text-[10px] uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        Supprimer vidéo 🗑️
                      </button>
                      <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full py-3 bg-neutral-950 text-neutral-500 font-bold text-[9px] uppercase tracking-widest rounded-2xl transition-all border border-neutral-900"
                      >
                        Annuler
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Edit Drawer */}
                <AnimatePresence>
                  {isEditingVideo && (
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="absolute bottom-6 inset-x-5 p-5 bg-neutral-900/95 border border-neutral-800 rounded-3xl z-45 text-white select-text space-y-3.5 shadow-2xl"
                    >
                      <h5 className="text-[10px] font-black text-indigo-450 uppercase tracking-widest mb-1 text-center">Modifier la description</h5>
                      
                      <textarea 
                        value={editVideoText}
                        onChange={(e) => setEditVideoText(e.target.value)}
                        className="w-full p-3.5 bg-neutral-950 border border-neutral-850 rounded-2xl text-[11px] text-white placeholder-neutral-600 font-bold outline-none focus:border-indigo-500 transition-colors"
                        rows={3}
                        placeholder="Saisissez une nouvelle description..."
                      />

                      <div className="flex gap-2.5">
                        <button 
                          onClick={() => setIsEditingVideo(false)}
                          className="flex-1 py-3.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-350 font-extrabold text-[9px] uppercase tracking-wider rounded-2xl transition-all border border-neutral-800"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleSaveVideoEdit}
                          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
