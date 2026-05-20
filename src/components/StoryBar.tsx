import { motion } from 'motion/react';
import { Plus, Sparkles } from 'lucide-react';
import { Story, User } from '../types';

interface StoryBarProps {
  stories: Story[];
  user: User;
  onViewStory: (index: number) => void;
  onCreateStory: () => void;
}

export default function StoryBar({ stories, user, onViewStory, onCreateStory }: StoryBarProps) {
  return (
    <div className="bg-white py-4.5 border-b border-gray-100/80 overflow-x-auto no-scrollbar flex items-center gap-4.5 px-5 select-none">
      {/* Create Story (Avatar with Plus icon) */}
      <motion.button 
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateStory}
        className="flex-shrink-0 flex flex-col items-center gap-2.5 outline-none font-sans"
      >
        <div className="relative">
          <div className="w-[66px] h-[66px] rounded-full p-[3px] bg-gray-50 border border-gray-150/80 shadow-xs flex items-center justify-center">
            <img 
              src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
              className="w-full h-full rounded-full object-cover border border-white"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Pulsing "+" icon badge */}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md animate-pulse">
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          </div>
        </div>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Votre Story</span>
      </motion.button>

      {/* Stories Loop */}
      {stories.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/60 rounded-2xl border border-dashed border-gray-150 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[9px] font-black text-gray-450 text-gray-400 uppercase tracking-widest leading-none">Soyez le premier à publier</span>
        </div>
      ) : (
        stories.map((story, index) => {
          // Visual styling for stories
          // Dynamic gradient border tells users this story is active and unseen
          const gradientBorder = "bg-gradient-to-tr from-rose-500 via-indigo-500 to-amber-500";
          
          return (
            <motion.button 
              key={story.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewStory(index)}
              className="flex-shrink-0 flex flex-col items-center gap-2.5 outline-none font-sans"
            >
              <div className={`w-[66px] h-[66px] rounded-full p-[2.5px] ${gradientBorder} shadow-sm active:scale-95 transition-transform duration-200`}>
                <div className="w-full h-full rounded-full p-[2px] bg-white">
                  <img 
                    src={story.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=merchant'} 
                    className="w-full h-full rounded-full object-cover border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <span className="text-[9px] font-black text-gray-900 uppercase tracking-wider truncate w-[68px] text-center leading-none">
                {story.userName.split(' ')[0]}
              </span>
            </motion.button>
          );
        })
      )}
    </div>
  );
}
