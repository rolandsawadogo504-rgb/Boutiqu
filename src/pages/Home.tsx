import { useState, useEffect } from 'react';
import FeedItem from '../components/FeedItem';
import ProductCard from '../components/ProductCard';
import StoryBar from '../components/StoryBar';
import StoryViewer from '../components/StoryViewer';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Product, Story, User, Shop } from '../types';
import { 
  Flame, Sparkles, TrendingUp, Compass, ShoppingBag, Users, ArrowRight,
  RefreshCw, CheckCircle, Smartphone, SlidersHorizontal, Loader2
} from 'lucide-react';

interface HomeProps {
  posts: Post[];
  products: Product[];
  stories: Story[];
  shops: Shop[];
  user: User;
  onAddStory: () => void;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (id: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  onUpdateStoryList?: (id: string, updatedFields: Partial<Story>) => void;
  key?: string;
}

type FeedMode = 'ia' | 'trending' | 'marketplace' | 'discover';
type CategoryFilter = 'all' | 'ebook' | 'template' | 'tips';

export default function Home({ 
  posts, 
  products, 
  stories, 
  shops, 
  user, 
  onAddStory,
  onEditPost,
  onDeletePost,
  onEditProduct,
  onDeleteProduct,
  onUpdateStoryList
}: HomeProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<FeedMode>('ia');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followedShops, setFollowedShops] = useState<string[]>([]);
  const [customAddedReplies, setCustomAddedReplies] = useState<Record<string, number>>({});

  // Dynamic Stories Prioritisation Algorithm:
  // 1. Filter out stories older than 24h
  // 2. Rank by scoring system (recency, followed accounts, popularity, shops)
  const prioritizedStories = (() => {
    const now = Date.now();
    const aDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Filter active (stories should expire after 24h and exclude TikTok shorts)
    const active = stories.filter(s => s.timestamp >= aDayAgo && !s.isShortVideo);

    return [...active].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // - 1. Recency component (+100 max scaled)
      const recencyA = Math.max(0, 1 - (now - a.timestamp) / (24 * 60 * 60 * 1000));
      const recencyB = Math.max(0, 1 - (now - b.timestamp) / (24 * 60 * 60 * 1000));
      scoreA += recencyA * 100;
      scoreB += recencyB * 100;

      // - 2. Subscribed accounts (+200 points)
      const isFavA = user.followingIds?.includes(a.userId) ? 200 : 0;
      const isFavB = user.followingIds?.includes(b.userId) ? 200 : 0;
      scoreA += isFavA;
      scoreB += isFavB;

      // - 3. Popularity indices (+10 per like, +5 per view)
      const popA = ((a.likes?.length || 0) * 10) + ((a.views?.length || 0) * 5);
      const popB = ((b.likes?.length || 0) * 10) + ((b.views?.length || 0) * 5);
      scoreA += popA;
      scoreB += popB;

      // - 4. Registered Shop Status (+150 points)
      const isMerchantA = shops.some(sh => sh.id === a.userId || sh.id === a.productLink) ? 150 : 0;
      const isMerchantB = shops.some(sh => sh.id === b.userId || sh.id === b.productLink) ? 150 : 0;
      scoreA += isMerchantA;
      scoreB += isMerchantB;

      return scoreB - scoreA;
    });
  })();

  // Reset infinite scroll view when tab changes for optimal rendering
  useEffect(() => {
    setVisibleCount(4);
  }, [activeTab, categoryFilter]);

  // Infinite Scroll mock loader
  const handleLoadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 3);
      setLoadingMore(false);
    }, 1200);
  };

  // Toggle follow status simulation
  const handleFollowShop = (shopId: string) => {
    setFollowedShops(prev => 
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  // Use real shops only, no fake boutiques allowed
  const sampleShops: Shop[] = shops;

  // 1. COMPUTE SOCIAL ALGORITHME SCORES
  const getPostScore = (p: Post) => {
    let score = p.likes * 2 + p.shares * 3 + p.commentsCount * 4;
    if (p.timestamp.includes('instant') || p.timestamp.includes('min')) score += 80;
    if (p.author.toLowerCase().includes('landro') || p.author.toLowerCase().includes('inoussa')) score += 50;
    return score;
  };

  const getProductScore = (pr: Product) => {
    let score = pr.likes * 2.5 + pr.views * 0.7;
    if (pr.category === 'E-book') score += 20;
    return score;
  };

  // Sorted arrays
  const sortedPosts = [...posts].sort((a, b) => getPostScore(b) - getPostScore(a));
  const sortedProducts = [...products].sort((a, b) => getProductScore(b) - getProductScore(a));

  // 2. CONSTRUCT MIXED PREMIUM FEED LIST
  const buildMixedFeed = (): (Post | Product | Shop)[] => {
    let list: (Post | Product | Shop)[] = [];

    // Order elements based on User Feedback specification with 100% dynamic data:
    // 1. nouvelles publications
    const recentPosts = [...posts].sort((a,b) => (b.timestamp.includes('instant') ? 1 : a.timestamp.includes('instant') ? -1 : 0));

    // 2. produits tendance
    const trendingProducts = [...products].sort((a,b) => (b.likes || b.views || 0) - (a.likes || a.views || 0));

    // 3. publications populaires
    const popularPosts = [...posts].sort((a,b) => (b.likes || 0) - (a.likes || 0));

    // 4. suggestions utilisateurs (user-created real shops)
    const suggestedShops = [...sampleShops];

    // 5. contenus récents (all other remaining or secondary items)
    const rawAllProducts = [...products];

    if (activeTab === 'ia') {
      // Step 1: Add up to 2 nouvelles publications
      recentPosts.slice(0, 2).forEach(p => {
        if (!list.some(x => x.id === p.id)) list.push(p);
      });

      // Step 2: Add up to 1-2 produits tendance
      trendingProducts.slice(0, 2).forEach(pr => {
        if (!list.some(x => x.id === pr.id)) list.push(pr);
      });

      // Step 3: Add up to 2 publications populaires (avoiding duplicates)
      popularPosts.forEach(p => {
        if (!list.some(x => x.id === p.id) && list.filter(el => 'author' in el).length < 4) {
          list.push(p);
        }
      });

      // Step 4: Add up to 2 suggestions de boutiques réelles
      suggestedShops.slice(0, 2).forEach(sh => {
        if (!list.some(x => x.id === sh.id)) list.push(sh);
      });

      // Step 5: Fill with remaining contents
      posts.forEach(p => {
        if (!list.some(x => x.id === p.id)) list.push(p);
      });
      products.forEach(pr => {
        if (!list.some(x => x.id === pr.id)) list.push(pr);
      });
      sampleShops.forEach(sh => {
        if (!list.some(x => x.id === sh.id)) list.push(sh);
      });
    } 
    else if (activeTab === 'trending') {
      // Sort primarily by engagement scores
      trendingProducts.slice(0, 5).forEach(pr => list.push(pr));
      popularPosts.slice(0, 5).forEach(p => list.push(p));
    } 
    else if (activeTab === 'marketplace') {
      // Products only
      products.forEach(pr => list.push(pr));
    } 
    else if (activeTab === 'discover') {
      // Suggested creators and shops
      suggestedShops.forEach(sh => list.push(sh));
      posts.forEach(p => {
        if (!list.some(x => x.id === p.id)) list.push(p);
      });
    }

    // Apply category filters dynamically
    if (categoryFilter !== 'all') {
      list = list.filter(item => {
        const isProd = 'price' in item;
        const isPost = 'author' in item;
        if (isProd) {
          const p = item as Product;
          if (categoryFilter === 'ebook' && p.category !== 'E-book') return false;
          if (categoryFilter === 'template' && p.category !== 'Template') return false;
          return true;
        }
        if (isPost) {
          const text = (item as Post).content.toLowerCase();
          if (categoryFilter === 'tips' && !text.includes('astuc') && !text.includes('busin')) return false;
          return true;
        }
        return true;
      });
    }

    return list;
  };

  const finalMixedFeed = buildMixedFeed();
  const paginatedFeed = finalMixedFeed.slice(0, visibleCount);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pb-24 bg-gray-55 min-h-screen flex flex-col relative"
      >
        {/* LANDRO REAL-TIME STORIES HEADER */}
        <StoryBar 
          stories={prioritizedStories} 
          user={user} 
          onViewStory={(index) => setSelectedStoryIndex(index)} 
          onCreateStory={onAddStory}
        />

        {/* ALGORITHME ALIBABA / TIKTOK CONTROL NAVIGATION BAR */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-40 px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-sm">
          <button 
            onClick={() => setActiveTab('ia')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'ia' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'ia' ? 'text-amber-400' : ''}`} />
            Pour vous (IA)
          </button>

          <button 
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'trending' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeTab === 'trending' ? 'text-orange-500 fill-orange-500' : ''}`} />
            Tendances
          </button>

          <button 
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'marketplace' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            Marketplace
          </button>

          <button 
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'discover' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            Découvrir
          </button>
        </div>

        {/* REFINEMENT SUB_CATEGORY PILLS */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 ${categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            Tout explorer
          </button>
          <button 
            onClick={() => setCategoryFilter('ebook')}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 ${categoryFilter === 'ebook' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            📚 E-books
          </button>
          <button 
            onClick={() => setCategoryFilter('template')}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 ${categoryFilter === 'template' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            ⚙️ Templates Notion
          </button>
          <button 
            onClick={() => setCategoryFilter('tips')}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 ${categoryFilter === 'tips' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            💡 Astuces Business
          </button>
        </div>

        {/* FEED LOOP */}
        <div className="flex flex-col gap-0 bg-gray-50/50">
          
          {/* INSTANT ANCHOR BRANDING ACCENTS */}
          {activeTab === 'ia' && (
            <div className="bg-indigo-600 text-white p-4 text-center text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-400 animate-pulse shrink-0" />
              <span>Algorithme IA Landro Digital Actif</span>
            </div>
          )}

          {paginatedFeed.map((item, index) => {
            const isPost = 'author' in item;
            const isProduct = 'price' in item;
            const isShop = !isPost && !isProduct;

            // Optional Injection: Insert a horizontal custom suggested shops view after first post
            const showShopCarousel = index === 1 && sampleShops.length > 0;
            const showCreatorBanner = index === 2 && posts.length > 1;

            return (
              <div key={`${isPost ? 'post' : isProduct ? 'prod' : 'shop'}-${item.id}-${index}`} className="w-full">
                
                {/* 1. RENDER POST */}
                {isPost && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
                  >
                    <FeedItem 
                      post={item as Post} 
                      onEditPost={onEditPost}
                      onDeletePost={onDeletePost}
                    />
                  </motion.div>
                )}

                {/* 2. RENDER PRODUCT CARD ACCENT */}
                {isProduct && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="px-4 py-5 bg-white border-b border-gray-100 last:border-b-0"
                  >
                    <div className="bg-blue-50/20 p-5 rounded-[40px] border border-blue-100/30 shadow-xs relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-600/10" />
                      
                      <div className="flex items-center justify-between mb-4 px-2 relative z-10">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 mb-0.5">Sponsorisé par l'IA</span>
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Digital Marketplace</span>
                        </div>
                        <span className="px-2.5 py-1 bg-white text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xs">Option Sécurisée</span>
                      </div>

                      <div className="h-[430px] relative z-10">
                        <ProductCard 
                          product={item as Product} 
                          onEditProduct={onEditProduct}
                          onDeleteProduct={onDeleteProduct}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. RENDER INDIVIDUAL SHOP DECK */}
                {isShop && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-5 bg-white border-b border-gray-100"
                  >
                    <div className="bg-gray-50/55 p-5 rounded-[32px] border border-gray-50 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-4 min-w-0">
                           <img src={(item as Shop).avatar} className="w-13 h-13 rounded-2xl object-cover shadow-xs shrink-0" />
                           <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-gray-950 tracking-tight truncate">{(item as Shop).name}</h4>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{(item as Shop).country}</p>
                              <p className="text-[10px] text-gray-500 font-medium truncate mt-1">{(item as Shop).bio}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleFollowShop((item as Shop).id)}
                          className={`ml-3 px-3.5 py-1.8 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shrink-0 ${followedShops.includes((item as Shop).id) ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-900 text-white'}`}
                        >
                           {followedShops.includes((item as Shop).id) ? 'Suivi' : 'Découvrir'}
                        </button>
                    </div>
                  </motion.div>
                )}

                {/* DYNAMIC CAROUSEL INJECTION: SUGGESTED BOUTIQUES PLATFORM */}
                {showShopCarousel && (
                  <div className="py-6 bg-gray-50/50 border-b border-gray-100">
                    <div className="px-4 mb-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Boutiques à la Une</h4>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">Basé sur vos centres d'intérêts</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
                      {sampleShops.map((sh) => (
                        <div 
                          key={`sugg-${sh.id}`} 
                          className="w-48 bg-white p-4 rounded-3xl border border-gray-100 shrink-0 shadow-xs flex flex-col justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={sh.avatar} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-[11px] text-gray-900 truncate leading-none">{sh.name}</h5>
                              <span className="text-[8px] font-black text-indigo-505 uppercase tracking-wider text-indigo-500">{sh.country}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2.5 line-clamp-2 leading-normal h-8">{sh.bio}</p>
                          
                          <div className="mt-3.5 pt-3 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{sh.followers + (followedShops.includes(sh.id) ? 1 : 0)} Abonnés</span>
                            <button 
                              onClick={() => handleFollowShop(sh.id)}
                              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${followedShops.includes(sh.id) ? 'bg-green-50 text-green-600' : 'bg-gray-900 text-white'}`}
                            >
                              {followedShops.includes(sh.id) ? 'Fait' : 'Suivre'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DYNAMIC SUGGESTION: SIMILAR DIGITAL PRODUCTS */}
                {showCreatorBanner && sortedProducts.length >= 2 && (
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-b border-gray-100 relative overflow-hidden flex flex-col gap-3">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-black uppercase tracking-widest">IA Recommandation</span>
                      <h4 className="font-extrabold text-sm tracking-tight mt-1">Meilleurs E-books de la semaine !</h4>
                      <p className="text-[10px] text-white/70">Sélectionnés pour leur vitesse de vente et sécurité.</p>
                    </div>
                    
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                      {sortedProducts.map(p => (
                        <div key={`sugg-p-${p.id}`} className="w-40 bg-white/10 backdrop-blur-md p-3 rounded-2xl shrink-0 border border-white/5 flex gap-2 items-center">
                          <img src={p.image} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/20" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-[10px] truncate leading-none text-white">{p.name}</h5>
                            <span className="text-[9px] font-black text-green-300 mt-1 block">{p.price} FCFA</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {/* INFINITE SCROLL / LAZY LOADING LOAD TRIGGER BUTTON */}
          {finalMixedFeed.length > visibleCount && (
            <div className="py-6 px-4 bg-white flex flex-col items-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full max-w-xs h-12 border border-gray-200 hover:border-blue-200 bg-white text-gray-900 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Calcul Recommandations...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    <span>Voir plus de publications</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* EMPTY STATE */}
          {finalMixedFeed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center bg-white">
              <div className="w-20 h-20 bg-gray-50 rounded-[35px] flex items-center justify-center mb-5 border border-gray-100">
                 <span className="text-3xl">📭</span>
              </div>
              <h3 className="font-black text-lg text-gray-900">Aucun contenu trouvé</h3>
              <p className="text-xs text-gray-400 mt-2 max-w-[220px] mx-auto leading-relaxed uppercase tracking-wider">Essayez un autre filtre ou catégorie pour activer le feed !</p>
            </div>
          )}

        </div>
      </motion.div>

      {/* STORY EXPANSION VIEWER SCREEN */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryViewer 
            stories={prioritizedStories}
            initialIndex={selectedStoryIndex}
            onClose={() => setSelectedStoryIndex(null)}
            currentUser={user}
            shops={shops}
            products={products}
            onUpdateStoryList={onUpdateStoryList}
          />
        )}
      </AnimatePresence>
    </>
  );
}
