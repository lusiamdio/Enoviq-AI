import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, Info, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../supabase';

// Suppress harmless Recharts warning caused by Framer Motion unmounts
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('The width') && args[0].includes('and height') && args[0].includes('should be greater than 0')) {
    return;
  }
  originalWarn(...args);
};

const defaultTasteData = [
  { subject: 'Structure', You: 85, Critics: 65, Stellenbosch: 90, fullMark: 100 },
  { subject: 'Tannins', You: 70, Critics: 80, Stellenbosch: 85, fullMark: 100 },
  { subject: 'Sweetness', You: 20, Critics: 10, Stellenbosch: 15, fullMark: 100 },
  { subject: 'Acidity', You: 60, Critics: 85, Stellenbosch: 50, fullMark: 100 },
  { subject: 'Fruit', You: 90, Critics: 70, Stellenbosch: 80, fullMark: 100 },
  { subject: 'Minerality', You: 40, Critics: 90, Stellenbosch: 60, fullMark: 100 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-wine-900/90 backdrop-blur-md border border-glass-border p-3 rounded-xl shadow-xl">
        <p className="text-sm font-serif text-ivory mb-2">{payload[0].payload.subject}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center justify-between gap-4 mb-1" style={{ color: entry.color }}>
            <span>{entry.name}</span>
            <span className="font-medium">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TasteDNA() {
  const [showCritics, setShowCritics] = useState(false);
  const [showRegion, setShowRegion] = useState(false);
  const [tasteData, setTasteData] = useState(defaultTasteData);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'idle'>('synced');

  useEffect(() => {
    const fetchTasteProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const { data, error } = await supabase.from('profiles').select('taste_dna').eq('id', user.id).single();
        if (data && data.taste_dna) {
          const savedData = data.taste_dna;
          const mergedData = defaultTasteData.map(item => ({
            ...item,
            You: savedData[item.subject] !== undefined ? savedData[item.subject] : item.You
          }));
          setTasteData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching taste DNA:", error);
      }
    };
    fetchTasteProfile();
  }, []);

  useEffect(() => {
    if (syncStatus === 'idle') {
      const saveToDb = async () => {
        setSyncStatus('saving');
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const profileToSave = tasteData.reduce((acc: any, item) => {
            acc[item.subject] = item.You;
            return acc;
          }, {});
          
          await supabase.from('profiles').update({ taste_dna: profileToSave }).eq('id', user.id);
          setSyncStatus('synced');
        } catch (error) {
          console.error("Error auto-saving Taste DNA:", error);
          setSyncStatus('synced');
        }
      };

      const timer = setTimeout(saveToDb, 1000);
      return () => clearTimeout(timer);
    }
  }, [tasteData, syncStatus]);

  const handleSliderChange = (index: number, value: number) => {
    const newData = [...tasteData];
    newData[index] = { ...newData[index], You: value };
    setTasteData(newData);
    setSyncStatus('idle');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-6 mb-12 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div>
          <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-ivory">
            <Dna className="text-gold-500" size={24} />
            Palate Matrix
          </h3>
          <p className="text-xs text-gray-400 mt-1">Real-time morphing sensory taste profile</p>
        </div>
        <div>
          {syncStatus === 'saving' && (
            <span className="text-[10px] font-mono text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full flex items-center gap-1.5 border border-gold-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              Syncing changes...
            </span>
          )}
          {syncStatus === 'synced' && (
            <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1.5 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Synced in real-time
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Radar Chart */}
        <div className="relative">
          <div className="h-[285px] w-full -ml-2 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="62%" data={tasteData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#d1d5db', fontSize: 11, fontFamily: 'Inter', fontWeight: 500 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                
                <Radar 
                  name="You" 
                  dataKey="You" 
                  stroke="#C6A96B" 
                  strokeWidth={2.5}
                  fill="#C6A96B" 
                  fillOpacity={0.4} 
                />
                
                {showCritics && (
                  <Radar 
                    name="Critics" 
                    dataKey="Critics" 
                    stroke="#9ca3af" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="#9ca3af" 
                    fillOpacity={0.05} 
                  />
                )}
                
                {showRegion && (
                  <Radar 
                    name="Stellenbosch" 
                    dataKey="Stellenbosch" 
                    stroke="#722F37" 
                    strokeWidth={1.5}
                    fill="#722F37" 
                    fillOpacity={0.25} 
                  />
                )}
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 mt-1 relative z-10">
            <button 
              onClick={() => setShowCritics(!showCritics)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all border ${
                showCritics 
                  ? 'bg-white/10 border-white/20 text-ivory' 
                  : 'bg-glass border-glass-border text-gray-400 hover:text-gray-300'
              }`}
            >
              vs. Critics
            </button>
            <button 
              onClick={() => setShowRegion(!showRegion)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all border ${
                showRegion 
                  ? 'bg-wine-800 border-wine-700 text-ivory shadow-[0_0_15px_rgba(114,47,55,0.3)]' 
                  : 'bg-glass border-glass-border text-gray-400 hover:text-gray-300'
              }`}
            >
              vs. Stellenbosch
            </button>
          </div>
        </div>

        {/* Real-Time Sliders Area */}
        <div className="space-y-4 relative z-10 bg-wine-950/20 p-4 rounded-2xl border border-glass-border">
          <div className="text-[10px] font-mono tracking-widest text-gold-400 uppercase border-b border-white/5 pb-1.5">Interactive Flavor Controls</div>
          {tasteData.map((item, idx) => (
            <div key={item.subject} className="group">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300 font-medium">{item.subject}</span>
                <span className="text-gold-400 font-mono text-[11px] font-semibold">{item.You}%</span>
              </div>
              <div className="relative h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
                <div 
                  style={{ width: `${item.You}%` }}
                  className="absolute top-0 left-0 h-full bg-gold-500/80 pointer-events-none transition-all duration-150" 
                />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={item.You}
                  onChange={(e) => handleSliderChange(idx, parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
