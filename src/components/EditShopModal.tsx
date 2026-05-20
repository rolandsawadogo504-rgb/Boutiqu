import { useState, useRef, type ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, X, Phone, Globe, CreditCard, Save, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop } from '../types';
import { uploadImageToStorage } from '../lib/storageService';

interface EditShopModalProps {
  shop: Shop;
  onClose: () => void;
  onComplete: (updatedFields: Partial<Shop>) => Promise<void>;
}

export default function EditShopModal({ shop, onClose, onComplete }: EditShopModalProps) {
  const [formData, setFormData] = useState({
    name: shop.name || '',
    bio: shop.bio || '',
    whatsapp: shop.whatsapp || '',
    country: shop.country || '',
    orangeMoney: shop.orangeMoney || '',
    moovMoney: shop.moovMoney || '',
    avatar: shop.avatar || '',
    banner: shop.banner || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>, field: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Le fichier sélectionné doit être une image.');
        return;
      }

      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        // Instant visual preview on front-end
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Le nom de la boutique est obligatoire.');
      return;
    }
    if (!formData.whatsapp.trim()) {
      setError('Le numéro WhatsApp est obligatoire.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      // 1. Upload assets to Supabase Storage if they are locally selected base64 strings
      let finalAvatar = formData.avatar;
      let finalBanner = formData.banner;

      if (formData.avatar.startsWith('data:')) {
        finalAvatar = await uploadImageToStorage(formData.avatar, 'avatars', `avatar_${shop.id}.jpg`);
      }
      if (formData.banner.startsWith('data:')) {
        finalBanner = await uploadImageToStorage(formData.banner, 'banners', `banner_${shop.id}.jpg`);
      }

      // 2. Complete and notify parent
      await onComplete({
        ...formData,
        avatar: finalAvatar,
        banner: finalBanner
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err?.message || 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const countries = [
    "Benin", "Burkina Faso", "Côte d'Ivoire", "Mali", "Niger", "Sénégal", "Togo", "Autre"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="font-black text-xl text-gray-900 tracking-tight">Modifier mon profil</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mise à jour de votre boutique</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Banner Upload Box */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Photo de Couverture</label>
            <div 
              onClick={() => !saving && bannerInputRef.current?.click()}
              className="relative h-28 bg-gray-50 rounded-2xl overflow-hidden border border-dashed border-gray-200 cursor-pointer group hover:bg-gray-100/50 transition-colors"
            >
              {formData.banner ? (
                <>
                  <img src={formData.banner} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1.5">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ajouter couverture</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={bannerInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleImageSelect(e, 'banner')} 
              disabled={saving}
            />
          </div>

          {/* Avatar Upload Box */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => !saving && avatarInputRef.current?.click()}
              className="relative w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden border border-dashed border-gray-200 cursor-pointer shrink-0 group hover:bg-gray-100/50 transition-colors"
            >
              {formData.avatar ? (
                <>
                  <img src={formData.avatar} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1">
                  <Camera className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase text-center leading-normal">Photo Profil</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Photo de profil</h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1">Recommandé : image carrée, compressée pour mobile.</p>
            </div>
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleImageSelect(e, 'avatar')} 
              disabled={saving}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nom de la Boutique</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex. Boutique d'Antonin"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Description / Bio</label>
              <textarea 
                value={formData.bio}
                onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                placeholder="Décrivez votre boutique..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none resize-none h-20"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input 
                    type="text"
                    value={formData.whatsapp}
                    onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="Ex. +226 70000000"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Pays de résidence</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.country}
                    onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none appearance-none"
                    disabled={saving}
                  >
                    <option value="">Sélectionnez</option>
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Revenus (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Orange Money</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text"
                      value={formData.orangeMoney}
                      onChange={e => setFormData(p => ({ ...p, orangeMoney: e.target.value }))}
                      placeholder="+226..."
                      className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Moov Money</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text"
                      value={formData.moovMoney}
                      onChange={e => setFormData(p => ({ ...p, moovMoney: e.target.value }))}
                      placeholder="+226..."
                      className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3.5 border border-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all text-center bg-white"
          >
            Annuler
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
