import { supabase } from './supabase';
import { Post, Story, Product, Shop, Comment, StoryReply } from '../types';

export function parseStoryMetadata(mediaUrl: string) {
  const defaultMeta = {
    text: '',
    emoji: '',
    productLink: '',
    shopLink: '',
    isShortVideo: false,
    views: [] as string[],
    likes: [] as string[],
    replies: [] as StoryReply[]
  };
  try {
    if (!mediaUrl) return defaultMeta;
    const hashIndex = mediaUrl.indexOf('#metadata=');
    if (hashIndex === -1) return defaultMeta;
    const jsonStr = decodeURIComponent(mediaUrl.substring(hashIndex + 10));
    const parsed = JSON.parse(jsonStr);
    return {
      text: parsed.text || '',
      emoji: parsed.emoji || '',
      productLink: parsed.productLink || '',
      shopLink: parsed.shopLink || '',
      isShortVideo: parsed.isShortVideo || false,
      views: Array.isArray(parsed.views) ? parsed.views : [],
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      replies: Array.isArray(parsed.replies) ? parsed.replies : []
    };
  } catch (err) {
    console.error('Error parsing story metadata from mediaUrl hash:', err);
    return defaultMeta;
  }
}

export function encodeStoryMetadata(mediaUrl: string, metadata: any): string {
  try {
    const baseMediaUrl = mediaUrl.split('#')[0];
    const jsonStr = JSON.stringify(metadata);
    return `${baseMediaUrl}#metadata=${encodeURIComponent(jsonStr)}`;
  } catch (err) {
    console.error('Error encoding story metadata into mediaUrl hash:', err);
    return mediaUrl;
  }
}

// Robust resilient mappers to handle both camelCase and snake_case database schema
export function mapDbPost(row: any): Post {
  let parsedComments: Comment[] = [];
  if (row.comments) {
    if (Array.isArray(row.comments)) {
      parsedComments = row.comments;
    } else if (typeof row.comments === 'string') {
      try {
        parsedComments = JSON.parse(row.comments);
      } catch (e) {
        console.error("Failed to parse comments JSON", e);
      }
    }
  }

  return {
    id: String(row.id),
    author: row.author || '',
    authorId: row.authorId || row.author_id || '',
    avatar: row.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    image: row.image || '',
    content: row.content || '',
    likes: Number(row.likes || 0),
    commentsCount: Number(row.commentsCount !== undefined ? row.commentsCount : (row.comments_count !== undefined ? row.comments_count : 0)),
    comments: parsedComments,
    shares: Number(row.shares || 0),
    isFollowing: Boolean(row.isFollowing ?? row.is_following ?? false),
    timestamp: row.timestamp || "À l'instant"
  };
}

export function mapDbProduct(row: any): Product {
  let tags: string[] = [];
  let description = row.description || '';

  if (row.tags) {
    if (Array.isArray(row.tags)) {
      tags = row.tags;
    } else if (typeof row.tags === 'string') {
      try {
        tags = JSON.parse(row.tags);
      } catch {
        tags = row.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }
  }

  // Also try parsing from description fallback encoded as #tags:tag1,tag2
  const tagHashIndex = description.lastIndexOf('#tags:');
  if (tagHashIndex !== -1) {
    const tagString = description.substring(tagHashIndex + 6).trim();
    description = description.substring(0, tagHashIndex).trim();
    if (tagString) {
      const parsedTags = tagString.split(',').map((t: string) => t.trim()).filter(Boolean);
      tags = Array.from(new Set([...tags, ...parsedTags]));
    }
  }

  return {
    id: String(row.id),
    name: row.name || '',
    price: Number(row.price || 0),
    image: row.image || '',
    category: row.category || '',
    description: description,
    fileUrl: row.fileUrl || row.file_url || '',
    chariowLink: row.chariowLink || row.chariow_link || '',
    views: Number(row.views || 0),
    likes: Number(row.likes || 0),
    shopId: row.shopId || row.shop_id || row.userId || row.user_id || '',
    shop_id: row.shop_id || row.shopId || row.user_id || row.userId || '',
    tags: tags
  } as any;
}

export function mapDbStory(row: any): Story {
  const rawMediaUrl = row.mediaUrl || row.media_url || '';
  const meta = parseStoryMetadata(rawMediaUrl);

  // Parse columns directly if they exist in Supabase and are populated prioritarily
  let parsedViews: string[] = meta.views;
  if (row.views) {
    if (Array.isArray(row.views)) parsedViews = row.views;
    else if (typeof row.views === 'string') {
      try { parsedViews = JSON.parse(row.views); } catch { /* ignore */ }
    }
  }

  let parsedLikes: string[] = meta.likes;
  if (row.likes) {
    if (Array.isArray(row.likes)) parsedLikes = row.likes;
    else if (typeof row.likes === 'string') {
      try { parsedLikes = JSON.parse(row.likes); } catch { /* ignore */ }
    }
  }

  let parsedReplies: StoryReply[] = meta.replies;
  if (row.replies) {
    if (Array.isArray(row.replies)) parsedReplies = row.replies;
    else if (typeof row.replies === 'string') {
      try { parsedReplies = JSON.parse(row.replies); } catch { /* ignore */ }
    }
  }

  return {
    id: String(row.id),
    userId: row.userId || row.user_id || '',
    userName: row.userName || row.user_name || '',
    userAvatar: row.userAvatar || row.user_avatar || '',
    mediaUrl: rawMediaUrl,
    type: row.type || 'image',
    timestamp: Number(row.timestamp || Date.now()),
    text: row.text || meta.text || '',
    emoji: row.emoji || meta.emoji || '',
    productLink: row.productLink || row.product_link || meta.productLink || '',
    shopLink: row.shopLink || row.shop_link || meta.shopLink || '',
    views: parsedViews,
    likes: parsedLikes,
    replies: parsedReplies,
    isShortVideo: Boolean(row.isShortVideo ?? row.is_short_video ?? meta.isShortVideo ?? false)
  };
}

export function mapDbShop(row: any): Shop {
  let followingIds: string[] = [];
  if (row.followingIds) {
    if (Array.isArray(row.followingIds)) followingIds = row.followingIds;
  } else if (row.following_ids) {
    if (Array.isArray(row.following_ids)) followingIds = row.following_ids;
  }

  return {
    id: String(row.id),
    name: row.name || '',
    avatar: row.avatar || '',
    banner: row.banner || '',
    bio: row.bio || '',
    whatsapp: row.whatsapp || '',
    country: row.country || '',
    followers: Number(row.followers || 0),
    followingIds: followingIds,
    orangeMoney: row.orangeMoney || row.orange_money || '',
    moovMoney: row.moovMoney || row.moov_money || '',
    products: [],
    posts: []
  };
}

// Resilient insert helper that handles case-insensitive/snake vs camel schemas automatically
async function insertResilient(tableName: string, camelCasePayload: any, snakeCasePayload: any) {
  try {
    // Try snake_case keys first (standard in postgres)
    const { data, error } = await supabase
      .from(tableName)
      .insert([snakeCasePayload])
      .select();
    
    if (!error) return data;
    
    console.warn(`Snake-case insert failed on table '${tableName}', attempting camelCase...`, error);
    
    // Fallback to camelCase keys
    const { data: camelData, error: camelError } = await supabase
      .from(tableName)
      .insert([camelCasePayload])
      .select();
      
    if (!camelError) return camelData;
    
    throw camelError;
  } catch (err) {
    console.error(`Resilient insert failed on table '${tableName}':`, err);
    throw err;
  }
}

export const dataService = {
  async getPosts(): Promise<Post[] | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapDbPost);
    } catch (err) {
      console.error('Error fetching posts:', err);
      return null;
    }
  },

  async getStories(): Promise<Story[] | null> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapDbStory);
    } catch (err) {
      console.error('Error fetching stories:', err);
      return null;
    }
  },

  async getProducts(): Promise<Product[] | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapDbProduct);
    } catch (err) {
      console.error('Error fetching products:', err);
      return null;
    }
  },

  async getShops(): Promise<Shop[] | null> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*');
      
      if (error) {
        // Handle gracefully if table doesn't exist
        console.warn('Shops table may not exist yet, returning empty list:', error);
        return [];
      }
      return (data || []).map(mapDbShop);
    } catch (err) {
      console.error('Error fetching shops:', err);
      return [];
    }
  },

  async createPost(post: Post): Promise<Post | null> {
    try {
      const camelCasePayload = {
        id: post.id,
        author: post.author,
        authorId: post.authorId,
        avatar: post.avatar,
        image: post.image,
        content: post.content,
        likes: post.likes || 0,
        commentsCount: post.commentsCount || 0,
        comments: post.comments || [],
        shares: post.shares || 0,
        timestamp: post.timestamp || "À l'instant"
      };

      const snakeCasePayload = {
        id: post.id,
        author: post.author,
        author_id: post.authorId,
        avatar: post.avatar,
        image: post.image,
        content: post.content,
        likes: post.likes || 0,
        comments_count: post.commentsCount || 0,
        comments: post.comments || [],
        shares: post.shares || 0,
        timestamp: post.timestamp || "À l'instant"
      };

      await insertResilient('posts', camelCasePayload, snakeCasePayload);
      return post;
    } catch (err) {
      console.error('Error creating post in Supabase:', err);
      return null;
    }
  },

  async createProduct(product: Product): Promise<Product | null> {
    try {
      const tagsList = product.tags || [];
      const finalDescription = (product.description || '') + 
        (tagsList.length > 0 ? `\n\n#tags:${tagsList.join(',')}` : '');

      const camelCasePayload: any = {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.image || '',
        category: product.category,
        description: finalDescription,
        fileUrl: product.fileUrl || '',
        chariowLink: product.chariowLink || '',
        views: product.views || 0,
        likes: product.likes || 0,
        tags: tagsList
      };

      const snakeCasePayload: any = {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.image || '',
        category: product.category,
        description: finalDescription,
        file_url: product.fileUrl || '',
        chariow_link: product.chariowLink || '',
        views: product.views || 0,
        likes: product.likes || 0,
        tags: tagsList
      };

      await insertResilient('products', camelCasePayload, snakeCasePayload);
      return product;
    } catch (err) {
      console.error('Error creating product in Supabase:', err);
      return null;
    }
  },

  async createStory(story: Story): Promise<Story | null> {
    try {
      const meta = {
        text: story.text || '',
        emoji: story.emoji || '',
        productLink: story.productLink || '',
        shopLink: story.shopLink || '',
        isShortVideo: story.isShortVideo || false,
        views: story.views || [],
        likes: story.likes || [],
        replies: story.replies || []
      };
      
      const finalMediaUrl = encodeStoryMetadata(story.mediaUrl, meta);

      const camelCasePayload = {
        id: story.id,
        userId: story.userId,
        userName: story.userName,
        userAvatar: story.userAvatar,
        mediaUrl: finalMediaUrl,
        type: story.type,
        timestamp: story.timestamp,
        text: meta.text,
        emoji: meta.emoji,
        productLink: meta.productLink,
        shopLink: meta.shopLink,
        views: meta.views,
        likes: meta.likes,
        replies: meta.replies,
        isShortVideo: story.isShortVideo || false
      };

      const snakeCasePayload = {
        id: story.id,
        user_id: story.userId,
        user_name: story.userName,
        user_avatar: story.userAvatar,
        media_url: finalMediaUrl,
        type: story.type,
        timestamp: story.timestamp,
        text: meta.text,
        emoji: meta.emoji,
        product_link: meta.productLink,
        shop_link: meta.shopLink,
        views: meta.views,
        likes: meta.likes,
        replies: meta.replies,
        is_short_video: story.isShortVideo || false
      };

      try {
        await insertResilient('stories', camelCasePayload, snakeCasePayload);
      } catch (insertErr) {
        console.warn("Extended story insert failed, attempting core-only fallback insert:", insertErr);
        // Fall back to writing only core columns which are guaranteed to exist
        const coreCamel = {
          id: story.id,
          userId: story.userId,
          userName: story.userName,
          userAvatar: story.userAvatar,
          mediaUrl: finalMediaUrl,
          type: story.type,
          timestamp: story.timestamp
        };
        const coreSnake = {
          id: story.id,
          user_id: story.userId,
          user_name: story.userName,
          user_avatar: story.userAvatar,
          media_url: finalMediaUrl,
          type: story.type,
          timestamp: story.timestamp
        };
        await insertResilient('stories', coreCamel, coreSnake);
      }
      
      return { ...story, mediaUrl: finalMediaUrl };
    } catch (err) {
      console.error('Error creating story in Supabase:', err);
      return null;
    }
  },

  async updateStory(id: string, story: Partial<Story>): Promise<boolean> {
    try {
      const { data, error: fetchErr } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();
      
      const currentMediaUrl = data ? (data.mediaUrl || data.media_url || '') : (story.mediaUrl || '');
      const parsedMeta = parseStoryMetadata(currentMediaUrl);

      const newMeta = {
        text: story.text !== undefined ? story.text : (parsedMeta.text || ''),
        emoji: story.emoji !== undefined ? story.emoji : (parsedMeta.emoji || ''),
        productLink: story.productLink !== undefined ? story.productLink : (parsedMeta.productLink || ''),
        shopLink: story.shopLink !== undefined ? story.shopLink : (parsedMeta.shopLink || ''),
        views: story.views !== undefined ? story.views : (parsedMeta.views || []),
        likes: story.likes !== undefined ? story.likes : (parsedMeta.likes || []),
        replies: story.replies !== undefined ? story.replies : (parsedMeta.replies || []),
        isShortVideo: story.isShortVideo !== undefined ? story.isShortVideo : (parsedMeta.isShortVideo || false)
      };

      const finalMediaUrl = encodeStoryMetadata(currentMediaUrl, newMeta);

      const camelCasePayload: any = {
        mediaUrl: finalMediaUrl,
        text: newMeta.text,
        emoji: newMeta.emoji,
        productLink: newMeta.productLink,
        shopLink: newMeta.shopLink,
        views: newMeta.views,
        likes: newMeta.likes,
        replies: newMeta.replies,
        isShortVideo: newMeta.isShortVideo
      };

      const snakeCasePayload: any = {
        media_url: finalMediaUrl,
        text: newMeta.text,
        emoji: newMeta.emoji,
        product_link: newMeta.productLink,
        shop_link: newMeta.shopLink,
        views: newMeta.views,
        likes: newMeta.likes,
        replies: newMeta.replies,
        is_short_video: newMeta.isShortVideo
      };

      const { error: snakeErr } = await supabase
        .from('stories')
        .update(snakeCasePayload)
        .eq('id', id);

      if (snakeErr) {
        const { error: camelErr } = await supabase
          .from('stories')
          .update(camelCasePayload)
          .eq('id', id);
        
        if (camelErr) {
          const { error: coreErr } = await supabase
            .from('stories')
            .update({ media_url: finalMediaUrl, mediaUrl: finalMediaUrl })
            .eq('id', id);
          
          if (coreErr) throw coreErr;
        }
      }

      return true;
    } catch (err) {
      console.error('Error updating story in Supabase:', err);
      return false;
    }
  },

  async createShop(shop: Shop): Promise<Shop | null> {
    try {
      const camelCasePayload = {
        id: shop.id,
        name: shop.name,
        avatar: shop.avatar,
        banner: shop.banner,
        bio: shop.bio,
        whatsapp: shop.whatsapp,
        country: shop.country,
        followers: shop.followers || 0,
        followingIds: shop.followingIds || [],
        orangeMoney: shop.orangeMoney || '',
        moovMoney: shop.moovMoney || ''
      };

      const snakeCasePayload = {
        id: shop.id,
        name: shop.name,
        avatar: shop.avatar,
        banner: shop.banner,
        bio: shop.bio,
        whatsapp: shop.whatsapp,
        country: shop.country,
        followers: shop.followers || 0,
        following_ids: shop.followingIds || [],
        orange_money: shop.orangeMoney || '',
        moov_money: shop.moovMoney || ''
      };

      await insertResilient('shops', camelCasePayload, snakeCasePayload);
      return shop;
    } catch (err) {
      console.error('Error creating shop in Supabase:', err);
      return null;
    }
  },

  async updateShop(shop: Shop): Promise<boolean> {
    try {
      const camelCasePayload = {
        id: shop.id,
        name: shop.name,
        avatar: shop.avatar,
        banner: shop.banner,
        bio: shop.bio,
        whatsapp: shop.whatsapp,
        country: shop.country,
        followers: shop.followers || 0,
        followingIds: shop.followingIds || [],
        orangeMoney: shop.orangeMoney || '',
        moovMoney: shop.moovMoney || ''
      };

      const snakeCasePayload = {
        id: shop.id,
        name: shop.name,
        avatar: shop.avatar,
        banner: shop.banner,
        bio: shop.bio,
        whatsapp: shop.whatsapp,
        country: shop.country,
        followers: shop.followers || 0,
        following_ids: shop.followingIds || [],
        orange_money: shop.orangeMoney || '',
        moov_money: shop.moovMoney || ''
      };

      // Upsert in shops
      const { error } = await supabase
        .from('shops')
        .upsert([snakeCasePayload]);

      if (error) {
        console.warn('Upsert snake_case failed, trying camelCase:', error);
        const { error: camelError } = await supabase
          .from('shops')
          .upsert([camelCasePayload]);
        if (camelError) throw camelError;
      }

      // Automatically update all posts by this author with new name & avatar
      try {
        await supabase
          .from('posts')
          .update({ author: shop.name, avatar: shop.avatar })
          .eq('author_id', shop.id);
      } catch (postErr) {
        try {
          await supabase
            .from('posts')
            .update({ author: shop.name, avatar: shop.avatar })
            .eq('authorId', shop.id);
        } catch (camelPostErr) {
          console.error("Failed to update posts author/avatar metadata", camelPostErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Error updating shop in Supabase:', err);
      return false;
    }
  },

  async deletePost(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting post in Supabase:', err);
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting product in Supabase:', err);
      return false;
    }
  },

  async updatePost(id: string, post: Partial<Post>): Promise<boolean> {
    try {
      // Handle camelCase and snake_case for comments / commentsCount if passed
      const payload: any = {};
      if (post.content !== undefined) payload.content = post.content;
      if (post.image !== undefined) payload.image = post.image;
      if (post.likes !== undefined) payload.likes = post.likes;
      if (post.commentsCount !== undefined) {
        payload.commentsCount = post.commentsCount;
        payload.comments_count = post.commentsCount;
      }
      if (post.comments !== undefined) {
        payload.comments = post.comments;
      }

      const { error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating post in Supabase:', err);
      return false;
    }
  },

  async deleteShop(id: string): Promise<boolean> {
    try {
      // Delete the shop
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting shop in Supabase:', err);
      return false;
    }
  },

  async deleteStory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting story in Supabase:', err);
      return false;
    }
  }
};
