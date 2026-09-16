import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Wine,
  MapPin,
  Calendar,
  Layers,
  Utensils,
  Globe
} from 'lucide-react';
import { supabase } from '../supabase';
import { callOpenRouter } from '../services/openRouterService';

interface SearchWineScreenProps {
  onBack: () => void;
  onNavigate: (route: string) => void;
  onSelectWine: (wine: any) => void;
}

export default function SearchWineScreen({ onBack, onNavigate, onSelectWine }: SearchWineScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [producer, setProducer] = useState('');
  const [region, setRegion] = useState('');
  const [vintage, setVintage] = useState('');
  const [country, setCountry] = useState('');
  const [grape, setGrape] = useState('');
  const [pairing, setPairing] = useState('');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [aiAlternativeActive, setAiAlternativeActive] = useState(false);

  const exampleSearches = [
    { text: 'Kanonkop Pinotage', search: 'Kanonkop Pinotage' },
    { text: 'Meerlust Rubicon', search: 'Meerlust Rubicon' },
    { text: 'Ataraxia Chardonnay', search: 'Ataraxia Chardonnay' },
    { text: 'Series C 2019', search: 'Vilafonté Series C' }
  ];

  // Live filter query function
  const triggerSearch = async (overrideTerm?: string) => {
    setLoading(true);
    setAiAlternativeActive(false);
    const searchVal = overrideTerm !== undefined ? overrideTerm : searchTerm;

    try {
      // Step 1: Query Supabase wines database
      let query = supabase.from('wines').select('*');

      if (searchVal) {
        query = query.or(`name.ilike.%${searchVal}%,notes.ilike.%${searchVal}%`);
      }
      if (producer) {
        query = query.ilike('name', `%${producer}%`);
      }
      if (region) {
        query = query.ilike('region', `%${region}%`);
      }
      if (grape) {
        query = query.ilike('grape', `%${grape}%`);
      }
      if (vintage) {
        query = query.eq('vintage', vintage);
      }

      const { data, error } = await query.limit(10);
      
      if (!error && data && data.length > 0) {
        setSearchResults(data);
        setLoading(false);
        return;
      }

      // Step 2: Fallback to AI-curated list if database matches are empty
      setAiAlternativeActive(true);
      const aiQueryPrompt = `Analyze this wine search query for South Africa fine wine registry. 
      Term: "${searchVal}"
      Producer query: "${producer}"
      Region query: "${region}"
      Grape variety query: "${grape}"
      Vintage query: "${vintage}"
      Country query: "${country}"
      Food Pairing query: "${pairing}"

      Identify OR generate 3 ultra-realistic premium wines matching these exact descriptors. Return STRICTLY a valid JSON array of objects with structure:
      [
        {
          "name": "Full Wine Name",
          "producer": "Producer Name",
          "vintage": "2018",
          "region": "Stellenbosch",
          "grape": "Cabernet Sauvignon",
          "price": "R 480",
          "rating": 4.7,
          "notes": "Premium aroma, nose details and tasting notes matching",
          "image": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop"
        }
      ]`;

      const aiResponseText = await callOpenRouter({
        prompt: aiQueryPrompt,
        temperature: 0.7,
        responseFormat: { type: "json_object" }
      });

      let aiWines = [];
      try {
        const parsed = JSON.parse(aiResponseText);
        aiWines = Array.isArray(parsed) ? parsed : (parsed.wines || []);
      } catch {
        // Simple fallback matching
        aiWines = [
          { name: searchVal || "Meerlust Rubicon", producer: "Meerlust", vintage: vintage || "2018", region: region || "Stellenbosch", grape: grape || "Cabernet Sauvignon", price: "R 550", rating: 4.8, notes: "A masterclass in balanced structural red blends with complex layers of rich fynbos and dark fruit flavors.", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop" }
        ];
      }

      setSearchResults(aiWines);

    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickClick = (text: string) => {
    setSearchTerm(text);
    triggerSearch(text);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setProducer('');
    setRegion('');
    setVintage('');
    setCountry('');
    setGrape('');
    setPairing('');
    setSearchResults([]);
    setAiAlternativeActive(false);
  };

  return (
    <div className="min-h-screen bg-wine-900 text-ivory pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-wine-955/90 backdrop-blur-xl border-b border-glass-border px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button 
            id="back_btn_search"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-gold-400 uppercase">Interactive Search</div>
            <h1 className="text-xl font-serif font-bold text-ivory">Search Wine Database</h1>
          </div>
        </div>
        <button 
          id="toggle_filters_btn"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${showFilters ? 'bg-gold-500 text-wine-950 border-gold-500 font-semibold' : 'bg-white/5 border-glass-border text-gray-300 hover:bg-white/10'}`}
        >
          <Filter size={14} />
          Filters {showFilters && '• Active'}
        </button>
      </header>

      {/* Breadcrumbs */}
      <div className="px-6 py-4 text-xs font-mono text-gray-400 flex items-center gap-1.5 border-b border-white/5 bg-wine-950/20">
        <span>Collection</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-3 h-3"><path d="m9 18 6-6-6-6"/></svg>
        <span className="text-gold-400">Search Hub</span>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
        
        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            id="search_field_word"
            type="text" 
            placeholder="Search wine name, producer, or aromatic profile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') triggerSearch(); }}
            className="w-full bg-wine-950 rounded-2xl border border-glass-border pl-12 pr-24 py-4 text-base text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
          />
          <button 
            id="search_action_btn"
            onClick={() => triggerSearch()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold-500 text-wine-950 px-5 py-2 rounded-xl text-xs font-serif font-bold hover:scale-95 transition-transform"
          >
            Find Case
          </button>
        </div>

        {/* Dynamic Filters Form */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass-panel p-5 rounded-3xl border border-glass-border overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono tracking-widest text-gold-400 uppercase">Advanced Search Filters</h3>
                <button 
                  onClick={clearAllFilters}
                  className="text-[10px] font-mono text-gray-400 hover:text-ivory"
                >
                  Reset Form
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wide text-gray-400 block">Producer</label>
                  <input 
                    id="filter_producer"
                    type="text" 
                    placeholder="e.g. Vilafonté" 
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    className="w-full bg-wine-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wide text-gray-400 block">Region</label>
                  <input 
                    id="filter_region"
                    type="text" 
                    placeholder="e.g. Franschhoek" 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-wine-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wide text-gray-400 block">Vintage</label>
                  <input 
                    id="filter_vintage"
                    type="text" 
                    placeholder="e.g. 2015" 
                    value={vintage}
                    onChange={(e) => setVintage(e.target.value)}
                    className="w-full bg-wine-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wide text-gray-400 block">Country</label>
                  <input 
                    id="filter_country"
                    type="text" 
                    placeholder="e.g. South Africa" 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-wine-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wide text-gray-400 block">Grape Variety</label>
                  <input 
                    id="filter_grape"
                    type="text" 
                    placeholder="e.g. Pinotage" 
                    value={grape}
                    onChange={(e) => setGrape(e.target.value)}
                    className="w-full bg-wine-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono tracking-wide text-gray-400 block">Food Pairing Dish</label>
                <input 
                  id="filter_pairing"
                  type="text" 
                  placeholder="e.g. Seared Springbok loin or Ribeye steak" 
                  value={pairing}
                  onChange={(e) => setPairing(e.target.value)}
                  className="w-full bg-wine-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                />
              </div>

              <button
                id="apply_filter_btn"
                type="button"
                onClick={() => triggerSearch()}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs rounded-xl font-medium tracking-wide"
              >
                Apply Parameters and Query
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example Quick Terms */}
        {searchResults.length === 0 && !loading && (
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-gray-500 uppercase block">Curated Vintage Queries</span>
            <div className="flex flex-wrap gap-2">
              {exampleSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickClick(item.search)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold-500/30 text-xs text-gray-300 transition-all flex items-center gap-1.5"
                >
                  <Search size={12} className="text-gold-400" />
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Stream */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-3 border-gold-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-gray-400 animate-pulse">Running advanced SA Sommelier Wine Check...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.length > 0 && (
              <div className="flex justify-between items-center bg-wine-950/20 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-xs text-gray-400">Found {searchResults.length} matching result(s)</span>
                {aiAlternativeActive && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded-full">
                    <Sparkles size={10} className="animate-pulse" />
                    AI TasteDNA Enhanced Match
                  </span>
                )}
              </div>
            )}

            <div className="space-y-3">
              {searchResults.map((wine, idx) => (
                <div 
                  key={idx} 
                  id={`search_result_${idx}`}
                  onClick={() => onSelectWine(wine)}
                  className="glass-panel p-4 rounded-3xl cursor-pointer hover:border-gold-500/40 hover:bg-white/[0.03] active:scale-[0.99] transition-all flex items-center gap-4 relative overflow-hidden"
                >
                  {/* Bottle image aspect */}
                  <div className="w-14 h-20 rounded-xl overflow-hidden bg-wine-955 flex-shrink-0">
                    <img 
                      src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=200&auto=format&fit=crop"} 
                      alt={wine.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between pointer-events-none">
                      <span className="text-[10px] font-mono text-gold-400 bg-gold-500/10 px-1.5 rounded-full">
                        {wine.grape || 'Fine Red'}
                      </span>
                      <span className="text-xs font-bold text-ivory">{wine.price || 'R 350'}</span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-ivory truncate">{wine.name}</h3>
                    <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <MapPin size={10} className="text-gold-500" />
                      {wine.region || 'South Africa'} • {wine.vintage || 'NV'}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1 italic font-serif mt-1">
                      "{wine.notes}"
                    </p>
                  </div>

                  <div className="text-gold-400 pr-1 flex-shrink-0">
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}

              {searchResults.length === 0 && !loading && searchTerm && (
                <div className="p-12 text-center glass-panel rounded-3xl border border-glass-border space-y-4">
                  <HelpCircle size={40} className="mx-auto text-gray-500" />
                  <div>
                    <h3 className="text-lg font-serif font-medium">No Direct Matches Found</h3>
                    <p className="text-xs text-gray-400 mt-1">We couldn't immediately identify this bottle in our static index. Click below to conjure complete AI metadata profiles for it dynamically!</p>
                  </div>
                  <button 
                    id="trigger_search_generation_btn"
                    onClick={() => triggerSearch()}
                    className="px-5 py-2 bg-gold-500 text-wine-950 rounded-xl text-xs font-serif font-bold hover:scale-95 transition-transform inline-flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    Consult Grand Taste Archive
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
