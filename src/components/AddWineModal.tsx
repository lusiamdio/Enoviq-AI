import { motion } from 'motion/react';
import { X, Camera, Search, Edit3 } from 'lucide-react';

export default function AddWineModal({ onClose, onSelectOption }: { onClose: () => void, onSelectOption: (option: 'scan' | 'search' | 'manual') => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-wine-900 border border-glass-border rounded-3xl p-6 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-ivory transition-colors">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-serif font-semibold mb-6">Add to Collection</h2>
        
        <div className="space-y-3">
          <button 
            onClick={() => onSelectOption('scan')}
            className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
              <Camera size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-ivory text-lg">Scan Label</h3>
              <p className="text-sm text-gray-400">Use AI to identify the wine</p>
            </div>
          </button>

          <button 
            onClick={() => onSelectOption('search')}
            className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Search size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-ivory text-lg">Search Wine</h3>
              <p className="text-sm text-gray-400">Find it in our database</p>
            </div>
          </button>

          <button 
            onClick={() => onSelectOption('manual')}
            className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <Edit3 size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-ivory text-lg">Manual Entry</h3>
              <p className="text-sm text-gray-400">Type in the details yourself</p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
