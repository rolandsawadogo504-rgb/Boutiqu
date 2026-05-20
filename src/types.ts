export interface User {
  id: string;
  name: string;
  avatar: string;
  isLoggedIn: boolean;
  hasShop: boolean;
  followingIds: string[];
  followersCount: number;
}

export interface Shop {
  id: string;
  name: string;
  avatar: string;
  banner: string;
  bio: string;
  whatsapp: string;
  country: string;
  followers: number;
  followingIds: string[];
  orangeMoney?: string;
  moovMoney?: string;
  products: Product[];
  posts: Post[];
}

export interface Post {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  image: string;
  content: string;
  likes: number;
  commentsCount: number;
  comments: Comment[];
  shares: number;
  isFollowing: boolean;
  timestamp: string;
}

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  content: string;
  likes: number;
  timestamp: string;
  replies?: Comment[];
}

export interface StoryReply {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  parentId?: string;
  likes?: string[];
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  type: 'image' | 'video';
  timestamp: number;
  text?: string;
  emoji?: string;
  productLink?: string; // Product id or external link
  shopLink?: string; // Shop id or external link
  views?: string[]; // Array of user ids who have viewed
  likes?: string[]; // Array of user ids who have liked
  replies?: StoryReply[]; // Array of story comments or answers
  isShortVideo?: boolean; // Discriminator to separate temporary stories from permanent TikTok short videos
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  fileUrl?: string;
  chariowLink?: string;
  views: number;
  likes: number;
  tags?: string[];
}

export type NotificationType = 'like' | 'follow' | 'comment' | 'reply' | 'purchase' | 'sale' | 'post';

export interface Notification {
  id: string;
  type: NotificationType;
  user: string;
  userAvatar?: string;
  action: string;
  target?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  buyerName: string;
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Report {
  id: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'user' | 'shop' | 'product';
  reporterName: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface AdminStats {
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  totalPosts: number;
  totalSales: number;
  totalRevenue: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  popularProducts: Product[];
}
