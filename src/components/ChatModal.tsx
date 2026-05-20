import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Phone, MoreVertical, Search, ArrowLeft } from 'lucide-react';
import { Conversation, Message } from '../types';
import { MessageBubble } from './ActivityItem';

interface ChatModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export default function ChatModal({ conversation, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: 'Moi',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
      text: inputText,
      timestamp: 'Maintenant',
      isMe: true,
      isRead: true
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-white z-[120] flex flex-col"
    >
      <header className="h-16 border-b border-gray-100 px-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
              <img src={conversation.participantAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900">{conversation.participantName}</h3>
              <p className="text-[10px] font-bold text-green-500 uppercase">En ligne</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-400"><Phone className="w-5 h-5" /></button>
          <button className="p-2 text-gray-400"><Search className="w-5 h-5" /></button>
          <button className="p-2 text-gray-400"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-6 bg-gray-50/50">
        <div className="flex flex-col">
          <div className="text-center mb-8">
             <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase shadow-sm border border-gray-50">Aujourd'hui</span>
          </div>
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      </div>

      <footer className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 bg-gray-50 rounded-[24px] p-1 pr-3">
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrire un message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-3 px-4"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
