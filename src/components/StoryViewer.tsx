import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, Send, Eye, Share2, Volume2, VolumeX, MessageCircle, 
  ExternalLink, ShoppingBag, Store, ChevronLeft, ChevronRight, CornerDownRight 
} from 'lucide-react';
import { Story, User, Shop, Product, StoryReply } from '../types';
import { dataService } from '../lib/dataService';
import { notificationManager } from '../lib/notificationManager';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  currentUser: User;
  shops: Shop[];
  products: Product[];
  onUpdateStoryList?: (id: string, updatedFields: Partial<Story>) => void;
}

export default function StoryViewer({ 
  stories, 
  initialIndex, 
  onClose, 
  currentUser,
  shops,
  products,
  onUpdateStoryList
}: StoryViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5000); // default 5s
  
  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<any>(null);

  const currentStory = stories[index];

  // Auto-record user view
  useEffect(() => {
    if (!currentStory || !currentUser.isLoggedIn) return;

    const views = currentStory.views || [];
    if (!views.includes(currentUser.id)) {
      const updatedViews = [...views, currentUser.id];
      // Update database
      dataService.updateStory(currentStory.id, { views: updatedViews });
      // Update state locally
      if (onUpdateStoryList) {
        onUpdateStoryList(currentStory.id, { views: updatedViews });
      }
    }
  }, [index, currentStory?.id, currentUser.id, currentUser.isLoggedIn]);

  // Video Duration setup
  const handleVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration * 1000;
    setVideoDuration(duration > 0 ? duration : 5000);
    setProgress(0);
  };

  // Main Progression Timer
  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalTime = 40; // update scale rate
    const step = (intervalTime / (currentStory.type === 'video' ? videoDuration : 5000)) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [index, isPaused, videoDuration, currentStory.type]);

  const handleNext = () => {
    setProgress(0);
    if (index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (index > 0) {
      setIndex(index - 1);
    } else {
      // Just cycle or stay
      setIndex(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, stories.length]);

  // Pause video if screen paused
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  // Actions
  const handleLikeToggle = async () => {
    if (!currentUser.isLoggedIn) {
      alert("Veuillez vous connecter pour aimer cette story.");
      return;
    }

    const likes = currentStory.likes || [];
    const isLiked = likes.includes(currentUser.id);
    let updatedLikes = [];

    if (isLiked) {
      updatedLikes = likes.filter(id => id !== currentUser.id);
    } else {
      updatedLikes = [...likes, currentUser.id];
      // Notify creator
      if (currentStory.userId !== currentUser.id) {
        notificationManager.notify(
          'like', 
          currentUser.name, 
          "a aimé votre story ! 🔥", 
          currentUser.avatar
        );
      }
    }

    // Persist
    await dataService.updateStory(currentStory.id, { likes: updatedLikes });
    // Update State
    if (onUpdateStoryList) {
      onUpdateStoryList(currentStory.id, { likes: updatedLikes });
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isLoggedIn) {
      alert("Veuillez vous connecter pour répondre à cette story.");
      return;
    }
    if (!replyText.trim()) return;

    const replies = currentStory.replies || [];
    const newReply: StoryReply = {
      id: `rep_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedReplies = [...replies, newReply];
    
    // Persist to DB
    await dataService.updateStory(currentStory.id, { replies: updatedReplies });
    
    // Update local state
    if (onUpdateStoryList) {
      onUpdateStoryList(currentStory.id, { replies: updatedReplies });
    }

    // Notify creator
    if (currentStory.userId !== currentUser.id) {
      notificationManager.notify(
        'reply',
        currentUser.name,
        `a répondu à votre story : "${replyText.trim()}" 💬`,
        currentUser.avatar
      );
    }

    setReplyText('');
    setIsPaused(false);
  };

  const handleShareStory = () => {
    // Copy a simulated share link to clipboard
    const simUrl = `${window.location.origin}/stories/${currentStory.id}`;
    navigator.clipboard.writeText(simUrl);
    alert("Lien de la story copié dans le presse-papiers ! Partagez-le avec vos proches.");
  };

  // Find linked objects
  const linkedProduct = products.find(p => p.id === currentStory.productLink);
  const linkedShop = shops.find(s => s.id === currentStory.shopLink || s.id === currentStory.userId);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 60;
    const isRightSwipe = distance < -60;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[250] bg-black/95 flex flex-col items-center justify-center backdrop-blur-lg"
    >
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-sm h-[100dvh] md:h-[85vh] bg-neutral-950 overflow-hidden flex flex-col justify-between shadow-2xl md:rounded-[44px] md:border border-white/10"
      >
        {/* Dynamic Top Progression Indicator */}
        <div className="absolute top-4 left-4 right-4 z-40 flex gap-1.5 touch-none">
          {stories.map((st, i) => (
            <div key={st.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{ 
                  width: `${i === index ? progress : (i < index ? 100 : 0)}%` 
                }}
              />
            </div>
          ))}
        </div>

        {/* Floating Controls Header */}
        <div className="absolute top-8 left-4 right-4 z-40 flex items-center justify-between touch-none">
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xs p-1.5 rounded-2xl">
            <img 
              src={currentStory.userAvatar} 
              className="w-10 h-10 rounded-[15px] object-cover border border-white/20" 
              referrerPolicy="no-referrer" 
            />
            <div className="text-left min-w-0">
              <h4 className="text-white font-black text-xs tracking-tight uppercase truncate max-w-32">{currentStory.userName}</h4>
              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest block leading-none mt-1">
                {new Date(currentStory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {linkedShop && (
              <span className="bg-green-500 font-black text-[7px] text-white px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
                Merchand
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {currentStory.type === 'video' && (
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                title="Son"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
              </button>
            )}

            <button 
              onClick={onClose} 
              className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Background Render (Plays & Toggles Progress on Tap/Hold) */}
        <div 
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="relative flex-1 flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {currentStory.type === 'image' ? (
            <img 
              src={currentStory.mediaUrl} 
              className="w-full h-full object-cover select-none pointer-events-none" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <video 
              ref={videoRef}
              src={currentStory.mediaUrl} 
              onLoadedMetadata={handleVideoLoaded}
              className="w-full h-full object-cover select-none pointer-events-none"
              autoPlay
              playsInline
              muted={isMuted}
              loop={false}
              onEnded={handleNext}
            />
          )}

          {/* Immersive Dark Overlay with Floating Texts & Emoji tags */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/45 pointer-events-none flex flex-col justify-end p-6 pb-20">
            {currentStory.emoji && (
              <div className="absolute top-24 right-5 animate-bounce-slow text-5xl">
                {currentStory.emoji}
              </div>
            )}

            <div className="space-y-4 max-w-full">
              {/* Custom Written Text */}
              {currentStory.text && (
                <p className="text-white text-lg font-black tracking-tight leading-tight uppercase drop-shadow-lg text-center break-words max-h-36 overflow-y-auto no-scrollbar">
                  "{currentStory.text}"
                </p>
              )}

              {/* Linked Product Attachment Button */}
              {linkedProduct && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/50 pointer-events-auto hover:bg-white select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={linkedProduct.image} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[11px] text-gray-900 truncate leading-none mb-1 uppercase tracking-tight">{linkedProduct.name}</p>
                      <p className="font-black text-xs text-indigo-600 leading-none">{linkedProduct.price.toLocaleString()} F</p>
                    </div>
                  </div>
                  <a 
                    href={`#shop-${linkedProduct.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      // Scroll or direct to product details via hash
                      window.location.hash = `product-${linkedProduct.id}`;
                    }}
                    className="ml-3 shrink-0 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                  >
                    ACHETER
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </a>
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick Click navigation areas (hidden overlay buttons) */}
          <div className="absolute inset-0 z-30 flex justify-between pointer-events-none">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-14 h-full pointer-events-auto outline-none focus:outline-none"
            />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-14 h-full pointer-events-auto outline-none focus:outline-none"
            />
          </div>
        </div>

        {/* Stories Right Interactions Panel (Likes, Views, Shares) */}
        <div className="absolute right-3.5 bottom-24 z-40 flex flex-col gap-3.5 touch-none">
          {/* Likes Button */}
          <button 
            onClick={handleLikeToggle}
            className="flex flex-col items-center gap-1 group text-white pointer-events-auto"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${currentStory.likes?.includes(currentUser.id) ? 'bg-red-500 text-white' : 'bg-black/40 backdrop-blur-md text-white border border-white/15'}`}>
              <Heart className={`w-5 h-5 ${currentStory.likes?.includes(currentUser.id) ? 'fill-white animate-pulse' : 'group-hover:scale-110'}`} />
            </div>
            <span className="text-[10px] font-black tracking-tight">{currentStory.likes?.length || 0}</span>
          </button>

          {/* Views stats (Owners see, otherwise visible as count) */}
          <button 
            onClick={() => {
              if (currentStory.userId === currentUser.id && currentStory.views && currentStory.views.length > 0) {
                setIsPaused(true);
                setShowViewsModal(true);
              }
            }}
            className="flex flex-col items-center gap-1 text-white pointer-events-auto"
          >
            <div className={`w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md text-white border border-white/15 flex items-center justify-center hover:bg-black/60`}>
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black tracking-tight">{currentStory.views?.length || 0}</span>
          </button>

          {/* Comment thread button */}
          <button 
            onClick={() => {
              setIsPaused(true);
              setShowRepliesModal(true);
            }}
            className="flex flex-col items-center gap-1 text-white pointer-events-auto"
          >
            <div className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md text-white border border-white/15 flex items-center justify-center hover:bg-black/60">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black tracking-tight">{currentStory.replies?.length || 0}</span>
          </button>

          {/* Share button */}
          <button 
            onClick={handleShareStory}
            className="flex flex-col items-center text-white pointer-events-auto"
            title="Partager"
          >
            <div className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md text-white border border-white/15 flex items-center justify-center hover:bg-black/60">
              <Share2 className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Bottom Reply Interface Overlay */}
        <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-40 touch-none flex gap-2">
          {currentUser.isLoggedIn ? (
            <form onSubmit={handleSendReply} className="flex-1 flex gap-2 pointer-events-auto">
              <input 
                type="text" 
                placeholder="Répondre en public..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => {
                  if (replyText.length === 0) setIsPaused(false);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[11px] font-bold px-4 py-3 border border-white/10 focus:outline-none focus:bg-white/15 focus:border-white/30 tracking-tight"
              />
              <button 
                type="submit"
                className="p-3 bg-white text-gray-950 rounded-2xl active:scale-95 transition-all"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </form>
          ) : (
            <p className="text-[10px] font-bold text-white/50 text-center uppercase tracking-wider py-2 w-full">
              Connectez-vous pour réagir et commenter
            </p>
          )}
        </div>

        {/* MODAL / DRAWER FOR COMMENT THREAD (REPLIES) */}
        <AnimatePresence>
          {showRepliesModal && (
            <motion.div 
              initial={{ opacity: 0, y: '100dvh' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100dvh' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="absolute inset-x-0 bottom-0 max-h-[70%] bg-white rounded-t-[36px] z-50 overflow-hidden flex flex-col pointer-events-auto text-left shadow-2xl"
            >
              <header className="p-5 border-b border-gray-150 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h5 className="font-black text-xs text-gray-950 uppercase tracking-widest block">Réponses de Story</h5>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{currentStory.replies?.length || 0} commentaires</span>
                </div>
                <button 
                  onClick={() => {
                    setShowRepliesModal(false);
                    setIsPaused(false);
                  }}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-64 no-scrollbar">
                {(!currentStory.replies || currentStory.replies.length === 0) ? (
                  <div className="text-center py-10">
                    <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aucune réponse pour l'instant</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Soyez le premier à réagir !</p>
                  </div>
                ) : (
                  currentStory.replies.map(rep => (
                    <div key={rep.id} className="flex gap-3 items-start p-3 hover:bg-gray-50 rounded-2xl border border-gray-100/50 transition-all">
                      <img src={rep.senderAvatar} className="w-8 h-8 rounded-xl object-cover shrink-0 border border-gray-100" referrerPolicy="no-referrer" />
                      <div className="bg-gray-100/40 p-2.5 rounded-2xl flex-1 max-w-[80%]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-extrabold text-[10px] text-gray-950 truncate max-w-28 uppercase">{rep.senderName}</span>
                          <span className="text-[8px] text-gray-400 font-bold uppercase">{rep.timestamp}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 leading-tight leading-relaxed select-text">{rep.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Thread direct sender form */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 sticky bottom-0">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Écrire un commentaire..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-white rounded-xl text-xs font-bold px-4 py-3.5 border border-gray-150 focus:border-indigo-500 focus:outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL / DRAWER FOR STORY VIEWS LIST */}
        <AnimatePresence>
          {showViewsModal && (
            <motion.div 
              initial={{ opacity: 0, y: '100dvh' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100dvh' }}
              className="absolute inset-x-0 bottom-0 max-h-[60%] bg-white rounded-t-[36px] z-50 overflow-hidden flex flex-col pointer-events-auto text-left shadow-2xl"
            >
              <header className="p-5 border-b border-gray-150 flex items-center justify-between">
                <div>
                  <h5 className="font-black text-xs text-gray-950 uppercase tracking-widest">Spectateurs de Story</h5>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Uniquement visible par vous</span>
                </div>
                <button 
                  onClick={() => {
                    setShowViewsModal(false);
                    setIsPaused(false);
                  }}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-56 no-scrollbar">
                {currentStory.views?.map(userId => {
                  const viewUser = shops.find(sh => sh.id === userId) || { name: `Utilisateur ${userId.substring(0, 4)}`, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer' };
                  return (
                    <div key={userId} className="flex items-center gap-3 p-2 bg-gray-50/70 rounded-xl">
                      <img src={(viewUser as any).avatar} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="font-black text-xs text-gray-950 uppercase tracking-tight">{viewUser.name}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Left/Right desktop icons */}
      <div className="absolute inset-y-1/2 left-32 hidden lg:flex">
         <button onClick={handlePrev} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-4 border border-white/20 active:scale-95 transition-all">
            <ChevronLeft className="w-6 h-6" />
         </button>
      </div>
      <div className="absolute inset-y-1/2 right-32 hidden lg:flex">
         <button onClick={handleNext} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-4 border border-white/20 active:scale-95 transition-all">
            <ChevronRight className="w-6 h-6" />
         </button>
      </div>
    </motion.div>
  );
}
