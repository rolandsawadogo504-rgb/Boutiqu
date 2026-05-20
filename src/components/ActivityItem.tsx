import { Notification, Message, Conversation } from '../types';
import { Bell, Heart, UserPlus, MessageSquare, ShoppingCart, DollarSign, Package, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export function NotificationItem({ notification }: { notification: Notification, key?: string }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'comment': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'reply': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'purchase': return <ShoppingCart className="w-5 h-5 text-green-500" />;
      case 'sale': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'post': return <Package className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className={`p-5 flex items-start gap-4 transition-all border-b border-gray-50 active:bg-gray-50 ${notification.isRead ? 'bg-white' : 'bg-blue-50/20'}`}
    >
      <div className="relative flex-shrink-0">
        {notification.userAvatar ? (
          <img 
            src={notification.userAvatar} 
            className="w-14 h-14 rounded-[20px] object-cover shadow-sm border border-gray-100" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-14 h-14 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-center">
            {getIcon()}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md p-1.5 border border-gray-50">
           {getIcon()}
        </div>
      </div>
      <div className="flex-1 pt-1">
        <p className="text-[14px] text-gray-900 leading-[1.4]">
          <span className="font-black">{notification.user}</span> {notification.action}
          {notification.target && <span className="text-blue-600 font-black"> « {notification.target} »</span>}
        </p>
        <p className="text-[10px] font-black text-gray-300 uppercase mt-1.5 tracking-widest">{notification.timestamp}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {!notification.isRead && (
          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30" />
        )}
      </div>
    </motion.div>
  );
}

export function ConversationItem({ conversation, onClick }: { conversation: Conversation, onClick: () => void, key?: string }) {
  return (
    <motion.button 
      initial={{ opacity: 0, x: 10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      onClick={onClick}
      className={`w-full p-5 flex items-center gap-4 transition-all border-b border-gray-50 active:bg-gray-50 hover:bg-gray-50/50 ${conversation.unreadCount > 0 ? 'bg-blue-50/10' : 'bg-white'}`}
    >
      <div className="relative flex-shrink-0">
        <img 
          src={conversation.participantAvatar} 
          alt={conversation.participantName} 
          className="w-16 h-16 rounded-[24px] object-cover border border-gray-100 shadow-sm"
          referrerPolicy="no-referrer"
        />
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-red-500 rounded-full flex items-center justify-center px-1.5 border-[3px] border-white shadow-lg z-10">
            <span className="text-[10px] font-black text-white">{conversation.unreadCount}</span>
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white shadow-sm" />
      </div>
      <div className="flex-1 min-w-0 text-left pt-1">
        <div className="flex justify-between items-baseline mb-1">
          <h4 className="font-black text-[16px] text-gray-900 truncate">{conversation.participantName}</h4>
          <span className="text-[10px] font-black text-gray-300 flex-shrink-0 ml-2 uppercase tracking-tighter">{conversation.timestamp}</span>
        </div>
        <p className={`text-[13px] truncate ${conversation.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
          {conversation.lastMessage}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-200 ml-2" />
    </motion.button>
  );
}

export function MessageBubble({ message }: { message: Message, key?: string }) {
  return (
    <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div className={`max-w-[80%] flex items-end gap-2 ${message.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!message.isMe && (
          <img src={message.avatar} className="w-7 h-7 rounded-full mb-1 flex-shrink-0" />
        )}
        <div className={`p-4 rounded-[24px] ${
          message.isMe 
            ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/20' 
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}>
          <p className="text-sm leading-relaxed">{message.text}</p>
          <p className={`text-[9px] mt-1 font-bold ${message.isMe ? 'opacity-50 text-white' : 'text-gray-400'}`}>
            {message.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}
