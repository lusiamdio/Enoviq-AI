import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Flame, Fish, Leaf, Wind, Droplet, Heart, Wine, Search, Sparkles, Utensils, CheckCircle2 } from 'lucide-react';

// --- DATA MODELS ---
const FOOD_OPTIONS = [
  { id: 'braai', label: 'Braai / BBQ', desc: 'Grilled meat, smoke & char', icon: Flame, target: { tannin: +0.4, body: +0.4, acidity: 0 } },
  { id: 'seafood', label: 'Seafood', desc: 'Fish, prawns, light citrus', icon: Fish, target: { tannin: -0.4, body: -0.3, acidity: +0.4 } },
  { id: 'spicy', label: 'Spicy African', desc: 'Jollof, curries, heat', icon: Flame, target: { sweetness: +0.3, tannin: -0.4, body: -0.2 } },
  { id: 'fine', label: 'Luxury Dining', desc: 'Steak, rich sauces', icon: Utensils, target: { tannin: +0.3, body: +0.4, acidity: +0.1 } },
  { id: 'veg', label: 'Vegetarian', desc: 'Roasted veg, plant-based', icon: Leaf, target: { tannin: -0.2, body: -0.2, acidity: +0.2 } },
  { id: 'sweet', label: 'Dessert & Cheese', desc: 'Chocolate, aged cheese', icon: Heart, target: { sweetness: +0.6, acidity: +0.2 } }
];

const TASTE_OPTIONS = [
  { id: 'light', label: 'Light & Fresh', desc: 'High acid, easy drinking', icon: Wind, target: { body: -0.3, acidity: +0.3, tannin: -0.3 } },
  { id: 'bold', label: 'Bold & Heavy', desc: 'High tannin, full body', icon: Droplet, target: { body: +0.4, tannin: +0.4 } },
  { id: 'smooth', label: 'Smooth & Fruity', desc: 'Low tannin, fruit forward', icon: Wine, target: { tannin: -0.4, sweetness: +0.1 } },
  { id: 'indulgent', label: 'Sweet & Indulgent', desc: 'Off-dry to sweet', icon: Heart, target: { sweetness: +0.5, body: +0.2 } }
];

const VIBE_OPTIONS = [
  { id: 'casual', label: 'Casual', desc: 'Everyday drinking, easy' },
  { id: 'date', label: 'Date Night', desc: 'Impressive but approachable' },
  { id: 'luxury', label: 'Luxury', desc: 'Premium, rare & collectible' },
  { id: 'party', label: 'Party / Braai', desc: 'Crowd pleasers, fun' }
];

const WINE_DB = [
  // RED WINES
  { name: "Kanonkop Pinotage", producer: "Kanonkop", region: "Stellenbosch", type: "Red", varietal: "Pinotage", profile: { sweetness: 0.1, acidity: 0.6, tannin: 0.7, body: 0.8 }, flavors: ["smoky","dark fruit","earth"], pairing_tags: ["grilled","braai"], price_range: "R800+", why: "Its smoky, earthy profile and structured tannins perfectly complement grilled meats and robust flavors." },
  { name: "Meerlust Rubicon", producer: "Meerlust", region: "Stellenbosch", type: "Red", varietal: "Bordeaux Blend", profile: { sweetness: 0.1, acidity: 0.6, tannin: 0.8, body: 0.9 }, flavors: ["dark fruit","earth","spice"], pairing_tags: ["steak","fine dining"], price_range: "R800+", why: "A quintessential Bordeaux blend whose dark fruit and spice elegantly handle rich sauces and fine dining." },
  { name: "Rust en Vrede Estate", producer: "Rust en Vrede", region: "Stellenbosch", type: "Red", varietal: "Cabernet Blend", profile: { sweetness: 0.1, acidity: 0.5, tannin: 0.8, body: 0.9 }, flavors: ["dark fruit","oak","spice"], pairing_tags: ["steak"], price_range: "R800+", why: "Massive dark fruit and integrated oak tannins cut through fatty steak marvelously." },
  { name: "Spier Seaward Shiraz", producer: "Spier", region: "Coastal", type: "Red", varietal: "Shiraz", profile: { sweetness: 0.1, acidity: 0.5, tannin: 0.6, body: 0.7 }, flavors: ["pepper","spice","dark fruit"], pairing_tags: ["grilled","spicy"], price_range: "R300-R800", why: "Spicy pepper notes naturally harmonize with spicy African cuisine and flame-grilled dishes." },
  { name: "Fairview Pinotage", producer: "Fairview", region: "Paarl", type: "Red", varietal: "Pinotage", profile: { sweetness: 0.1, acidity: 0.5, tannin: 0.6, body: 0.7 }, flavors: ["smoky","berry"], pairing_tags: ["braai"], price_range: "R100-R300", why: "An accessible, juicy Pinotage with enough smokiness to elevate casual braai flavors." },
  // WHITE WINES
  { name: "Ken Forrester FMC", producer: "Ken Forrester", region: "Stellenbosch", type: "White", varietal: "Chenin Blanc", profile: { sweetness: 0.3, acidity: 0.7, tannin: 0.0, body: 0.8 }, flavors: ["honey","tropical"], pairing_tags: ["spicy","rich"], price_range: "R800+", why: "Richness and a touch of residual sugar cool down spicy dishes while matching heavy culinary weights." },
  { name: "Spier Signature Sauvignon Blanc", producer: "Spier", region: "Coastal", type: "White", varietal: "Sauvignon Blanc", profile: { sweetness: 0.1, acidity: 0.8, tannin: 0.0, body: 0.5 }, flavors: ["citrus","green"], pairing_tags: ["seafood"], price_range: "R100-R300", why: "Zesty citrus notes and high acidity act like a squeeze of fresh lemon over seafood." },
  { name: "Tokara Chardonnay", producer: "Tokara", region: "Stellenbosch", type: "White", varietal: "Chardonnay", profile: { sweetness: 0.2, acidity: 0.6, tannin: 0.0, body: 0.7 }, flavors: ["butter","apple"], pairing_tags: ["creamy"], price_range: "R300-R800", why: "A slightly buttery, well-rounded profile fits seamlessy with creamy or richer vegetarian dishes." },
  // SPARKLING
  { name: "Graham Beck Brut", producer: "Graham Beck", region: "Western Cape", type: "Sparkling", varietal: "Cap Classique", profile: { sweetness: 0.2, acidity: 0.8, tannin: 0.0, body: 0.5 }, flavors: ["citrus","toast"], pairing_tags: ["seafood","fried"], price_range: "R300-R800", why: "Searing acidity and lively bubbles cleanse the palate perfectly between bites of fried seafood." },
  { name: "Simonsig Kaapse Vonkel", producer: "Simonsig", region: "Stellenbosch", type: "Sparkling", varietal: "Cap Classique", profile: { sweetness: 0.2, acidity: 0.8, tannin: 0.0, body: 0.6 }, flavors: ["apple","yeast"], pairing_tags: ["celebration"], price_range: "R300-R800", why: "Elegant yeasty notes and crisp apple flavors elevate any celebration or light starter." },
  // DESSERT
  { name: "Vin de Constance", producer: "Klein Constantia", region: "Constantia", type: "Dessert", varietal: "Muscat", profile: { sweetness: 0.9, acidity: 0.6, tannin: 0.0, body: 0.9 }, flavors: ["honey","apricot"], pairing_tags: ["dessert","cheese"], price_range: "R800+", why: "Its legendary honey and apricot sweetness is perfectly balanced by natural acidity for the ultimate cheese pairing." },
  { name: "Paul Cluver Noble Late Harvest", producer: "Paul Cluver", region: "Elgin", type: "Dessert", varietal: "Riesling", profile: { sweetness: 0.8, acidity: 0.7, tannin: 0.0, body: 0.7 }, flavors: ["honey","citrus"], pairing_tags: ["dessert"], price_range: "R300-R800", why: "Brilliant acidity balances dense sweetness, making it a dream for fruity or creamy desserts." }
];

export default function PairingEngine({ onBack, onNavigate }: { onBack: () => void, onNavigate: (tab: string, state?: any) => void }) {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<{food: string, taste: string, vibe: string}>({ food: '', taste: '', vibe: '' });
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing Flavor Profile...");
  const [results, setResults] = useState<{match: any, upgrade: any} | null>(null);

  const handleSelect = (category: 'food'|'taste'|'vibe', id: string) => {
    setSelections(s => ({ ...s, [category]: id }));
    setTimeout(() => {
      if (step < 3) setStep(step + 1);
      else calculateResults();
    }, 400);
  };

  const calculateResults = () => {
    setIsCalculating(true);
    setStep(4);
    
    // Simulate AI loading steps
    setTimeout(() => setLoadingText("Mapping Wine DNA..."), 1000);
    setTimeout(() => setLoadingText("Applying Food Physics..."), 2000);
    
    setTimeout(() => {
      // 1. Base User Vector
      let userVector = { sweetness: 0.2, acidity: 0.5, tannin: 0.5, body: 0.5 };
      
      // 2. Apply Food Target Modifiers
      const foodData = FOOD_OPTIONS.find(f => f.id === selections.food)?.target || {};
      Object.entries(foodData).forEach(([k, v]) => userVector[k as keyof typeof userVector] += (v as number));
      
      // 3. Apply Taste Target Modifiers
      const tasteData = TASTE_OPTIONS.find(t => t.id === selections.taste)?.target || {};
      Object.entries(tasteData).forEach(([k, v]) => userVector[k as keyof typeof userVector] += (v as number));
      
      // Normalize vector
      Object.keys(userVector).forEach(k => {
        const key = k as keyof typeof userVector;
        userVector[key] = Math.max(0, Math.min(1, userVector[key]));
      });

      // 4. Score Wines (Lower distance = better match)
      const scoredWines = WINE_DB.map(wine => {
        let dist = 0;
        dist += Math.abs(wine.profile.sweetness - userVector.sweetness) * 1.5; // Sweetness is polarizing
        dist += Math.abs(wine.profile.acidity - userVector.acidity);
        dist += Math.abs(wine.profile.tannin - userVector.tannin) * 1.2;
        dist += Math.abs(wine.profile.body - userVector.body);
        return { ...wine, score: 1 - (dist / 4.7) };
      }).sort((a, b) => b.score - a.score);

      // 5. Filter based on Vibe and Price Range
      const isLuxury = selections.vibe === 'luxury' || selections.vibe === 'date';
      
      let baseMatch: any;
      let upgradeMatch: any;

      if (isLuxury) {
        baseMatch = scoredWines.find(w => w.price_range === 'R300-R800' || w.price_range === 'R800+') || scoredWines[0];
        upgradeMatch = scoredWines.find(w => w.price_range === 'R800+' && w.name !== baseMatch.name) || scoredWines.find(w => w.name !== baseMatch.name) || scoredWines[1];
      } else {
        baseMatch = scoredWines.find(w => w.price_range === 'R100-R300' || w.price_range === 'R300-R800') || scoredWines[0];
        upgradeMatch = scoredWines.find(w => (w.price_range === 'R300-R800' || w.price_range === 'R800+') && w.name !== baseMatch.name) || scoredWines.find(w => w.name !== baseMatch.name) || scoredWines[1];
      }

      setResults({ match: baseMatch, upgrade: upgradeMatch });
      setIsCalculating(false);
    }, 3000);
  };

  const foodOption = FOOD_OPTIONS.find(f => f.id === selections.food);
  const tasteOption = TASTE_OPTIONS.find(t => t.id === selections.taste);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-32 overflow-x-hidden font-sans">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-md px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 flex justify-center gap-2">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-[#D4AF37]' : i < step ? 'w-4 bg-white/40' : 'w-4 bg-white/10'}`} />
          ))}
        </div>
        <div className="w-10" /> {/* Balancer */}
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: FOOD */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-serif font-bold mb-2">What are you eating tonight?</h1>
              <p className="text-gray-400 mb-8">This helps us map the fat, acid, and spice elements.</p>
              <div className="grid grid-cols-2 gap-4">
                {FOOD_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleSelect('food', opt.id)}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all text-left group flex flex-col gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                      <opt.icon size={20} className="text-gray-300 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ivory">{opt.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: TASTE */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-serif font-bold mb-2">What do you feel like?</h1>
              <p className="text-gray-400 mb-8">Let's set your personal taste vector.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TASTE_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleSelect('taste', opt.id)}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all text-left flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37]/20 transition-colors">
                      <opt.icon size={24} className="text-gray-300 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ivory text-lg">{opt.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: VIBE */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-serif font-bold mb-2">What's the vibe?</h1>
              <p className="text-gray-400 mb-8">This sets the budget and prestige level.</p>
              <div className="flex flex-col gap-3">
                {VIBE_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleSelect('vibe', opt.id)}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all text-left group"
                  >
                    <h3 className="font-serif font-bold text-xl text-ivory group-hover:text-[#D4AF37] transition-colors">{opt.label}</h3>
                    <p className="text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: RESULTS / CALCULATING */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              {isCalculating || !results ? (
                <div className="pt-20 flex flex-col items-center justify-center text-center">
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-t-2 border-[#D4AF37] rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-2 border-white/20 rounded-full animate-spin reverse"></div>
                    <Sparkles className="absolute inset-0 m-auto text-[#D4AF37]" size={32} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Generating DNA</h2>
                  <p className="text-[#D4AF37] font-mono text-sm uppercase tracking-widest animate-pulse">{loadingText}</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-[#D4AF37]/30">
                      <CheckCircle2 size={14} /> Match Found
                    </div>
                    <h1 className="text-4xl font-serif font-bold mb-2">Your Perfect Pairing</h1>
                    <p className="text-gray-400">
                      Based on {foodOption?.label.toLowerCase()} and a {tasteOption?.label.toLowerCase()} profile.
                    </p>
                  </div>

                  {/* Primary Match */}
                  <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />
                    
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2 block">🍷 Primary Recommendation</span>
                    <h2 className="text-3xl font-serif font-bold text-[#D4AF37] mb-1">{results.match.name}</h2>
                    <p className="text-lg text-white/80 mb-2">{results.match.producer} • {results.match.varietal}</p>
                    <p className="text-sm text-gray-400 mb-6">{results.match.region} • {results.match.price_range}</p>
                    
                    <div className="bg-black/30 rounded-2xl p-4 mb-6 border border-white/5">
                      <span className="flex items-center gap-1.5 text-xs text-gold-500 uppercase tracking-widest font-bold mb-2">
                        <Sparkles size={14} /> Why This Works
                      </span>
                      <p className="text-gray-300 text-sm leading-relaxed">{results.match.why}</p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => onNavigate('discover', { query: results.match.name })}
                        className="flex-1 bg-[#D4AF37] text-[#0B0F14] font-bold py-3 rounded-xl hover:bg-gold-400 transition"
                      >
                        Find this wine
                      </button>
                    </div>
                  </div>

                  {/* Upgrade Match */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      🛒 Premium Upgrade Pick
                    </span>
                    <div className="flex justify-between items-start mb-2 mt-3">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors">{results.upgrade.name}</h3>
                        <p className="text-sm text-gray-400">{results.upgrade.producer} • {results.upgrade.varietal}</p>
                      </div>
                      <span className="bg-white/10 px-3 py-1 rounded-lg text-sm font-mono">{results.upgrade.price_range}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{results.upgrade.why}</p>
                    <button 
                      onClick={() => onNavigate('discover', { query: results.upgrade.name })}
                      className="mt-4 w-full bg-white/10 text-white font-medium py-2.5 rounded-xl border border-white/10 hover:bg-white/20 transition"
                    >
                      Explore Premium Choice
                    </button>
                  </div>
                  
                  <button onClick={() => { setStep(1); setSelections({food:'', taste:'', vibe:''}); }} className="w-full py-4 mt-6 text-sm text-gray-500 hover:text-white transition">
                    Start over
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
