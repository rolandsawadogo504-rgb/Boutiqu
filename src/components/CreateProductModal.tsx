import { useState, useRef, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, FileText, Link as LinkIcon, Send, Camera, DollarSign, AlertCircle, Tag } from 'lucide-react';
import { Product } from '../types';
import { compressImage } from '../lib/imageCompressor';

interface CreateProductModalProps {
  onClose: () => void;
  onComplete: (productData: Partial<Product>) => void;
}

export default function CreateProductModal({ onClose, onComplete }: CreateProductModalProps) {
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    file: null as File | null,
    chariowLink: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = (tagStr: string) => {
    const cleanTag = tagStr.trim().replace(/[#,]/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(currentTag);
      setCurrentTag('');
    }
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setValidationError("Veuillez charger un fichier image valide.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setValidationError('');
        try {
          const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
          setFormData(prev => ({ ...prev, image: compressed }));
        } catch (error) {
          console.error("Compression failed:", error);
          setFormData(prev => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setValidationError("Sécurité Produit: Seuls les fichiers au format PDF sont acceptés pour la vente sécurisée.");
        return;
      }
      setValidationError('');
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = () => {
    setValidationError('');
    
    if (!formData.image) {
      setValidationError("Une image de couverture est obligatoire pour publier un produit.");
      return;
    }
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setValidationError("Le nom du produit doit contenir au moins 3 caractères.");
      return;
    }
    const numPrice = parseInt(formData.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setValidationError("Le prix doit être un entier positif (FCFA).");
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setValidationError("Veuillez fournir une description claire de votre produit digital (minimum 10 caractères).");
      return;
    }
    if (!formData.file && !formData.chariowLink.trim()) {
      setValidationError("Sécurité Produit: Vous devez soit charger un fichier PDF, soit renseigner un lien Chariow sécurisé.");
      return;
    }

    onComplete({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: numPrice,
      image: formData.image,
      category: 'E-book',
      chariowLink: formData.chariowLink.trim(),
      tags: tags
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[110] p-4 flex items-center justify-center backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-xl">Nouveau Produit</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Image Cover */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Image de couverture</label>
            <div 
              onClick={() => imageInputRef.current?.click()}
              className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 cursor-pointer overflow-hidden relative group"
            >
              {formData.image ? (
                <img src={formData.image} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase">Ajouter une image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white" />
              </div>
            </div>
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nom du produit</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Guide de Marketing Digital"
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Prix (FCFA)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  placeholder="Ex: 5000"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Décrivez ce que contient votre produit..."
                rows={3}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mots-clés (Tags) de découvrabilité</label>
              <div className="flex flex-wrap gap-1.5 p-3 min-h-[48px] bg-gray-50 rounded-2xl border border-gray-100/50">
                {tags.length === 0 ? (
                  <span className="text-xs text-gray-300 font-medium italic self-center pl-1">Aucun mot-clé ajouté</span>
                ) : (
                  tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-400 hover:text-blue-800 font-extrabold focus:outline-none text-[8px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={currentTag}
                    onChange={e => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Écrire un mot-clé (ex: Formation, Ebook)"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300 placeholder:font-medium text-gray-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentTag.trim()) {
                      handleAddTag(currentTag);
                      setCurrentTag('');
                    }
                  }}
                  className="px-4 bg-gray-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-black active:scale-95 transition-all"
                >
                  Ajouter
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1 animate-pulse">Suggestions de découvrabilité</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Ebook', 'Formation', 'Marketing', 'SaaS', 'Digital', 'Excel', 'Coaching', 'IA'].map(sug => {
                    const isSelected = tags.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleAddTag(sug)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide transition-all border ${
                          isSelected 
                            ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-150 text-gray-600 hover:bg-gray-50 hover:border-gray-200 cursor-pointer'
                        }`}
                      >
                        + {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Upload PDF</label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-colors ${formData.file ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                  >
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-bold truncate">
                      {formData.file ? formData.file.name : 'Choisir un fichier'}
                    </span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Lien Chariow (Optionnel)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={formData.chariowLink}
                      onChange={e => setFormData({...formData, chariowLink: e.target.value})}
                      placeholder="Lien externe..."
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-10 pr-4 text-[10px] focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 space-y-4">
          <AnimatePresence>
            {validationError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2.5 text-xs font-black uppercase tracking-wide leading-relaxed"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{validationError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handleSubmit}
            className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 shadow-xl transition-all"
          >
            Publier le produit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
