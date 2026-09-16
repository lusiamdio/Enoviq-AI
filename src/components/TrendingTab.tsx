import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Flame, Globe, Activity, Music, TrendingUp, TrendingDown, Wine, Cpu, Search, MapPin, Share2, MessageCircle, Heart, RefreshCw } from 'lucide-react';

export default function TrendingTab({ onBack, initialFilter = 'All Trends' }: { onBack: () => void, initialFilter?: string }) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [livePulse, setLivePulse] = useState(12450320);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());

  const [trends, setTrends] = useState({
    news: [
      { title: "Rand strengthens after Reserve Bank update", source: "Daily Maverick", time: "2h ago", engagement: "45K" },
      { title: "New education reform announced for public schools", source: "News24", time: "4h ago", engagement: "32K" },
      { title: "Cape Town infrastructure expansion approved", source: "CapeTalk", time: "5h ago", engagement: "89K" }
    ],
    culture: [
      { title: "Amapiano track hitting #1", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop" },
      { title: "Cape Town fashion week highlights", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop" },
      { title: "New Netflix series trending", image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=400&auto=format&fit=crop" }
    ],
    financeMain: [
      { symbol: "NPN", name: "Naspers", price: "R 3,450", change: "+2.4%", isUp: true },
      { symbol: "FSR", name: "FirstRand", price: "R 68.20", change: "-0.8%", isUp: false },
      { symbol: "MTN", name: "MTN Group", price: "R 110.50", change: "+1.2%", isUp: true }
    ],
    financeHeadlines: [
      "Stellenbosch tech startup raises R150m series A funding.",
      "Property market in Western Cape sees Q3 boom."
    ],
    wine: [
      "Kanonkop Paul Sauer trending in auctions",
      "Vin de Constance demand rising globally",
      "Franschhoek luxury tasting experiences booked out"
    ],
    tech: [
      "Cape Town AI startup raises funding",
      "New fintech platform expands mobile banking",
      "SA robotics lab breakthrough announced"
    ],
    top10: [
      'Breaking national news', 'Amapiano viral track', 'Rand exchange rate', 'Cape Town tourism spike', 
      'Wine auction results', 'Joburg infrastructure update', 'Tech startup funding', 'Sports highlight', 
      'Celebrity news', 'Lifestyle trend'
    ]
  });

  const filters = ['All Trends', 'News', 'Culture', 'Finance', 'Wine', 'Tech'];

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const syncWithAI = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an AI trend analyzer focusing on South Africa. Output JSON ONLY in this exact format, with no markdown code blocks formatting.
              {
                "news": [{"title":"...","source":"...","time":"...","engagement":"..."}],
                "culture": [{"title":"..."}],
                "financeMain": [{"symbol":"...","name":"...","price":"...","change":"..."}],
                "financeHeadlines": ["..."],
                "wine": ["..."],
                "tech": ["..."],
                "top10": ["..."]
              }
              Generate 3 news items, 3 culture items, 3 financeMain items, 2 financeHeadlines, 3 wine items, 3 tech items, and 10 top10 items. Values must be highly engaging current SA topics.`
            },
            {
              role: "user",
              content: "Provide the latest trending topics in South Africa right now."
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, ''));
      
      if (Object.keys(parsed).length > 0) {
        setTrends(prev => ({
          news: parsed.news && parsed.news.length > 0 ? parsed.news : prev.news,
          culture: parsed.culture && parsed.culture.length > 0 ? parsed.culture.map((c: any, i: number) => ({
            title: c.title,
            image: prev.culture[i]?.image || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop"
          })) : prev.culture,
          financeMain: parsed.financeMain && parsed.financeMain.length > 0 ? parsed.financeMain.map((m: any) => ({
            ...m, 
            isUp: m.change?.includes('+')
          })) : prev.financeMain,
          financeHeadlines: parsed.financeHeadlines && parsed.financeHeadlines.length > 0 ? parsed.financeHeadlines : prev.financeHeadlines,
          wine: parsed.wine && parsed.wine.length > 0 ? parsed.wine : prev.wine,
          tech: parsed.tech && parsed.tech.length > 0 ? parsed.tech : prev.tech,
          top10: parsed.top10 && parsed.top10.length > 0 ? parsed.top10 : prev.top10
        }));
        setLastSynced(new Date());
      }
    } catch (e) {
      console.error("AI Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial sync
    syncWithAI();
    // Auto-sync every 60 seconds
    const syncInterval = setInterval(syncWithAI, 60000);
    return () => clearInterval(syncInterval);
  }, []);

  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-ivory pb-32 overflow-x-hidden">
      {/* GLOBAL NAV BAR - Sticky Filter */}
      <div className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search trending topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder:text-gray-500"
            />
          </div>
          <button onClick={syncWithAI} disabled={isSyncing} className={`p-2 bg-white/5 rounded-full hover:bg-white/10 transition ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <RefreshCw size={18} className={`text-[#D4AF37] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-1 bg-white/5 px-3 py-2 rounded-full text-sm border border-white/10">
            <MapPin size={14} className="text-[#D4AF37]" />
            SA
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pr-4 flex-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f ? 'bg-[#D4AF37] text-[#0B0F14]' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                {f === 'All Trends' && <Flame size={14} className="inline mr-1 mb-0.5" />}
                {f}
              </button>
            ))}
          </div>
          {lastSynced && (
            <div className="text-[10px] text-gray-500 whitespace-nowrap pl-2">
              Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* 🌟 SECTION 1: Today in South Africa (Hero Carousel) */}
      {(activeFilter === 'All Trends' || activeFilter === 'News') && (
        <section className="relative h-[60vh] flex flex-col justify-end p-6 mb-8 mt-4 mx-4 rounded-3xl overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1580974852861-c381510bc98a?q=80&w=1200&auto=format&fit=crop" 
            alt="Cape Town Skyline" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/50 to-transparent" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/50 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
              </span>
              <span className="text-xs font-mono text-[#D4AF37] tracking-widest uppercase">Live • {livePulse.toLocaleString()} discussions</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              Rand strengthens after Reserve Bank rate hold 📈
            </h1>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pt-2 pb-2">
              {['Economy', 'Tech Breakthrough', 'Wine Export Rise'].map((tag, i) => (
                <span key={i} className="text-xs px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 whitespace-nowrap">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 📰 SECTION 2: Top News in SA Right Now */}
      {(activeFilter === 'All Trends' || activeFilter === 'News') && (
        <section className="px-6 mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="text-blue-400" /> Top News in SA Right Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trends.news.filter(n => matchesSearch(n.title)).map((n, i) => (
              <NewsCard 
                key={i}
                title={n.title} 
                source={n.source} time={n.time} engagement={n.engagement} 
              />
            ))}
          </div>
        </section>
      )}

      {/* 🎭 SECTION 3: Culture & Entertainment */}
      {(activeFilter === 'All Trends' || activeFilter === 'Culture') && (
        <section className="pl-6 mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Music className="text-[#D4AF37]" /> What SA is Watching & Listening To
          </h2>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pr-6">
            {trends.culture.filter(c => matchesSearch(c.title)).map((c, i) => (
              <CultureCard key={i} title={c.title} image={c.image} />
            ))}
          </div>
        </section>
      )}

      {/* 💰 SECTION 4: Finance & Economy */}
      {(activeFilter === 'All Trends' || activeFilter === 'Finance') && (
        <section className="px-6 mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="text-green-400" /> Markets & Money
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/10 rounded-3xl p-5">
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-gray-400 tracking-wider">JSE TOP MOVERS</h3>
              <div className="space-y-3">
                {trends.financeMain
                  .filter(m => matchesSearch(m.symbol) || matchesSearch(m.name))
                  .map(m => (
                    <MarketItem key={m.symbol} {...m} />
                  ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-gray-400 tracking-wider">BUSINESS HEADLINES</h3>
              <ul className="space-y-3 text-sm">
                {trends.financeHeadlines
                  .filter(matchesSearch)
                  .map((h, i) => (
                  <li key={i} className="line-clamp-2 hover:text-[#D4AF37] cursor-pointer transition">{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 🍷 SECTION 5: Wine & Lifestyle */}
      {(activeFilter === 'All Trends' || activeFilter === 'Wine') && (
        <section className="px-6 mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Wine className="text-[#5A1E2C]" /> Cape Wine & Luxury Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.wine.filter(matchesSearch).map((t, i) => (
              <WineTrendCard key={i} title={t} />
            ))}
          </div>
        </section>
      )}

      {/* 🤖 SECTION 6: Tech & Innovation */}
      {(activeFilter === 'All Trends' || activeFilter === 'Tech') && (
        <section className="px-6 mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Cpu className="text-[#00E5FF]" /> Tech & Innovation Pulse
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.tech.filter(matchesSearch).map((t, i) => (
              <TechCard key={i} title={t} />
            ))}
          </div>
        </section>
      )}

      {/* 📈 SECTION 7: Live Trending Rankings */}
      {(activeFilter === 'All Trends' || activeFilter === 'News') && (
        <section className="px-6 mb-24">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Flame className="text-red-500" /> Top 10 Trending Topics
          </h2>
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-3xl p-5">
            {trends.top10.filter(matchesSearch).map((topic, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                <span className="text-[#D4AF37] font-mono font-bold">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1">{topic}</span>
                {i % 3 === 0 ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-gray-500" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ⚡ SECTION 8: Live Activity Feed */}
      <div className="fixed bottom-[72px] left-0 right-0 h-10 bg-[#0B0F14]/90 backdrop-blur-xl border-t border-white/10 flex items-center z-30 px-4 overflow-hidden mask-fade-edges">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap text-xs text-gray-400"
        >
          <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" /> @sarah_w just liked 'Vin de Constance'</span>
          <span className="flex items-center gap-1"><MessageCircle size={12} className="text-blue-400" /> New comment on Tech Startup funding</span>
          <span className="flex items-center gap-1"><Share2 size={12} className="text-green-400" /> 'Kanonkop Paul Sauer' shared 200 times</span>
          <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" /> @david_m just liked 'Amapiano Chart'</span>
          <span className="flex items-center gap-1"><TrendingUp size={12} className="text-[#D4AF37]" /> JSE Top Movers trending #3</span>
        </motion.div>
      </div>
    </div>
  );
}

// Subcomponents
function NewsCard({ title, source, time, engagement }: any) {
  return (
    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition group cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400">{source}</span>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <h3 className="font-bold mb-4 group-hover:text-[#D4AF37] transition-colors">{title}</h3>
      <div className="flex items-center gap-1 text-xs text-[#D4AF37]">
        <Flame size={12} />
        {engagement}
      </div>
    </div>
  );
}

function CultureCard({ title, image }: any) {
  return (
    <div className="min-w-[160px] max-w-[160px] h-[240px] rounded-2xl relative overflow-hidden group cursor-pointer">
      <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" alt="" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
        <div className="flex gap-1 mb-2">
          <span className="w-1 h-3 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-4 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <h3 className="text-sm font-bold leading-tight line-clamp-3">{title}</h3>
      </div>
    </div>
  );
}

function MarketItem({ symbol, name, price, change, isUp }: any) {
  return (
    <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
      <div>
        <div className="font-bold">{symbol}</div>
        <div className="text-xs text-gray-400">{name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm">{price}</div>
        <div className={`text-xs flex items-center justify-end gap-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </div>
      </div>
    </div>
  );
}

function WineTrendCard({ title }: any) {
  return (
    <div className="bg-[#5A1E2C]/20 border border-[#5A1E2C]/50 p-5 rounded-2xl cursor-pointer hover:bg-[#5A1E2C]/40 transition group">
      <Wine className="text-[#D4AF37] mb-3 opacity-50 group-hover:opacity-100 transition" size={20} />
      <h3 className="font-serif font-bold text-lg group-hover:text-[#D4AF37] transition-colors">{title}</h3>
    </div>
  );
}

function TechCard({ title }: any) {
  return (
    <div className="bg-gradient-to-br from-[#00E5FF]/10 to-transparent border border-[#00E5FF]/20 p-5 rounded-2xl relative overflow-hidden group cursor-pointer">
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E5FF]/10 blur-xl rounded-full" />
      <Cpu className="text-[#00E5FF] mb-3" size={20} />
      <h3 className="font-bold text-sm leading-relaxed group-hover:text-[#00E5FF] transition-colors">{title}</h3>
    </div>
  );
}
