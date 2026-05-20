import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLogin({ onClose, onSuccess }: AdminLoginProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Simulate real high-security decryption check
    setTimeout(() => {
      if (code === '7515') {
        // Protect administratively using instant Session Tokens
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center mb-6 border border-blue-100">
             <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">Accès Administrateur</h2>
          <p className="text-sm text-gray-400 font-medium mb-8">Veuillez entrer votre code de sécurité pour accéder au tableau de bord LANDRO.</p>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="relative">
              <input 
                type="password" 
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••"
                className={`w-full bg-gray-50 border-2 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] transition-all focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none ${error ? 'border-red-200 text-red-500' : 'border-gray-100 text-gray-900 focus:border-blue-500'}`}
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-1.5 text-red-500"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Code incorrect</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={code.length < 4 || loading}
                className={`flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center`}
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
    </motion.div>
  );
}
