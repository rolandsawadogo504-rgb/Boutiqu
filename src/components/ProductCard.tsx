import { ShoppingCart, Share2, Eye, Heart, MessageCircle, X, ExternalLink, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { useState } from 'react';
import PaymentModal from './PaymentModal';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  product: Product;
  key?: string;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export default function ProductCard({ product, onEditProduct, onDeleteProduct }: ProductCardProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(product.price).replace('XOF', 'FCFA');

  const handleWhatsApp = () => {
    const message = `Bonjour, je suis intéressé par votre produit : ${product.name} (${formattedPrice})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-xl h-full flex flex-col group relative">
        <div className="aspect-[4/5] overflow-hidden relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={() => setShowQuickView(true)}
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-xl border border-white/50">
              {product.category}
            </span>
          </div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-2xl backdrop-blur-md transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-900 shadow-lg hover:bg-white'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => setShowQuickView(true)}
              className="p-3 rounded-2xl bg-white/80 backdrop-blur-md text-gray-900 shadow-lg hover:bg-white transition-all active:scale-95"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/20">
             <div className="flex items-center gap-2 text-white">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-bold">{product.views >= 1000 ? `${(product.views/1000).toFixed(1)}k` : product.views}</span>
             </div>
             <div className="flex items-center gap-2 text-white">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-bold">{isLiked ? product.likes + 1 : product.likes}</span>
             </div>
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-1 gap-5">
          <div className="space-y-1">
            <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
            <p className="text-blue-600 font-black text-xl tracking-tight">{formattedPrice}</p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {product.tags.map(t => (
                  <span key={t} className="text-[9px] font-black uppercase tracking-wider text-blue-500 bg-blue-50/70 border border-blue-105/30 px-2 py-0.5 rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-auto grid grid-cols-5 gap-2">
            <button 
              onClick={() => setShowPayment(true)}
              className="col-span-3 bg-gray-900 text-white py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg hover:shadow-gray-200"
            >
              <ShoppingCart className="w-4 h-4" />
              ACHETER
            </button>
            <button 
              onClick={handleWhatsApp}
              className="w-full aspect-square border border-gray-100 rounded-2xl flex items-center justify-center text-green-600 active:scale-95 transition-all hover:bg-green-50 shadow-sm"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="w-full aspect-square border border-gray-100 rounded-2xl flex items-center justify-center text-gray-600 active:scale-95 transition-all hover:bg-gray-50 shadow-sm">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Actions Bar */}
          {(onEditProduct || onDeleteProduct) && (
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              {onEditProduct && (
                <button 
                  onClick={() => onEditProduct(product)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </button>
              )}
              {onDeleteProduct && (
                <button 
                  onClick={() => onDeleteProduct(product.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPayment && (
          <PaymentModal 
            product={product} 
            onClose={() => setShowPayment(false)} 
          />
        )}

        {showQuickView && (
          <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickView(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-2xl bg-white rounded-t-[40px] sm:rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
            >
              <button 
                onClick={() => setShowQuickView(false)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-gray-900 shadow-lg active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full md:w-1/2 aspect-[4/5] md:aspect-auto">
                <img 
                  src={product.image} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-green-600">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Garanti Landro</span>
                  </div>
                </div>

                <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2 leading-tight">
                  {product.name}
                </h2>
                
                <p className="text-2xl font-black text-blue-600 mb-6 tracking-tight">
                  {formattedPrice}
                </p>

                <div className="space-y-4 mb-8">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</h4>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {product.description || "Aucune description détaillée disponible pour ce produit. Contactez le vendeur pour plus d'informations."}
                  </p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mots-clés</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowQuickView(false);
                        setShowPayment(true);
                      }}
                      className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-gray-200"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Acheter maintenant
                    </button>
                    <button 
                      onClick={handleWhatsApp}
                      className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all border border-green-100"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2 text-gray-400">
                          <Eye className="w-4 h-4" />
                          <span className="text-[10px] font-black">{product.views} vus</span>
                       </div>
                       <div className="flex items-center gap-2 text-gray-400">
                          <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                          <span className="text-[10px] font-black">{isLiked ? product.likes + 1 : product.likes} likes</span>
                       </div>
                    </div>
                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                       Partager <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
