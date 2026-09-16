import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, MapPin, Clock } from 'lucide-react';
import { supabase } from '../supabase';

export default function EventModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title || !date) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title,
        event_date: new Date(`${date}T${time || '00:00'}`).toISOString(),
        time,
        location,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      alert("Tasting event scheduled! You'll receive a reminder.");
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to schedule event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[70] bg-wine-900 overflow-y-auto hide-scrollbar flex flex-col"
    >
      <div className="p-6 flex justify-between items-center bg-wine-900/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-2xl font-serif font-semibold">Schedule Tasting</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-glass border border-glass-border flex items-center justify-center text-white hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 flex-1">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Event Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Stellenbosch Reds Tasting"
              className="w-full bg-glass border border-glass-border rounded-xl p-4 text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Calendar size={16} /> Date
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl p-4 text-ivory focus:outline-none focus:border-gold-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Clock size={16} /> Time
              </label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl p-4 text-ivory focus:outline-none focus:border-gold-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <MapPin size={16} /> Location
            </label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., My Cellar or Zoom Link"
              className="w-full bg-glass border border-glass-border rounded-xl p-4 text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>
      </div>

      <div className="p-6 pb-12 mt-auto">
        <button 
          onClick={handleSave}
          disabled={isSubmitting || !title || !date}
          className="w-full bg-gold-500 text-wine-900 font-medium py-4 rounded-2xl hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
        </button>
      </div>
    </motion.div>
  );
}
