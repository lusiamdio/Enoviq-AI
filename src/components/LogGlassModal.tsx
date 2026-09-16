import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Star, Droplet } from 'lucide-react';
import { supabase } from '../supabase';

export default function LogGlassModal({ wine, onClose }: { wine: any, onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [occasion, setOccasion] = useState('Dinner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLog = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from('consumption').insert({
        user_id: user.id,
        wine_name: wine.name,
        calories: wine.caloriesPerGlass || 120,
        date: new Date().toISOString(),
        rating,
        notes,
        occasion
      });

      if (error) throw error;
      
      // Track event
      console.log("Event logged:", {
        event: "log_glass",
        wine_id: wine.id || wine.name,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });

      alert("Glass logged! You're on a 3-day tasting streak! 🔥");
      onClose();
    } catch (error) {
      console.error("Error saving consumption log:", error);
      alert("Failed to log glass.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        
        <h2 className="text-2xl font-serif font-semibold mb-2">Log a Glass</h2>
        <p className="text-gold-500 font-medium mb-6">{wine.name}</p>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-full transition-colors ${rating >= star ? 'text-gold-500' : 'text-gray-600'}`}
                >
                  <Star size={28} className={rating >= star ? 'fill-gold-500' : ''} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Occasion</label>
            <div className="flex flex-wrap gap-2">
              {['Dinner', 'Celebration', 'Relaxing', 'Tasting'].map(occ => (
                <button
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${occasion === occ ? 'bg-gold-500 text-wine-900' : 'bg-glass border border-glass-border text-gray-300 hover:bg-white/10'}`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Tasting Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you think?"
              className="w-full bg-glass border border-glass-border rounded-xl p-3 text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500 resize-none h-24"
            />
          </div>

          <button 
            onClick={handleLog}
            disabled={isSubmitting}
            className="w-full bg-gold-500 text-wine-900 font-medium py-4 rounded-xl hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Droplet size={18} />
            {isSubmitting ? 'Logging...' : 'Save to Tracker'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
