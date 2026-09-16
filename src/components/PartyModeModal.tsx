import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { callOpenRouter } from '../services/openRouterService';

export default function PartyModeModal({ onClose, onSelectWine }: { onClose: () => void, onSelectWine: (wine: any) => void }) {
  const [groupDescription, setGroupDescription] = useState('');
  const [winesAvailable, setWinesAvailable] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!groupDescription || !winesAvailable) return;
    setIsGenerating(true);

    try {
      const systemInstruction = `You are a fun, expert sommelier analyzing a group of people and ranking a list of wines to maximize overall group satisfaction. You must return your response strictly as a JSON object, responding with valid JSON only.
Structure:
{
  "rankedWines": [
    {
      "name": "string",
      "score": number (Group satisfaction score out of 100),
      "reason": "Why this works for the group."
    }
  ],
  "groupSummary": "A fun summary of the group's collective palate."
}`;

      const responseText = await callOpenRouter({
        prompt: `Rank these wines for my group. Group: ${groupDescription}. Wines available: ${winesAvailable}.`,
        systemPrompt: systemInstruction,
        responseFormat: { type: "json_object" }
      });

      const data = JSON.parse(responseText || "{}");
      setResult(data);
    } catch (error) {
      console.error("Party Mode Error:", error);
      alert("Failed to analyze group preferences. Please try again.");
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
          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
            <Users size={18} className="text-pink-500" />
          </div>
          <h2 className="font-serif text-xl font-medium text-ivory">Group Intelligence</h2>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-ivory transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        {!result && !isGenerating && (
          <div className="space-y-6">
            <p className="text-gray-300 font-serif text-lg mb-8">Find the perfect bottle to please everyone at the table.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Who is drinking?</label>
              <textarea 
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="e.g., Me (loves bold reds), Sarah (only drinks sweet white), John (will drink anything)" 
                className="w-full h-24 bg-glass border border-glass-border rounded-xl py-3 px-4 text-ivory placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">What wines are available?</label>
              <textarea 
                value={winesAvailable}
                onChange={(e) => setWinesAvailable(e.target.value)}
                placeholder="e.g., Meerlust Rubicon, Ken Forrester Chenin Blanc, Haute Cabriere Pinot Noir" 
                className="w-full h-24 bg-glass border border-glass-border rounded-xl py-3 px-4 text-ivory placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!groupDescription || !winesAvailable}
              className="w-full mt-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Analyze Group Palate
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-6" />
            <p className="text-pink-500 font-serif text-xl animate-pulse">Calculating crowd pleasers...</p>
          </div>
        )}

        {result && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="glass-panel p-6 rounded-2xl mb-6">
              <h3 className="text-sm uppercase tracking-widest text-pink-400 mb-2">Group Palate Summary</h3>
              <p className="text-ivory font-serif leading-relaxed">"{result.groupSummary}"</p>
            </div>

            <h3 className="text-xl font-serif font-semibold text-ivory mb-4">Ranked for Your Group</h3>
            
            <div className="space-y-4">
              {result.rankedWines?.map((wine: any, idx: number) => (
                <div key={idx} className="glass-panel p-5 rounded-2xl relative overflow-hidden">
                  {idx === 0 && <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 blur-2xl rounded-full"></div>}
                  
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <h4 className="text-lg font-serif font-semibold text-ivory flex items-center gap-2">
                      {idx === 0 && <span className="text-xl">🏆</span>}
                      {wine.name}
                    </h4>
                    <div className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs font-bold">
                      {wine.score}% Match
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 relative z-10">"{wine.reason}"</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setResult(null)}
              className="w-full py-4 text-gray-400 hover:text-ivory font-medium transition-colors mt-4"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
