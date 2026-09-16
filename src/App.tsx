/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './supabase';
import OnboardingScreen from './components/OnboardingScreen';
import { Bell, Calendar, Grape, Home, Search, ScanLine, Sparkles, User, Users } from 'lucide-react';


const HomeTab = lazy(() => import('./components/HomeTab'));
const DiscoverTab = lazy(() => import('./components/DiscoverTab'));
const ScanTab = lazy(() => import('./components/ScanTab'));
const CellarTab = lazy(() => import('./components/CellarTab'));
const SocialTab = lazy(() => import('./components/SocialTab'));
const SommelierChat = lazy(() => import('./components/SommelierChat'));
const CupidoTab = lazy(() => import('./components/CupidoTab'));
const WineDetail = lazy(() => import('./components/WineDetail'));
const TrendingTab = lazy(() => import('./components/TrendingTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const PairWithDinnerPage = lazy(() => import('./components/PairWithDinnerPage'));
const PairingEngine = lazy(() => import('./components/PairingEngine'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AddWineCollectionScreen = lazy(() => import('./components/AddWineCollectionScreen'));
const ManualEntryScreen = lazy(() => import('./components/ManualEntryScreen'));
const SearchWineScreen = lazy(() => import('./components/SearchWineScreen'));
const GrapeKnowledgePage = lazy(() => import('./components/GrapeKnowledgePage'));


type AppRouteState = {
  tab?: string;
  discoverState?: any;
  chatState?: { role: 'user' | 'model', text: string, autoVoice?: boolean } | null;
  cellarView?: 'cellar' | 'wishlist';
};

const TAB_ROUTES: Record<string, string> = {
  home: '/',
  discover: '/explore',
  scan: '/scan',
  ai: '/sommelier',
  cellar: '/cellar',
  cupido: '/cupido',
  social: '/friends',
  profile: '/profile',
  trending: '/trending',
  pairings: '/pairings',
  'pairing-engine': '/pairings/engine',
  admin: '/admin',
  'collection-add': '/cellar/add',
  'collection-manual': '/cellar/add/manual',
  search: '/cellar/add/search',
};

const routeForTab = (tab: string, state?: any) => {
  if (tab === 'discover' && state?.query) return `/explore?query=${encodeURIComponent(state.query)}`;
  if (tab === 'discover' && state?.filter) return `/explore?filter=${encodeURIComponent(state.filter)}`;
  if (tab === 'ai' && state?.text) return `/sommelier?prompt=${encodeURIComponent(state.text)}`;
  if (tab === 'cellar' && state?.view === 'wishlist') return '/cellar/wishlist';
  return TAB_ROUTES[tab] || '/';
};

const pathToTab = (path: string) => {
  if (path === '/' || path === '') return 'home';
  if (path === '/scan') return 'scan';
  if (path === '/cellar' || path === '/cellar/wishlist') return 'cellar';
  if (path === '/cupido') return 'cupido';
  if (path === '/friends') return 'social';
  if (path === '/profile') return 'profile';
  if (path === '/pairings') return 'pairings';
  if (path === '/pairings/engine') return 'pairing-engine';
  if (path === '/admin') return 'admin';
  if (path === '/cellar/add') return 'collection-add';
  if (path === '/cellar/add/manual') return 'collection-manual';
  if (path === '/cellar/add/search') return 'search';
  return null;
};

const ScreenFallback = () => (
  <div className="min-h-[60dvh] flex items-center justify-center text-gold-400 text-xs font-mono uppercase tracking-[0.25em]">
    Loading cellar room...
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedWine, setSelectedWine] = useState<any>(null);
  const [selectedGrapeSlug, setSelectedGrapeSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [initialDiscoverState, setInitialDiscoverState] = useState<any>(null);
  const [initialChatState, setInitialChatState] = useState<{ role: 'user' | 'model', text: string, autoVoice?: boolean } | null>(null);
  const [cellarSubView, setCellarSubView] = useState<'cellar' | 'wishlist'>('cellar');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [kycAssurance, setKycAssurance] = useState(0);

  const addNotification = (type: 'match' | 'event' | 'info', title: string, message: string) => {
    const id = Math.random().toString();
    const newNotif = { id, type, title, message };
    setNotifications(prev => [newNotif, ...prev].slice(0, 3));
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsOnboarding(!user);
        if (user) {
          const { data } = await supabase.rpc('current_user_kyc_assurance');
          setKycAssurance(Number(data || 0));
        } else {
          setKycAssurance(0);
        }
      } catch (error) {
        console.error("Error connecting to Supabase: ", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const applyRoute = useCallback(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const historyState = (window.history.state || {}) as AppRouteState;

    setSelectedGrapeSlug(null);
    setInitialDiscoverState(null);
    setInitialChatState(null);

    if (path.startsWith('/grapes/')) {
      setActiveTab('discover');
      setSelectedGrapeSlug(decodeURIComponent(path.split('/')[2] || ''));
      return;
    }

    if (path.startsWith('/pair') && path !== '/pairings' && path !== '/pairings/engine') {
      setActiveTab('ai');
      const meal = params.get('meal');
      const mood = params.get('mood');
      if (meal) setInitialChatState({ role: 'user', text: `I am having ${meal} for dinner. What South African wine would you pair with this?` });
      else if (mood) setInitialChatState({ role: 'user', text: `I am in a ${mood} mood. Recommend a South African wine.` });
      else setInitialChatState({ role: 'model', text: `What are you eating tonight? Let me help you pair a wine.` });
      return;
    }

    if (path.startsWith('/explore')) {
      setActiveTab('discover');
      const query = params.get('query');
      const filter = params.get('filter');
      setInitialDiscoverState(historyState.discoverState || (query ? { query } : filter ? { filter } : null));
      return;
    }

    if (path.startsWith('/trending') || path.startsWith('/search/trending') || path.startsWith('/sa')) {
      setActiveTab('trending');
      if (path.includes('/news')) setInitialDiscoverState({ filter: 'News' });
      else if (path.includes('/culture')) setInitialDiscoverState({ filter: 'Culture' });
      else if (path.includes('/markets') || path.includes('/finance')) setInitialDiscoverState({ filter: 'Finance' });
      else if (path.includes('/wine')) setInitialDiscoverState({ filter: 'Wine' });
      else if (path.includes('/tech')) setInitialDiscoverState({ filter: 'Tech' });
      else setInitialDiscoverState({ filter: params.get('filter') || historyState.discoverState?.filter || 'All Trends' });
      return;
    }

    if (path.startsWith('/sommelier')) {
      setActiveTab('ai');
      const voice = params.get('voice');
      const prompt = params.get('prompt');
      setInitialChatState(historyState.chatState || (prompt ? { role: 'user', text: prompt } : { role: 'model', text: "Tell me your mood, budget, and meal, and I'll find the perfect wine.", autoVoice: voice === 'true' }));
      return;
    }

    const tab = pathToTab(path) || 'home';
    setActiveTab(tab);
    setCellarSubView(path === '/cellar/wishlist' || historyState.cellarView === 'wishlist' ? 'wishlist' : 'cellar');
  }, []);

  const navigateTo = useCallback((tab: string, state?: any, options?: { replace?: boolean }) => {
    const nextUrl = routeForTab(tab, state);
    const nextState: AppRouteState = {
      tab,
      discoverState: tab === 'discover' || tab === 'trending' ? state : undefined,
      chatState: tab === 'ai' ? state : undefined,
      cellarView: tab === 'cellar' ? state?.view : undefined,
    };

    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history[options?.replace ? 'replaceState' : 'pushState'](nextState, '', nextUrl);
    } else {
      window.history.replaceState(nextState, '', nextUrl);
    }
    applyRoute();
  }, [applyRoute]);

  useEffect(() => {
    applyRoute();
    window.addEventListener('popstate', applyRoute);
    return () => window.removeEventListener('popstate', applyRoute);
  }, [applyRoute]);

  useEffect(() => {
    const handleCustomNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        addNotification(detail.type, detail.title, detail.message);
      }
    };
    window.addEventListener('enoviq_notification', handleCustomNotification);
    return () => window.removeEventListener('enoviq_notification', handleCustomNotification);
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    let matchesChannel: any = null;

    const setupMatchesSubscription = async () => {
      try {
        matchesChannel = supabase.channel(`realtime_app_matches_${user.id}`);
        matchesChannel
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cupido_matches' }, (payload: any) => {
            if (!isMounted) return;
            const newMatch = payload.new;
            if (newMatch && (newMatch.user_one_id === user.id || newMatch.user_two_id === user.id)) {
              addNotification(
                'match',
                'New Wine Match! 🍷',
                'You have a new mutual Enoviq Cupido match on premium wine preferences!'
              );
            }
          })
          .subscribe();
      } catch (err) {
        console.warn("Matches live channel trigger warning:", err);
      }
    };

    setupMatchesSubscription();

    const checkApproachingEvents = async () => {
      try {
        const { data: regs, error } = await supabase
          .from('cupido_event_registrations')
          .select('event_id')
          .eq('user_id', user.id);

        if (!error && regs && regs.length > 0) {
          const registeredEventIds = regs.map((r: any) => r.event_id);
          const now = new Date();
          const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const { data: events } = await supabase
            .from('events')
            .select('id, title, event_date, location')
            .gte('event_date', now.toISOString())
            .lte('event_date', soon.toISOString());

          events
            ?.filter((event: any) => registeredEventIds.includes(event.id))
            .forEach((event: any) => {
              const eventDate = new Date(event.event_date);
              const daysAway = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
              addNotification(
                'event',
                'Approaching Event! 📅',
                `${event.title} at ${event.location || 'the listed venue'} is approaching on ${eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} (${daysAway} day${daysAway === 1 ? '' : 's'} away).`
              );
            });
        }
      } catch (err) {
        console.warn("Approaching events checking warning:", err);
      }
    };

    const eventsTimer = setTimeout(() => {
      if (isMounted) checkApproachingEvents();
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(eventsTimer);
      if (matchesChannel) {
        try {
          supabase.removeChannel(matchesChannel);
        } catch {}
      }
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center text-gold-500 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold-500/10 rounded-full blur-[80px] z-0 animate-pulse pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Grape className="w-12 h-12 text-gold-500 animate-bounce duration-1000" />
          <div className="text-xs font-mono tracking-[0.25em] text-gold-400 uppercase animate-pulse">Initializing Cellar Vault</div>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return <OnboardingScreen onComplete={() => setIsOnboarding(false)} />;
  }

  if (!user) {
    // Should be caught by isOnboarding, but render it just in case onboarding completes with no auth
    return <OnboardingScreen onComplete={() => setIsOnboarding(false)} />;
  }

  const requiresKyc = (tab: string) => tab === 'scan';

  const requireVerifiedAccess = (tab: string) => {
    if (!requiresKyc(tab) || kycAssurance >= 1) {
      navigateTo(tab);
      return;
    }

    addNotification('info', 'KYC Required', 'Please submit KYC in your Dossier before accessing high-trust features.');
    navigateTo('profile');
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-[#F2E7D5] flex flex-col items-center justify-between relative overflow-hidden selection:bg-[#C8A24A]/30 font-sans border-0 sm:border sm:border-[#C8A24A]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] lg:max-w-md lg:mx-auto">
      {/* Frame Gold Border Effect (Mobile Outline) */}
      <div className="absolute inset-0 border-[0.5px] border-[#C8A24A]/20 pointer-events-none z-50 rounded-sm lg:rounded-none m-1"></div>
      
      {/* Real-time Notification HUD Overlays */}
      <div className="absolute top-4 left-4 right-4 z-[100] pointer-events-none flex flex-col gap-2.5 max-w-sm mx-auto">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -45, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 15, stiffness: 180 }}
              className="pointer-events-auto w-full p-3.5 rounded-xl border border-[#C8A24A]/30 bg-[#0A0A0B]/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.85)] flex items-start gap-3 relative overflow-hidden group"
            >
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-5 group-hover:animate-shine pointer-events-none" />
              <div className={`absolute top-0 left-0 w-[3px] h-full ${
                notif.type === 'match' ? 'bg-[#8B1538]' : notif.type === 'event' ? 'bg-[#D4AF37]' : 'bg-blue-400'
              }`} />
              <div className={`p-2 rounded-lg ${
                notif.type === 'match' ? 'bg-[#8B1538]/10 text-[#8B1538]' : notif.type === 'event' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-blue-400/10 text-blue-400'
              }`}>
                {notif.type === 'match' && <Sparkles size={16} className="text-[#D4AF37] fill-[#D4AF37]/30" />}
                {notif.type === 'event' && <Calendar size={16} className="text-[#D4AF37]" />}
                {notif.type !== 'match' && notif.type !== 'event' && <Bell size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-black text-white leading-none mb-1">{notif.title}</h4>
                  <button 
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-[10px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">{notif.message}</p>
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-1.5">Enoviq Real-time • Live HUD</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-[#C8A24A]/5 to-transparent"></div>
         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#C8A24A]/5 rounded-full blur-[120px]" />
      </div>

      <main className="w-full flex-1 h-[100dvh] overflow-y-auto hide-scrollbar relative z-10 custom-scrollbar">
        <Suspense fallback={<ScreenFallback />}>
        {selectedGrapeSlug ? (
          <GrapeKnowledgePage 
            slug={selectedGrapeSlug} 
            onBack={() => navigateTo('discover')}
            onSelectWine={setSelectedWine}
          />
        ) : (
          <>
            {activeTab === 'home' && <HomeTab onSelectWine={setSelectedWine} onNavigate={navigateTo} />}
            {activeTab === 'discover' && <DiscoverTab onSelectWine={setSelectedWine} initialState={initialDiscoverState} />}
            {activeTab === 'scan' && (kycAssurance >= 1 ? <ScanTab onSelectWine={setSelectedWine} /> : <ProfileTab onNavigate={(tab) => navigateTo(tab)} />)}
            {activeTab === 'ai' && <SommelierChat onClose={() => navigateTo('home')} initialMessage={initialChatState} />}
            {activeTab === 'cellar' && <CellarTab initialViewMode={cellarSubView} onSelectWine={setSelectedWine} onNavigate={navigateTo} />}
            {activeTab === 'cupido' && <CupidoTab />}
            {activeTab === 'profile' && <ProfileTab onNavigate={(tab) => navigateTo(tab, tab === 'cellar' ? { view: 'cellar' } : undefined)} />}
            {activeTab === 'trending' && <TrendingTab onBack={() => navigateTo('home')} initialFilter={initialDiscoverState?.filter || 'All Trends'} />}
            {activeTab === 'pairings' && <PairWithDinnerPage onBack={() => navigateTo('home')} onNavigate={navigateTo} />}
            {activeTab === 'pairing-engine' && <PairingEngine onBack={() => navigateTo('pairings')} onNavigate={navigateTo} />}
            {activeTab === 'admin' && <AdminDashboard onBack={() => navigateTo('home')} />}
            {activeTab === 'collection-add' && (
              <AddWineCollectionScreen 
                onBack={() => navigateTo('cellar', { view: 'cellar' })}
                onNavigate={(route) => navigateTo(route)}
                onSelectWine={(wine) => setSelectedWine(wine)}
                onNavigateToCellar={(section) => {
                  if (section === 'wishlist') {
                    navigateTo('cellar', { view: 'wishlist' });
                  } else if (section === 'portfolio') {
                    navigateTo('profile');
                  } else {
                    navigateTo('cellar', { view: 'cellar' });
                  }
                }}
              />
            )}
            {activeTab === 'collection-manual' && (
              <ManualEntryScreen 
                onBack={() => navigateTo('collection-add')}
                onNavigate={(route) => navigateTo(route)}
                onSelectWine={(wine) => setSelectedWine(wine)}
              />
            )}
            {activeTab === 'search' && (
              <SearchWineScreen 
                onBack={() => navigateTo('collection-add')}
                onNavigate={(route) => navigateTo(route)}
                onSelectWine={(wine) => setSelectedWine(wine)}
              />
            )}
          </>
        )}
        </Suspense>
      </main>

      {/* Floating Glass Navigation Bar - Hidden in Admin Console Mode & Immersive Add workflows */}
      {activeTab !== 'admin' && activeTab !== 'collection-add' && activeTab !== 'collection-manual' && activeTab !== 'search' && !selectedGrapeSlug && (
        <div className="absolute bottom-6 left-4 right-4 z-40 max-w-sm mx-auto">
          <nav className="w-full h-[72px] bg-[#0A0A0A]/90 backdrop-blur-xl border border-[#C8A24A]/25 flex justify-between items-center px-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
            <NavItem label="For You" icon={<Home size={19} />} active={activeTab === 'home'} onClick={() => navigateTo('home')} />
            <NavItem label="Search" icon={<Search size={19} />} active={activeTab === 'discover'} onClick={() => navigateTo('discover')} />
            <NavItem label="Friends" icon={<Users size={19} />} active={activeTab === 'social'} onClick={() => navigateTo('social')} />
            <NavItem label="Profile" icon={<User size={19} />} active={activeTab === 'profile' || activeTab === 'cellar'} onClick={() => navigateTo('profile')} />

            {/* Floating Center Scan Button */}
            <div className="relative -top-6">
              <button
                onClick={() => requireVerifiedAccess('scan')}
                aria-label="Scan wine"
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C8A24A] to-[#B38E36] text-[#050505] flex flex-col items-center justify-center shadow-[0_8px_32px_rgba(200,162,74,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 relative group overflow-hidden border border-[#C8A24A]"
              >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                <ScanLine size={22} />
                <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Scan</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      <AnimatePresence>
        {selectedWine && (
          <Suspense fallback={null}>
            <WineDetail wine={selectedWine} onClose={() => setSelectedWine(null)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-1.5 min-w-12 flex flex-col items-center gap-1 transition-all duration-300 relative ${
        active ? 'text-[#C8A24A] scale-110' : 'text-[#F2E7D5]/40 hover:text-[#F2E7D5]/80 hover:scale-105'
      }`}
    >
      {icon}
      <span className="text-[8px] font-mono uppercase tracking-wider leading-none">{label}</span>
      {active && (
         <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C8A24A] shadow-[0_0_8px_rgba(200,162,74,0.8)]" />
      )}
    </button>
  );
}
