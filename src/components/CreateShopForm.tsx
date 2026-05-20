import { useState, useRef, type ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, ArrowRight, Check, Phone, Globe, CreditCard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../lib/imageCompressor';

interface CreateShopFormProps {
  onClose: () => void;
  onComplete: (shopData: any) => void;
  key?: string;
}

export default function CreateShopForm({ onClose, onComplete }: CreateShopFormProps) {
  const [step, setStep] = useState(1);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    category: '',
    whatsapp: '',
    country: '',
    orangeMoney: '',
    moovMoney: '',
    avatar: '',
    banner: ''
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setValidationError("Le fichier doit être une image valide.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setValidationError('');
        try {
          const rawResult = reader.result as string;
          // Dynamically compress for maximum performance on mid/low-spec mobile Androids
          const compressed = await compressImage(rawResult, 800, 800, 0.7);
          setFormData(prev => ({ ...prev, [field]: compressed }));
        } catch (error) {
          console.error("Compression error:", error);
          setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setValidationError('');
    if (currentStep === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 3) {
        setValidationError('Le nom de la boutique doit comporter au moins 3 caractères.');
        return false;
      }
      if (!formData.bio.trim() || formData.bio.trim().length < 10) {
        setValidationError('La description doit comporter au moins 10 caractères.');
        return false;
      }
      if (!formData.category) {
        setValidationError('Veuillez sélectionner une catégorie pour votre boutique.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.whatsapp.trim()) {
        setValidationError('Veuillez renseigner un numéro WhatsApp de contact.');
        return false;
      }
      // Simple phone number validation
      const cleanPhone = formData.whatsapp.replace(/\s+/g, '');
      if (cleanPhone.length < 8) {
        setValidationError('Le numéro WhatsApp de contact est incorrect (minimum 8 chiffres).');
        return false;
      }
      if (!formData.country) {
        setValidationError('Veuillez sélectionner votre pays.');
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.country === 'Burkina Faso') {
        const cleanOm = formData.orangeMoney.replace(/\s+/g, '');
        const cleanMoov = formData.moovMoney.replace(/\s+/g, '');
        if (!cleanOm && !cleanMoov) {
          setValidationError('Veuillez configurer au moins un numéro Orange Money ou Moov Money pour recevoir vos paiements.');
          return false;
        }
        if (cleanOm && cleanOm.length < 8) {
          setValidationError('Le numéro Orange Money est invalide (minimum 8 chiffres).');
          return false;
        }
        if (cleanMoov && cleanMoov.length < 8) {
          setValidationError('Le numéro Moov Money est invalide (minimum 8 chiffres).');
          return false;
        }
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };
  
  const prevStep = () => {
    setValidationError('');
    setStep(s => s - 1);
  };

  const countries = [
    "Benin", "Burkina Faso", "Côte d'Ivoire", "Mali", "Niger", "Sénégal", "Togo", "Autre"
  ];

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      <header className="h-16 border-b border-gray-100 px-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold">Créer ma boutique</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Étape {step} sur 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-blue-600' : 'bg-gray-100'}`} />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Identité de votre boutique</h2>
              
              <div className="relative mb-12">
                <div 
                  className="w-full h-32 bg-gray-50 rounded-2xl overflow-hidden mb-12 relative cursor-pointer group"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {formData.banner ? (
                    <img src={formData.banner} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase">Bannière</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" />
                  </div>
                </div>

                <div 
                  className="absolute -bottom-8 left-6 w-20 h-20 bg-white rounded-full p-1 shadow-xl cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center relative">
                    {formData.avatar ? (
                      <img src={formData.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white w-4 h-4" />
                    </div>
                  </div>
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nom de la boutique</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Landro Digital Store"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bio / Description</label>
                  <textarea 
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Décrivez votre boutique en quelques mots..."
                    rows={3}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Catégorie</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="Digital">Digital (Formations, E-books)</option>
                    <option value="Mode">Mode & Beauté</option>
                    <option value="High Tech">High Tech & Électronique</option>
                    <option value="Service">Services & Freelance</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Contact & Localisation</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Numéro WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="tel" 
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      placeholder="+226 XX XX XX XX"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Pays</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select 
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Sélectionnez un pays</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Configuration Paiements</h2>
              
              {formData.country === 'Burkina Faso' ? (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500 leading-relaxed">Veuillez configurer vos numéros de réception pour les paiements locaux au Burkina Faso.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Numéro Orange Money</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                        <input 
                          type="tel" 
                          value={formData.orangeMoney}
                          onChange={e => setFormData({...formData, orangeMoney: e.target.value})}
                          placeholder="Numéro Orange Money"
                          className="w-full bg-orange-50/30 border border-orange-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-blue-800 uppercase tracking-wider ml-1">Numéro Moov Money</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                        <input 
                          type="tel" 
                          value={formData.moovMoney}
                          onChange={e => setFormData({...formData, moovMoney: e.target.value})}
                          placeholder="Numéro Moov Money"
                          className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-3xl text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Paiements Internationaux</h3>
                  <p className="text-sm text-gray-500">Pour le pays sélectionné ({formData.country || 'Non défini'}), les paiements seront gérés via notre passerelle internationale sécurisée.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {validationError && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mx-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wide"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="p-6 border-t border-gray-100 flex gap-4">
        {step > 1 && (
          <button 
            onClick={prevStep}
            className="w-16 h-14 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <button 
          onClick={step === 3 ? () => {
            if (validateStep(3)) {
              onComplete(formData);
            }
          } : nextStep}
          className="flex-1 bg-gray-900 text-white rounded-2xl h-14 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {step === 3 ? (
            <>
              Terminer <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              Suivant <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
