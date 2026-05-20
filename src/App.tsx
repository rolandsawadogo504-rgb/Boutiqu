import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import BottomNav, { Tab } from './components/BottomNav';
import Home from './pages/Home';
import Marketing from './pages/Marketing';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import CreateShopForm from './components/CreateShopForm';
import ShopDetail from './components/ShopDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import NotificationToast from './components/NotificationToast';
import { notificationManager } from './lib/notificationManager';
import { AnimatePresence } from 'motion/react';
import { User, Shop, Post, Product, Story, Notification as AppNotification } from './types';
import { INITIAL_POSTS, INITIAL_PRODUCTS, INITIAL_STORIES } from './constants';
import AdminActionModal from './components/AdminActionModal';
import EditPostModal from './components/EditPostModal';
import EditProductModal from './components/EditProductModal';
import CreateStoryModal from './components/CreateStoryModal';
import { dataService } from './lib/dataService';
import Videos from './pages/Videos';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('landro_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    return {
      id: 'user-me',
      name: 'Utilisateur',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      isLoggedIn: false,
      hasShop: false,
      followingIds: [],
      followersCount: 0
    };
  });
  const [shop, setShop] = useState<Shop | null>(() => {
    const saved = localStorage.getItem('landro_shop');
    return saved ? JSON.parse(saved) : null;
  });
  const [globalPosts, setGlobalPosts] = useState<Post[]>(INITIAL_POSTS);
  const [globalStories, setGlobalStories] = useState<Story[]>(INITIAL_STORIES);
  const [globalProducts, setGlobalProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [viewingShop, setViewingShop] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);

  // Admin Secure Action states
  const [adminActionModal, setAdminActionModal] = useState<{ title: string; onSuccess: () => void } | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [createStoryIsShortVideo, setCreateStoryIsShortVideo] = useState(false);

  // Synchronise state for stories reactions (likes, views, replies)
  const handleUpdateStoryList = (id: string, updatedFields: Partial<Story>) => {
    setGlobalStories(prev => prev.map(story => story.id === id ? { ...story, ...updatedFields } : story));
  };

  // Persist a crafted story object, save to DB, update feeds, and trigger a notify dispatch
  const handleSaveStory = async (storyData: any) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: user.id || 'anonymous',
      userName: user.name || 'Utilisateur',
      userAvatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      mediaUrl: storyData.mediaUrl,
      type: storyData.type,
      timestamp: Date.now(),
      text: storyData.text,
      emoji: storyData.emoji,
      productLink: storyData.productLink,
      shopLink: storyData.shopLink,
      views: [],
      likes: [],
      replies: [],
      isShortVideo: storyData.isShortVideo || false
    };

    try {
      const saved = await dataService.createStory(newStory);
      const finalStory = saved || newStory;
      setGlobalStories(prev => [finalStory, ...prev]);

      // Showcase the publish to active sessions
      notificationManager.notify(
        'post',
        user.name,
        "a publié une nouvelle story ! ✨",
        user.avatar
      );
    } catch (err) {
      console.error("Failed to write manual story into database:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { dataService } = await import('./lib/dataService');
        const [posts, stories, products, shopsData] = await Promise.all([
          dataService.getPosts(),
          dataService.getStories(),
          dataService.getProducts(),
          dataService.getShops()
        ]);

        if (posts) setGlobalPosts(posts);
        if (stories) {
          setGlobalStories(stories);
          // Expire stories older than 24h by sweeping them silently from DB (except short videos which act as permanent TikTok products showcase)
          const dayLimit = Date.now() - 24 * 60 * 60 * 1000;
          stories.forEach(async (st) => {
            if (!st.isShortVideo && st.timestamp < dayLimit) {
              try {
                const { supabase } = await import('./lib/supabase');
                await supabase.from('stories').delete().eq('id', st.id);
              } catch (delErr) {
                console.warn("Clean-up sweep failed for story:", st.id, delErr);
              }
            }
          });
        }
        if (products) setGlobalProducts(products);
        if (shopsData) {
          setAllShops(shopsData);

          const savedUserRaw = localStorage.getItem('landro_user');
          if (savedUserRaw) {
            try {
              const parsedUser = JSON.parse(savedUserRaw);
              if (parsedUser.isLoggedIn && parsedUser.hasShop) {
                const savedShopRaw = localStorage.getItem('landro_shop');
                const savedShopId = savedShopRaw ? JSON.parse(savedShopRaw).id : null;

                const dbShop = (shopsData as Shop[]).find(s => s.id === savedShopId || s.id === parsedUser.id || s.name === parsedUser.name);
                if (dbShop) {
                  const shopPosts = (posts || []).filter(p => p.authorId === dbShop.id);
                  const shopProducts = (products || []).filter(p => (p as any).shopId === dbShop.id || (p as any).shop_id === dbShop.id);

                  const syncedShop: Shop = {
                    ...dbShop,
                    posts: shopPosts,
                    products: shopProducts
                  };

                  setShop(syncedShop);
                  localStorage.setItem('landro_shop', JSON.stringify(syncedShop));

                  const updatedUser = {
                    ...parsedUser,
                    name: dbShop.name || parsedUser.name,
                    avatar: dbShop.avatar || parsedUser.avatar
                  };
                  setUser(updatedUser);
                  localStorage.setItem('landro_user', JSON.stringify(updatedUser));
                }
              }
            } catch (jsonErr) {
              console.error("Failed to recover user and shop state from db mount list:", jsonErr);
            }
          }
        }
      } catch (err) {
        console.error('Supabase fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up Realtime listener to synchronize database changes across all clients instantly
    let postsChannel: any;
    let productsChannel: any;
    let shopsChannel: any;
    let storiesChannel: any;
    let isCancelled = false;

    const setupRealtime = async () => {
      try {
        const { supabase } = await import('./lib/supabase');
        const { mapDbPost, mapDbProduct, mapDbShop, mapDbStory } = await import('./lib/dataService');

        if (isCancelled) return;

        const rand = Math.random().toString(36).substring(7);

        postsChannel = supabase
          .channel(`changes-posts-${rand}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
            if (isCancelled) return;
            if (payload.eventType === 'INSERT') {
              const newp = mapDbPost(payload.new);
              setGlobalPosts(prev => prev.some(p => p.id === newp.id) ? prev : [newp, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapDbPost(payload.new);
              setGlobalPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
            } else if (payload.eventType === 'DELETE') {
              setGlobalPosts(prev => prev.filter(p => p.id !== String(payload.old.id)));
            }
          })
          .subscribe();

        productsChannel = supabase
          .channel(`changes-products-${rand}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
            if (isCancelled) return;
            if (payload.eventType === 'INSERT') {
              const newp = mapDbProduct(payload.new);
              setGlobalProducts(prev => prev.some(p => p.id === newp.id) ? prev : [newp, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapDbProduct(payload.new);
              setGlobalProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
            } else if (payload.eventType === 'DELETE') {
              setGlobalProducts(prev => prev.filter(p => p.id !== String(payload.old.id)));
            }
          })
          .subscribe();

        shopsChannel = supabase
          .channel(`changes-shops-${rand}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, (payload) => {
            if (isCancelled) return;
            if (payload.eventType === 'INSERT') {
              const newp = mapDbShop(payload.new);
              setAllShops(prev => prev.some(s => s.id === newp.id) ? prev : [newp, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapDbShop(payload.new);
              setAllShops(prev => prev.map(s => s.id === updated.id ? updated : s));
            } else if (payload.eventType === 'DELETE') {
              setAllShops(prev => prev.filter(s => s.id !== String(payload.old.id)));
            }
          })
          .subscribe();

        storiesChannel = supabase
          .channel(`changes-stories-${rand}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, (payload) => {
            if (isCancelled) return;
            if (payload.eventType === 'INSERT') {
              const news = mapDbStory(payload.new);
              setGlobalStories(prev => prev.some(s => s.id === news.id) ? prev : [news, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapDbStory(payload.new);
              setGlobalStories(prev => prev.map(s => s.id === updated.id ? updated : s));
            } else if (payload.eventType === 'DELETE') {
              setGlobalStories(prev => prev.filter(s => s.id !== String(payload.old.id)));
            }
          })
          .subscribe();
      } catch (err) {
        console.error('Realtime setup failed:', err);
      }
    };
    setupRealtime();

    // Notification listener
    const unsubscribe = notificationManager.subscribe((notif) => {
      setActiveNotification(notif);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setActiveNotification(null), 5000);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      isCancelled = true;
      if (postsChannel) postsChannel.unsubscribe();
      if (productsChannel) productsChannel.unsubscribe();
      if (shopsChannel) shopsChannel.unsubscribe();
      if (storiesChannel) storiesChannel.unsubscribe();
    };
  }, []);

  // Sync user's boutique from the global fresh database values dynamically
  useEffect(() => {
    if (shop) {
      const updatedPosts = globalPosts.filter(p => p.authorId === shop.id);
      const updatedProducts = globalProducts.filter(p => (p as any).shopId === shop.id || (p as any).shop_id === shop.id);
      
      const postsChanged = JSON.stringify(shop.posts.map(p => p.id)) !== JSON.stringify(updatedPosts.map(p => p.id));
      const productsChanged = JSON.stringify(shop.products.map(p => p.id)) !== JSON.stringify(updatedProducts.map(p => p.id));
      
      if (postsChanged || productsChanged) {
        setShop(prev => prev ? {
          ...prev,
          posts: updatedPosts,
          products: updatedProducts
        } : null);
      }
    }
  }, [globalPosts, globalProducts, shop?.id]);

  useEffect(() => {
    localStorage.setItem('landro_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (shop) {
      localStorage.setItem('landro_shop', JSON.stringify(shop));
    }
  }, [shop]);

  const handleLogin = () => {
    setUser({ 
      ...user, 
      isLoggedIn: true,
      name: "Utilisateur Landro",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=landro"
    });
  };

  const handleLogout = () => {
    const freshUser: User = {
      id: "user-me",
      name: "Utilisateur",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
      isLoggedIn: false,
      hasShop: false,
      followersCount: 0,
      followingIds: []
    };
    setUser(freshUser);
    setShop(null);
    localStorage.removeItem('landro_user');
    localStorage.removeItem('landro_shop');
    setActiveTab('home');
  };

  const handleCreateShop = async (shopData: any) => {
    const newShop: Shop = {
      ...shopData,
      id: 'shop-' + Date.now(),
      followers: 0,
      followingIds: [],
      products: [],
      posts: []
    };
    setShop(newShop);
    setAllShops(prev => [newShop, ...prev]);
    setUser({ ...user, hasShop: true });
    setIsCreatingShop(false);
    setViewingShop(true);

    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.createShop(newShop);
    } catch (err) {
      console.error('Failed to save shop to database:', err);
    }
  };

  const handleAddPost = async (post: Post) => {
    setGlobalPosts(prev => [post, ...prev]);
    if (shop) {
       setShop({ ...shop, posts: [post, ...shop.posts] });
    }

    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.createPost(post);
    } catch (err) {
      console.error('Failed to save post to database:', err);
    }
  };

  const handleAddProduct = async (product: Product) => {
    const productWithShop = {
      ...product,
      shopId: shop?.id || '',
      shop_id: shop?.id || ''
    } as any;

    setGlobalProducts(prev => [productWithShop, ...prev]);
    if (shop) {
       setShop({ ...shop, products: [productWithShop, ...shop.products] });
    }

    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.createProduct(productWithShop);
    } catch (err) {
      console.error('Failed to save product to database:', err);
    }
  };

  const handleUpdateShop = async (updatedFields: Partial<Shop>) => {
    if (!shop) return;
    const updatedShop: Shop = {
      ...shop,
      ...updatedFields
    };

    setShop(updatedShop);

    setAllShops(prev => prev.map(s => s.id === shop.id ? { ...s, ...updatedFields } : s));

    if (updatedFields.name || updatedFields.avatar) {
      setUser(prev => ({
        ...prev,
        name: updatedFields.name || prev.name,
        avatar: updatedFields.avatar || prev.avatar
      }));
    }

    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.updateShop(updatedShop);
    } catch (err) {
      console.error('Failed to update shop in database:', err);
    }
  };

  const handleAdminAction = (title: string, action: () => void) => {
    const sessionToken = sessionStorage.getItem('landro_admin_session_payload');
    if (sessionToken && sessionToken.startsWith('landro_auth_granted_')) {
      action();
    } else {
      setAdminActionModal({
        title,
        onSuccess: () => {
          setAdminActionModal(null);
          action();
        }
      });
    }
  };

  const executeDeletePost = async (id: string) => {
    setGlobalPosts(prev => prev.filter(p => p.id !== id));
    if (shop) {
      setShop(prev => prev ? { ...prev, posts: prev.posts.filter(p => p.id !== id) } : null);
    }
    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.deletePost(id);
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteProduct = async (id: string) => {
    setGlobalProducts(prev => prev.filter(p => p.id !== id));
    if (shop) {
      setShop(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== id) } : null);
    }
    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.deleteProduct(id);
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteShop = async (id: string) => {
    setAllShops(prev => prev.filter(s => s.id !== id));
    if (shop && shop.id === id) {
      handleLogout();
    }
    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.deleteShop(id);
    } catch (err) {
      console.error(err);
    }
  };

  const executeSaveEditedPost = async (id: string, updatedContent: string) => {
    setGlobalPosts(prev => prev.map(p => p.id === id ? { ...p, content: updatedContent } : p));
    if (shop) {
      setShop(prev => prev ? { ...prev, posts: prev.posts.map(p => p.id === id ? { ...p, content: updatedContent } : p) } : null);
    }
    try {
      const { dataService } = await import('./lib/dataService');
      await dataService.updatePost(id, { content: updatedContent });
    } catch (err) {
      console.error(err);
    }
  };

  const executeSaveEditedProduct = async (id: string, updatedFields: Partial<Product>) => {
    setGlobalProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    if (shop) {
      setShop(prev => prev ? { ...prev, products: prev.products.map(p => p.id === id ? { ...p, ...updatedFields } : p) } : null);
    }
    try {
      const { supabase } = await import('./lib/supabase');
      await supabase.from('products').update(updatedFields).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = () => {
    if (viewingShop && shop) {
      return (
        <ShopDetail 
          key="shop-detail" 
          shop={shop} 
          isOwner={true} 
          onAddPost={handleAddPost}
          onAddProduct={handleAddProduct}
          onUpdateShop={handleUpdateShop}
          stories={globalStories}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Home 
            key="home" 
            posts={globalPosts} 
            products={globalProducts} 
            stories={globalStories.filter(st => !st.isShortVideo)} 
            shops={allShops}
            user={user} 
            onAddStory={() => {
              if (!user.isLoggedIn) {
                setActiveTab('profile');
              } else {
                setCreateStoryIsShortVideo(false);
                setShowCreateStory(true);
              }
            }}
            onUpdateStoryList={handleUpdateStoryList}
            onEditPost={(post) => {
              handleAdminAction("Modifier la publication", () => {
                setEditingPost(post);
              });
            }}
            onDeletePost={(id) => {
              handleAdminAction("Supprimer la publication", () => {
                executeDeletePost(id);
              });
            }}
            onEditProduct={(product) => {
              handleAdminAction("Modifier le produit", () => {
                setEditingProduct(product);
              });
            }}
            onDeleteProduct={(id) => {
              handleAdminAction("Supprimer le produit", () => {
                executeDeleteProduct(id);
              });
            }}
          />
        );
      case 'marketing':
        return <Marketing key="marketing" products={globalProducts} />;
      case 'videos':
        return (
          <Videos 
            key="videos"
            stories={globalStories.filter(st => st.isShortVideo)}
            user={user}
            onUpdateStoryList={handleUpdateStoryList}
            onDeleteStory={(id) => setGlobalStories(prev => prev.filter(s => s.id !== id))}
            onAddStory={() => {
              if (!user.isLoggedIn) {
                setActiveTab('profile');
              } else {
                setCreateStoryIsShortVideo(true);
                setShowCreateStory(true);
              }
            }}
            products={globalProducts}
            shops={allShops}
            onUpdateUser={setUser}
          />
        );
      case 'activity':
        return <Activity key="activity" />;
      case 'profile':
        return (
          <Profile 
            key="profile" 
            user={user} 
            shop={shop || undefined}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onCreateShop={() => setIsCreatingShop(true)}
            onViewShop={() => setViewingShop(true)}
            onAdminAccess={() => setShowAdminLogin(true)}
            onAddPost={handleAddPost}
            onAddProduct={handleAddProduct}
            onUpdateShop={handleUpdateShop}
            stories={globalStories}
            onDeleteStory={(id) => setGlobalStories(prev => prev.filter(s => s.id !== id))}
            onUpdateStoryList={handleUpdateStoryList}
          />
        );
      default:
        return (
          <Home 
            key="home" 
            posts={globalPosts} 
            products={globalProducts} 
            stories={globalStories.filter(st => !st.isShortVideo)} 
            shops={allShops}
            user={user} 
            onAddStory={() => {
              if (!user.isLoggedIn) {
                setActiveTab('profile');
              } else {
                setCreateStoryIsShortVideo(false);
                setShowCreateStory(true);
              }
            }}
            onUpdateStoryList={handleUpdateStoryList}
            onEditPost={(post) => {
              handleAdminAction("Modifier la publication", () => {
                setEditingPost(post);
              });
            }}
            onDeletePost={(id) => {
              handleAdminAction("Supprimer la publication", () => {
                executeDeletePost(id);
              });
            }}
            onEditProduct={(product) => {
              handleAdminAction("Modifier le produit", () => {
                setEditingProduct(product);
              });
            }}
            onDeleteProduct={(id) => {
              handleAdminAction("Supprimer le produit", () => {
                executeDeleteProduct(id);
              });
            }}
          />
        );
    }
  };

  const currentTitle = viewingShop ? "Boutique" : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none overflow-x-hidden">
      <div className="flex-1 w-full max-w-md mx-auto bg-white shadow-sm min-h-screen flex flex-col relative overflow-hidden">
        
        <TopBar 
          onMenuClick={() => {}} 
          onActivityClick={() => setActiveTab('activity')} 
          onBack={viewingShop ? () => setViewingShop(false) : undefined}
          title={currentTitle}
        />
        
        <main className="flex-1 mt-16 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>

        <BottomNav 
          activeTab={viewingShop ? (null as any) : activeTab} 
          setActiveTab={(tab) => {
            setViewingShop(false);
            setActiveTab(tab);
          }} 
          user={user}
        />

        <AnimatePresence>
          {isCreatingShop && (
            <CreateShopForm 
              onClose={() => setIsCreatingShop(false)}
              onComplete={handleCreateShop}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdminLogin && (
            <AdminLogin 
              onClose={() => setShowAdminLogin(false)}
              onSuccess={() => {
                setShowAdminLogin(false);
                setShowAdminDashboard(true);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdminDashboard && (
            <AdminDashboard 
              onClose={() => setShowAdminDashboard(false)}
              posts={globalPosts}
              products={globalProducts}
              shops={allShops}
              onDeletePost={executeDeletePost}
              onDeleteProduct={executeDeleteProduct}
              onDeleteShop={executeDeleteShop}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {adminActionModal && (
            <AdminActionModal 
              onClose={() => setAdminActionModal(null)}
              onSuccess={adminActionModal.onSuccess}
              actionTitle={adminActionModal.title}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingPost && (
            <EditPostModal 
              post={editingPost}
              onClose={() => setEditingPost(null)}
              onSave={async (content) => {
                await executeSaveEditedPost(editingPost.id, content);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingProduct && (
            <EditProductModal 
              product={editingProduct}
              onClose={() => setEditingProduct(null)}
              onSave={async (updatedFields) => {
                await executeSaveEditedProduct(editingProduct.id, updatedFields);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCreateStory && (
            <CreateStoryModal 
              onClose={() => setShowCreateStory(false)}
              onSave={handleSaveStory}
              products={globalProducts}
              shops={allShops}
              isShortVideoMode={createStoryIsShortVideo}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeNotification && (
            <NotificationToast 
              notification={activeNotification}
              onClose={() => setActiveNotification(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
