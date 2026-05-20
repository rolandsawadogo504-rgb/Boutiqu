import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface AdminActionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export default function AdminActionModal({ onClose, onSuccess, actionTitle = "Action Sécurisée" }: AdminActionModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (code === '7515') {
        sessionStorage.setItem('landro_admin_session_payload', 'landro_auth_granted_' + Date.now());
        onSuccess();
      } else {
        setError(true);
        setLoading(false);
        setCode('');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-sm bg-white rounded-[36px] shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-[22px] flex items-center justify-center mb-6 border border-red-100">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          </div>

          <h3 className="text-xl font-black text-gray-900 tracking-tight">{actionTitle}</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Sécurité LANDRO DIGITAL</p>
          
          <p className="text-xs text-gray-405 font-medium leading-relaxed mt-4 mb-6">
            Cette action nécessite une autorisation de niveau Administrateur. Veuillez composer le code de sécurité à 4 chiffres.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="relative">
              <input 
                type="password" 
                maxLength={4}
                value={code}
                onChange={(e) => {
                  setError(false);
                  setCode(e.target.value);
                }}
                placeholder="••••"
                className={`w-full bg-gray-50 border-2 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] transition-all focus:ring-4 focus:ring-red-100 focus:bg-white outline-none ${error ? 'border-red-300 text-red-600' : 'border-gray-100 text-gray-900 focus:border-red-500'}`}
                autoFocus
                disabled={loading}
              />
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-1.5 text-red-600 font-bold"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Code incorrect - Accès refusé</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all text-center border border-gray-100"
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={code.length < 4 || loading}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
