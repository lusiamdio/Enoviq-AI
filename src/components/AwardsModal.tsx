import { motion } from 'motion/react';
import { X, Trophy, Star, Map } from 'lucide-react';
import { AWARDED_ESTATES, TOP_PRODUCERS } from '../data/awardedEstates';

export default function AwardsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[70] bg-wine-900 overflow-y-auto hide-scrollbar flex flex-col"
    >
      <div className="p-6 flex justify-between items-center bg-wine-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-glass-border">
        <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Trophy className="text-gold-500" /> 2026 Awards
        </h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-glass border border-glass-border flex items-center justify-center text-white hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        <section>
          <h3 className="text-xl font-serif font-medium text-gold-500 mb-4 flex items-center gap-2">
            <Star size={18} /> Top-Tier Global Estates
          </h3>
          <div className="space-y-3">
            {AWARDED_ESTATES.filter(e => e.category.includes('global')).map((estate, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-xl">
                <h4 className="font-medium text-ivory text-lg">{estate.name}</h4>
                <p className="text-sm text-gray-400 mb-2">{estate.region}</p>
                <p className="text-sm text-gold-400 bg-gold-500/10 inline-block px-2 py-1 rounded">{estate.recognition}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-serif font-medium text-gold-500 mb-4 flex items-center gap-2">
            <Map size={18} /> Leading Tourism Wineries
          </h3>
          <div className="space-y-3">
            {AWARDED_ESTATES.filter(e => e.category.includes('tourism')).map((estate, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-xl">
                <h4 className="font-medium text-ivory text-lg">{estate.name}</h4>
                <p className="text-sm text-gray-400 mb-2">{estate.region}</p>
                <p className="text-sm text-gold-400 bg-gold-500/10 inline-block px-2 py-1 rounded">{estate.recognition}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-serif font-medium text-gold-500 mb-4 flex items-center gap-2">
            <Trophy size={18} /> Top Producers & Hall of Fame
          </h3>
          <div className="space-y-3">
            {TOP_PRODUCERS.map((producer, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-xl">
                <h4 className="font-medium text-ivory text-lg">{producer.name}</h4>
                <p className="text-sm text-gold-400 bg-gold-500/10 inline-block px-2 py-1 rounded mb-2">{producer.recognition}</p>
                <p className="text-sm text-gray-400"><span className="text-gray-300">Associated:</span> {producer.associated}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
