import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, UserPlus, ShoppingBag, Bell, X } from 'lucide-react';
import { Notification } from '../types';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment':
      case 'reply': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'purchase':
      case 'sale': return <ShoppingBag className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, x: 50 }}
      className="fixed top-6 right-6 z-[300] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-4 w-full max-w-[320px] pointer-events-auto"
    >
      <div className="flex gap-4">
        <div className="relative">
          <img 
            src={notification.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=system'} 
            className="w-12 h-12 rounded-2xl object-cover border border-gray-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-gray-900 tracking-tight truncate">
            {notification.user}
          </h4>
          <p className="text-xs text-gray-400 font-bold leading-tight">
            {notification.action}
          </p>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 block">
            {notification.timestamp}
          </span>
        </div>

        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-50 rounded-lg transition-colors h-fit"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </motion.div>
  );
}
