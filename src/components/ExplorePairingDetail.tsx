import React from 'react';
import { ChevronLeft, Sparkles, Utensils, Wine, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ExplorePairingDetail({ pairing, onBack, onNavigate }: { pairing: any, onBack: () => void, onNavigate: (tab: string, state?: any) => void }) {
  if (!pairing) return null;

  const wineList = pairing.wines.split(',').map((w: string) => w.trim());

  return (
    <div className="min-h-screen bg-[#0B0F14] text-ivory pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-ivory/10">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-serif">{pairing.title}</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-gold-500/30">
            <Utensils size={14} /> {pairing.mood}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ivory mb-4">{pairing.title}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">{pairing.description}</p>
        </motion.div>

        <div className="bg-glass border border-glass-border rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl" />
          <h2 className="text-2xl font-serif font-semibold mb-4 text-gold-500 flex items-center gap-3 relative z-10">
            <Sparkles size={24} /> Why this works
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed relative z-10">{pairing.explanation}</p>
        </div>

        <h3 className="text-2xl font-serif font-semibold mb-6 flex items-center gap-3">
          <Wine size={24} className="text-red-400" /> Recommended Styles
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {wineList.map((wine: string, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors group cursor-pointer"
              onClick={() => onNavigate('discover', { query: wine })}
            >
              <div>
                <h4 className="text-xl font-serif font-semibold text-ivory mb-2 group-hover:text-gold-500 transition-colors">{wine}</h4>
                <p className="text-sm text-gray-400">Discover premium selections matching this profile.</p>
              </div>
              <button 
                className="mt-6 flex items-center gap-2 text-gold-500 font-medium group-hover:translate-x-1 transition-transform"
              >
                Find Bottles <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
