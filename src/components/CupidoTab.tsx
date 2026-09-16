import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  Sliders, 
  ChevronRight, 
  Check, 
  X, 
  Zap, 
  Compass, 
  Users, 
  Map, 
  Award, 
  Crown, 
  CreditCard,
  ShieldCheck,
  TrendingUp, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Info,
  FileText,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase, notifyUser } from '../supabase';
import { WHOP_CUPIDO_CHECKOUT_URL, openWhopCheckout } from '../services/checkoutLinks';

// Theme Colors
// Background: #0D0A0A (Rich Jet Black) to #4A001F (Deep Wine Plum) to #8B1538 (Vibrant Crimson Wine)
// Accents: Gold (#D4AF37), Crimson (#8B1538), Ivory White (#F8F5F2)

interface MatchProfile {
  id?: string;
  name: string;
  photo: string;
  compatibility: number;
  wineType: string;
  favoriteWines: string[];
  experiences: string[];
  personality: string;
  wineDNA: {
    oldWorld: number;
    boldReds: number;
    luxuryDining: number;
    adventure: number;
  };
  icebreakers: string[];
  insights: {
    personality: number;
    travel: number;
    dining: number;
    conversation: number;
    longterm: number;
  };
}

const MATCHES_DATA: MatchProfile[] = [
  {
    name: "Emma",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    compatibility: 94,
    wineType: "French Wine Enthusiast",
    favoriteWines: ["Pinot Noir", "Champagne", "Barolo"],
    experiences: ["Tuscany", "Michelin Dining", "Opera"],
    personality: "The Purist / Collector",
    wineDNA: { oldWorld: 95, boldReds: 88, luxuryDining: 92, adventure: 81 },
    icebreakers: [
      "You both rated Meerlust Rubicon 5 Stars. Try asking: 'What was your favorite South African wine estate visit?'",
      "Emma enjoys cold-climate Pinot Noir. Ask which coastal vineyard is her personal secret reserve."
    ],
    insights: { personality: 91, travel: 84, dining: 88, conversation: 92, longterm: 89 }
  },
  {
    name: "Alex",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    compatibility: 89,
    wineType: "Bold Red Collector",
    favoriteWines: ["Syrah/Shiraz", "Cabernet Sauvignon", "Malbec"],
    experiences: ["Stellenbosch Braai", "Helicopter Vineyard Tour", "Napa Valley"],
    personality: "The Connoisseur",
    wineDNA: { oldWorld: 80, boldReds: 96, luxuryDining: 85, adventure: 89 },
    icebreakers: [
      "You both enjoy high-altitude Cabernet Sauvignon. Ask: 'What's the most overrated wine you've ever tasted?'",
      "Ask Alex about his favorite campfire Syrah pairing under the safari stars."
    ],
    insights: { personality: 88, travel: 90, dining: 82, conversation: 85, longterm: 87 }
  },
  {
    name: "Sophia",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    compatibility: 92,
    wineType: "Vintage Champagne Specialist",
    favoriteWines: ["Blanc de Blancs", "Pet-Nat", "Chardonnay"],
    experiences: ["Franschhoek Tram", "Oyster Shucking", "Art Galleries"],
    personality: "The Avant-Garde Sommelier",
    wineDNA: { oldWorld: 90, boldReds: 60, luxuryDining: 98, adventure: 85 },
    icebreakers: [
      "You both share a passion for traditional method Cap Classique! Ask Sophia: 'Which vintage toast remains your absolute benchmark?'",
      "Ask Sophia: 'Does natural low-sulfur sparkling live up to the prestige?'"
    ],
    insights: { personality: 93, travel: 89, dining: 95, conversation: 90, longterm: 91 }
  },
  {
    name: "Chloe",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    compatibility: 87,
    wineType: "Eclectic Orange explorer",
    favoriteWines: ["Amphora Chenin Blanc", "Barolo", "Cinsault"],
    experiences: ["Swartland Organic Harvest", "Record Bars", "Glamping"],
    personality: "The Naturalist Rebel",
    wineDNA: { oldWorld: 75, boldReds: 70, luxuryDining: 72, adventure: 95 },
    icebreakers: [
      "Both of you appreciate wild yeast ferments. Try saying: 'Unfiltered Cinsault is the new vintage masterclass. Thoughts?'",
      "Ask what obscure, dusty bottle she unboxed during her last overseas road trip."
    ],
    insights: { personality: 84, travel: 95, dining: 78, conversation: 91, longterm: 83 }
  }
];

interface RegionalEvent {
  id: string;
  title: string;
  location: string;
  time: string;
  price: string;
  description: string;
  dressCode: string;
  keynote: string;
}

const REGIONAL_EVENTS: RegionalEvent[] = [
  {
    id: "bordeaux",
    title: "VIP Bordeaux Masterclass",
    location: "Heritage Estate Grand Cellar, Stellenbosch",
    time: "Wednesday, 18:00 - 21:00",
    price: "Exclusive Cupido Pass (Free for Match)",
    description: "An exclusive vertical tasting of legendary Bordeaux Grand Crus paired with hand-crafted local artisanal cheeses. Guided by master sommelier Pierre Laurent.",
    dressCode: "Gala Elegant / Semi-Formal",
    keynote: "Mastering the Bordeaux Blends & High-Altitude Terroir"
  },
  {
    id: "cabernet",
    title: "Underground Cabernet Cellar Tasting",
    location: "Central Wine Caves, Franschhoek",
    time: "Friday, 19:30 - 22:30",
    price: "Exclusive Cupido Pass (Free for Match)",
    description: "Journey deep into historic limestone caves for an immersive tasting of single-vineyard, ultra-premium Cabernet Sauvignons under candle flame.",
    dressCode: "Sophisticated Smart Casual",
    keynote: "Aged Cabernet Secrets: Decade-long Evolution Trends"
  }
];

export default function CupidoTab() {
  const [isHeroAnimating, setIsHeroAnimating] = useState(true);
  const [heroStep, setHeroStep] = useState(0); // 0: streams flow, 1: merge heart, 2: heart to glass, 3: cupido logo
  const [hasEntered, setHasEntered] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [matchStatus, setMatchStatus] = useState<'liked' | 'passed' | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [activeDateStep, setActiveDateStep] = useState<'invite' | 'round1' | 'round2' | 'round3' | 'completed'>('invite');
  const [dateScore, setDateScore] = useState(0);
  const [showGoldModal, setShowGoldModal] = useState(false);
  // Membership is server-authorized. Never trust a browser flag for paid access.
  const [isPremium, setIsPremium] = useState(false);
  
  // Event registration states
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [selectedEventForModal, setSelectedEventForModal] = useState<RegionalEvent | null>(null);

  // Core matches state mirroring cupido_profiles table
  const [matchesList, setMatchesList] = useState<MatchProfile[]>(MATCHES_DATA);

  const [activePresenceCount, setActivePresenceCount] = useState(14);

  useEffect(() => {
    let isMounted = true;
    let presenceChannel: any = null;

    async function initPresence() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        presenceChannel = supabase.channel('cupido_regional_presence');

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            if (!isMounted) return;
            const state = presenceChannel.presenceState ? presenceChannel.presenceState() : {};
            const count = Object.keys(state || {}).length;
            const simulatedBase = 12 + Math.floor(Math.sin(Date.now() / 60000) * 3);
            setActivePresenceCount(Math.max(simulatedBase, count));
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED' && user && presenceChannel.track) {
              try {
                await presenceChannel.track({
                  user_id: user.id,
                  online_at: new Date().toISOString(),
                  region: 'Stellenbosch/Cape Town'
                });
              } catch (e) {
                console.warn("Presence tracking registration safely handled:", e);
              }
            }
          });
      } catch (err) {
        console.warn("Presence channel setup safely handled:", err);
      }
    }

    initPresence();

    const interval = setInterval(() => {
      if (isMounted) {
        setActivePresenceCount(prev => {
          const delta = Math.random() > 0.5 ? 1 : -1;
          const nextVal = prev + delta;
          return Math.max(6, Math.min(22, nextVal));
        });
      }
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (presenceChannel) {
        try {
          supabase.removeChannel(presenceChannel);
        } catch {}
      }
    };
  }, []);

  const refreshMembership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsPremium(false);
      return;
    }
    const { data, error } = await supabase
      .from('cupido_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Unable to verify Cupido membership:', error);
      setIsPremium(false);
      return;
    }
    setIsPremium(data?.is_premium === true);
  };

  useEffect(() => {
    void refreshMembership();
  }, []);

  // Real-time synchronization loader
  useEffect(() => {
    let isMounted = true;

    async function syncEcosystem() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        // 1. Ensure the signed-in user has a live Cupido profile for realtime matching
        // Check/create user's own profile in cupido_profiles to manage auth rules
        let { data: myCupidoProfile } = await supabase
          .from('cupido_profiles')
          .select('*')
          .eq('id', user.id);

        const myProfileExists = myCupidoProfile && myCupidoProfile.length > 0;
        if (!myProfileExists) {
          await supabase.from('cupido_profiles').insert({
            id: user.id,
            full_name: user.email?.split('@')[0] || 'Connoisseur',
            photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
            wine_type: 'Stellenbosch Collector',
            personality: 'The Connoisseur',
            old_world_affinity: 80,
            bold_reds_affinity: 85,
            luxury_dining_affinity: 90,
            adventure_affinity: 75,
            favorite_wines: ['Meerlust Rubicon', 'Pinot Noir'],
            favorite_experiences: ['Constantia Tram Tour', 'Candlelit tastings'],
            location_name: 'Western Cape, South Africa'
          });
        }

        // 2. Fetch event registrations
        const { data: dbRegs } = await supabase
          .from('cupido_event_registrations')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (dbRegs && isMounted) {
          setRegisteredEventIds(dbRegs.map((r: any) => r.event_id));
        }

        // 3. Load other profiles from Supabase cupido_profiles table
        const { data: dbProfiles } = await supabase
          .from('cupido_profiles')
          .select('*')
          .neq('id', user.id);

        if (dbProfiles && dbProfiles.length > 0 && isMounted) {
          const mapped: MatchProfile[] = dbProfiles.map((dbProf: any) => {
            const diffOldWorld = Math.abs(80 - (dbProf.old_world_affinity ?? 50));
            const diffBoldReds = Math.abs(85 - (dbProf.bold_reds_affinity ?? 50));
            const diffDining = Math.abs(90 - (dbProf.luxury_dining_affinity ?? 50));
            const diffAdventure = Math.abs(75 - (dbProf.adventure_affinity ?? 50));
            const rawScore = 100 - ((diffOldWorld + diffBoldReds + diffDining + diffAdventure) / 4);
            const compScore = Math.max(50, Math.min(100, Math.round(rawScore)));

            return {
              id: dbProf.id,
              name: dbProf.full_name || 'Anonymous',
              photo: dbProf.photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
              compatibility: compScore,
              wineType: dbProf.wine_type || 'Wine Enthusiast',
              favoriteWines: dbProf.favorite_wines || [],
              experiences: dbProf.favorite_experiences || [],
              personality: dbProf.personality || 'The Collector',
              wineDNA: {
                oldWorld: dbProf.old_world_affinity ?? 50,
                boldReds: dbProf.bold_reds_affinity ?? 50,
                luxuryDining: dbProf.luxury_dining_affinity ?? 50,
                adventure: dbProf.adventure_affinity ?? 50,
              },
              icebreakers: [
                `Hi ${dbProf.full_name || 'there'}! Enoviq matched us on the vintage ${dbProf.favorite_wines?.[0] || 'Cabernet'}. Do you explore local Stellenbosch reserves?`,
                `Both of you appreciate immersive sensory evenings. Ask: 'What's the finest bottle you've ever unboxed?'`
              ],
              insights: {
                personality: 88,
                travel: dbProf.adventure_affinity ?? 85,
                dining: dbProf.luxury_dining_affinity ?? 90,
                conversation: 92,
                longterm: 89
              }
            };
          });
          setMatchesList(mapped);
        }
      } catch (err) {
        console.warn("Ecosystem synchronization handled gracefully:", err);
      }
    };

    syncEcosystem();
    return () => { isMounted = false; };
  }, []);

  const downloadEventPDF = (event: RegionalEvent) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Outer borders
    doc.setDrawColor(200, 162, 74); // Enoviq Gold
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277);
    doc.rect(12, 12, 186, 273);

    // Header fill
    doc.setFillColor(11, 8, 8);
    doc.rect(13, 13, 184, 45, 'F');

    // Header texts
    doc.setTextColor(212, 175, 55); // Gold
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text("E N O V I Q   C U P I D O", 105, 27, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("OFFICIAL EXCLUSIVE EVENT REGISTRATION PASS", 105, 36, { align: 'center' });

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(40, 42, 170, 42);

    doc.setTextColor(180, 180, 180);
    doc.setFontSize(8);
    doc.text("CONFIRMED VIA CUPIDO NEURAL MATCHING ENGINE", 105, 48, { align: 'center' });

    // Main section
    doc.setTextColor(11, 8, 8);
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text("REGISTRATION RECEIPT & ENTRY PASS", 105, 75, { align: 'center' });

    doc.setDrawColor(139, 21, 56); // Deep burgundy
    doc.setLineWidth(1);
    doc.line(80, 80, 130, 80);

    // Details background rect
    doc.setFillColor(248, 245, 242); // Alabaster
    doc.rect(20, 90, 170, 115, 'F');
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.3);
    doc.rect(20, 90, 170, 115);

    // Event title
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(139, 21, 56);
    doc.text(event.title, 25, 102);

    // Grid details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Date & Time:", 25, 115);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(event.time, 58, 115);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("Location:", 25, 125);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const splitLocation = doc.splitTextToSize(event.location, 120);
    doc.text(splitLocation, 58, 125);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("Access Tier:", 25, 140);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text(event.price, 58, 140);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("Dress Code:", 25, 150);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(event.dressCode, 58, 150);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("Focus:", 25, 160);
    doc.setFont('helvetica', 'oblique');
    doc.setTextColor(40, 40, 40);
    doc.text(event.keynote, 58, 160);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("Description:", 25, 170);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const splitOverview = doc.splitTextToSize(event.description, 125);
    doc.text(splitOverview, 58, 170);

    // Pass details
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 8, 8);
    doc.setFontSize(10);
    doc.text("ATTENDEE VERIFICATION PASS", 105, 222, { align: 'center' });

    // Numeric security code
    doc.setDrawColor(11, 8, 8);
    doc.setLineWidth(0.5);
    doc.rect(80, 228, 50, 14);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    const regCode = `EQ-${Math.floor(100000 + Math.random() * 900000)}`;
    doc.text(regCode, 105, 237, { align: 'center' });

    // Terms footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Show this digital pass or a physical print-out at the entrance gate.", 105, 254, { align: 'center' });
    doc.text("Registration is tied to your Cupido identity and is non-transferable.", 105, 259, { align: 'center' });
    doc.text("© 2026 Enoviq Inc. Designed for elite wine networking & pairing.", 105, 264, { align: 'center' });

    doc.save(`cupido_${event.id}_registration_pass.pdf`);
  };

  // 3.5 seconds World-Class Hero Animation
  useEffect(() => {
    if (isHeroAnimating) {
      const timers = [
        setTimeout(() => setHeroStep(1), 900),   // Streams flowing -> merge into heart
        setTimeout(() => setHeroStep(2), 1800),  // Heart -> transforms into wine glass
        setTimeout(() => setHeroStep(3), 2700),  // Wine glass -> Cupido AI logo
        setTimeout(() => {
          setIsHeroAnimating(false);
        }, 3600)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isHeroAnimating]);

  const handleLike = async () => {
    setMatchStatus('liked');
    const currProfile = matchesList[currentMatchIdx] || MATCHES_DATA[0];
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user && currProfile) {
        // Record the swipe in Supabase
        await supabase.from('cupido_swipes').insert({
          sender_id: user.id,
          receiver_id: currProfile.id || 'e0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
          swipe_type: 'like'
        });

        // Check if they swiped back (mutual conversation / match)
        const { data: mutualSwipe } = await supabase
          .from('cupido_swipes')
          .select('*')
          .eq('sender_id', currProfile.id || 'e0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c')
          .eq('receiver_id', user.id)
          .eq('swipe_type', 'like');

        if (mutualSwipe && mutualSwipe.length > 0) {
          setShowMatchCelebration(true);
          return;
        }
      }
    } catch (err) {
      console.warn("Real-time swipe registration warning:", err);
    }

    setTimeout(() => {
      // Fallback display celebration or advance to next profile
      if (currentMatchIdx % 2 === 0) {
        setShowMatchCelebration(true);
      } else {
        nextMatch();
      }
    }, 600);
  };

  const handlePass = async () => {
    setMatchStatus('passed');
    const currProfile = matchesList[currentMatchIdx] || MATCHES_DATA[0];
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user && currProfile) {
        await supabase.from('cupido_swipes').insert({
          sender_id: user.id,
          receiver_id: currProfile.id || 'e0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
          swipe_type: 'pass'
        });
      }
    } catch (err) {
      console.warn("Silent pass swipe sync warning:", err);
    }

    setTimeout(() => {
      nextMatch();
    }, 600);
  };

  const nextMatch = () => {
    setMatchStatus(null);
    setCurrentMatchIdx((prev) => (prev + 1) % matchesList.length);
  };

  const currentProfile = matchesList[currentMatchIdx] || MATCHES_DATA[0];

  // Wine date answers
  const handleDateAnswer = (correct: boolean) => {
    if (correct) setDateScore(prev => prev + 1);
    if (activeDateStep === 'round1') setActiveDateStep('round2');
    else if (activeDateStep === 'round2') setActiveDateStep('round3');
    else if (activeDateStep === 'round3') setActiveDateStep('completed');
  };

  const handleRegisterEvent = async (event: RegionalEvent) => {
    triggerVibrate();
    const regCode = `EQ-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        await supabase.from('cupido_event_registrations').insert({
          user_id: user.id,
          event_id: event.id,
          registration_code: regCode
        });
      }
    } catch (err) {
      console.warn("Real-time event registration warning:", err);
    }
    setRegisteredEventIds((prev) => [...prev, event.id]);
    setSelectedEventForModal(event);
    notifyUser(
      'event',
      'VIP Pass Secured! 🎫',
      `You registered for ${event.title}! Mark your calendar for ${event.time} at ${event.location.split(',')[0]}!`
    );
  };

  const triggerVibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(80); } catch (e) {}
    }
  };

  if (isHeroAnimating) {
    return (
      <div className="fixed inset-0 bg-[#0D0A0A] z-50 flex flex-col justify-center items-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D0A0A] via-[#4A001F] to-[#8B1538] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />

        {/* Dynamic Wine Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                backgroundColor: i % 2 === 0 ? '#D4AF37' : '#8B1538',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 30 - 15, 0],
                scale: [1, 1.4, 1]
              }}
              transition={{
                duration: 6 + Math.random() * 8,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        {/* Skip Animation button */}
        <button 
          onClick={() => setIsHeroAnimating(false)}
          className="absolute top-10 right-6 z-50 text-xs font-mono text-[#F8F5F2]/60 hover:text-[#D4AF37] border border-white/10 px-3 py-1 rounded-full transition-all cursor-pointer"
        >
          Skip Intro
        </button>

        {/* Core Animation Stage Box */}
        <div className="relative w-72 h-72 flex justify-center items-center z-10">
          <AnimatePresence mode="wait">
            {heroStep === 0 && (
              <motion.div 
                key="step0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full flex justify-center items-center"
              >
                {/* Two wine streams flowing together */}
                <motion.div 
                  className="absolute w-24 h-[6px] bg-gradient-to-r from-transparent to-[#8B1538] rounded-full"
                  animate={{ x: [-150, 0], y: [-40, 0], rotate: [15, 0], scale: [0.5, 1.2] }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
                <motion.div 
                  className="absolute w-24 h-[6px] bg-gradient-to-r from-transparent to-[#D4AF37] rounded-full"
                  animate={{ x: [150, 0], y: [40, 0], rotate: [-15, 0], scale: [0.5, 1.2] }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
                {/* Center glowing meeting particle */}
                <motion.div 
                  className="w-4 h-4 bg-white rounded-full blur-[4px]"
                  animate={{ scale: [1, 2.5, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <div className="absolute bottom-4 text-[10px] tracking-widest text-[#D4AF37] uppercase font-mono animate-pulse">
                  Conjoining Taste Algorithms...
                </div>
              </motion.div>
            )}

            {heroStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col justify-center items-center"
                transition={{ duration: 0.9 }}
              >
                {/* Streams merged into a glowing heartbeat */}
                <div className="relative">
                  <Heart className="text-[#8B1538] fill-[#8B1538] filter drop-shadow-[0_0_15px_rgba(139,21,56,0.6)]" size={72} />
                  <motion.div 
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Heart className="text-[#D4AF37]" size={72} />
                  </motion.div>
                </div>
                <div className="text-[11px] font-serif text-[#F8F5F2] font-semibold mt-6 tracking-wide text-center">
                  Crystallizing Compatibility Node
                </div>
              </motion.div>
            )}

            {heroStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ rotate: -180, scale: 0.4, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="flex flex-col justify-center items-center"
                transition={{ type: 'spring', stiffness: 100 }}
              >
                {/* Heart transforms into wine glass stem and bowl */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-16 h-16 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v10c0 3.313-2.687 6-6 6h12c-3.313 0-6-2.687-6-6V2z" />
                    {/* Floating wine crimson juice level */}
                    <path d="M7.4 9.5c2 1 5-1 7.2 0" stroke="#8B1538" strokeWidth="2.5" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                  {/* Floating Bubbles */}
                  <div className="absolute top-8 w-2 h-2 bg-[#8B1538] rounded-full animate-ping" />
                  <div className="absolute top-10 left-8 w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" />
                </div>
                <div className="text-[11px] text-[#D4AF37] uppercase font-mono tracking-[0.2em] mt-6">
                  Tasting DNA Connected
                </div>
              </motion.div>
            )}

            {heroStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col justify-center items-center text-center space-y-4"
              >
                {/* Final Cupido AI glowing logo insignia */}
                <div className="relative">
                  <div className="p-5 rounded-full bg-gradient-to-br from-[#8B1538]/30 to-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                    <Heart className="text-[#D4AF37] fill-[#8B1538] animate-pulse" size={56} />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 text-[#D4AF37] animate-bounce" size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-black tracking-widest text-[#F8F5F2]">CUPIDO AI</h1>
                  <span className="text-[9px] font-mono tracking-[0.3em] text-[#D4AF37] block uppercase">Intelligence Pairing</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ---------------- PART A: LANDING SCREEN ----------------
  if (!hasEntered) {
    return (
      <div className="min-h-full bg-[#0D0A0A] flex flex-col justify-start relative overflow-hidden text-[#F8F5F2]">
        
        {/* Deep rich burgundy backdrop gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0A0A] via-[#4A001F] to-[#8B1538] opacity-95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,transparent_80%)]"></div>

        {/* Premium Floating Ornament Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
          <svg className="w-96 h-96 text-white/5" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="35" ry="48" fill="none" stroke="currentColor" strokeWidth="0.2" />
            <ellipse cx="50" cy="50" rx="48" ry="35" fill="none" stroke="currentColor" strokeWidth="0.2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 2" />
          </svg>
        </div>

        {/* Animated Wine Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 12 }).map((_, idx) => (
            <motion.div 
              key={idx}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 6 + 3,
                height: Math.random() * 6 + 3,
                backgroundColor: idx % 3 === 0 ? '#D4AF37' : '#8B1538',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.15
              }}
              animate={{
                y: [0, -120, 0],
                rotate: [0, 360],
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{
                duration: 8 + Math.random() * 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Header HUD */}
        <div className="relative z-10 flex justify-between items-center px-6 pt-7 pb-4">
          <span className="text-[10px] tracking-[0.25em] font-mono text-[#D4AF37] uppercase font-bold">ENOVIQ CELLARS</span>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                triggerVibrate();
                setShowGoldModal(true);
              }}
              className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-black py-1 px-3 rounded-full flex items-center gap-1.5 tracking-wider uppercase transition-all"
            >
              <Crown size={11} className="text-[#D4AF37]" /> {isPremium ? "CUPIDO ACTIVE" : "GET GOLD"}
            </button>
          </div>
        </div>

        {/* Landing Content Container */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-6 pb-28 pt-8">
          
          {/* Main Hero Group */}
          <div className="text-center space-y-5 my-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="inline-block mx-auto relative group"
            >
              <div className="p-6 rounded-full bg-[#0A0A0A]/40 border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(139,21,56,0.25)] relative">
                <Heart className="text-[#D4AF37] fill-[#8B1538] animate-pulse" size={60} />
              </div>
              <Sparkles className="absolute top-2 right-2 text-[#D4AF37] animate-bounce" size={18} />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-xs font-mono tracking-[0.35em] text-[#D4AF37] uppercase font-bold">CUPIDO AI</h1>
              <h2 className="text-3xl font-serif font-black tracking-tight leading-none text-white max-w-xs mx-auto">
                The World's First Wine Compatibility platform.
              </h2>
            </div>

            <p className="text-xs text-[#F8F5F2]/75 max-w-sm mx-auto leading-relaxed px-2">
              Discover people who share your exquisite taste in award-winning wines, fine dining, world travel and inspired living.
            </p>
          </div>

          {/* Action Trigger Block */}
          <div className="space-y-6">
            <div className="bg-[#0A0A0A]/60 backdrop-blur-md rounded-2xl border border-[#D4AF37]/20 p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#8B1538]/10 border border-[#8B1538]/20">
                  <TrendingUp className="text-[#D4AF37]" size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-serif">92% Match Accuracy</h4>
                  <p className="text-[9px] text-[#F8F5F2]/50 font-mono">Based on 128 sensory wine taste signals</p>
                </div>
              </div>
              <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-mono font-bold uppercase tracking-widest border border-[#D4AF37]/20 px-2.5 py-1 rounded">
                AI Powered
              </span>
            </div>

            <motion.button 
              onClick={() => {
                triggerVibrate();
                if (isPremium) {
                  setHasEntered(true);
                } else {
                  setShowGoldModal(true);
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F8F5F2] hover:animate-pulse text-black font-semibold uppercase tracking-widest py-4 px-6 rounded-xl text-xs font-serif shadow-lg shadow-[#8B1538]/25 flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              Find Connections <ChevronRight size={14} />
            </motion.button>
          </div>

        </div>

        {/* Premium Gold Promo Modal Overlay */}
        <AnimatePresence>
          {showGoldModal && (
            <GoldPremiumModal onClose={() => setShowGoldModal(false)} onUpgrade={() => { void refreshMembership(); setShowGoldModal(false); }} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---------------- PART B: ACTIVE EXPERIENCE DASHBOARD ----------------
  return (
    <div className="min-h-full bg-[#050505] flex flex-col justify-start relative text-[#F2E7D5]">
      
      {/* Top Navigation Frame bar */}
      <div className="sticky top-0 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 z-30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="text-[#8B1538] fill-[#8B1538]" size={18} />
          <h1 className="text-base font-serif font-black tracking-wider text-white">Cupido AI</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              triggerVibrate();
              setShowGoldModal(true);
            }}
            className="flex items-center gap-1.5 py-1 px-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-bold rounded-full uppercase tracking-wider transition-all"
          >
            <Crown size={11} className="text-[#D4AF37]" /> {isPremium ? "Gold Active" : "Cupido Gold"}
          </button>
          
          <button 
            onClick={() => {
              triggerVibrate();
              setHasEntered(false);
            }} 
            className="text-xs text-gray-400 hover:text-white font-mono p-1"
            title="Return to Intro"
          >
            Intro
          </button>
        </div>
      </div>

      {/* Realtime Regional Presence Bar */}
      <div className="bg-[#8B1538]/5 border-b border-white/5 px-4 py-2 flex items-center justify-between text-[11px] font-mono select-none">
        <div className="flex items-center gap-2 text-gray-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Stellenbosch District: <strong className="text-[#D4AF37] font-bold">{activePresenceCount} Wine Lovers Online</strong></span>
        </div>
        <span className="text-[8px] text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/5 px-1.5 py-0.5 rounded font-bold border border-[#D4AF37]/10">Live Presence</span>
      </div>

      {/* Main Container Layout: Swipe + DNA + Date Game + Nearby Map + Journey Timeline */}
      <div className="pb-32 px-4 pt-4 space-y-8 overflow-y-auto">

        {/* SECTION 1: PERFECT PAIRING MATCH CARD WITH GLASSMORPHISM AND SWIPING */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <div>
              <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">EXCLUSIVE DISCOVERY</span>
              <h3 className="text-md font-serif font-extrabold text-white">Your Perfect Wine Matches</h3>
              <div className="mt-1.5 inline-block bg-gradient-to-r from-[#8B1538] to-[#4A001F] text-white text-[9px] font-mono font-bold uppercase py-1 px-2.5 rounded border border-white/10 tracking-widest">
                {currentProfile.wineType}
              </div>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Match {currentMatchIdx + 1} of {matchesList.length}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentProfile.name}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative overflow-hidden rounded-2xl border ${
                matchStatus === 'liked' ? 'border-[#D4AF37]' : matchStatus === 'passed' ? 'border-[#8B1538]' : 'border-white/10'
              } bg-[#0D0A0A]/70 backdrop-blur-md shadow-2xl transition-all`}
            >
              {/* Glassmorphism Blur Highlight Rings */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A001F]/20 rounded-full blur-2xl" />
              <div className="absolute bottom-1/4 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl" />

              {/* Swipe Direction Overlays */}
              {matchStatus === 'liked' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#D4AF37]/20 z-10 flex items-center justify-end pr-10">
                  <div className="border-4 border-[#D4AF37] text-[#D4AF37] font-serif font-black text-3xl uppercase tracking-widest py-2 px-6 rounded-xl rotate-12">
                    LIKE
                  </div>
                </div>
              )}
              {matchStatus === 'passed' && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#8B1538]/20 to-transparent z-10 flex items-center justify-start pl-10">
                  <div className="border-4 border-[#8B1538] text-[#8B1538] font-serif font-black text-3xl uppercase tracking-widest py-2 px-6 rounded-xl -rotate-12">
                    PASS
                  </div>
                </div>
              )}

              {/* Photo Area with Gradient Trim */}
              <div className="h-64 relative bg-gray-900">
                <img 
                  src={currentProfile.photo} 
                  alt={currentProfile.name} 
                  className="w-full h-full object-cover select-none" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40" />

                {/* Travel Compatibility Pill badge */}
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-[#D4AF37]/35 py-1.5 px-3.5 rounded-full flex items-center gap-1.5">
                  <Compass className="text-[#D4AF37] animate-pulse" size={13} />
                  <span className="text-[11px] font-mono font-bold text-[#F8F5F2]">
                    Travel Compatibility <span className="text-[#D4AF37] font-black">{currentProfile.insights.travel}%</span>
                  </span>
                </div>

                {/* Match tag relocated to header */}

                {/* Profile Name Over Image */}
                <div className="absolute bottom-3 left-4">
                  <h4 className="text-2xl font-serif font-black text-white leading-none flex items-center gap-2">
                    {currentProfile.name}
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" title="Online Sommelier" />
                  </h4>
                  <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} className="text-[#D4AF37]" /> Cape Town • South Africa
                  </p>
                </div>
              </div>

              {/* Details & Compatibility Signals */}
              <div className="p-4.5 space-y-4">
                
                {/* Compact Lifestyle / Wine Match Indicators */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold">
                  <div className="bg-white/5 border border-white/5 py-2 px-3 rounded-xl flex justify-between items-center">
                    <span className="text-gray-400">Travel Match</span>
                    <span className="text-blue-400">{currentProfile.insights.travel}%</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 py-2 px-3 rounded-xl flex justify-between items-center">
                    <span className="text-gray-400">Food Match</span>
                    <span className="text-purple-400">91%</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 py-2 px-3 rounded-xl flex justify-between items-center">
                    <span className="text-gray-400">Wine Compatibility</span>
                    <span className="text-[#D4AF37]">{currentProfile.compatibility}%</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 py-2 px-3 rounded-xl flex justify-between items-center">
                    <span className="text-gray-400">Conversation Match</span>
                    <span className="text-emerald-400">92%</span>
                  </div>
                </div>

                {/* Favorite Wines & Experiences lists */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[9px] tracking-wider font-mono text-gray-500 uppercase block">Favorite Wines</span>
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.favoriteWines.map((w, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#8B1538]/10 text-[#F2E7D5] border border-[#8B1538]/20 font-serif">
                          🍷 {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] tracking-wider font-mono text-gray-500 uppercase block">Favorite Experiences</span>
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.experiences.map((exp, i) => {
                        const icon = exp.includes('Tuscany') || exp.includes('Napa') || exp.includes('Glamping') ? '✈️' : exp.includes('Braai') || exp.includes('Michelin') || exp.includes('Oyster') ? '🍽' : '🎭';
                        return (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#D4AF37]/5 text-gray-300 border border-[#D4AF37]/15">
                            {icon} {exp}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Swiping Like / Pass Actions */}
                <div className="flex gap-4 border-t border-white/5 pt-4">
                  <button 
                    onClick={handlePass}
                    className="flex-1 bg-white/[0.04] hover:bg-[#8B1538]/10 text-gray-300 hover:text-[#8B1538] border border-white/10 hover:border-[#8B1538]/30 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <ThumbsDown size={14} /> Pass
                  </button>
                  <button 
                    onClick={handleLike}
                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B38E36] hover:brightness-110 text-black py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-serif font-black transition-all shadow-lg shadow-[#D4AF37]/10 cursor-pointer"
                  >
                    <Heart className="fill-black" size={14} /> Swill Like
                  </button>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SECTION 2: WINE DNA VISUALIZATION (Spotify Wrapped style Concentric SVG metrics) */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4.5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">YOUR SENSORY SPECTRUM</span>
              <h4 className="text-sm font-serif font-extrabold text-white">Wine DNA Profile Visualization</h4>
            </div>
            <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[9px] font-mono px-2 py-0.5 rounded font-black max-w-max uppercase tracking-wider">
              {currentProfile.personality}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
            Every wine scan, rating, and pairing adds unique values to your personal Wine DNA. Here is your target alignment against <strong>{currentProfile.name}</strong>:
          </p>

          {/* Concentric / Radial visualization representation */}
          <div className="flex flex-col sm:flex-row justify-around items-center gap-6 py-2">
            
            {/* Custom Interactive SVG Concentric Rings */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Circle Underlay tracks */}
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle cx="50" cy="50" r="20" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle cx="50" cy="50" r="10" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />

                {/* Old World Wines: 95% */}
                <circle cx="50" cy="50" r="40" stroke="#D4AF37" strokeWidth="6" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - currentProfile.wineDNA.oldWorld / 100)}`}
                />
                {/* Bold Reds: 88% */}
                <circle cx="50" cy="50" r="30" stroke="#8B1538" strokeWidth="6" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - currentProfile.wineDNA.boldReds / 100)}`}
                />
                {/* Luxury Dining: 92% */}
                <circle cx="50" cy="50" r="20" stroke="#a78bfa" strokeWidth="6" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - currentProfile.wineDNA.luxuryDining / 100)}`}
                />
                {/* Adventure: 81% */}
                <circle cx="50" cy="50" r="10" stroke="#34d399" strokeWidth="6" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - currentProfile.wineDNA.adventure / 100)}`}
                />
              </svg>
              {/* Central Heart Logo */}
              <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center">
                <Heart className="text-[#8B1538]" size={16} />
                <span className="text-[10px] font-bold font-mono text-white mt-0.5">{currentProfile.compatibility}%</span>
              </div>
            </div>

            {/* Legend checklist */}
            <div className="space-y-2 w-full max-w-xs text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <span>Old World Traditionalist</span>
                </div>
                <span className="text-white font-bold">{currentProfile.wineDNA.oldWorld}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B1538]" />
                  <span>Oak & Bold Tannins</span>
                </div>
                <span className="text-white font-bold">{currentProfile.wineDNA.boldReds}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Luxury Culinary Focus</span>
                </div>
                <span className="text-white font-bold">{currentProfile.wineDNA.luxuryDining}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Glamping & Wine Tourism</span>
                </div>
                <span className="text-white font-bold">{currentProfile.wineDNA.adventure}%</span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: AI CONVERSATION STARTERS & ICEBREAKERS */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4.5 space-y-3 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl" />
          
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#D4AF37]" size={15} />
            <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">AI ICEBREAKERS</span>
          </div>

          <h4 className="text-xs font-serif font-black text-white">Suggested Openers for {currentProfile.name}</h4>

          <div className="space-y-2.5 pt-1">
            {currentProfile.icebreakers.map((ice, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl space-y-1">
                <span className="text-[8px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">AI Sommelier Option {i + 1}</span>
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  "{ice.substring(ice.indexOf('"') + 1, ice.lastIndexOf('"')) || ice}"
                </p>
                <button 
                  onClick={() => {
                    triggerVibrate();
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(ice);
                    }
                  }}
                  className="text-[9px] font-mono text-gray-500 hover:text-white underline cursor-pointer"
                >
                  Copy Prompt Key
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: VIRTUAL WINE DATE (PREMIUM FEATURE SIMULATOR GAME) */}
        <div className="bg-gradient-to-br from-[#4A001F]/20 to-[#0A0A0A] border border-[#8B1538]/20 rounded-2xl p-4.5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">PREMIUM SOMMELIER LOUNGE</span>
              <h4 className="text-sm font-serif font-extrabold text-white flex items-center gap-1.5">
                Virtual Wine Tasting Dates <Heart size={13} className="text-[#8B1538] fill-[#8B1538]" />
              </h4>
            </div>
            <span className="bg-[#8B1538] text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Exclusive
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeDateStep === 'invite' && (
              <motion.div 
                key="invite-date"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div className="space-y-0.5 font-sans">
                    <p className="text-gray-400 font-bold">Upcoming Match Date Slot</p>
                    <p className="text-[#D4AF37] font-semibold">Friday • 19:00 SAST</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px] font-mono">Wine Selection</p>
                    <p className="text-white font-serif font-extrabold text-[11px]">Kanonkop Pinotage</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Step into a beautiful, guided virtual wine date hosted in real-time by Cupido AI. Rate aromas, compare tannin scores, guess regions, and score wine compatibility points together!
                </p>

                <button 
                  onClick={() => {
                    triggerVibrate();
                    setActiveDateStep('round1');
                    setDateScore(0);
                  }}
                  className="w-full bg-[#8B1538] hover:bg-[#A31C43] text-white text-xs font-serif font-bold py-2.5 rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Start Virtual Tasting Date with {currentProfile.name}
                </button>
              </motion.div>
            )}

            {activeDateStep === 'round1' && (
              <motion.div 
                key="round1"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#D4AF37]">ROUND 1 OF 3</span>
                  <span className="text-gray-500">Aroma Sensory Alignment</span>
                </div>
                <h5 className="text-xs font-serif font-bold text-white leading-relaxed">
                  Cupido AI: "Welcome, {currentProfile.name} & User! Pull out your bottle of Kanonkop Pinotage. Pour a clean glass, swirl to aerate, and close your eyes. What fragrance commands your first inhalation?"
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button 
                    onClick={() => handleDateAnswer(true)}
                    className="p-3 bg-white/[0.03] hover:bg-[#D4AF37]/20 border border-white/5 rounded-xl text-left text-gray-300 transition-all cursor-pointer font-sans"
                  >
                    Ripe red currants, espresso, wild bramble and smoky oak
                  </button>
                  <button 
                    onClick={() => handleDateAnswer(false)}
                    className="p-3 bg-white/[0.03] hover:bg-[#8B1538]/10 border border-white/5 rounded-xl text-left text-gray-300 transition-all cursor-pointer font-sans"
                  >
                    Chilled crisp green apples and fresh mineral limestone
                  </button>
                </div>
              </motion.div>
            )}

            {activeDateStep === 'round2' && (
              <motion.div 
                key="round2"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#D4AF37]">ROUND 2 OF 3</span>
                  <span className="text-gray-500">Geographic Terroir Challenge</span>
                </div>
                <h5 className="text-xs font-serif font-bold text-white leading-relaxed">
                  {currentProfile.name} inputs her answer! But first, Cupido AI asks you: "Where are the weathered granite soils of Simonsberg-Stellenbosch situated that yield Kanonkop’s bold dry-land vineyards?"
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button 
                    onClick={() => handleDateAnswer(true)}
                    className="p-3 bg-white/[0.03] hover:bg-[#D4AF37]/20 border border-white/5 rounded-xl text-left text-gray-300 transition-all cursor-pointer font-sans"
                  >
                    Stellenbosch, Western Cape (South Africa)
                  </button>
                  <button 
                    onClick={() => handleDateAnswer(false)}
                    className="p-3 bg-white/[0.03] hover:bg-[#8B1538]/10 border border-white/5 rounded-xl text-left text-gray-300 transition-all cursor-pointer font-sans"
                  >
                    Rhône Valley, Southern France (Europe)
                  </button>
                </div>
              </motion.div>
            )}

            {activeDateStep === 'round3' && (
              <motion.div 
                key="round3"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#D4AF37]">ROUND 3 OF 3</span>
                  <span className="text-gray-500">Gourmet Pairing Duet</span>
                </div>
                <h5 className="text-xs font-serif font-bold text-white leading-relaxed">
                  Cupido AI: "Sensory notes verified! Time for the final dinner pairing puzzle. What fine dish would you select to support this heavy, smoky Pinotage on your date?"
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button 
                    onClick={() => handleDateAnswer(true)}
                    className="p-3 bg-white/[0.03] hover:bg-[#D4AF37]/20 border border-white/5 rounded-xl text-left text-gray-300 transition-all cursor-pointer font-sans"
                  >
                    Slow-roasted lamb shanks or a rich braised pork belly
                  </button>
                  <button 
                    onClick={() => handleDateAnswer(false)}
                    className="p-3 bg-white/[0.03] hover:bg-[#8B1538]/10 border border-white/5 rounded-xl text-left text-gray-300 transition-all cursor-pointer font-sans"
                  >
                    Cold raw oysters with fine lemon mignonette vinegar
                  </button>
                </div>
              </motion.div>
            )}

            {activeDateStep === 'completed' && (
              <motion.div 
                key="date-completed"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-3 text-center py-2"
              >
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full inline-block mx-auto">
                  <Award className="text-[#D4AF37]" size={36} />
                </div>
                <h5 className="text-sm font-serif font-black text-white">Date Curation Perfected!</h5>
                <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
                  You scored <strong>{dateScore}/3 Alignment points</strong>! Cupido AI has finalized your shared tasting profile and synced it to your matching logs.
                </p>
                <div className="flex gap-2.5 max-w-xs mx-auto pt-2">
                  <button 
                    onClick={() => {
                      triggerVibrate();
                      setActiveDateStep('invite');
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[11px] font-mono font-bold py-2 rounded-lg cursor-pointer"
                  >
                    Restart Simulator
                  </button>
                  <button 
                    onClick={() => {
                      triggerVibrate();
                      setShowMatchCelebration(true);
                    }}
                    className="flex-1 bg-[#D4AF37] text-black text-[11px] font-mono font-bold py-2 rounded-lg cursor-pointer"
                  >
                    Toast Match
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 5: DISCOVER NEARBY WINE LOVERS & MAP (STELLENBOSCH / CAPE TOWN HUD) */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4.5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">COMMUNITY HUB</span>
              <h4 className="text-sm font-serif font-extrabold text-white flex items-center gap-1.5">
                Discover Nearby Wine Lovers <Map size={14} className="text-[#D4AF37]" />
              </h4>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              72 Online Nearby
            </div>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Your GPS parameters locate you alongside the historical Stellenbosch wine corridor. Here are the curated events nearby:
          </p>

          {/* Styled Cape Town / Stellenbosch interactive vector map simulator */}
          <div className="relative h-44 bg-[#050505] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center">
            
            {/* Elegant Map Contour lines overlay */}
            <div className="absolute inset-0 opacity-15">
              <svg className="w-full h-full" viewBox="0 0 200 100">
                <path d="M 10 30 C 50 10, 70 80, 110 40 C 150 10, 180 90, 190 20" stroke="currentColor" strokeWidth="0.8" fill="none" />
                <path d="M 20 50 C 60 30, 80 90, 120 50 C 160 20, 190 80, 200 40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" fill="none" />
                <circle cx="100" cy="50" r="30" stroke="currentColor" strokeWidth="0.3" fill="none" />
                <circle cx="100" cy="50" r="60" stroke="currentColor" strokeWidth="0.2" fill="none" />
              </svg>
            </div>

            {/* GPS center hub */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 left-[50%] top-[45%] z-10 text-center">
              <div className="relative">
                <div className="w-3.5 h-3.5 bg-[#8B1538] border-2 border-white rounded-full mx-auto shadow-lg animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B1538] opacity-75"></span>
                </span>
              </div>
              <span className="text-[10px] font-black font-serif text-white bg-black/80 px-2 py-0.5 rounded border border-[#D4AF37]/35 block mt-2 whitespace-nowrap">
                Stellenbosch, SA
              </span>
            </div>

            {/* Micro Match Indicators floating */}
            <div className="absolute left-[20%] top-[30%]">
              <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-ping" />
              <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            </div>
            <div className="absolute right-[25%] top-[70%]">
              <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            </div>
            <div className="absolute right-[15%] top-[25%]">
              <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            </div>
            <div className="absolute left-[30%] top-[75%]">
              <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            </div>

          </div>

          <div className="space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold block">Exclusive Regional Meetups</span>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              {REGIONAL_EVENTS.map((event) => {
                const isRegistered = registeredEventIds.includes(event.id);
                return (
                  <div key={event.id} className="bg-[#ffffff]/[0.02] border border-white/5 p-3 rounded-xl flex justify-between items-center hover:border-[#D4AF37]/20 transition-colors duration-200">
                    <div className="space-y-0.5">
                      <h5 className="font-serif font-bold text-white">{event.title}</h5>
                      <p className="text-[10px] text-gray-500">{event.location.split(',')[0]} • {event.time.split(',')[0]}</p>
                    </div>
                    
                    {isRegistered ? (
                      <div className="flex items-center gap-1.5">
                        <span 
                          onClick={() => setSelectedEventForModal(event)}
                          className="text-[9px] font-mono text-green-400 bg-green-500/10 px-2 py-1.5 rounded border border-green-500/20 font-bold cursor-pointer hover:bg-green-500/20 transition-all flex items-center gap-1"
                        >
                          <Check size={11} /> Registered
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegisterEvent(event)}
                        className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/5 px-2.5 py-1.5 rounded border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10 active:scale-95 transition-all duration-200 font-bold cursor-pointer"
                      >
                        Register
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Relocated Label: Move Current Area: Cape Wine Route 12 Active meetups to below Exclusive Regional Meetups */}
            <div className="flex justify-between items-center bg-[#0d0a0a]/90 backdrop-blur-md p-2.5 rounded-xl border border-white/5 text-[10px] font-mono">
              <span className="text-gray-400">Current Area: Cape Wine Route</span>
              <span className="text-[#D4AF37] font-bold">12 Active meetups</span>
            </div>
          </div>
        </div>

        {/* SECTION 6: AI MATCH INSIGHTS (BARS REPRESENTING WHY THEY MATCHED) */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4.5 space-y-4">
          <div>
            <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">WINE BIOMETRICS</span>
            <h4 className="text-sm font-serif font-extrabold text-white">AI Compatibility Breakdown</h4>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            {/* Shared Wine Personality: 91% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Shared Wine Personality</span>
                <span className="text-[#D4AF37] font-bold">{currentProfile.insights.personality}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${currentProfile.insights.personality}%` }} />
              </div>
            </div>

            {/* Shared Travel Goals: 84% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Shared Travel Goals</span>
                <span className="text-[#D4AF37] font-bold">{currentProfile.insights.travel}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-[#8B1538] h-full rounded-full" style={{ width: `${currentProfile.insights.travel}%` }} />
              </div>
            </div>

            {/* Dining Preferences: 88% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Dining Preferences</span>
                <span className="text-[#D4AF37] font-bold">{currentProfile.insights.dining}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${currentProfile.insights.dining}%` }} />
              </div>
            </div>

            {/* Conversation Style: 92% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Conversation Style & Wit</span>
                <span className="text-[#D4AF37] font-bold">{currentProfile.insights.conversation}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentProfile.insights.conversation}%` }} />
              </div>
            </div>

            {/* Potential Long-Term Compatibility: 89% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Potential Long-Term Compatibility</span>
                <span className="text-[#D4AF37] font-bold">{currentProfile.insights.longterm}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${currentProfile.insights.longterm}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7: WINE JOURNEY TIMELINE REPRESENTATION WITH ANIMATION */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4.5 space-y-4">
          <div>
            <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">RELATIONSHIP METERS</span>
            <h4 className="text-sm font-serif font-extrabold text-white">Wine Journey Timeline</h4>
          </div>

          <div className="relative pl-6 space-y-5 border-l border-white/10 ml-2">
            
            {/* Stage 1 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-[#D4AF37] text-black w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center border border-black">
                1
              </div>
              <div className="space-y-0.5">
                <h5 className="text-[11px] font-serif font-bold text-white uppercase">First Match Registered</h5>
                <p className="text-[10px] text-gray-500">Cupido algorithms detected reciprocal rating interest.</p>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-[#8B1538] text-white w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center border border-black">
                2
              </div>
              <div className="space-y-0.5">
                <h5 className="text-[11px] font-serif font-bold text-white uppercase">First Conversation Started</h5>
                <p className="text-[10px] text-gray-500">AI Icebreakers unboxed. Shared South African vineyards discussed.</p>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-purple-500 text-white w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center border border-black">
                3
              </div>
              <div className="space-y-0.5">
                <h5 className="text-[11px] font-serif font-bold text-white uppercase">First Virtual Tasting Date</h5>
                <p className="text-[10px] text-gray-500">Simultaneously scanned Kanonkop Pinotage for guided aroma comparison.</p>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-gray-700 text-white w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center border border-black">
                4
              </div>
              <div className="space-y-0.5">
                <h5 className="text-[11px] font-serif font-bold text-gray-400 uppercase">Interactive Masterclasses</h5>
                <p className="text-[10px] text-gray-500">Booked next-tier local estate events together.</p>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 8: ULTIMATE ENOVIQ ECOSYSTEM FLOWCHART DIAGRAM (Gold-Burgundy Nodes) */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4.5 space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest font-black uppercase">ENOVIQ ECOSYSTEM ENGINE</span>
            <h4 className="text-sm font-serif font-extrabold text-white">Sensory Community Cycle</h4>
          </div>

          <p className="text-[11px] text-gray-450 leading-relaxed text-center font-sans">
            How scanning a single retail bottle converts into offline event memberships and long-term wine communities:
          </p>

          {/* Core horizontal/vertical flow blocks */}
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-bold">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-[#D4AF37] text-xs">① SCAN A WINE</span>
              <p className="text-[9px] text-gray-500 mt-1">OCR Grayscale contrast label analysis</p>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-[#8B1538] text-xs">② RATE IT</span>
              <p className="text-[9px] text-gray-500 mt-1">Logs five-star tasting logs in cellar</p>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-purple-400 text-xs">③ TASTE PROFILE</span>
              <p className="text-[9px] text-gray-500 mt-1">Aggregates sweet-dry Oak signals</p>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-emerald-400 text-xs">④ WINE DNA</span>
              <p className="text-[9px] text-gray-500 mt-1">Assigns Connoisseur identity rating</p>
            </div>
          </div>

          <div className="flex justify-center py-1">
            <div className="text-[#D4AF37] animate-bounce">↓</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-bold">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-pink-400 text-xs">⑤ MATCH PEOPLE</span>
              <p className="text-[9px] text-gray-500 mt-1">Swills custom target matches with Cupido</p>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-blue-400 text-xs">⑥ BOOK TASTINGS</span>
              <p className="text-[9px] text-gray-500 mt-1">Arranges premium virtual date tasting</p>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-amber-500 text-xs">⑦ ATTEND EVENTS</span>
              <p className="text-[9px] text-gray-500 mt-1">Registers for VIP regional masterclasses</p>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col justify-center items-center">
              <span className="text-white text-xs">⑧ WINE COHORT</span>
              <p className="text-[9px] text-gray-500 mt-1">Builds lasting social luxury communities</p>
            </div>
          </div>

        </div>

      </div>

      {/* MATCH LANDING CELEBRATION MODAL OVERLAY */}
      <AnimatePresence>
        {showMatchCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8B1538]/30 via-transparent to-[#D4AF37]/10 pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#0A0A0A] border-2 border-[#D4AF37] rounded-3xl p-6 text-center max-w-sm w-full space-y-6 shadow-2xl relative"
            >
              {/* Confetti sparkling indicator */}
              <div className="p-4 rounded-full bg-gradient-to-br from-[#8B1538]/20 to-[#D4AF37]/20 border border-[#D4AF37]/30 inline-block">
                <Heart className="text-[#D4AF37] fill-[#8B1538] animate-bounce" size={48} />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono tracking-[0.3em] text-[#D4AF37] uppercase font-black block">CUPIDO COUPLING SYSTEM</span>
                <h3 className="text-2xl font-serif font-black text-white">A Perfect Pairing!</h3>
                <p className="text-xs text-gray-300">
                  You and <strong>{currentProfile.name}</strong> both selected <strong>Meerlust Rubicon</strong> 5 Stars in your vaults!
                </p>
              </div>

              <div className="flex justify-center -space-x-4 py-2">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" 
                  alt="You" 
                  className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white/20 shadow-lg relative z-10" 
                />
                <img 
                  src={currentProfile.photo} 
                  alt={currentProfile.name} 
                  className="w-[72px] h-[72px] rounded-full object-cover border-2 border-[#D4AF37] shadow-lg relative z-20" 
                />
              </div>

              {/* Opener starter prompt card */}
              <div className="bg-white/[0.04] p-3.5 rounded-xl text-left border border-white/5 space-y-1.5">
                <span className="text-[8px] font-mono tracking-widest text-[#D4AF37] uppercase font-black block">RECOMMENDED ICEBREAKER</span>
                <p className="text-xs text-gray-250 italic">
                  "Hi {currentProfile.name}, Enoviq matched us on the vintage {currentProfile.favoriteWines[0] || "Cabernet"}. Did you explore their premium estate tastings yet?"
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => {
                    triggerVibrate();
                    setShowMatchCelebration(false);
                    nextMatch();
                  }}
                  className="w-full bg-[#D4AF37] hover:bg-[#B38E36] text-black font-serif font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                >
                  Send Icebreaker Opener
                </button>
                <button 
                  onClick={() => {
                    triggerVibrate();
                    setShowMatchCelebration(false);
                    nextMatch();
                  }}
                  className="text-[10px] font-mono text-gray-500 hover:text-white underline block mx-auto cursor-pointer"
                >
                  Keep Discovering
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT REGISTRATION DETAILS MODAL */}
      <AnimatePresence>
        {selectedEventForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8B1538]/30 via-transparent to-[#D4AF37]/10 pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#0A0A0A] border-2 border-[#D4AF37] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="absolute top-4 right-4 text-gray-405 hover:text-white transition-colors cursor-pointer"
                type="button"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-1">
                <div className="p-3.5 rounded-full bg-green-500/10 border border-green-500/30 inline-block">
                  <Check className="text-green-400" size={32} />
                </div>
                <span className="text-[9px] font-mono tracking-[0.3em] text-[#D4AF37] uppercase font-black block">CUPIDO PASS ACTIVATED</span>
                <h3 className="text-xl font-serif font-black text-white">Registration Confirmed</h3>
                <p className="text-xs text-gray-300">You are on the exclusive attendee roster</p>
              </div>

              {/* Boxed Event Details */}
              <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/5 space-y-3.5 text-xs text-left">
                <div>
                  <span className="text-[8px] font-mono text-[#D4AF37] uppercase font-black block">EVENT TITLE</span>
                  <h4 className="font-serif font-extrabold text-white text-sm">{selectedEventForModal.title}</h4>
                </div>

                <div className="grid grid-cols-1 gap-2.5 font-mono text-[10px]">
                  <div>
                    <span className="text-gray-500 block uppercase">DATE & TIME</span>
                    <span className="text-gray-350">{selectedEventForModal.time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase">DRESS CODE</span>
                    <span className="text-gray-350">{selectedEventForModal.dressCode}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">VENUE LOCATION</span>
                  <p className="text-gray-350">{selectedEventForModal.location}</p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#D4AF37] block uppercase">VIP COST & ACCESS</span>
                  <p className="text-yellow-100 font-bold">{selectedEventForModal.price}</p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[8px] font-mono text-gray-400 block uppercase">SESSION FOCUS</span>
                  <p className="text-gray-300 italic font-serif">"{selectedEventForModal.keynote}"</p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[8px] font-mono text-gray-400 block uppercase">ABOUT THE EVENT</span>
                  <p className="text-gray-400 text-[11px] leading-relaxed font-sans">{selectedEventForModal.description}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => downloadEventPDF(selectedEventForModal)}
                  className="w-full bg-[#D4AF37] hover:bg-[#B38E36] text-black font-serif font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 border-0"
                >
                  <Download size={14} strokeWidth={2.5} /> Download PDF Pass
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEventForModal(null)}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-[11px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/10"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ---------------- CUPIDO PREMIUM GOLD PAYWALL MODAL + PAYMENT FLOW ----------------
type PaymentProvider = 'google_pay' | 'paypal' | 'stripe';

type CupidoReceipt = {
  subscriptionId: string;
  provider: PaymentProvider;
  planName: string;
  amountZAR: number;
  interval: 'week';
  payerEmail?: string;
  receiptUrl?: string;
};

const CUPIDO_GOLD_PLAN = {
  name: 'Cupido Gold — Weekly AI Access',
  priceZAR: 20,
  quantity: 1,
};

const providerLabels: Record<PaymentProvider, string> = {
  google_pay: 'Google Pay',
  paypal: 'PayPal',
  stripe: 'Stripe Card',
};

function GoldPremiumModal({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: () => void }) {
  const [receipt, setReceipt] = useState<CupidoReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeUpgrade = (paymentReceipt: CupidoReceipt) => {
    setReceipt(paymentReceipt);
    notifyUser(
      'info',
      'Cupido Gold Activated ✨',
      `Your R${paymentReceipt.amountZAR.toFixed(2)}/week ${providerLabels[paymentReceipt.provider]} subscription is active.`
    );
    setTimeout(onUpgrade, 1200);
  };

  const startWhopCheckout = () => {
    setError(null);
    try {
      openWhopCheckout(WHOP_CUPIDO_CHECKOUT_URL, {
        source: 'enoviq',
        flow: 'cupido',
        plan: CUPIDO_GOLD_PLAN.name
      });
    } catch (err: any) {
      setError(err?.message || 'Checkout is not configured yet. Please try again later.');
    }
  };

  if (receipt) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-[#0D0A0A] border border-[#D4AF37]/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
          <div className="p-3.5 rounded-full bg-green-500/10 border border-green-500/30 inline-block">
            <ShieldCheck className="text-green-400" size={42} />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-[0.3em] text-[#D4AF37] font-black uppercase">PAYMENT CONFIRMED</span>
            <h3 className="text-xl font-serif font-black text-white">Cupido Gold Active</h3>
          </div>
          <div className="bg-white/[0.04] border border-white/5 rounded-xl p-3 text-xs text-left space-y-1.5">
            <p><strong className="text-[#D4AF37]">Plan:</strong> {receipt.planName}</p>
            <p><strong className="text-[#D4AF37]">Recurring fee:</strong> R{receipt.amountZAR.toFixed(2)} / week</p>
            <p><strong className="text-[#D4AF37]">Paid with:</strong> {providerLabels[receipt.provider]}</p>
            <p className="text-gray-500 font-mono text-[10px]">Subscription: {receipt.subscriptionId}</p>
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Opening Cupido AI platform…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-t from-[#8B1538]/20 via-[#4A001F]/5 to-transparent pointer-events-none" />
      <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-[#0D0A0A] border border-[#D4AF37]/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-5 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-405 hover:text-white transition-colors cursor-pointer" type="button"><X size={20} /></button>
        <div className="p-3.5 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#8B1538]/20 border border-[#D4AF37]/30 inline-block"><Crown className="text-[#D4AF37] animate-pulse" size={40} /></div>
        <div className="space-y-1">
          <span className="text-[9px] font-mono tracking-[0.3em] text-[#D4AF37] font-black uppercase">ENOVIQ GOLD MEMBERSHIP</span>
          <h3 className="text-xl font-serif font-black text-white">Pay R20/week to unlock Cupido AI</h3>
          <p className="text-xs text-gray-400">A recurring Cupido Gold subscription is required before accessing matches, AI dates, VIP meetups and compatibility reports.</p>
        </div>
        <div className="space-y-2.5 text-left text-xs font-serif text-gray-300">
          {['Unlimited Connections across Cape Wine routes', 'Real-time AI Matchmaker and advanced filters', 'Virtual Wine Dates and premium AI icebreakers', 'Luxury Wine Compatibility Reports', 'VIP Wine Networking and exclusive meetups'].map((feature) => (
            <div className="flex items-center gap-2" key={feature}><Check size={14} className="text-[#D4AF37]" /><span>{feature}</span></div>
          ))}
        </div>
        <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-serif font-black text-white">Cupido Gold</p><p className="text-[10px] text-gray-500 font-mono">Recurring weekly billing</p></div>
            <p className="text-lg text-[#D4AF37] font-serif font-black">R20</p>
          </div>
          <button type="button" onClick={startWhopCheckout} className="w-full bg-[#D4AF37] hover:bg-[#f0cf69] text-[#0D0A0A] font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"><CreditCard size={14} /> Continue to Whop checkout</button>
        </div>
        {error && <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>}
      </motion.div>
    </motion.div>
  );
}

const GOOGLE_PAY_ENVIRONMENT = 'TEST';
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';
const CHARGE_ENDPOINT = '/api/cupido/subscriptions/google-pay';

const baseCardPaymentMethod = {
  type: 'CARD',
  parameters: {
    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
  },
};

const cardPaymentMethod = {
  ...baseCardPaymentMethod,
  tokenizationSpecification: {
    type: 'PAYMENT_GATEWAY',
    parameters: { gateway: 'stripe', 'stripe:version': '2024-06-20', 'stripe:publishableKey': STRIPE_PUBLISHABLE_KEY },
  },
};

declare global {
  interface Window { google?: any; }
}

function getGooglePaymentsClient() {
  return new window.google.payments.api.PaymentsClient({ environment: GOOGLE_PAY_ENVIRONMENT });
}

function buildPaymentDataRequest(ticket: { name: string; priceZAR: number; quantity: number }) {
  const totalPrice = (ticket.priceZAR * ticket.quantity).toFixed(2);
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [cardPaymentMethod],
    merchantInfo: { merchantId: '12345678901234567890', merchantName: 'Cupido Gold' },
    transactionInfo: {
      countryCode: 'ZA', currencyCode: 'ZAR', totalPriceStatus: 'FINAL', totalPrice, totalPriceLabel: 'Weekly recurring fee',
      displayItems: [{ label: ticket.name, type: 'LINE_ITEM', price: ticket.priceZAR.toFixed(2) }],
    },
    shippingAddressRequired: false,
    emailRequired: true,
  };
}

function GooglePayButton({ ticket, onSuccess, onError }: { ticket: { name: string; priceZAR: number; quantity: number }, onSuccess: (receipt: CupidoReceipt) => void, onError: (error: Error) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function init() {
      const paymentsClient = getGooglePaymentsClient();
      paymentsClient.isReadyToPay({ apiVersion: 2, apiVersionMinor: 0, allowedPaymentMethods: [baseCardPaymentMethod] })
        .then((response: any) => {
          if (cancelled || !response.result) return;
          const button = paymentsClient.createButton({
            onClick: () => handleClick(paymentsClient), buttonColor: 'black', buttonType: 'pay', buttonSizeMode: 'fill', buttonRadius: 8,
          });
          containerRef.current?.replaceChildren(button);
          setReady(true);
        })
        .catch((err: Error) => onError?.(err));
    }
    if (window.google?.payments?.api) init();
    else {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://pay.google.com/gp/p/js/pay.js"]');
      if (existingScript) existingScript.addEventListener('load', init, { once: true });
      else {
        const script = document.createElement('script');
        script.src = 'https://pay.google.com/gp/p/js/pay.js';
        script.async = true;
        script.onload = init;
        script.onerror = () => onError?.(new Error('Failed to load Google Pay script'));
        document.body.appendChild(script);
      }
    }
    return () => { cancelled = true; };
  }, []);

  async function handleClick(paymentsClient: any) {
    setLoadingPay(true);
    try {
      const paymentData = await paymentsClient.loadPaymentData(buildPaymentDataRequest(ticket));
      const googlePayToken = paymentData.paymentMethodData.tokenizationData.token;
      const payerEmail = paymentData.email;
      const res = await fetch(CHARGE_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googlePayToken, payerEmail, planName: ticket.name, quantity: ticket.quantity, amountZAR: ticket.priceZAR * ticket.quantity }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || 'Payment failed. Please try again.');
      onSuccess?.(payload.receipt);
    } catch (err: any) {
      if (err?.statusCode !== 'CANCELED') onError?.(err);
    } finally {
      setLoadingPay(false);
    }
  }

  return (
    <div>
      <div ref={containerRef} style={{ minHeight: 48, margin: '8px 0', opacity: loadingPay ? 0.6 : 1 }} aria-live="polite" />
      {!ready && <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Loading Google Pay…</p>}
    </div>
  );
}
