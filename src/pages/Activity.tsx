import { useState } from 'react';
import { MOCK_NOTIFICATIONS, MOCK_CONVERSATIONS } from '../constants';
import { NotificationItem, ConversationItem } from '../components/ActivityItem';
import { motion, AnimatePresence } from 'motion/react';
import ChatModal from '../components/ChatModal';
import { Conversation } from '../types';

export default function Activity() {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'messages'>('notifications');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Total unread for the badge in the UI
  const unreadMessages = MOCK_CONVERSATIONS.reduce((acc, conv) => acc + conv.unreadCount, 0);
  const unreadNotifications = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-20 min-h-screen bg-white"
    >
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Activité</h1>
      </div>

      <div className="px-4 mb-2 sticky top-0 bg-white/80 backdrop-blur-md z-10 py-2">
        <div className="flex bg-gray-100 p-1.5 rounded-[24px]">
          <button 
            onClick={() => setActiveSubTab('notifications')}
            className={`flex-1 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSubTab === 'notifications' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400'}`}
          >
            Notifications
            {unreadNotifications > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px]">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveSubTab('messages')}
            className={`flex-1 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSubTab === 'messages' ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400'}`}
          >
            Messages
            {unreadMessages > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px]">
                {unreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50 bg-white">
        {activeSubTab === 'notifications' ? (
          <>
            {MOCK_NOTIFICATIONS.length > 0 ? (
              MOCK_NOTIFICATIONS.map(notif => (
                <NotificationItem key={notif.id} notification={notif} />
              ))
            ) : (
                <EmptyState icon="🔔" title="Aucune notification" details="Vos interactions apparaîtront ici." />
            )}
          </>
        ) : (
          <>
            {MOCK_CONVERSATIONS.length > 0 ? (
              MOCK_CONVERSATIONS.map(conv => (
                <ConversationItem 
                  key={conv.id} 
                  conversation={conv} 
                  onClick={() => setSelectedConversation(conv)}
                />
              ))
            ) : (
                <EmptyState icon="💬" title="Aucun message" details="Commencez une conversation avec un vendeur ou un expert." />
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedConversation && (
          <ChatModal 
            conversation={selectedConversation} 
            onClose={() => setSelectedConversation(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyState({ icon, title, details }: { icon: string, title: string, details: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
      <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6 border border-gray-100">
         <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="font-black text-xl text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-[200px] leading-relaxed">{details}</p>
    </div>
  );
}
