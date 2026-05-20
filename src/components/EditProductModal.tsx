import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Tag, Loader } from 'lucide-react';
import { Product } from '../types';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedFields: Partial<Product>) => Promise<void>;
}

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price,
    category: product.category,
    description: product.description || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim() || formData.price <= 0) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const categories = ["E-book", "Template", "Service", "Autre"];

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
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-lg text-gray-900 tracking-tight">Modifier le produit</h3>
          </div>
          <button onClick={onClose} disabled={saving} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nom du produit</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex. Guide Freelancing"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-950 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Prix (FCFA)</label>
              <input 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                placeholder="Ex. 5000"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-950 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-950 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none appearance-none"
                disabled={saving}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Décrivez votre produit..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none resize-none h-24"
              disabled={saving}
            />
          </div>
        </div>

        <footer className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 text-gray-500 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all text-center"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !formData.name.trim() || formData.price <= 0}
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
