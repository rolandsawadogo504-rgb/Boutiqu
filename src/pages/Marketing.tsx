import { useState } from 'react';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingBag, X } from 'lucide-react';
import { Product } from '../types';

interface MarketingProps {
  products: Product[];
  key?: string;
}

export default function Marketing({ products }: MarketingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags present in current products list
  const allUniqueTags = Array.from(
    new Set(
      products.flatMap(p => p.tags || [])
    )
  ).filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || (product.tags || []).includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-20 pt-6 bg-white min-h-screen"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1 block">Marketplace LANDRO</span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Boutique Premium</h1>
          </div>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
            title="Réinitialiser filtres"
            className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 border border-gray-100 transition-all active:scale-95 hover:text-blue-600 hover:bg-blue-50/50"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search zone */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-600/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Chercher formations, e-books, tags, mots-clés..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-[24px] py-5 pl-14 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold placeholder:text-gray-300 placeholder:font-medium shadow-sm text-gray-950"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-700 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal tag scroll bar to improve discoverability */}
        {allUniqueTags.length > 0 && (
          <div className="space-y-2 mt-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">Découvrir par mots-clés</span>
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 ${
                  !selectedTag 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15 border border-transparent'
                    : 'bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tout voir
              </button>
              {allUniqueTags.map(tag => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15 border border-transparent animate-pulse'
                        : 'bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-105 hover:bg-gray-100'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Products layout grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 pt-2">
          {filteredProducts.map(product => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-2 py-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center text-blue-600">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900">Aucun produit trouvé</h3>
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                  {selectedTag || searchQuery 
                    ? "Essayez d'autres mots-clés ou réinitialisez les filtres de recherche."
                    : "Les produits s'afficheront ici après avoir été publiés par les vendeurs."}
                </p>
                {(selectedTag || searchQuery) && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag(null);
                    }}
                    className="mt-4 px-4 py-2 pb-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
