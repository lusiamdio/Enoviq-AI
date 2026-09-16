import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { callOpenRouter } from '../services/openRouterService';

export default function GiftEngineModal({ onClose, onSelectWine }: { onClose: () => void, onSelectWine: (wine: any) => void }) {
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!recipient || !occasion || !budget) return;
    setIsGenerating(true);

    try {
      const systemInstruction = `You are an elite sommelier specializing in South African wine gifting. Suggest an impressive, appropriate wine.
You must return your response strictly as a JSON object with the following structure, responding with valid JSON only:
{
  "wine": {
    "name": "string",
    "vintage": "string",
    "region": "string",
    "price": "string",
    "grape": "string",
    "rating": number
  },
  "prestigeLevel": "string (e.g., 'Ultra Premium', 'Hidden Gem', 'Cult Classic')",
  "reason": "string (Why this is the perfect gift for this specific recipient and occasion.)"
}`;

      const prompt = `Suggest the perfect South African wine gift. Recipient: ${recipient}. Occasion: ${occasion}. Budget: ${budget}.`;

      const responseText = await callOpenRouter({
        prompt,
        systemPrompt: systemInstruction,
        responseFormat: { type: "json_object" }
      });

      const data = JSON.parse(responseText || "{}");
      setResult(data);
    } catch (error) {
      console.error("Gift Engine Error:", error);
      alert("Failed to generate gift suggestion. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 flex flex-col bg-wine-900/95 backdrop-blur-xl"
    >
      <div className="flex justify-between items-center p-6 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
            <Gift size={18} className="text-gold-500" />
          </div>
          <h2 className="font-serif text-xl font-medium text-ivory">AI Gift Engine</h2>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-ivory transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        {!result && !isGenerating && (
          <div className="space-y-6">
            <p className="text-gray-300 font-serif text-lg mb-8">Find the perfect bottle to impress, celebrate, or say thank you.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Who is this for?</label>
              <input 
                type="text" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g., My boss, Father-in-law, Best friend" 
                className="w-full bg-glass border border-glass-border rounded-xl py-3 px-4 text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">What's the occasion?</label>
              <input 
                type="text" 
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., Promotion, 50th Birthday, Dinner party" 
                className="w-full bg-glass border border-glass-border rounded-xl py-3 px-4 text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Budget</label>
              <div className="flex gap-2">
                {['Under R500', 'R500 - R1500', 'Unlimited'].map((b) => (
                  <button 
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors border ${budget === b ? 'bg-gold-500 text-wine-900 border-gold-500' : 'bg-glass border-glass-border text-gray-400 hover:text-ivory'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!recipient || !occasion || !budget}
              className="w-full mt-8 bg-gradient-to-r from-gold-400 to-gold-600 text-wine-900 font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(198,169,107,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Find the Perfect Gift
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-6" />
            <p className="text-gold-500 font-serif text-xl animate-pulse">Consulting the cellar...</p>
          </div>
        )}

        {result && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-glass border border-glass-border backdrop-blur-md px-3 py-1.5 rounded-full mb-2">
              <Sparkles size={16} className="text-gold-500" />
              <span className="text-xs font-medium tracking-wide text-gold-500">Perfect Match</span>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-gold-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-2xl font-serif font-semibold text-ivory mb-1">{result.wine.name}</h3>
                  <p className="text-gray-400 text-sm">{result.wine.region}, {result.wine.vintage}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold-500 font-medium">{result.wine.price}</p>
                  <p className="text-xs text-gray-500 mt-1">{result.wine.rating} pts</p>
                </div>
              </div>

              <div className="bg-wine-900/50 rounded-xl p-4 mb-4 border border-white/5 relative z-10">
                <p className="text-xs uppercase tracking-widest text-gold-500 mb-2">Prestige Level: {result.prestigeLevel}</p>
                <p className="text-sm text-ivory leading-relaxed">"{result.reason}"</p>
              </div>

              <button 
                onClick={() => {
                  onSelectWine({
                    ...result.wine,
                    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop",
                    notes: result.reason,
                    match: '100% Gift Match'
                  });
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-ivory font-medium transition-colors flex items-center justify-center gap-2"
              >
                View Details <ChevronRight size={16} />
              </button>
            </div>

            <button 
              onClick={() => setResult(null)}
              className="w-full py-4 text-gray-400 hover:text-ivory font-medium transition-colors"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
