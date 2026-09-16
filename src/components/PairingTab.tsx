import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Search, Sparkles, ChefHat, Loader2 } from 'lucide-react';
import { callOpenRouter } from '../services/openRouterService';

export default function PairingTab() {
  const [foodInput, setFoodInput] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairingResult, setPairingResult] = useState<any>(null);

  const handlePairing = async () => {
    if (!foodInput) return;
    setIsPairing(true);
    
    try {
      const systemInstruction = `Act as an expert AI Sommelier specializing in African wines. You must return your response strictly as a JSON object with valid JSON only.
Structure:
{
  "wine": "Name of the wine varietal or blend",
  "region": "Wine region in South Africa",
  "reason": "A 2-3 sentence explanation of why this pairs well with the food.",
  "recommendations": [
    {
      "name": "Specific Bottle Recommendation",
      "price": "Estimated Price in ZAR"
    }
  ]
}`;

      const prompt = `I am eating: ${foodInput}.\nSuggest the perfect South African wine pairing.`;

      const responseText = await callOpenRouter({
        prompt: prompt,
        systemPrompt: systemInstruction,
        responseFormat: { type: "json_object" }
      });

      const result = JSON.parse(responseText || '{}');
      setPairingResult({
        food: foodInput,
        ...result
      });
    } catch (error) {
      console.error("Pairing error:", error);
      // Fallback if API fails
      setPairingResult({
        food: foodInput,
        wine: "Pinotage",
        region: "Stellenbosch",
        reason: `The bold, smoky flavors of ${foodInput} perfectly complement the dark fruit and earthy notes of a classic South African Pinotage.`,
        recommendations: [
          { name: "Kanonkop Pinotage", price: "R 550" },
          { name: "Beyerskloof Reserve", price: "R 220" }
        ]
      });
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-serif font-light mb-4">Perfect <span className="italic text-accent">Pairings</span></h2>
        <p className="text-ink-light text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Tell us what you're eating, and our AI will find the perfect African wine to elevate your meal.
        </p>
      </motion.div>

      {/* Input Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-black/5 mb-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ChefHat className="text-ink-light" size={20} />
            </div>
            <input 
              type="text" 
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              placeholder="e.g., Traditional Braai, Chakalaka, Bobotie..." 
              className="w-full bg-bg border border-black/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              onKeyDown={(e) => e.key === 'Enter' && handlePairing()}
            />
          </div>
          <button 
            onClick={handlePairing}
            disabled={isPairing || !foodInput}
            className="bg-ink text-white px-8 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-ink-light transition-colors disabled:opacity-50 min-w-[160px]"
          >
            {isPairing ? <><Loader2 size={18} className="animate-spin" /> Pairing...</> : <><Sparkles size={18} /> Pair Wine</>}
          </button>
          <button className="bg-bg text-ink px-6 py-4 rounded-2xl border border-black/10 hover:bg-black/5 transition-colors flex items-center justify-center">
            <Camera size={20} />
          </button>
        </div>

        {/* Popular Local Pairings */}
        {!pairingResult && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest font-semibold text-ink-light mb-4">Try Local Favorites</p>
            <div className="flex flex-wrap gap-2">
              {['Braai Meat', 'Bobotie', 'Chakalaka', 'Biltong', 'Cape Malay Curry'].map(food => (
                <button 
                  key={food}
                  onClick={() => setFoodInput(food)}
                  className="px-4 py-2 rounded-full border border-black/10 text-sm hover:border-accent hover:text-accent transition-colors"
                >
                  {food}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Section */}
      {pairingResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-accent text-white rounded-3xl p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <WineIcon size={200} className="transform translate-x-1/4 -translate-y-1/4" />
          </div>
          
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-widest font-semibold text-white/70 mb-2">Perfect Match for {pairingResult.food}</div>
            <h3 className="text-4xl font-serif font-medium mb-6">{pairingResult.wine} <span className="text-xl text-white/70 font-sans font-normal ml-2">from {pairingResult.region}</span></h3>
            
            <p className="text-white/90 leading-relaxed mb-8 max-w-2xl text-lg">
              {pairingResult.reason}
            </p>

            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-sm uppercase tracking-widest font-semibold text-white/70 mb-4">Top Recommendations</h4>
              <div className="space-y-4">
                {pairingResult.recommendations?.map((rec: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <span className="font-medium">{rec.name}</span>
                    <span className="text-white/70">{rec.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Simple custom SVG for decoration
function WineIcon({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 22h8" />
      <path d="M7 10h10" />
      <path d="M12 15v7" />
      <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />
    </svg>
  );
}
