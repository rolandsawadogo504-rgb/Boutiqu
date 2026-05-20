import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, FileText, Loader } from 'lucide-react';
import { Post } from '../types';

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onSave: (updatedContent: string) => Promise<void>;
}

export default function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave(content);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl border border-gray-100"
      >
        <header className="p-6 border-b border-gray-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-lg text-gray-900 tracking-tight">Modifier la publication</h3>
          </div>
          <button onClick={onClose} disabled={saving} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Contenu de la publication</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none h-40"
              placeholder="Écrivez le contenu ici..."
              disabled={saving}
            />
          </div>
        </div>

        <footer className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 text-gray-500 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
