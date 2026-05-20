import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Image, Film, FileText, Smile, ShoppingBag, 
  HelpCircle, Upload, Check, Loader, Play, Sparkles, ExternalLink 
} from 'lucide-react';
import { Product, Shop, Story } from '../types';
import { uploadImageToStorage } from '../lib/storageService';

interface CreateStoryModalProps {
  onClose: () => void;
  onSave: (storyData: Omit<Story, 'id' | 'userId' | 'userName' | 'userAvatar' | 'timestamp'>) => Promise<void>;
  products: Product[];
  shops: Shop[];
  isShortVideoMode?: boolean; // If true, builds a TikTok style short video clip. Otherwise a standard 24h story
}

const POPULAR_EMOJIS = ['🔥', '✨', '💎', '🎉', '🌟', '👀', '❤️', '🙌', '🚀', '💯', '🛒', '📦'];

export default function CreateStoryModal({ onClose, onSave, products, shops, isShortVideoMode = false }: CreateStoryModalProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(isShortVideoMode ? 'video' : null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('');
  const [productLink, setProductLink] = useState('');
  const [shopLink, setShopLink] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    
    if (isShortVideoMode && type !== 'video') {
      setError("Le flux de Vidéos TikTok supporte uniquement les formats vidéos (.mp4, .mov).");
      return;
    }

    // Check file size limit (limit compression or warn)
    if (file.size > 20 * 1024 * 1024) { // 20MB max for video
      setError("La vidéo ou l'image est trop volumineuse (Max 20 Mo).");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setMediaSrc(reader.result as string);
      setMediaType(type);
      setLoading(false);
      setPreviewOpen(true);
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const executePublish = async () => {
    if (!mediaSrc || !mediaType) return;
    setLoading(true);
    setError(null);

    try {
      const fileName = `story_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
      let finalUrl = mediaSrc;

      if (mediaSrc.startsWith('data:')) {
        finalUrl = await uploadImageToStorage(mediaSrc, 'stories', fileName);
      }

      await onSave({
        mediaUrl: finalUrl,
        type: mediaType,
        text: text.trim() || undefined,
        emoji: emoji || undefined,
        productLink: productLink || undefined,
        shopLink: shopLink || undefined,
        views: [],
        likes: [],
        replies: [],
        isShortVideo: isShortVideoMode
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Échec de la publication. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === productLink);
  const selectedShop = shops.find(s => s.id === shopLink);

  return (
    <div className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[90vh] md:h-[80vh] border border-gray-100"
      >
        {/* Header */}
        <header className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin-slow text-indigo-500" />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-950 uppercase tracking-tighter">
                {isShortVideoMode ? 'Publier une Vidéo Marketing' : 'Créer une Story'}
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                {isShortVideoMode ? 'Flux TikTok / Reels de LANDRO' : 'Story Express 24 Heures'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-950 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-650 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center border border-red-100">
              {error}
            </div>
          )}

          {/* Media Picker */}
          {!mediaSrc ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-150 hover:border-indigo-500 transition-colors rounded-[32px] p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col items-center justify-center h-52 group relative"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept={isShortVideoMode ? "video/*" : "image/*,video/*"} 
                className="hidden" 
              />
              <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors mb-4 border border-gray-100">
                <Upload className="w-6 h-6 animate-pulse" />
              </div>
              <p className="font-extrabold text-xs text-gray-950 uppercase tracking-tight">
                {isShortVideoMode ? 'Importer une Vidéo (.mp4)' : 'Importer Photo ou Vidéo'}
              </p>
              <p className="text-[10px] text-gray-400 font-extrabold tracking-wider mt-1.5 uppercase">
                {isShortVideoMode ? 'Vidéo produits ou boutique certifiée' : 'Galerie ou Caméra Téléphone'}
              </p>
            </div>
          ) : (
            /* Media Preview Box */
            <div className="relative rounded-[32px] overflow-hidden bg-gray-900 aspect-video md:aspect-[4/3] flex items-center justify-center shadow-lg border border-gray-200">
              {mediaType === 'image' ? (
                <img src={mediaSrc} className="w-full h-full object-cover" />
              ) : (
                <div className="relative w-full h-full">
                  <video src={mediaSrc} className="w-full h-full object-cover" controls playsInline />
                </div>
              )}
              
              {/* Overlays previewed on media */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  {emoji && (
                    <span className="text-4xl animate-bounce">{emoji}</span>
                  )}
                  <span className="text-[9px] font-black text-white/50 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase tracking-wider">Aperçu direct</span>
                </div>

                <div className="space-y-2">
                  {text && (
                    <p className="text-white text-base font-black tracking-tight drop-shadow-md text-center max-w-xs mx-auto">
                      {text}
                    </p>
                  )}
                  {(productLink || shopLink) && (
                    <div className="flex gap-2 justify-center">
                      {selectedProduct && (
                        <span className="bg-blue-600 text-white font-black text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <ShoppingBag className="w-3 h-3" />
                          {selectedProduct.name} - {selectedProduct.price}F
                        </span>
                      )}
                      {selectedShop && !selectedProduct && (
                        <span className="bg-indigo-600 text-white font-black text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <ExternalLink className="w-3 h-3" />
                          Visiter Boutique {selectedShop.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Media Button */}
              <button 
                onClick={() => {
                  setMediaSrc(null);
                  setMediaType(isShortVideoMode ? 'video' : null);
                }}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Story Modifiers */}
          <div className="space-y-4">
            {/* Text Overlay Input */}
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                {isShortVideoMode ? 'Description marketing de la Vidéo' : 'Message écrit sur la Story'}
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  maxLength={120}
                  placeholder={isShortVideoMode ? "Décrivez votre vidéo, offre spéciale ou marque..." : "Écrivez un court texte accrocheur..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold text-gray-950 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Quick Emoji Picker */}
            {!isShortVideoMode && (
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Choisir un émoji flottant</label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => setEmoji(emoji === em ? '' : em)}
                      type="button"
                      className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all ${emoji === em ? 'bg-indigo-50 border-2 border-indigo-500 scale-110' : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shoppable Attachments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Attach a product */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Attacher un Produit de la boutique</label>
                <div className="relative">
                  <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={productLink}
                    onChange={(e) => {
                      setProductLink(e.target.value);
                      if (e.target.value) {
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod && (prod as any).shopId) {
                          setShopLink((prod as any).shopId);
                        }
                      }
                    }}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold text-gray-950 outline-none appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Aucun produit lié</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price} F)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attach a Shop Profile */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 font-bold">Lien Vers une Boutique</label>
                <div className="relative">
                  <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={shopLink}
                    onChange={(e) => setShopLink(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-bold text-gray-950 outline-none appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Aucune boutique liée</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <footer className="p-6 bg-slate-50 border-t border-gray-100 flex gap-4 shrink-0 font-sans">
          <button 
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-2xl text-[10px] font-black tracking-widest uppercase active:scale-95 transition-all text-center"
          >
            Annuler
          </button>
          <button 
            type="button"
            disabled={loading || !mediaSrc}
            onClick={executePublish}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase active:scale-95 transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isShortVideoMode ? 'Publier la Vidéo' : 'Publier Story'}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
