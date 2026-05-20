import { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, Check, X, Maximize2, 
  Flame, Sparkles, Award, Bookmark, Copy, ExternalLink, Send, Edit3, Trash2
} from 'lucide-react';
import { Post } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import CommentSection from './CommentSection';

interface FeedItemProps {
  post: Post;
  key?: string;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (id: string) => void;
}

export default function FeedItem({ post, onEditPost, onDeletePost }: FeedItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.isFollowing);
  const [showFullText, setShowFullText] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load saved state on start
  useEffect(() => {
    const saved = localStorage.getItem(`saved_post_${post.id}`);
    if (saved) {
      setIsSaved(true);
    }
  }, [post.id]);

  const handleLike = (e: React.MouseEvent) => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    if (nextLiked) {
      // Trigger premium burst micro-particles 
      const newBurst = {
        id: Date.now(),
        x: e.clientX ? e.nativeEvent.offsetX : 20,
        y: e.clientY ? e.nativeEvent.offsetY : -20
      };
      setBursts(prev => [...prev, newBurst]);
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== newBurst.id));
      }, 1000);
    }
  };

  const handleSave = () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    if (nextSaved) {
      localStorage.setItem(`saved_post_${post.id}`, 'true');
    } else {
      localStorage.removeItem(`saved_post_${post.id}`);
    }
  };

  const handleCopyLink = () => {
    const link = `https://landro.digital/post/${post.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(err => {
      console.error('Could not copy:', err);
    });
  };

  const shareOnWhatsApp = () => {
    const text = `Découvrez cette publication de ${post.author} sur LANDRO DIGITAL : "${post.content.substring(0, 60)}..." https://landro.digital/post/${post.id}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowShareSheet(false);
  };

  const truncatedContent = post.content.length > 150 
    ? post.content.substring(0, 150) + "..." 
    : post.content;

  // Modern feed scoring badges
  const isTrending = post.likes + post.commentsCount > 30;
  const isNewPost = post.timestamp.includes('À l\'instant') || post.timestamp.includes('min') || post.timestamp.includes('heure');
  const isPremiumPost = post.author.toLowerCase().includes('digital') || post.author.toLowerCase().includes('landro') || post.likes > 20;

  return (
    <div className="bg-white border-b border-gray-100 mb-2 last:border-b-0 overflow-hidden relative">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img 
            src={post.avatar} 
            alt={post.author} 
            className="w-11 h-11 rounded-full border border-gray-100 object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-gray-900 leading-tight">{post.author}</h3>
              
              {/* Intelligent dynamic badges */}
              {isTrending && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest border border-amber-100 animate-pulse">
                  <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  🔥 Tendance
                </span>
              )}

              {isNewPost && !isTrending && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                  ✨ Nouveau
                </span>
              )}

              {isPremiumPost && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
                  <Award className="w-2.5 h-2.5 text-indigo-500" />
                  ⭐ Premium
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{post.timestamp}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFollowing && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFollowing(true)}
              className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black transition-all"
            >
              Suivre
            </motion.button>
          )}
          {isFollowing && (
             <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFollowing(false)}
              className="px-4 py-1.5 border border-gray-100 text-gray-400 rounded-full text-xs font-black flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-green-500" />
              Suivi
             </motion.button>
          )}
          <button 
            onClick={() => setShowShareSheet(true)}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
          {showFullText ? post.content : truncatedContent}
          {post.content.length > 150 && !showFullText && (
            <button 
              onClick={() => setShowFullText(true)}
              className="text-blue-600 font-bold ml-1 hover:underline"
            >
              Voir plus
            </button>
          )}
        </p>
      </div>

      {/* Post Image with Fluid Full Screen and Hover Maximize Trigger */}
      {post.image && (
        <div className="relative aspect-square w-full bg-gray-50 overflow-hidden group cursor-pointer" onClick={() => setShowFullImage(true)}>
          <motion.img 
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            src={post.image} 
            alt="Post asset" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="p-3 bg-white/80 backdrop-blur-md rounded-2xl flex items-center gap-2 shadow-xl border border-white/50">
               <Maximize2 className="w-5 h-5 text-gray-900 animate-pulse" />
               <span className="text-xs font-black uppercase tracking-widest text-gray-950">Agrandir</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactions */}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 relative">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className="group flex items-center gap-1 relative border-0 outline-0 select-none bg-transparent"
            >
              {/* Popping micro hearts burst */}
              <AnimatePresence>
                {bursts.map(b => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 1, scale: 0.5, y: -10, x: 0 }}
                    animate={{ opacity: 0, scale: 1.5, y: -60, x: (Math.random() - 0.5) * 40 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute pointer-events-none z-10 text-red-500"
                    style={{ left: b.x - 10, top: b.y - 45 }}
                  >
                    <Heart className="w-5 h-5 fill-red-500" />
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className={`p-2 rounded-full transition-all ${isLiked ? 'bg-red-50' : 'group-hover:bg-red-50'}`}>
                <motion.div
                  animate={isLiked ? { scale: [1, 1.4, 0.9, 1.2, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} />
                </motion.div>
              </div>
              <span className={`text-[13px] font-black tracking-tight ${isLiked ? 'text-red-500 font-extrabold' : 'text-gray-500'}`}>
                {post.likes + (isLiked ? 1 : 0)} <span className="hidden sm:inline">Likes</span>
              </span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="group flex items-center gap-1 focus:outline-none"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-all">
                <MessageCircle className={`w-6 h-6 transition-colors ${showComments ? 'text-blue-600 fill-blue-50/20' : 'text-gray-400 group-hover:text-blue-600'}`} />
              </div>
              <span className={`text-[13px] font-black tracking-tight ${showComments ? 'text-blue-600 font-extrabold' : 'text-gray-500'}`}>
                {post.commentsCount} <span className="hidden sm:inline">Commentaires</span>
              </span>
            </button>
            <button 
              onClick={() => setShowShareSheet(true)}
              className="group flex items-center gap-1 focus:outline-none"
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 transition-all">
                <Share2 className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <span className="text-[13px] font-black tracking-tight text-gray-500">
                {post.shares} <span className="hidden sm:inline">Partages</span>
              </span>
            </button>
          </div>

          <button 
            onClick={handleSave}
            className={`p-2 rounded-full transition-all focus:outline-none ${isSaved ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-400 hover:text-indigo-500'}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-indigo-600' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {(showComments || post.comments.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <CommentSection comments={post.comments} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full screen image viewer with beautiful entry & exit transitions */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[300] flex flex-col justify-between p-4 select-none backdrop-blur-md"
            onClick={() => setShowFullImage(false)}
          >
            <header className="flex justify-between items-center w-full z-10 pt-safe">
              <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md py-2 px-4 rounded-full border border-white/5">
                <img src={post.avatar} className="w-6 h-6 rounded-full border border-white/20 object-cover" />
                <span className="text-white text-xs font-black">{post.author}</span>
              </div>
              <button 
                onClick={() => setShowFullImage(false)} 
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
              <motion.img 
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                src={post.image} 
                alt="Full preview"
                className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl border border-white/5"
                onClick={(e) => e.stopPropagation()}
                referrerPolicy="no-referrer"
              />
            </div>

            <footer className="text-center text-[10px] text-white/40 uppercase tracking-[0.2em] pb-safe">
              Appuyez n'importe où pour fermer en toute sécurité
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engagement actionsheet menu (WhatsApp sharing, copying link, saving publication) */}
      <AnimatePresence>
        {showShareSheet && (
          <div className="fixed inset-0 z-[400] flex items-end justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareSheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] overflow-hidden p-6 shadow-2xl flex flex-col gap-4 border-t border-gray-100 pb-10"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Options de partage</h4>
                <button 
                  onClick={() => setShowShareSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-2">
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {copyFeedback ? <Check className="w-5 h-5 text-green-500 animate-bounce" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                      {copyFeedback ? "Lien Copié !" : "Copier le lien"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">Générer un lien de partage sécurisé</p>
                  </div>
                </button>

                <button 
                  onClick={shareOnWhatsApp}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Partager sur WhatsApp</p>
                    <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">Envoyer directement à vos contacts</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    handleSave();
                    setShowShareSheet(false);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSaved ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                      {isSaved ? "Désenregistrer" : "Mettre de côté"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">Conserver dans vos favoris Landro</p>
                  </div>
                </button>

                {/* MODIFICATION / SUPPRESSION SECURISÉE POUR ADMIN OU AUTEUR */}
                {(onEditPost || onDeletePost) && (
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">ZONE D'ADMINISTRATION SECURISEE</p>
                    <div className="grid grid-cols-2 gap-3">
                      {onEditPost && (
                        <button 
                          onClick={() => {
                            setShowShareSheet(false);
                            onEditPost(post);
                          }}
                          className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                        >
                          <Edit3 className="w-4 h-4" />
                          Modifier
                        </button>
                      )}
                      {onDeletePost && (
                        <button 
                          onClick={() => {
                            setShowShareSheet(false);
                            onDeletePost(post.id);
                          }}
                          className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
