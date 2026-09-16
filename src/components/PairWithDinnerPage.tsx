import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, Utensils, ArrowRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import ExplorePairingDetail from './ExplorePairingDetail';

export default function PairWithDinnerPage({ onBack, onNavigate }: { onBack: () => void, onNavigate: (tab: string, state?: any) => void }) {
  const [selectedPairing, setSelectedPairing] = useState<any>(null);

  const pairings = [
    {
      title: "Braai Night",
      description: "Grilled meats, boerewors, smoky BBQ flavors",
      wines: "Pinotage, Syrah, Cabernet Sauvignon",
      mood: "Bold & Smoky",
      explanation: "The smoke and char of the meat perfectly matches the spicy, dark fruit notes of Syrah and the earthy, roasted profile of Pinotage, while tannins cut through the fat."
    },
    {
      title: "Seafood Dinner",
      description: "Prawns, line fish, calamari, light citrus dishes",
      wines: "Sauvignon Blanc, Chenin Blanc, Cap Classique",
      mood: "Fresh & Crisp",
      explanation: "High acidity in Sauvignon Blanc highlights the freshness of seafood, while the bubbles in Cap Classique act as a fantastic palate cleanser for fried or rich dishes."
    },
    {
      title: "Spicy African Feast",
      description: "Jollof rice, curries, peri-peri dishes",
      wines: "Off-dry Chenin Blanc, Riesling, light Pinotage",
      mood: "Balanced Heat",
      explanation: "Off-dry wines have a slight sweetness that cools the palate and balances the heat of the spices without adding bitterness or clashing with the flavors."
    },
    {
      title: "Luxury Fine Dining",
      description: "Steak, lamb, rich sauces, gourmet cuisine",
      wines: "Cabernet Sauvignon, Bordeaux blends, Merlot",
      mood: "Elegant & Structured",
      explanation: "Structured tannins and complex dark fruit flavors in Bordeaux blends complement rich sauces and the heavy proteins in steak and lamb."
    },
    {
      title: "Vegetarian Table",
      description: "Roasted vegetables, salads, plant-based dishes",
      wines: "Chenin Blanc, Chardonnay, Rosé",
      mood: "Light & Vibrant",
      explanation: "Lighter, vibrant wines like Rosé and unoaked Chardonnay enhance the fresh, earthy flavors of roasted vegetables without overpowering them."
    },
    {
      title: "Dessert & Cheese",
      description: "Chocolate, pastries, aged cheeses",
      wines: "Vin de Constance, Late Harvest Chenin, Moscato",
      mood: "Sweet & Indulgent",
      explanation: "The wine must always be sweeter than the dessert itself. Rich, honeyed late harvest wines complement both sugary sweets and the savory richness of aged cheeses."
    },
  ];

  if (selectedPairing) {
    return <ExplorePairingDetail pairing={selectedPairing} onBack={() => setSelectedPairing(null)} onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-32 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-md px-4 py-4 mb-6 flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-serif">Pair With Dinner</h1>
      </div>

      <div className="max-w-5xl mx-auto text-center mb-10 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif font-bold text-ivory mb-2"
        >
          Curated Pairings
        </motion.h1>
        <p className="text-gray-400 mt-2">
          Discover the perfect South African wine for every meal
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
        {pairings.map((item, index) => (
          <PairingCard key={index} item={item} index={index} onNavigate={onNavigate} onSelect={() => setSelectedPairing(item)} />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto text-center mt-12 px-6">
        <p className="text-gray-400 mb-4">
          Want a personalized pairing for your dinner?
        </p>
        <button 
          onClick={() => onNavigate('pairing-engine')}
          className="bg-gold-500 text-wine-900 font-medium py-3 px-8 rounded-xl hover:bg-gold-400 transition-colors"
        >
          Build My Wine Pairing
        </button>
      </div>
    </div>
  );
}

function PairingCard({ item, index, onNavigate, onSelect }: { key?: React.Key, item: any, index: number, onNavigate: (tab: string, state?: any) => void, onSelect: () => void }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const wineList = item.wines.split(',').map((w: string) => w.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <div className="bg-white/5 border border-white/10 rounded-2xl hover:border-gold-500/30 transition-all duration-300 h-full flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-gold-500">
            <Utensils size={18} />
            <span className="text-xs uppercase tracking-widest font-semibold tracking-wide">
              {item.mood}
            </span>
          </div>

          <h2 className="text-xl font-serif font-semibold mb-2">
            {item.title}
          </h2>

          <p className="text-gray-400 text-sm mb-4">
            {item.description}
          </p>

          <div className="flex items-start gap-2 text-sm text-gray-300 mb-4">
            <Wine size={16} className="mt-0.5 text-red-400 flex-shrink-0" />
            <div className="flex flex-wrap gap-x-1.5 gap-y-1">
              {wineList.map((wine: string, i: number) => (
                <button
                  key={i}
                  onClick={() => onNavigate('discover', { query: wine })}
                  className="hover:text-gold-500 underline underline-offset-2 decoration-white/20 hover:decoration-gold-500/50 transition-colors text-left"
                >
                  {wine}{i < wineList.length - 1 ? ',' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex-1">
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs flex items-center gap-1 text-gold-500/70 hover:text-gold-500 transition-colors font-medium"
            >
              {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Why this works
            </button>
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-gray-400 mt-2 bg-black/20 p-3 rounded-lg border border-white/5">
                    {item.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={onSelect}
            className="mt-auto w-full bg-white text-black hover:bg-gray-200 py-3 rounded-xl flex items-center justify-center font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
          >
            Explore Pairing <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
