import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageCircle, Share2, Bookmark, ShoppingBag, Store, 
  Plus, ChevronUp, ChevronDown, Sparkles, Volume2, VolumeX, 
  ArrowLeft, Upload, Edit3, MessageSquare, AlertCircle, X, Send, 
  Check, Play, Trash2, CornerDownRight
} from 'lucide-react';
import { Story, User, Shop, Product, StoryReply } from '../types';
import { dataService } from '../lib/dataService';
import { notificationManager } from '../lib/notificationManager';

interface VideosProps {
  stories: Story[];
  user: User;
  onUpdateStoryList: (id: string, updatedFields: Partial<Story>) => void;
  onDeleteStory?: (id: string) => void;
  onAddStory: () => void;
  products: Product[];
  shops: Shop[];
  onUpdateUser?: (user: User) => void;
}

export default function Videos({ 
  stories, 
  user, 
  onUpdateStoryList, 
  onDeleteStory,
  onAddStory,
  products,
  shops,
  onUpdateUser
}: VideosProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCommentsId, setShowCommentsId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Strictly filter for TikTok-style persistent short videos only
  const videoStories = stories.filter(s => s.isShortVideo === true);

  // Load saved video IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('landro_saved_videos');
    if (saved) {
      try {
        setSavedVideoIds(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleSaveVideo = (storyId: string) => {
    let nextSaved = [];
    if (savedVideoIds.includes(storyId)) {
      nextSaved = savedVideoIds.filter(id => id !== storyId);
    } else {
      nextSaved = [...savedVideoIds, storyId];
      notificationManager.notify('post', user.name, "Vidéo enregistrée dans vos coups de cœur 🏷️", user.avatar);
    }
    setSavedVideoIds(nextSaved);
    localStorage.setItem('landro_saved_videos', JSON.stringify(nextSaved));
  };

  // Scroll handler to detect which video is currently visible
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    
    // Calculate page index based on midpoints for precise responsive triggering
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeVideoIndex && index >= 0 && index < videoStories.length) {
      setActiveVideoIndex(index);
    }
  };

  // Track user view on active video story
  useEffect(() => {
    if (videoStories.length === 0 || !user.isLoggedIn || activeVideoIndex >= videoStories.length) return;
    
    const activeVideo = videoStories[activeVideoIndex];
    const views = activeVideo.views || [];
    
    if (!views.includes(user.id)) {
      const updatedViews = [...views, user.id];
      // Update database
      dataService.updateStory(activeVideo.id, { views: updatedViews });
      // Update state locally
      onUpdateStoryList(activeVideo.id, { views: updatedViews });
    }
  }, [activeVideoIndex, videoStories.length, user.id, user.isLoggedIn]);

  return (
    <div className="absolute inset-0 bg-black text-white shrink-0 flex flex-col z-[40]">
      {/* Feed Area */}
      <div className="flex-1 relative bg-neutral-950 overflow-hidden">
        {videoStories.length === 0 ? (
          /* High Premium Empty State guiding merchants to upload actual videos */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-neutral-955 text-center font-sans">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-[20px] flex items-center justify-center text-indigo-400 mb-6 relative">
              <Play className="w-8 h-8 animate-pulse text-indigo-500 fill-current" />
              <span className="absolute -inset-1 bg-indigo-500/10 rounded-[24px] blur-md animate-ping" />
            </div>
            
            <h3 className="font-black text-base uppercase tracking-tighter text-white">Aucune vidéo en ligne</h3>
            <p className="text-xs text-neutral-400 font-bold max-w-xs leading-relaxed uppercase mt-2.5 tracking-wider">
              Découvrez les démonstrations réelles de nos boutiquiers. Soyez le premier à publier !
            </p>

            <div className="mt-8 space-y-4 w-full max-w-xs">
              <button
                onClick={onAddStory}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-750 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase active:scale-95 transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Publier une Vidéo 🎬
              </button>
              
              <div className="p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-left">
                <p className="text-[9px] font-black uppercase text-indigo-400 mb-1.5 tracking-widest">Pourquoi publier ?</p>
                <ul className="text-[10px] text-neutral-400 space-y-1 font-bold uppercase tracking-wider">
                  <li>• Convertissez vos prospects en clients réels</li>
                  <li>• Présentez vos produits phares en 15 secondes</li>
                  <li>• Gagnez en visibilité immédiate</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Scrollable Video Stack */
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-scroll scroll-smooth scrollbar-none snap-y snap-mandatory select-none"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            {videoStories.map((story, i) => {
              const isActive = i === activeVideoIndex;
              return (
                <VideoItem 
                  key={story.id}
                  story={story}
                  isActive={isActive}
                  isMuted={isMuted}
                  setIsMuted={setIsMuted}
                  user={user}
                  onUpdateStoryList={onUpdateStoryList}
                  onDeleteStory={onDeleteStory}
                  products={products}
                  shops={shops}
                  isSaved={savedVideoIds.includes(story.id)}
                  onToggleSave={() => toggleSaveVideo(story.id)}
                  onOpenComments={() => setShowCommentsId(story.id)}
                  onUpdateUser={onUpdateUser}
                />
              );
            })}
          </div>
        )}

        {/* Global Floating Sound Toggle Indicator (top right) */}
        {videoStories.length > 0 && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-4 right-4 z-50 p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md border border-neutral-800/80 text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        )}

        {/* Floating Upload button at Top Left of Feed */}
        {videoStories.length > 0 && (
          <button
            onClick={onAddStory}
            className="absolute top-4 left-4 z-50 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-full backdrop-blur-md text-white font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Publier Vidéo
          </button>
        )}
      </div>

      {/* COMMENTS MODAL */}
      <AnimatePresence>
        {showCommentsId && (
          <CommentsDrawer 
            storyId={showCommentsId}
            stories={stories}
            user={user}
            onClose={() => setShowCommentsId(null)}
            onUpdateStoryList={onUpdateStoryList}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* Individual Video Feed Item playing on status */
interface VideoItemProps {
  story: Story;
  isActive: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  user: User;
  onUpdateStoryList: (id: string, updatedFields: Partial<Story>) => void;
  onDeleteStory?: (id: string) => void;
  products: Product[];
  shops: Shop[];
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenComments: () => void;
  onUpdateUser?: (user: User) => void;
}

function VideoItem({
  story,
  isActive,
  isMuted,
  setIsMuted,
  user,
  onUpdateStoryList,
  onDeleteStory,
  products,
  shops,
  isSaved,
  onToggleSave,
  onOpenComments,
  onUpdateUser
}: VideoItemProps) {
  const [likesCount, setLikesCount] = useState(story.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(story.likes?.includes(user.id) || false);
  const [isFollowing, setIsFollowing] = useState(user.followingIds?.includes(story.userId) || false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [heartBurstCoords, setHeartBurstCoords] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(story.text || '');
  const [editEmoji, setEditEmoji] = useState(story.emoji || '');
  const [editProductLink, setEditProductLink] = useState(story.productLink || '');
  const [editShopLink, setEditShopLink] = useState(story.shopLink || '');
  
  const [showAdminCodePrompt, setShowAdminCodePrompt] = useState<{ action: 'edit' | 'delete' } | null>(null);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminCodeError, setAdminCodeError] = useState('');

  // Handle updates when story changes
  useEffect(() => {
    setEditText(story.text || '');
    setEditEmoji(story.emoji || '');
    setEditProductLink(story.productLink || '');
    setEditShopLink(story.shopLink || '');
  }, [story]);

  // Handle updates when user followingIds changes
  useEffect(() => {
    setIsFollowing(user.followingIds?.includes(story.userId) || false);
  }, [user.followingIds, story.userId]);

  const isOwner = user.isLoggedIn && story.userId === user.id;
  const hasExistingAdminSession = typeof sessionStorage !== 'undefined' && 
    (() => {
      const token = sessionStorage.getItem('landro_admin_session_payload');
      return token && token.startsWith('landro_auth_granted_');
    })();

  const isAuthorized = isOwner || hasExistingAdminSession;

  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await dataService.deleteStory(story.id);
      if (success) {
        if (onDeleteStory) {
          onDeleteStory(story.id);
        }
        alert("La vidéo a été supprimée avec succès.");
      } else {
        alert("Erreur lors de la suppression de la vidéo du serveur.");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    if (isAuthorized) {
      setEditText(story.text || '');
      setEditEmoji(story.emoji || '');
      setEditProductLink(story.productLink || '');
      setEditShopLink(story.shopLink || '');
      setShowEditModal(true);
    } else {
      setShowAdminCodePrompt({ action: 'edit' });
    }
  };

  const handleDeleteClick = () => {
    if (isAuthorized) {
      if (window.confirm("Voulez-vous supprimer définitivement ce Short Vidéo ? Cette action est irréversible.")) {
        executeDelete();
      }
    } else {
      setShowAdminCodePrompt({ action: 'delete' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedFields: Partial<Story> = {
        text: editText,
        emoji: editEmoji,
        productLink: editProductLink,
        shopLink: editShopLink
      };
      
      const success = await dataService.updateStory(story.id, updatedFields);
      if (success) {
        onUpdateStoryList(story.id, updatedFields);
        setShowEditModal(false);
        alert("La vidéo a été modifiée avec succès.");
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyAdminCode = () => {
    if (adminCodeInput === '7515') {
      sessionStorage.setItem('landro_admin_session_payload', `landro_auth_granted_${Date.now()}`);
      const actionToRun = showAdminCodePrompt?.action;
      setShowAdminCodePrompt(null);
      setAdminCodeInput('');
      setAdminCodeError('');
      
      if (actionToRun === 'edit') {
        setEditText(story.text || '');
        setEditEmoji(story.emoji || '');
        setEditProductLink(story.productLink || '');
        setEditShopLink(story.shopLink || '');
        setShowEditModal(true);
      } else if (actionToRun === 'delete') {
        if (window.confirm("Voulez-vous supprimer définitivement ce Short Vidéo ? Cette action est irréversible.")) {
          executeDelete();
        }
      }
    } else {
      setAdminCodeError("Code d'accès incorrect !");
    }
  };

  // Synchronise like state on active story changes
  useEffect(() => {
    setIsLiked(story.likes?.includes(user.id) || false);
    setLikesCount(story.likes?.length || 0);
    setIsFollowing(user.followingIds?.includes(story.userId) || false);
  }, [story, user.id, user.followingIds]);

  // Video playback management based on visible status
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay was prevented by browser security rules", error);
        });
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleLikeToggle = async (e?: React.MouseEvent) => {
    if (!user.isLoggedIn) {
      alert("Veuillez vous de connecter pour interagir !");
      return;
    }

    const likes = story.likes || [];
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    let updatedLikes = [];
    if (nextLiked) {
      updatedLikes = [...likes, user.id];
      setLikesCount(prev => prev + 1);

      // Heart pop burst coordinates
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        setHeartBurstCoords({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setShowHeartBurst(true);
        setTimeout(() => setShowHeartBurst(false), 800);
      }

      // Notify creator
      if (story.userId !== user.id) {
        notificationManager.notify(
          'like', 
          user.name, 
          "a aimé votre vidéo promo ! 🔥🎬", 
          user.avatar
        );
      }
    } else {
      updatedLikes = likes.filter(id => id !== user.id);
      setLikesCount(prev => Math.max(0, prev - 1));
    }

    // Write change
    onUpdateStoryList(story.id, { likes: updatedLikes });
    await dataService.updateStory(story.id, { likes: updatedLikes });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Double click to trigger rapid like burst
    if (!isLiked) {
      handleLikeToggle(e);
    } else {
      // Toggle burst anyway
      const rect = e.currentTarget.getBoundingClientRect();
      setHeartBurstCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }
  };

  const handleFollowToggle = async () => {
    if (!user.isLoggedIn) {
      alert("Veuillez vous connecter pour suivre cette boutique.");
      return;
    }

    const followingIds = user.followingIds || [];
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);

    let updatedFollowing = [];
    if (nextFollowing) {
      updatedFollowing = [...followingIds, story.userId];
      notificationManager.notify('follow', user.name, "S'est abonné à votre boutique ! 🤝", user.avatar);
    } else {
      updatedFollowing = followingIds.filter(id => id !== story.userId);
    }

    // Save user state in memory & localStorage
    const updatedUser = { ...user, followingIds: updatedFollowing };
    localStorage.setItem('landro_user', JSON.stringify(updatedUser));
    
    // Propagate changes to parent user state in the application
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/videos/${story.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Lien de la vidéo marketing copié ! Partagez-le avec vos clients.");
  };

  // Find linked objects
  const linkedProduct = products.find(p => p.id === story.productLink);
  const linkedShop = shops.find(s => s.id === story.shopLink || s.id === story.userId);

  return (
    <div className="w-full h-full bg-neutral-950 flex flex-col justify-end snap-start relative text-left">
      {/* Video Content with double click triggers */}
      <div 
        onDoubleClick={handleDoubleClick}
        className="absolute inset-0 z-10 w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
      >
        <video
          ref={videoRef}
          src={story.mediaUrl}
          loop
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
        />

        {/* Big double toggle heart burst overlay */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 1, rotate: -15 }}
              animate={{ scale: [1, 1.4, 1.2], opacity: [1, 1, 0], rotate: [0, 10, -5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: 'absolute',
                left: heartBurstCoords.x - 30,
                top: heartBurstCoords.y - 30,
                transform: 'translate(-50%, -50%)',
                color: '#ef4444',
                pointerEvents: 'none'
              }}
              className="z-[260]"
            >
              <Heart className="w-16 h-16 fill-red-500 drop-shadow-2xl filter" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Real Fullscreen Bottom Gradients Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30 opacity-80 pointer-events-none z-20" />

      {/* ACTIONS ON THE UTILITY RIGHT COUPLING */}
      <div className="absolute right-3.5 bottom-28 z-30 flex flex-col items-center gap-4.5 select-none text-center">
        {/* Profile Shop Circle + Floating Follow */}
        <div className="relative mb-3 flex flex-col items-center">
          <a
            href={`#shop-${story.userId}`}
            onClick={(e) => {
              e.preventDefault();
              // Guide to shop view
              window.location.hash = `shop-${story.userId}`;
            }}
            className="w-11 h-11 bg-neutral-900 rounded-full border-2 border-indigo-500 overflow-hidden shadow-lg p-[1.5px]"
          >
            <img 
              src={story.userAvatar} 
              className="w-full h-full rounded-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </a>
          
          {/* Quick toggle follow plus button */}
          {!isFollowing && story.userId !== user.id && (
            <button
              onClick={handleFollowToggle}
              className="absolute -bottom-1 w-[18px] h-[18px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center border-2 border-slate-950 focus:outline-none shadow-md transition-all active:scale-90"
            >
              <Plus className="w-2.5 h-2.5 stroke-[4px]" />
            </button>
          )}
          {isFollowing && story.userId !== user.id && (
            <button
              onClick={handleFollowToggle}
              className="absolute -bottom-1 w-[18px] h-[18px] bg-green-500 text-white rounded-full flex items-center justify-center border-2 border-slate-950 focus:outline-none shadow-md"
            >
              <Check className="w-2.5 h-2.5 stroke-[4px]" />
            </button>
          )}
        </div>

        {/* Video likes action */}
        <button 
          onClick={(e) => handleLikeToggle(e)}
          className="flex flex-col items-center gap-1 focus:outline-none text-white font-sans"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-250 ${isLiked ? 'bg-rose-600 border-none text-white shadow-lg shadow-rose-600/30' : 'bg-black/45 hover:bg-black/60 backdrop-blur-md border-white/10'}`}>
            <Heart className={`w-[22px] h-[22px] ${isLiked ? 'fill-current text-white animate-pulse' : 'text-neutral-100'}`} />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight drop-shadow">{likesCount}</span>
        </button>

        {/* Comment actions modal triggered */}
        <button 
          onClick={onOpenComments}
          className="flex flex-col items-center gap-1 focus:outline-none text-white font-sans"
        >
          <div className="w-12 h-12 rounded-full bg-black/45 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-200">
            <MessageCircle className="w-[22px] h-[22px] text-neutral-100" />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight drop-shadow">{story.replies?.length || 0}</span>
        </button>

        {/* Save coup de coeur */}
        <button 
          onClick={onToggleSave}
          className="flex flex-col items-center gap-1 focus:outline-none text-white font-sans"
        >
          <div className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 ${isSaved ? 'bg-amber-500 border-none text-neutral-950 shadow-lg shadow-amber-500/30' : 'bg-black/45 hover:bg-black/60 backdrop-blur-md text-white'}`}>
            <Bookmark className={`w-[22px] h-[22px] ${isSaved ? 'fill-current' : 'text-neutral-100'}`} />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight drop-shadow">{isSaved ? "Sauvé" : "Enregistrer"}</span>
        </button>

        {/* Share link copy */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1 focus:outline-none text-white font-sans"
        >
          <div className="w-12 h-12 rounded-full bg-black/45 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-200">
            <Share2 className="w-[22px] h-[22px] text-neutral-100" />
          </div>
          <span className="text-[10px] font-extrabold tracking-tight drop-shadow">Partager</span>
        </button>
      </div>

      {/* LEFT CONTENT CONTAINER & SHOPPABLE TARGET CARD */}
      <div className="p-5 pb-8 z-30 space-y-4 max-w-[85%] relative">
        <div className="space-y-1.5">
          {/* Shop Title with Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-black text-sm uppercase tracking-tight truncate max-w-44">
              {story.userName}
            </h4>
            {linkedShop && (
              <span className="bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block">
                Boutique Certifiée
              </span>
            )}
            {!isOwner && !isFollowing && (
              <button
                onClick={handleFollowToggle}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1 cursor-pointer"
              >
                Suivre
              </button>
            )}
          </div>

          {/* Description text */}
          {story.text && (
            <p className="text-xs font-bold leading-relaxed text-neutral-200 uppercase tracking-wide break-words">
              {story.text}
            </p>
          )}

          {/* Floating Emoji Indicator */}
          {story.emoji && (
            <div className="inline-flex gap-1 items-center px-2 py-1 bg-white/10 backdrop-blur-xs rounded-xl font-bold text-xs">
              <span>Humeur :</span>
              <span className="text-base animate-bounce">{story.emoji}</span>
            </div>
          )}
        </div>

        {/* Product Attachment bottom cards if present */}
        {linkedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/95 backdrop-blur-md rounded-[24px] p-3 shadow-2xl flex items-center justify-between border border-white/30"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img src={linkedProduct.image} className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0" />
              <div className="min-w-0">
                <span className="text-[8px] font-black text-indigo-600 block uppercase tracking-widest leading-none mb-0.5">Produit lié</span>
                <p className="font-extrabold text-[11px] text-neutral-900 truncate uppercase tracking-tight leading-none mb-1">{linkedProduct.name}</p>
                <p className="font-black text-xs text-indigo-750 font-sans tracking-tight">{linkedProduct.price.toLocaleString()} F</p>
              </div>
            </div>
            
            <a 
              href={`#product-${linkedProduct.id}`}
              onClick={(e) => {
                e.preventDefault();
                // scroll or link to product Detail using hash direct identifier
                window.location.hash = `product-${linkedProduct.id}`;
              }}
              className="ml-3 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-indigo-600/20 shrink-0"
            >
              Acheter
              <ShoppingBag className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}
      </div>

      {/* MODAL ADMIN PIN ACCESS CODE ENTRY */}
      <AnimatePresence>
        {showAdminCodePrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative">
              <button 
                onClick={() => {
                  setShowAdminCodePrompt(null);
                  setAdminCodeInput('');
                  setAdminCodeError('');
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>

              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">Accès Administrateur requis</h4>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide leading-relaxed mb-6">
                Vous n'êtes pas propriétaire de cette vidéo. Veuillez saisir le code secret d'administrateur (4 chiffres) :
              </p>

              <input 
                type="password"
                maxLength={6}
                value={adminCodeInput}
                onChange={(e) => {
                  setAdminCodeInput(e.target.value);
                  setAdminCodeError('');
                }}
                placeholder="••••"
                className="w-full text-center tracking-[0.8em] font-sans font-black text-xl py-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-white outline-none focus:border-indigo-500 transition-colors mb-3"
              />

              {adminCodeError && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wide mb-3">{adminCodeError}</p>
              )}

              <button 
                onClick={handleVerifyAdminCode}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg"
              >
                Valider l'authentification
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL OVERLAY */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-x-0 bottom-0 top-12 bg-neutral-950/98 backdrop-blur-lg border-t border-neutral-800 rounded-t-[40px] z-[190] p-6 overflow-y-auto flex flex-col font-sans text-neutral-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6 font-sans">
              <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Détails du Shorts Vidéo
              </span>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {/* Message / Description */}
              <div>
                <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Message accrocheur</label>
                <textarea 
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={120}
                  rows={2}
                  className="w-full p-4 bg-neutral-900 border border-neutral-800 text-white rounded-2xl text-xs outline-none focus:border-indigo-500 resize-none font-sans"
                  placeholder="Décrivez votre produit..."
                />
                <span className="text-[9px] text-right block text-neutral-500 uppercase mt-1">{editText.length}/120</span>
              </div>

              {/* Floating Emoji */}
              <div>
                <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Emoji d'humeur</label>
                <div className="flex gap-2 flex-wrap">
                  {['🔥', '🎬', '💎', '💥', '⚠️', '👀', '✨', '👜', '🛍️'].map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => setEditEmoji(emoji === editEmoji ? '' : emoji)}
                      className={`w-10 h-10 text-lg rounded-xl flex items-center justify-center border transition-all ${editEmoji === emoji ? 'bg-indigo-600 border-indigo-400 text-white scale-110' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Product Selection */}
              <div>
                <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Produit Lié</label>
                <select 
                  value={editProductLink}
                  onChange={(e) => setEditProductLink(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border border-neutral-800 text-white rounded-2xl text-xs outline-none focus:border-indigo-500 font-sans"
                >
                  <option value="">Aucun produit lié</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.price} F</option>
                  ))}
                </select>
              </div>

              {/* Linked Shop Selection */}
              <div>
                <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Boutique Liée</label>
                <select 
                  value={editShopLink}
                  onChange={(e) => setEditShopLink(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border border-neutral-800 text-white rounded-2xl text-xs outline-none focus:border-indigo-500 font-sans"
                >
                  <option value="">Aucune boutique liée (Défaut : vous)</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSaveEdit}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-600/20 mt-6"
            >
              Enregistrer modifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Comments Drawer sliding up */
interface CommentsDrawerProps {
  storyId: string;
  stories: Story[];
  user: User;
  onClose: () => void;
  onUpdateStoryList: (id: string, updatedFields: Partial<Story>) => void;
}

function getRelativeTime(timestamp: string): string {
  if (!timestamp) return "À l'instant";
  if (timestamp.includes(":") && !timestamp.includes("T")) {
    return timestamp;
  }
  try {
    const parsed = Date.parse(timestamp);
    if (isNaN(parsed)) return timestamp;
    const diffMs = Date.now() - parsed;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "À l'instant";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin}m`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `Il y a ${diffHour}h`;
    const diffDay = Math.floor(diffHour / 24);
    return `Il y a ${diffDay}j`;
  } catch {
    return timestamp;
  }
}

function CommentsDrawer({
  storyId,
  stories,
  user,
  onClose,
  onUpdateStoryList
}: CommentsDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const [localReplies, setLocalReplies] = useState<StoryReply[]>([]);
  const [replyingTo, setReplyingTo] = useState<StoryReply | null>(null);
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const story = stories.find(s => s.id === storyId);

  // Sync state with incoming database stories
  useEffect(() => {
    if (story) {
      setLocalReplies(story.replies || []);
    }
  }, [story]);

  if (!story) return null;

  const parentReplies = localReplies.filter(r => !r.parentId);
  const childReplies = localReplies.filter(r => r.parentId);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isLoggedIn) {
      alert("Veuillez vous connecter pour commenter.");
      return;
    }
    if (!commentText.trim()) return;

    const newReply: StoryReply = {
      id: `rep_${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
      likes: [],
      parentId: replyingTo ? replyingTo.id : undefined
    };

    const updatedReplies = [...localReplies, newReply];
    
    // Optimistic Update local state
    setLocalReplies(updatedReplies);
    onUpdateStoryList(story.id, { replies: updatedReplies });
    
    // Save to Database
    await dataService.updateStory(story.id, { replies: updatedReplies });

    // Send visual in-app notification to author
    if (story.userId !== user.id) {
      notificationManager.notify(
        'reply',
        user.name,
        `a commenté votre vidéo: "${commentText.trim().substring(0, 30)}${commentText.length > 30 ? '...' : ''}" 💬`,
        user.avatar
      );
    }

    setCommentText('');
    setReplyingTo(null);
  };

  const handleLikeComment = async (replyId: string) => {
    if (!user.isLoggedIn) {
      alert("Veuillez vous connecter pour aimer ce commentaire.");
      return;
    }
    const updated = localReplies.map(rep => {
      if (rep.id === replyId) {
        const likesList = rep.likes || [];
        const hasLiked = likesList.includes(user.id);
        const newLikes = hasLiked 
          ? likesList.filter(uid => uid !== user.id)
          : [...likesList, user.id];
        return { ...rep, likes: newLikes };
      }
      return rep;
    });

    setLocalReplies(updated);
    onUpdateStoryList(story.id, { replies: updated });
    await dataService.updateStory(story.id, { replies: updated });
  };

  const handleDeleteComment = async (replyId: string) => {
    if (window.confirm("Voulez-vous supprimer votre commentaire ?")) {
      const updated = localReplies.filter(rep => rep.id !== replyId && rep.parentId !== replyId);
      setLocalReplies(updated);
      onUpdateStoryList(story.id, { replies: updated });
      await dataService.updateStory(story.id, { replies: updated });
    }
  };

  const handleStartEdit = (rep: StoryReply) => {
    setEditingId(rep.id);
    setEditText(rep.text);
  };

  const handleUpdateComment = async (replyId: string) => {
    if (!editText.trim()) return;
    const updated = localReplies.map(rep => {
      if (rep.id === replyId) {
        return { ...rep, text: editText.trim() };
      }
      return rep;
    });

    setLocalReplies(updated);
    setEditingId(null);
    onUpdateStoryList(story.id, { replies: updated });
    await dataService.updateStory(story.id, { replies: updated });
  };

  const handleInsertEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  // Quick action selector for reply threads
  const handleTriggerReply = (rep: StoryReply) => {
    // If we reply to a nested reply, align it to the original parent comment
    const finalParent = rep.parentId ? stories.find(s=>s.id === storyId)?.replies?.find(r=>r.id === rep.parentId) || rep : rep;
    setReplyingTo(finalParent);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-xs flex flex-col justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-h-[75%] bg-neutral-950 text-white border-t border-white/10 rounded-t-[32px] overflow-hidden flex flex-col cursor-normal pointer-events-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TikTok Style Header */}
        <header className="px-5 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur-md z-10 text-left">
          <div>
            <h5 className="font-black text-xs text-white uppercase tracking-widest block">Commentaires</h5>
            <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest">{localReplies.length} discussion{localReplies.length > 1 ? 's' : ''}</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 bg-neutral-900 hover:bg-neutral-850 rounded-full text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Dynamic scroll view of the messages thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 max-h-[380px] text-left scrollbar-thin scrollbar-thumb-neutral-800">
          {parentReplies.length === 0 ? (
            <div className="text-center py-14">
              <MessageSquare className="w-10 h-10 text-neutral-700 mx-auto mb-3 animate-pulse" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Aucun commentaire rédigé</p>
              <p className="text-[8px] text-neutral-500 font-bold uppercase mt-1.5">Soyez le premier à réagir à cette vidéo !</p>
            </div>
          ) : (
            parentReplies.map(rep => {
              const itemChildren = childReplies.filter(c => c.parentId === rep.id);
              const hasLiked = rep.likes?.includes(user.id);

              return (
                <div key={rep.id} className="space-y-4">
                  {/* Parent comment item */}
                  <div className="flex gap-3 items-start group select-text">
                    <img 
                      src={rep.senderAvatar} 
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[10px] text-neutral-200 uppercase tracking-tight">{rep.senderName}</span>
                        <span className="text-[8px] text-neutral-500 font-bold uppercase">{getRelativeTime(rep.timestamp)}</span>
                      </div>
                      
                      {/* Live edit or display content text */}
                      {editingId === rep.id ? (
                        <div className="space-y-1.5 mt-1.5 w-full">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500 font-sans"
                            rows={2}
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 rounded-lg text-[8px] font-black uppercase tracking-wider"
                            >
                              Annuler
                            </button>
                            <button 
                              onClick={() => handleUpdateComment(rep.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-[8px] font-black uppercase tracking-wider"
                            >
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-200 mt-1 leading-relaxed">{rep.text}</p>
                      )}

                      {/* Small inline controls bar */}
                      <div className="flex items-center gap-3.5 mt-2 select-none">
                        <button 
                          onClick={() => handleTriggerReply(rep)}
                          className="text-[9px] text-neutral-500 hover:text-white font-extrabold uppercase transition-colors"
                        >
                          Répondre
                        </button>
                        {user.isLoggedIn && rep.senderId === user.id && (
                          <>
                            <button 
                              onClick={() => handleStartEdit(rep)}
                              className="text-[9px] text-neutral-500 hover:text-neutral-300 font-extrabold uppercase transition-colors"
                            >
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(rep.id)}
                              className="text-[9px] text-rose-500 hover:text-rose-400 font-extrabold uppercase transition-colors flex items-center gap-1"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Like comment button layout */}
                    <div className="flex flex-col items-center shrink-0">
                      <button 
                        onClick={() => handleLikeComment(rep.id)}
                        className="p-1 hover:scale-110 active:scale-95 transition-all text-neutral-400 hover:text-rose-500"
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'}`} />
                      </button>
                      <span className="text-[8px] font-extrabold text-neutral-500 mt-0.5">{rep.likes?.length || 0}</span>
                    </div>
                  </div>

                  {/* Indented nested child replies */}
                  {itemChildren.length > 0 && (
                    <div className="pl-9 mt-2 space-y-4 border-l-2 border-white/5 ml-4.5">
                      {itemChildren.map(child => {
                        const childHasLiked = child.likes?.includes(user.id);

                        return (
                          <div key={child.id} className="flex gap-3 items-start group select-text">
                            <img 
                              src={child.senderAvatar} 
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10" 
                              referrerPolicy="no-referrer" 
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[10px] text-neutral-300 uppercase tracking-tight">{child.senderName}</span>
                                <span className="text-[8px] text-neutral-550 text-neutral-500 font-bold uppercase">{getRelativeTime(child.timestamp)}</span>
                              </div>
                              
                              {/* Display child description or live editor */}
                              {editingId === child.id ? (
                                <div className="space-y-1.5 mt-1.5 w-full">
                                  <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500 font-sans"
                                    rows={2}
                                  />
                                  <div className="flex gap-1.5 justify-end">
                                    <button 
                                      onClick={() => setEditingId(null)}
                                      className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-450 text-neutral-400 rounded-lg text-[8px] font-black uppercase tracking-wider"
                                    >
                                      Annuler
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateComment(child.id)}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-[8px] font-black uppercase tracking-wider"
                                    >
                                      Enregistrer
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                                  <span className="text-indigo-400 text-[10px] font-extrabold mr-1">@{rep.senderName}</span>
                                  {child.text}
                                </p>
                              )}

                              {/* Small child interaction bar */}
                              <div className="flex items-center gap-3.5 mt-2 select-none">
                                <button 
                                  onClick={() => handleTriggerReply(rep)}
                                  className="text-[9px] text-neutral-500 hover:text-white font-extrabold uppercase transition-colors"
                                >
                                  Répondre
                                </button>
                                {user.isLoggedIn && child.senderId === user.id && (
                                  <>
                                    <button 
                                      onClick={() => handleStartEdit(child)}
                                      className="text-[9px] text-neutral-550 text-neutral-500 hover:text-neutral-300 font-extrabold uppercase transition-colors"
                                    >
                                      Modifier
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteComment(child.id)}
                                      className="text-[9px] text-rose-500 hover:text-rose-450 font-extrabold uppercase transition-colors flex items-center gap-1"
                                    >
                                      Supprimer
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Like comment button layout for child */}
                            <div className="flex flex-col items-center shrink-0">
                              <button 
                                onClick={() => handleLikeComment(child.id)}
                                className="p-1 hover:scale-110 active:scale-95 transition-all text-neutral-400 hover:text-rose-500"
                              >
                                <Heart className={`w-3.5 h-3.5 ${childHasLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-450'}`} />
                              </button>
                              <span className="text-[8px] font-extrabold text-neutral-500 mt-0.5">{child.likes?.length || 0}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Reply To banner bar indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-900 border-t border-white/5 text-[10px] font-bold text-neutral-400 select-none">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 font-bold" />
              Réponse à <span className="text-white font-black">@{replyingTo.senderName}</span>
            </span>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:text-white transition-colors text-neutral-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Emojis selection board list */}
        <div className="flex gap-3 overflow-x-auto py-2.5 px-5 bg-neutral-900 border-t border-white/5 select-none scrollbar-none shrink-0 scroll-behavior-smooth">
          {["🔥", "❤️", "👏", "🙌", "😍", "😂", "😢", "👑", "💯", "🚀"].map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleInsertEmoji(emoji)}
              className="text-base p-1 hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Text Form Submission */}
        <div className="p-4 bg-neutral-950 border-t border-white/5 sticky bottom-0 z-10">
          {user.isLoggedIn ? (
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input 
                type="text" 
                placeholder={replyingTo ? `Répondre à @${replyingTo.senderName}...` : "Ajouter un commentaire..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={400}
                className="flex-1 bg-neutral-900 rounded-2xl text-[11px] font-bold px-4 py-3 border border-white/5 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none text-white font-sans"
              />
              <button 
                type="submit"
                disabled={!commentText.trim()}
                className="w-10 h-10 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:scale-100 transition-all shadow-md shadow-indigo-650/15 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="py-2 text-center">
              <p className="text-[10px] font-black text-rose-450 uppercase tracking-widest">
                Connexion requise
              </p>
              <p className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                Veuillez vous connecter sur votre profil pour pouvoir commenter
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
