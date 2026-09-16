import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grape, Utensils, Compass, ArrowRight, Loader2, Sparkles, MapPin, 
  Briefcase, Hotel, ChevronRight, Check, AlertCircle, Mail, Lock, LogIn, UserPlus, User
} from 'lucide-react';
import { supabase, loginWithEmail, registerWithEmail } from '../supabase';
import { isConfiguredAdminEmail } from '../config';

const identities = [
  { id: 'explorer', label: 'Wine Explorer', icon: <Grape className="w-6 h-6" /> },
  { id: 'dining', label: 'Fine Dining Enthusiast', icon: <Utensils className="w-6 h-6" /> },
  { id: 'investor', label: 'Investor / Collector', icon: <Briefcase className="w-6 h-6" /> },
  { id: 'hospitality', label: 'Hospitality Professional', icon: <Hotel className="w-6 h-6" /> },
];

const flavors = [
  { id: 'citrus', label: 'Citrus', emoji: '🍋' },
  { id: 'spice', label: 'Spice', emoji: '🌶️' },
  { id: 'chocolate', label: 'Chocolate', emoji: '🍫' },
  { id: 'floral', label: 'Floral', emoji: '🌸' },
  { id: 'berry', label: 'Dark Berries', emoji: '🍇' },
  { id: 'oak', label: 'Toasted Oak', emoji: '🪵' },
];

const regions = [
  { id: 'za', label: 'South Africa', flag: '🇿🇦' },
  { id: 'ma', label: 'Morocco', flag: '🇲🇦' },
  { id: 'et', label: 'Ethiopia', flag: '🇪🇹' },
  { id: 'ng', label: 'Nigeria', flag: '🇳🇬' },
  { id: 'ke', label: 'Kenya', flag: '🇰🇪' },
];

const interests = [
  { id: 'tastings', label: 'Wine Tastings', emoji: '🍷' },
  { id: 'travel', label: 'Luxury Travel', emoji: '✈️' },
  { id: 'culinary', label: 'Culinary Experiences', emoji: '🍽️' },
  { id: 'networking', label: 'Networking Events', emoji: '🤝' },
  { id: 'wellness', label: 'Wellness & Retreats', emoji: '🌿' },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const totalSteps = 9;

  const [answers, setAnswers] = useState({
    identity: '',
    flavors: [] as string[],
    regions: [] as string[],
    interests: [] as string[]
  });
  
  const [sliders, setSliders] = useState({
    sweetDry: 50,
    lightFull: 50,
    fruityEarthy: 50
  });

  const [isSaving, setIsSaving] = useState(false);
  const [aiTyping, setAiTyping] = useState('');

  // Auth local state for step 7
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginOnly, setIsLoginOnly] = useState(false);

  const proceed = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const back = () => {
    if (step === 7 && isLoginOnly) {
      setIsLoginOnly(false);
      setStep(0);
    } else {
      setStep(s => Math.max(s - 1, 0));
    }
  };

  useEffect(() => {
    if (step === 5) {
      setAiTyping('');
      const msg = "Try a bold South African Shiraz with spice balance to complement the rich tomato base.";
      let i = 0;
      const t = setInterval(() => {
        setAiTyping(msg.substring(0, i));
        i++;
        if (i > msg.length + 5) clearInterval(t);
      }, 40);
      return () => clearInterval(t);
    }
  }, [step]);

  const saveProfileAndProceed = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const emailName = user.email ? user.email.split('@')[0] : 'Connoisseur';
      const cleanFirstName = emailName.split(/[._-]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      // Determine cupido values
      let personality: 'The Collector' | 'The Connoisseur' | 'The Avant-Garde Sommelier' | 'The Naturalist Rebel' = 'The Connoisseur';
      if (answers.identity === 'investor') {
        personality = 'The Collector';
      } else if (answers.identity === 'explorer') {
        personality = 'The Naturalist Rebel';
      } else if (answers.identity === 'hospitality') {
        personality = 'The Avant-Garde Sommelier';
      } else if (answers.identity === 'dining') {
        personality = 'The Connoisseur';
      }

      const wineTypeMap: Record<string, string> = {
        explorer: 'Heritage Wine Explorer',
        dining: 'Fine Dining Connoisseur',
        investor: 'Prestige Wine Collector',
        hospitality: 'Elite Sommelier'
      };
      const wineType = wineTypeMap[answers.identity] || 'Wine Enthusiast';

      // Affinities map 0-100
      const oldWorldAffinity = Math.round(sliders.fruityEarthy); // earthy -> old world
      const boldRedsAffinity = Math.round(sliders.lightFull); // full -> bold red
      const luxuryDiningAffinity = answers.interests.includes('culinary') || answers.identity === 'dining' ? 95 : 60;
      const adventureAffinity = answers.interests.includes('travel') || answers.identity === 'explorer' ? 90 : 55;

      // Unsplash avatar placeholders based on answers.identity or random
      const avatarUrlMap: Record<string, string> = {
        explorer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
        dining: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
        investor: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=800&auto=format&fit=crop',
        hospitality: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop'
      };
      const avatarUrl = avatarUrlMap[answers.identity] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop';

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: cleanFirstName,
        identity: answers.identity,
        flavors: answers.flavors,
        regions: answers.regions,
        interests: answers.interests,
        sweet_dry: sliders.sweetDry.toString(),
        light_full: sliders.lightFull.toString(),
        fruity_earthy: sliders.fruityEarthy.toString(),
        avatar_url: avatarUrl,
        taste_dna: {
           Boldness: sliders.lightFull,
           Tannin: 50,
           Sweetness: 100 - sliders.sweetDry,
           Acidity: 60,
           Fruitiness: 100 - sliders.fruityEarthy,
           Earthiness: sliders.fruityEarthy
        },
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.error("Error saving profile:", error);
      }

      // Automatically propagate profile to Cupido AI dating profiles table for instant sync!
      const { error: cupidoErr } = await supabase.from('cupido_profiles').upsert({
        id: user.id,
        full_name: cleanFirstName,
        photo_url: avatarUrl,
        wine_type: wineType,
        personality: personality,
        old_world_affinity: oldWorldAffinity,
        bold_reds_affinity: boldRedsAffinity,
        luxury_dining_affinity: luxuryDiningAffinity,
        adventure_affinity: adventureAffinity,
        favorite_wines: answers.flavors.length > 0 ? answers.flavors : ['Pinot Noir', 'Syrah'],
        favorite_experiences: answers.interests.length > 0 ? answers.interests : ['Tasting Tours', 'Fine Dining'],
        location_name: 'Stellenbosch, South Africa'
      }, { onConflict: 'id' });

      if (cupidoErr) {
        console.error("Error saving Cupido profile:", cupidoErr);
      }

      // Skip the Auth step if logged in
      setStep(8);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setAuthError(null);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      
      await saveProfileAndProceed();
    } catch (error: any) {
      console.error("Auth failed:", error);
      let msg = error.message || 'An error occurred.';
      if (msg.includes('security purposes') || msg.includes('after') || msg.toLowerCase().includes('rate limit')) {
        msg = `Supabase rate limit: ${msg}. Please wait or disable rate limits in your Supabase Auth settings.`;
      }
      setAuthError(msg);
      setIsSaving(false);
    }
  };

  const handleNextClick = async () => {
    if (step === 6) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveProfileAndProceed();
      } else {
        proceed();
      }
    } else if (step === 8) {
      onComplete();
    } else if (step !== 7 && step !== 0) {
      proceed();
    }
  };

  const toggleArrayItem = (key: 'flavors'|'regions'|'interests', id: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id]
    }));
  };

  const getSliderFeedback = () => {
    const { sweetDry, lightFull, fruityEarthy } = sliders;
    if (sweetDry < 40 && lightFull > 60) return "You might enjoy a bold South African Pinotage or robust Cabernet Sauvignon.";
    if (sweetDry > 60 && fruityEarthy < 40) return "A luscious Late Harvest Chenin Blanc seems perfect for you.";
    if (lightFull < 40 && fruityEarthy < 40) return "Crisp, earthy Moroccan whites or a dry Rosé might be your ideal match.";
    return "We're dynamically building a vibrant, balanced Taste DNA Profile just for you.";
  };

  const renderWelcome = () => (
    <motion.div 
      key="step-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-between pt-16 pb-12 px-6 z-20 text-center bg-[#050505]"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle geometric lines reflecting the heritage theme */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#C8A24A 1px, transparent 1px), linear-gradient(90deg, #C8A24A 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center' }}></div>
      </div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-between select-none flex-1 py-4">
        {/* Elegant wine glasses visual descriptor */}
        <div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-4xl font-serif font-normal text-[#F2E7D5] mb-2 leading-[1.1] tracking-tight px-1 mt-2"
          >
            Enoviq <span className="text-[#C8A24A] font-bold italic">Estate</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-[#F2E7D5]/70 text-[13px] font-serif leading-relaxed italic max-w-[280px] mx-auto"
          >
            "An AI-designed sommelier mapping, unlocking winemaking heritage, perfect pairings and investment-grade cellar yields."
          </motion.p>
        </div>

        {/* Elegant 4 winemaking stages highlight list */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="w-full bg-[#0A0A0A]/80 backdrop-blur-md border border-[#C8A24A]/20 p-5 rounded-xl text-center space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] mt-8 mb-4"
        >
           <h3 className="text-[10px] tracking-[0.2em] font-mono text-[#C8A24A] text-center font-bold uppercase mb-2">The 4 Winemaking Stages</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center text-center">
                 <span className="text-[#C8A24A] text-lg mb-1">🌾</span>
                 <h4 className="text-[11px] font-bold text-[#F2E7D5] uppercase tracking-wider mb-0.5">Harvest</h4>
                 <p className="text-[9px] text-[#F2E7D5]/50 leading-snug">Handpicking peak African fruit.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                 <span className="text-[#C8A24A] text-lg mb-1">🍇</span>
                 <h4 className="text-[11px] font-bold text-[#F2E7D5] uppercase tracking-wider mb-0.5">Crush</h4>
                 <p className="text-[9px] text-[#F2E7D5]/50 leading-snug">Separating skin & juice.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                 <span className="text-[#C8A24A] text-lg mb-1">🧪</span>
                 <h4 className="text-[11px] font-bold text-[#F2E7D5] uppercase tracking-wider mb-0.5">Ferment</h4>
                 <p className="text-[9px] text-[#F2E7D5]/50 leading-snug">Cultivating yeasts & body.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                 <span className="text-[#C8A24A] text-lg mb-1">🍾</span>
                 <h4 className="text-[11px] font-bold text-[#F2E7D5] uppercase tracking-wider mb-0.5">Bottle</h4>
                 <p className="text-[9px] text-[#F2E7D5]/50 leading-snug">Maturing in select oak.</p>
              </div>
            </div>
         </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-4 w-full pt-1">
             <button 
             onClick={proceed}
             className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A24A] to-[#B38E36] text-[#050505] font-semibold text-sm hover:from-[#dabb70] hover:to-[#C8A24A] transition-all duration-300 shadow-[0_8px_30px_rgba(200,162,74,0.3)] hover:scale-[1.01] active:scale-[0.99] group flex items-center justify-center gap-2 relative overflow-hidden animate-pulse-glow"
          >
             <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
             Create Your Tasting DNA
             <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
             onClick={() => { setIsLogin(true); setIsLoginOnly(true); setStep(7); }}
             className="w-full text-[10px] uppercase font-mono tracking-widest text-[#F2E7D5]/50 hover:text-[#C8A24A] transition-colors"
          >
            Already registered? <span className="text-[#C8A24A] font-bold border-b border-[#C8A24A] pb-0.5">Log In</span>
           </button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderIdentity = () => (
    <div className="w-full max-w-md flex flex-col items-center">
      <h2 className="text-[26px] leading-[1.1] font-serif text-[#C8A24A] mb-1 text-center font-bold">
        <span className="text-xl text-[#F2E7D5] font-normal block mb-1">Stage 1:</span>
        Your Wine Journey
      </h2>
      <p className="text-[#F2E7D5]/70 text-sm font-serif italic mb-6 text-center max-w-[260px]">
        "How would you describe your relationship with wine?"
      </p>
      
      <div className="space-y-3 w-full">
        {[
          { id: 'explorer', label: 'Wine Explorer', desc: 'Discover varietals across the continent', icon: <Grape className="w-5 h-5" /> },
          { id: 'dining', label: 'Fine Dining Enthusiast', desc: 'Pairing wines with exceptional cuisine', icon: <Utensils className="w-5 h-5" /> },
          { id: 'investor', label: 'Investor / Collector', desc: 'Investment-grade cellar & yields', icon: <Briefcase className="w-5 h-5" /> },
          { id: 'hospitality', label: 'Hospitality Professional', desc: 'Curate wine lists for guests', icon: <Hotel className="w-5 h-5" /> }
        ].map(i => (
          <button
            key={i.id}
            onClick={() => { setAnswers({ ...answers, identity: i.id }); setTimeout(proceed, 400); }}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 group relative overflow-hidden ${
              answers.identity === i.id 
                ? 'bg-[#12100C] border-[#C8A24A] shadow-[0_0_20px_rgba(200,162,74,0.15)]' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#C8A24A]/40 hover:shadow-[0_0_15px_rgba(200,162,74,0.1)]'
            }`}
          >
            {/* Soft Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r from-[#C8A24A]/0 via-[#C8A24A]/5 to-[#C8A24A]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-300 ${
              answers.identity === i.id ? 'bg-[#C8A24A]/10 border-[#C8A24A]/50 text-[#C8A24A]' : 'bg-black/40 border-white/10 text-[#F2E7D5]/60 group-hover:text-[#C8A24A]'
            }`}>
              {i.icon}
            </div>
            
            <div className="flex-1 text-left flex flex-col justify-center">
              <span className={`font-serif text-[15px] font-semibold transition-colors duration-300 ${
                answers.identity === i.id ? 'text-[#C8A24A]' : 'text-[#F2E7D5]'
              }`}>{i.label}</span>
              <span className="text-[11px] text-[#F2E7D5]/50 mt-0.5">{i.desc}</span>
            </div>
            
            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
              answers.identity === i.id ? 'text-[#C8A24A] translate-x-1' : 'text-white/20 group-hover:text-[#C8A24A]/60'
            }`} />
          </button>
        ))}
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-[#0A0A0A] border border-[#C8A24A]/30 p-5 rounded-xl w-full shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <h3 className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#C8A24A] mb-3 text-center font-bold">
          Why Enoviq?
        </h3>
        <ul className="space-y-2.5 text-xs text-[#F2E7D5]/80 font-serif leading-relaxed">
          <li className="flex gap-3">
            <span className="text-[#C8A24A] mt-0.5 text-sm">•</span> 
            <span>AI Terroir Mapping across 6 African countries</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#C8A24A] mt-0.5 text-sm">•</span> 
            <span>Winemaking heritage & investment yield scoring</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#C8A24A] mt-0.5 text-sm">•</span> 
            <span>Personalised pairings from your Tasting DNA</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#C8A24A] mt-0.5 text-sm">•</span> 
            <span>Private cellar management & passport history</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderSliders = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage II: Structure & Balance</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Define the structure of your ideal pour.</p>
      
      <div className="space-y-3">
        {[
          { key: 'sweetDry', left: 'Sweet', right: 'Dry', color: 'bg-rose-400', emojiLeft: '🍯', emojiRight: '🍂' },
          { key: 'lightFull', left: 'Light', right: 'Full-bodied', color: 'bg-purple-500', emojiLeft: '🍃', emojiRight: '🍷' },
          { key: 'fruityEarthy', left: 'Fruity', right: 'Earthy', color: 'bg-stone-500', emojiLeft: '🍒', emojiRight: '🍄' },
        ].map(slider => {
          const val = (sliders as any)[slider.key];
          return (
            <div key={slider.key} className="glass-panel p-3.5 rounded-xl border border-glass-border relative overflow-hidden group">
              <div className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10" style={{ background: `linear-gradient(90deg, transparent, ${slider.color.replace('bg-', '')}, transparent)` }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-2.5">
                  <div className={`flex items-center gap-1.5 transition-opacity ${val < 50 ? 'opacity-100' : 'opacity-40'}`}>
                    <span className="text-lg">{slider.emojiLeft}</span>
                    <span className="text-xs font-medium text-ivory">{slider.left}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-opacity ${val > 50 ? 'opacity-100' : 'opacity-40'}`}>
                    <span className="text-xs font-medium text-ivory">{slider.right}</span>
                    <span className="text-lg">{slider.emojiRight}</span>
                  </div>
                </div>
                
                <div className="relative h-2 bg-black/40 rounded-full border border-white/5 shadow-inner">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-600 to-gold-400 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)] pointer-events-none" style={{ width: `${val}%` }}></div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={val}
                    onChange={e => setSliders(s => ({ ...s, [slider.key]: parseInt(e.target.value) }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full border border-gold-500 shadow-xl pointer-events-none transition-transform group-hover:scale-110 flex items-center justify-center animate-pulse" style={{ left: `calc(${val}% - 8px)` }}>
                    <div className="w-1.5 h-1.5 bg-gold-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <motion.div 
        key={getSliderFeedback()}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-start gap-2.5 shadow-[0_0_20px_rgba(212,175,55,0.05)]"
      >
        <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-gold-100/90 text-xs leading-relaxed font-serif italic">{getSliderFeedback()}</p>
      </motion.div>
    </div>
  );

  const renderFlavors = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage III: Tasting Notes</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Which primary profiles do you seek in a glass?</p>
      <div className="grid grid-cols-3 gap-2">
        {flavors.map(f => {
          const isSelected = answers.flavors.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggleArrayItem('flavors', f.id)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[0_0_10px_rgba(198,169,107,0.1)]' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
              }`}
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-[11px] font-medium tracking-tight text-center">{f.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderRegions = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage III: Continental Regions</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Which heritage regions excite you?</p>
      <div className="space-y-1.5">
        {regions.map(r => {
          const isSelected = answers.regions.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggleArrayItem('regions', r.id)}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
              }`}
            >
              <span className="text-2xl shrink-0">{r.flag}</span>
              <span className="font-medium text-sm flex-1 text-left">{r.label}</span>
              {isSelected ? (
                <Check className="w-4 h-4 text-gold-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/10" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderAIIntro = () => (
    <div className="w-full max-w-md text-center">
      <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(198,169,107,0.1)]">
        <Sparkles className="w-6 h-6 text-gold-400 animate-pulse" />
      </div>
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage IV: Meet Enoviq</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Refined, warm, deeply knowledgeable.</p>
      
      <div className="bg-glass border border-glass-border rounded-xl p-3 space-y-3 text-left">
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <div className="bg-[#151518]/50 p-2.5 rounded-xl rounded-tl-none border border-white/5 text-xs text-ivory">
            What wine pairs with proper spicy Jollof rice?
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <div className="bg-gold-500/5 p-2.5 rounded-xl rounded-tl-none border border-gold-500/20 text-xs text-gold-100 flex-1 min-h-[40px] leading-relaxed">
            {aiTyping}
            {aiTyping.length < 80 && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="w-full max-w-md">
      <h2 className="text-xl md:text-2xl font-serif text-ivory mb-1 text-center font-semibold">Stage IV: Experience Personalization</h2>
      <p className="text-gray-400 text-xs md:text-sm font-serif italic mb-4 text-center">Beyond the glass.</p>
      <div className="space-y-1.5">
        {interests.map(i => {
          const isSelected = answers.interests.includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => toggleArrayItem('interests', i.id)}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                isSelected 
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400' 
                  : 'bg-glass border-glass-border hover:bg-glass-hover hover:border-gold-500/20'
              }`}
            >
              <span className="text-xl shrink-0">{i.emoji}</span>
              <span className="font-medium text-sm flex-1 text-left">{i.label}</span>
              {isSelected ? (
                <Check className="w-4 h-4 text-gold-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/10" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderAuth = () => (
    <div className="w-full max-w-md flex flex-col items-center">
      <h2 className="text-3xl font-serif text-[#C8A24A] mb-1 text-center font-bold leading-tight">
        <span className="text-xl text-[#F2E7D5] font-normal block mb-1">
          {isLoginOnly ? 'Log In to' : 'Stage IV: Save'}
        </span>
        {isLoginOnly ? 'Your Cellar' : 'Wine Passport'}
      </h2>
      <p className="text-[#F2E7D5]/70 text-sm font-serif italic mb-6 text-center">
        {isLoginOnly ? '"Welcome back to your curated experience."' : '"Save your custom Taste DNA profile."'}
      </p>
      
      <div className="w-full bg-[#0A0A0A]/80 backdrop-blur-xl border border-[#C8A24A]/20 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-left">
        {/* Subtle Silhouette Background */}
        <div className="absolute top-10 -right-10 w-40 h-64 border border-white/5 rounded-full mix-blend-overlay opacity-30 pointer-events-none transform rotate-12 flex justify-center pt-4">
           <div className="w-12 h-40 border border-white/10 rounded-[4px_4px_24px_24px] mt-4 relative">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-12 border border-white/10 rounded-t-sm"></div>
           </div>
        </div>

        {!isLoginOnly && (
          <div className="flex mb-6 bg-black rounded-lg p-1 relative z-10 border border-white/5">
            <button
              onClick={() => { setIsLogin(false); setAuthError(null); }}
              className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-semibold rounded-md transition-all duration-300 font-mono ${
                !isLogin ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-gray-500 hover:text-[#F2E7D5]'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => { setIsLogin(true); setAuthError(null); }}
              className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-semibold rounded-md transition-all duration-300 font-mono ${
                isLogin ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-gray-500 hover:text-[#F2E7D5]'
              }`}
            >
              Log In
            </button>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[#F2E7D5]/60 mb-2 font-bold">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-[#C8A24A]/70" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-sm text-[#F2E7D5] placeholder-[#F2E7D5]/30 focus:ring-1 focus:ring-[#C8A24A]/60 focus:border-[#C8A24A]/60 transition-all font-sans outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-[#F2E7D5]/60 mb-2 font-bold flex justify-between">
              Password
              {isLoginOnly && <button type="button" className="text-[#C8A24A] hover:underline font-serif normal-case italic text-[11px] tracking-normal">Forgot password?</button>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-[#C8A24A]/70" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="block w-full pl-10 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-sm text-[#F2E7D5] placeholder-[#F2E7D5]/30 focus:ring-1 focus:ring-[#C8A24A]/60 focus:border-[#C8A24A]/60 transition-all font-sans outline-none font-mono tracking-widest text-lg"
                placeholder="••••••••"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <p>{authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-4 bg-gradient-to-r from-[#C8A24A] to-[#B38E36] text-[#050505] font-semibold py-3.5 rounded-full hover:from-[#dabb70] hover:to-[#C8A24A] transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(200,162,74,0.3)] disabled:opacity-50 text-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#050505]" />
            ) : isLogin ? (
              'Sign In to Cellar'
            ) : (
              'Configure Taste DNA'
            )}
          </button>
        </form>

        {isLoginOnly && (
          <div className="mt-6 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Or</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            
            <div className="space-y-3">
              <button disabled className="w-full py-3 rounded-xl border border-white/10 bg-black/40 text-[13px] font-sans text-[#F2E7D5] hover:bg-white/5 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 opacity-80 hover:opacity-100">
                Continue with Google
              </button>
              <button disabled className="w-full py-3 rounded-xl border border-white/10 bg-black/40 text-[13px] font-sans text-[#F2E7D5] hover:bg-white/5 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 opacity-80 hover:opacity-100">
                Continue with Apple
              </button>
            </div>
            
            <div className="mt-5 text-center flex items-center justify-center gap-1.5 opacity-50">
              <Lock className="w-3 h-3 text-[#C8A24A]" />
              <span className="text-[9px] font-mono tracking-widest uppercase text-[#F2E7D5]">Secured by 256-bit Encryption</span>
            </div>
          </div>
        )}
      </div>

      {!isLoginOnly && (
         <div className="mt-6 p-4 rounded-xl border border-[#C8A24A]/30 bg-[#1A1813] w-full text-center shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h4 className="text-[12px] font-bold text-[#C8A24A] font-serif mb-1">Journey Complete!</h4>
            <p className="text-[11px] text-[#F2E7D5]/70 mb-3">All 4 winemaking stages mastered.<br/>Your Tasting DNA has been crafted.<br/>Enter your cellar.</p>
            <div className="h-1 bg-black rounded-full overflow-hidden w-2/3 mx-auto flex items-center">
               <div className="h-full bg-[#C8A24A] w-full shadow-[0_0_10px_rgba(200,162,74,1)]"></div>
            </div>
         </div>
      )}

      {isLoginOnly && (
        <button 
          onClick={() => { setIsLoginOnly(false); setIsLogin(false); }}
          className="mt-6 px-6 py-3 w-full bg-[#C8A24A]/10 hover:bg-[#C8A24A]/25 border border-[#C8A24A]/30 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest text-[#C8A24A] hover:text-[#F2E7D5] transition-all duration-300 shadow-[0_4px_15px_rgba(200,162,74,0.1)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] group"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#C8A24A] group-hover:text-[#F2E7D5] transition-colors" />
          Create Your Tasting DNA
        </button>
      )}
    </div>
  );

  const renderCelebration = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 p-6 z-20 text-center bg-[#050505]">
      {/* Subtle geometric lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#C8A24A 1px, transparent 1px), linear-gradient(90deg, #C8A24A 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center' }}></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#C8A24A]/10 rounded-full blur-[100px] z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center h-full">
        <div className="text-[10px] uppercase tracking-widest font-mono text-[#F2E7D5]/60 mb-10 flex items-center gap-2">
          <div className="w-8 h-px bg-[#C8A24A]/40"></div>
          Enoviq • AI Sommelier
          <div className="w-8 h-px bg-[#C8A24A]/40"></div>
        </div>

        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          onClick={handleNextClick}
          className="mx-auto px-6 py-3.5 rounded-full bg-gradient-to-r from-[#C8A24A] to-[#B38E36] text-[#050505] font-bold text-xs uppercase tracking-widest hover:from-[#dabb70] hover:to-[#C8A24A] transition-all duration-300 shadow-[0_8px_30px_rgba(200,162,74,0.3)] hover:scale-[1.01] active:scale-[0.99] group flex items-center justify-center gap-2 mb-6"
        >
          Enter Your Cellar
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
        
        <motion.h2 
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-4xl font-serif text-[#F2E7D5] mb-2 font-normal leading-tight mt-4"
        >
          Taste Passport<br/>
          <span className="text-[#C8A24A] font-bold italic">Unlocked</span>
        </motion.h2>
        <motion.p 
          initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[#F2E7D5]/70 font-serif text-[13px] italic mb-8 max-w-[260px] mx-auto leading-relaxed"
        >
          "Your custom wine tasting history and curation is ready for exploration."
        </motion.p>

        <motion.div 
           initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
           className="grid grid-cols-3 gap-2 w-full mb-8"
        >
           {[
             { title: 'Cellar', desc: 'Your curated wines', icon: <Briefcase className="w-4 h-4" /> },
             { title: 'Terroir Map', desc: "Africa's regions", icon: <MapPin className="w-4 h-4" /> },
             { title: 'AI Pairings', desc: 'Smart matches', icon: <Sparkles className="w-4 h-4" /> }
           ].map((ft, idx) => (
              <div key={idx} className="bg-[#0A0A0A]/80 backdrop-blur-md border border-[#C8A24A]/30 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                 <div className="text-[#C8A24A] mb-1.5">{ft.icon}</div>
                 <h4 className="text-[10px] font-bold text-[#F2E7D5] font-sans uppercase tracking-wider mb-1">{ft.title}</h4>
                 <p className="text-[9px] text-[#F2E7D5]/60 font-serif">{ft.desc}</p>
              </div>
           ))}
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
           className="grid grid-cols-3 divide-x divide-white/10 w-full border-t border-b border-white/10 py-3 mb-8"
        >
           <div className="flex flex-col items-center">
             <span className="text-[#C8A24A] font-serif text-lg font-bold mb-0.5">200+</span>
             <span className="text-[9px] uppercase font-mono text-[#F2E7D5]/50 tracking-wider">African Wines</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[#C8A24A] font-serif text-lg font-bold mb-0.5">6</span>
             <span className="text-[9px] uppercase font-mono text-[#F2E7D5]/50 tracking-wider">Countries Mapped</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[#C8A24A] font-serif text-lg font-bold mb-0.5">AI</span>
             <span className="text-[9px] uppercase font-mono text-[#F2E7D5]/50 tracking-wider">Sommelier Engine</span>
            </div>
         </motion.div>
         
         <div className="flex-1"></div>

      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderWelcome();
      case 1: return renderIdentity();
      case 2: return renderSliders();
      case 3: return renderFlavors();
      case 4: return renderRegions();
      case 5: return renderAIIntro();
      case 6: return renderInterests();
      case 7: return renderAuth();
      case 8: return renderCelebration();
      default: return null;
    }
  };

  const showHeader = step !== 0 && step !== 8;

  const winemakingStages = [
    { id: 1, tag: 'Harvest', name: '1. Harvest & Select', activeSteps: [1] },
    { id: 2, tag: 'Crush', name: '2. Crush & Press', activeSteps: [2] },
    { id: 3, tag: 'Ferment', name: '3. Ferment & Age', activeSteps: [3, 4] },
    { id: 4, tag: 'Bottle', name: '4. Blend & Bottle', activeSteps: [5, 6, 7] },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-[#F2E7D5] flex flex-col items-center justify-between relative overflow-hidden selection:bg-[#C8A24A]/30 font-sans border-0 sm:border sm:border-[#C8A24A]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] lg:max-w-md lg:mx-auto">
      {/* Frame Gold Border Effect (Mobile Outline) */}
      <div className="absolute inset-0 border-[0.5px] border-[#C8A24A]/20 pointer-events-none z-50 rounded-sm lg:rounded-none m-1"></div>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-[#C8A24A]/5 to-transparent pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-full h-[400px] bg-gradient-to-t from-[#C8A24A]/5 to-transparent pointer-events-none"></div>
         {step === 7 && isLoginOnly && (
           <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none scale-[2] translate-y-[20%]">
             <svg viewBox="0 0 100 300" className="w-full h-full fill-[#C8A24A]"><path d="M40 0h20v60c0 20 15 30 20 50v180H20V110c5-20 20-30 20-50V0z"/></svg>
           </div>
         )}
      </div>

      {showHeader && (
        <div className="w-full max-w-md px-6 z-20 mt-6 md:mt-8">
          <div className="mb-2 text-center">
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#C8A24A] font-bold">
              {step === 7 && isLoginOnly ? 'Enoviq Estate' : 'Winemaking Stage'}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-0 mb-6 px-2">
            {winemakingStages.map((stage, idx) => {
              const isActive = stage.activeSteps.includes(step);
              const isCompleted = stage.activeSteps.every(st => step > st) || 
                (idx === 0 && step > 1) || 
                (idx === 1 && step > 2) || 
                (idx === 2 && step > 4) ||
                (step === 7 && isLoginOnly);

              return (
                <div key={stage.id} className="flex-1 flex flex-col items-center relative group">
                  <div className="flex items-center w-full">
                    {idx > 0 && (
                      <div className={`h-px flex-1 transition-all duration-500 ${isCompleted || isActive ? 'bg-[#C8A24A]' : 'bg-white/10'}`} />
                    )}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500 shrink-0 relative z-10 ${
                      isActive 
                        ? 'bg-[#C8A24A] border-[#C8A24A] text-[#050505]' 
                        : isCompleted 
                          ? 'bg-[#050505] border-[#C8A24A]/70 text-[#C8A24A]' 
                          : 'bg-[#050505] border-white/20 text-transparent'
                    }`}>
                      {isCompleted && !isActive ? <Check className="w-3 h-3 stroke-[3]" /> : isActive ? <div className="w-1.5 h-1.5 bg-[#050505] rounded-full" /> : null}
                    </div>
                    {idx < 3 && (
                      <div className={`h-px flex-1 transition-all duration-500 ${isCompleted ? 'bg-[#C8A24A]' : 'bg-white/10'}`} />
                    )}
                  </div>
                  <span className={`absolute top-6 whitespace-nowrap text-[8px] uppercase tracking-widest font-semibold font-mono transition-colors duration-300 ${
                    isActive ? 'text-[#C8A24A]' : isCompleted ? 'text-[#C8A24A]/70' : 'text-[#F2E7D5]/30'
                  }`}>
                    {stage.tag}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs mt-6 mb-2">
            <button 
              onClick={back}
              className="text-[#F2E7D5]/50 hover:text-[#C8A24A] transition-colors disabled:opacity-0 flex items-center gap-1 font-mono uppercase tracking-widest text-[9px]"
              disabled={step === 1 || (step === 7 && !isLoginOnly)}
            >
              Back
            </button>
            <span className="text-[#C8A24A] font-mono text-[9px] font-semibold tracking-widest uppercase">Step {Math.min(step, 6)}/6</span>
          </div>
        </div>
      )}

      {/* Main step view slot with tight layouts */}
      <div className="w-full flex-1 flex items-start justify-center overflow-y-auto max-w-md px-6 z-10 custom-scrollbar pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="w-full flex justify-center py-2 relative"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showHeader && step !== 7 && (
        <div className="w-full max-w-md px-6 pb-6 pt-4 z-20 flex flex-col items-center bg-[#050505]/80 backdrop-blur-md">
          {/* Progress completion bar */}
          <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mb-5 relative">
            <div className="absolute top-0 left-0 h-full bg-[#C8A24A] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(200,162,74,0.8)]" style={{ width: `${(step / 6) * 100}%` }}></div>
          </div>
          <button
            onClick={handleNextClick}
            disabled={isSaving || (step === 1 && !answers.identity)}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-full font-semibold bg-gradient-to-r from-[#C8A24A] to-[#B38E36] text-[#050505] hover:from-[#dabb70] hover:to-[#C8A24A] shadow-[0_8px_25px_rgba(200,162,74,0.25)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-sm tracking-wide"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#050505]" /> : 'Continue'}
            {!isSaving && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>
          
          <div className="mt-8 flex flex-col items-center pb-2 opacity-50 text-center">
             <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8A24A] mb-1 font-bold">Enoviq Estate</span>
             <span className="text-[9px] font-serif italic text-white/50">"Discover Africa's finest terroir, one sip at a time."</span>
          </div>
        </div>
      )}
      
      {step === 7 && isLoginOnly && (
        <div className="w-full max-w-md px-6 pb-8 z-20 flex flex-col items-center mt-auto">
          <div className="flex flex-col items-center pb-2 text-center opacity-70 mt-6">
             <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8A24A] mb-1.5 font-bold">Enoviq Estate</span>
             <span className="text-[10px] font-serif italic text-[#F2E7D5]/70">Africa's AI-Powered Sommelier Experience</span>
          </div>
        </div>
      )}
    </div>
  );
}
