import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, Activity, Droplet, Calendar, Plus, TrendingUp } from 'lucide-react';
import { isCurrentUserAdmin, supabase } from '../supabase';
import EventModal from './EventModal';

export default function HomeTab({ onSelectWine, onNavigate }: { onSelectWine: (wine: any) => void, onNavigate: (tab: string, state?: any) => void }) {
  const [glassesThisWeek, setGlassesThisWeek] = useState(0);
  const [caloriesThisWeek, setCaloriesThisWeek] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [trendingNews, setTrendingNews] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('Friend');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Fetch News Real-time
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(5);
        if (error) throw error;
        if (isMounted && data) {
           setTrendingNews(data);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
      }
    };
    fetchNews();
    
    const newsChannel = supabase
      .channel(`news_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchNews();
      })
      .subscribe();

    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .maybeSingle();

      const admin = await isCurrentUserAdmin().catch(() => false);
      if (isMounted) {
        setIsAdmin(admin);
      }
      
      if (profileData && profileData.first_name && isMounted) {
         setFirstName(profileData.first_name);
      } else if (user.email && isMounted) {
         setFirstName(user.email.split('@')[0]);
      }
    };
    
    const fetchConsumption = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data } = await supabase
        .from('consumption')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', oneWeekAgo.toISOString());
        
      if (data && isMounted) {
        let glasses = 0;
        let calories = 0;
        data.forEach((doc: any) => {
          glasses += 1;
          calories += Number(doc.calories) || 120;
        });
        setGlassesThisWeek(glasses);
        setCaloriesThisWeek(calories);
      }
    };

    const fetchEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });
        
      if (data && isMounted) {
        const today = new Date().toISOString().split('T')[0];
        setEvents(data.filter((e: any) => (e.event_date || '').slice(0, 10) >= today));
      }
    };

    fetchUserData();
    fetchConsumption();
    fetchEvents();
    
    const fetchUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const consumptionChannel = supabase
        .channel(`consumption_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption', filter: `user_id=eq.${user.id}` }, () => {
          fetchConsumption();
        })
        .subscribe();
        
      const eventsChannel = supabase
        .channel(`events_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${user.id}` }, () => {
          fetchEvents();
        })
        .subscribe();
        
      return { consumptionChannel, eventsChannel };
    };
    
    const channelsPromise = fetchUserAndSubscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(newsChannel);
      channelsPromise.then(channels => {
        if (channels) {
          supabase.removeChannel(channels.consumptionChannel);
          supabase.removeChannel(channels.eventsChannel);
        }
      });
    };
  }, []);

  return (
    <div className="pb-32 w-full mt-2">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6">
        <button 
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full overflow-hidden border border-[#C8A24A]/40 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(200,162,74,0.15)]"
        >
          <img src={profileUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </button>
        
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className="px-4 py-2 rounded-full bg-[#12100C] border border-[#C8A24A]/40 text-[#C8A24A] font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1813] active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(200,162,74,0.15)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Admin Console
          </button>
        )}

        <div className="w-10 h-10 rounded-full border border-[#C8A24A]/30 bg-[#0A0A0A] flex items-center justify-center shadow-[0_0_15px_rgba(200,162,74,0.1)] relative">
          <div className="absolute inset-1.5 border border-[#C8A24A]/20 rounded-full border-dashed animate-[spin_30s_linear_infinite]"></div>
          <div className="w-1.5 h-1.5 bg-[#C8A24A] rounded-full"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-6 mb-8 mt-2">
        <div className="text-[10px] tracking-[0.2em] font-mono text-[#C8A24A] uppercase mb-3 flex items-center gap-2">
           <div className="w-6 h-px bg-[#C8A24A]/40"></div>
           Enoviq Estate
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[34px] leading-[1.1] font-serif font-normal mb-3"
        >
          Good evening,<br/>
          <span className="text-[#C8A24A] font-bold italic">{firstName}</span> <span className="text-transparent text-shadow-sm opacity-80 text-2xl">🍷</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[#F2E7D5]/60 text-sm font-serif italic"
        >
          "Here's your perfect match for tonight."
        </motion.p>
      </div>

      {/* Hero Card */}
      <div className="px-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-[4/5] border border-[#C8A24A]/30 shadow-[0_15px_40px_rgba(0,0,0,0.8)] group"
        >
          <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop" alt="Wine" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
          <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none z-10 m-2"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
            <div className="inline-flex items-center gap-2 bg-[#050505]/80 border border-[#C8A24A]/40 backdrop-blur-md px-3 py-1.5 rounded-full mb-4 shadow-[0_0_15px_rgba(200,162,74,0.2)]">
              <Sparkles size={12} className="text-[#C8A24A]" />
              <span className="text-[9px] font-bold tracking-[0.15em] font-mono text-[#C8A24A] uppercase mt-0.5">95% Match</span>
            </div>
            <h2 className="text-3xl font-serif font-semibold mb-1 text-[#F2E7D5] leading-tight">Kanonkop Paul Sauer</h2>
            <p className="text-[#F2E7D5]/70 mb-5 font-serif italic text-sm">Stellenbosch, 2019</p>
            <button 
              onClick={() => onSelectWine({
                name: "Kanonkop Paul Sauer",
                vintage: "2019",
                region: "Stellenbosch",
                image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"
              })}
              className="w-full bg-gradient-to-r from-[#C8A24A] to-[#B38E36] hover:from-[#dabb70] hover:to-[#C8A24A] text-[#050505] font-semibold py-4 rounded-full transition-all duration-300 shadow-[0_8px_25px_rgba(200,162,74,0.3)] text-sm group-hover:shadow-[0_8px_30px_rgba(200,162,74,0.4)] relative overflow-hidden animate-pulse-glow"
            >
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              Explore Pairing
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mindful Tracker */}
      <div className="px-6 mb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-serif italic flex items-center gap-2 text-[#C8A24A]">
            <Activity size={18} className="text-[#C8A24A]" />
            Mindful Tracker
          </h3>
        </div>
        <div className="bg-[#0A0A0A]/90 luxury-border p-4 rounded-xl flex gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex-1 bg-[#12100C] rounded-lg p-4 luxury-border relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="flex items-center gap-2 text-[#F2E7D5]/70 mb-3 relative z-10">
              <Droplet size={14} className="text-[#C8A24A]" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Glasses <span className="text-white/30">(7d)</span></span>
            </div>
            <p className="text-3xl font-serif font-bold text-[#F2E7D5] relative z-10">{glassesThisWeek}</p>
          </div>
          <div className="flex-1 bg-[#12100C] rounded-lg p-4 luxury-border relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="flex items-center gap-2 text-[#F2E7D5]/70 mb-3 relative z-10">
              <Activity size={14} className="text-[#C8A24A]" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Calories</span>
            </div>
            <p className="text-3xl font-serif font-bold text-[#F2E7D5] relative z-10">{caloriesThisWeek}</p>
          </div>
        </div>
      </div>

      {/* Trending Now */}
      <div className="px-6 mb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-serif italic flex items-center gap-2 text-[#C8A24A]">
            <TrendingUp size={18} className="text-[#C8A24A]" />
            Trending Now
          </h3>
          <button onClick={() => onNavigate('discover')} className="text-[#F2E7D5]/50 flex items-center text-sm gap-1 hover:text-[#C8A24A] transition-colors uppercase tracking-widest font-mono text-[9px] font-bold">
            Discover Now <ChevronRight size={12} className="ml-0.5" />
          </button>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-6 px-6">
           {trendingNews.map((news, i) => (
             <div key={i} className="min-w-[280px] w-[280px] bg-[#0A0A0A]/90 p-4 rounded-2xl relative overflow-hidden shrink-0 hover:bg-[#12100C] transition-colors cursor-pointer luxury-border shadow-[0_8px_25px_rgba(0,0,0,0.5)] group" onClick={() => onNavigate('discover')}>
                <div className="h-36 mb-4 rounded-xl overflow-hidden relative border border-white/5">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                  <div className="absolute top-2 left-2 bg-[#050505]/80 backdrop-blur-md px-2 py-1 flex rounded border border-[#C8A24A]/30 items-center text-[8px] uppercase tracking-widest text-[#C8A24A] font-bold font-mono">
                     {news.category}
                  </div>
                </div>
                <h4 className="font-serif text-[15px] text-[#F2E7D5] mb-2 line-clamp-2 leading-snug">{news.title}</h4>
                <p className="text-xs text-[#F2E7D5]/50 line-clamp-2 leading-relaxed font-serif italic">{news.description}</p>
             </div>
           ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="px-6 mb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-serif italic flex items-center gap-2 text-[#C8A24A]">
            <Calendar size={18} className="text-[#C8A24A]" />
            Tasting Events
          </h3>
          <button onClick={() => setShowEventModal(true)} className="text-[#F2E7D5]/50 flex items-center gap-1 hover:text-[#C8A24A] transition-colors uppercase tracking-widest font-mono text-[9px] font-bold">
            <Plus size={12} /> Set Up
          </button>
        </div>
        
        {events.length === 0 ? (
          <div className="bg-[#0A0A0A]/90 p-6 rounded-xl luxury-border text-center shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <p className="text-[#F2E7D5]/50 text-sm mb-4 font-serif italic">"No upcoming tastings scheduled."</p>
            <button onClick={() => setShowEventModal(true)} className="px-6 py-2.5 bg-transparent border border-[#C8A24A]/50 rounded-full text-xs text-[#C8A24A] hover:bg-[#C8A24A]/10 transition-colors uppercase tracking-widest font-mono font-bold shadow-[0_0_15px_rgba(200,162,74,0.1)]">
              Schedule One
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="bg-[#0A0A0A]/90 p-3 rounded-xl flex items-center gap-4 luxury-border shadow-[0_5px_20px_rgba(0,0,0,0.3)]">
                <div className="bg-[#12100C] rounded-lg p-2.5 text-center min-w-[60px] border border-[#C8A24A]/10">
                  <p className="text-[10px] text-[#F2E7D5]/50 uppercase font-mono tracking-widest font-bold">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</p>
                  <p className="text-lg font-serif font-semibold text-[#C8A24A] mt-0.5">{new Date(event.event_date).getDate()}</p>
                </div>
                <div>
                  <h4 className="font-serif text-[15px] text-[#F2E7D5] mb-1">{event.title}</h4>
                  <p className="text-[11px] font-mono text-[#C8A24A]/70 uppercase tracking-wider">
                    {event.time && `${event.time} • `}{event.location || 'TBD'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      <AnimatePresence>
        {showEventModal && <EventModal onClose={() => setShowEventModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
