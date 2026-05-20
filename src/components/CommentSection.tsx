import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, CornerDownRight, Check } from 'lucide-react';
import { Comment } from '../types';
import { notificationManager } from '../lib/notificationManager';

interface CommentSectionProps {
  comments: Comment[];
}

export default function CommentSection({ comments: initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: "comment-" + Date.now() + Math.random().toString(36).substring(2, 5),
      author: 'Moi',
      authorId: 'me',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
      content: newComment,
      likes: 0,
      timestamp: 'À l\'instant',
      replies: []
    };
    setComments([comment, ...comments]);
    setNewComment('');

    // Simulate reply notification after user comments
    setTimeout(() => {
      notificationManager.notify(
        'reply',
        'Landro Digital',
        'a répondu à votre commentaire',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=landro'
      );
    }, 4500);
  };

  return (
    <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
      {/* Input de commentaire principal */}
      <div className="flex items-center gap-3 px-4">
         <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=me" className="w-full h-full object-cover" />
         </div>
         <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4 py-2 border border-gray-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
            <input 
              type="text" 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddComment()}
              placeholder="Votre avis sur LANDRO..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-semibold text-gray-850"
            />
            <button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="text-blue-600 font-bold text-xs disabled:opacity-30 pl-2 focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Liste de commentaires */}
      <div className="flex flex-col gap-5 px-4 pb-4">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment, key?: string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(true); // Default show for responsive feed
  const [showFullText, setShowFullText] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [repliesList, setRepliesList] = useState<Comment[]>(comment.replies || []);

  const handleLikeComment = () => {
    setIsLiked(!isLiked);
  };

  const handleAddReply = () => {
    if (!replyText.trim()) return;

    const newReply: Comment = {
      id: "reply-" + Date.now() + Math.random().toString(36).substring(2, 5),
      author: 'Moi',
      authorId: 'me',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
      content: replyText,
      likes: 0,
      timestamp: 'À l\'instant',
      replies: []
    };

    setRepliesList([...repliesList, newReply]);
    setReplyText('');
    setIsReplying(false);
    setShowReplies(true);

    // Dynamic toast trigger
    notificationManager.notify(
      'comment',
      'Votre réponse',
      `a été ajoutée à ${comment.author}`,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=me'
    );
  };

  const truncatedContent = comment.content.length > 200 
    ? comment.content.substring(0, 200) + "..." 
    : comment.content;

  return (
    <div className="flex gap-3">
      <img 
        src={comment.avatar} 
        className="w-9 h-9 rounded-2xl object-cover border border-gray-100 shadow-xs flex-shrink-0" 
        referrerPolicy="no-referrer" 
      />
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="bg-gray-50/70 p-3.5 rounded-[22px] rounded-tl-none border border-gray-100">
          <h4 className="font-extrabold text-[11px] text-gray-950 mb-0.5 tracking-tight">{comment.author}</h4>
          <p className="text-xs text-gray-700 leading-normal font-medium whitespace-pre-wrap">
            {showFullText ? comment.content : truncatedContent}
            {comment.content.length > 200 && !showFullText && (
              <button 
                onClick={() => setShowFullText(true)}
                className="text-blue-600 font-extrabold ml-1 inline text-[11px]"
              >
                Voir plus
              </button>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4 px-2 select-none">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{comment.timestamp}</span>
          <button 
            onClick={handleLikeComment}
            className={`text-[9px] font-black uppercase tracking-widest transition-colors focus:outline-none ${isLiked ? 'text-blue-600' : 'text-gray-400'}`}
          >
            Liker {comment.likes + (isLiked ? 1 : 0) > 0 && `(${comment.likes + (isLiked ? 1 : 0)})`}
          </button>
          <button 
            onClick={() => setIsReplying(!isReplying)}
            className={`text-[9px] font-black uppercase tracking-widest transition-colors focus:outline-none ${isReplying ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            Répondre
          </button>
        </div>

        {/* Dynamic Nested Reply Form */}
        <AnimatePresence>
          {isReplying && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 flex items-center gap-2 pl-2"
            >
              <CornerDownRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <div className="flex-1 bg-blue-50/40 rounded-xl flex items-center px-3 py-1.5 border border-blue-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
                <input 
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddReply()}
                  placeholder={`Répondre à ${comment.author}...`}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-semibold text-gray-800 py-0.5"
                  autoFocus
                />
                <button 
                  onClick={handleAddReply}
                  disabled={!replyText.trim()}
                  className="text-indigo-600 font-black text-[10px] disabled:opacity-30 pl-2 focus:outline-none uppercase tracking-wider"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Threaded Nested replies loop list */}
        {repliesList.length > 0 && (
          <div className="mt-2 ml-2 flex flex-col gap-4 border-l border-gray-100 pl-3">
             {!showReplies ? (
               <button 
                 onClick={() => setShowReplies(true)}
                 className="text-[10px] font-black text-blue-600 text-left hover:underline uppercase tracking-wider mt-1"
               >
                 Voir les {repliesList.length} réponses
               </button>
             ) : (
               <>
                 <div className="flex flex-col gap-3">
                   {repliesList.map(reply => (
                     <CommentItem key={reply.id} comment={reply} />
                   ))}
                 </div>
                 <button 
                  onClick={() => setShowReplies(false)}
                  className="text-[9px] font-black text-gray-400 text-left uppercase tracking-widest mt-1"
                >
                  Masquer les réponses
                </button>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
