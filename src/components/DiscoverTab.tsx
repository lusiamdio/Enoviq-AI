import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Gift, Users, Loader2, Trophy, Filter } from 'lucide-react';
import TasteDNA from './TasteDNA';
import GiftEngineModal from './GiftEngineModal';
import PartyModeModal from './PartyModeModal';
import RegionModal from './RegionModal';
import AwardsModal from './AwardsModal';
import { supabase } from '../supabase';
import { WINE_FARMS_KNOWLEDGE } from '../data/wineKnowledge';
import { WINE_COURSE_KNOWLEDGE } from '../data/educationalCourseKnowledge';
import { WINE_WISE_KNOWLEDGE } from '../data/wineWiseKnowledge';
import { callOpenRouter } from '../services/openRouterService';

const navigateToPath = (path: string) => {
  if (`${window.location.pathname}${window.location.search}` === path) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new Event('popstate'));
};

export default function DiscoverTab({ onSelectWine, initialState }: { onSelectWine: (wine: any) => void, initialState?: any }) {
  const [showGiftEngine, setShowGiftEngine] = useState(false);
  const [showPartyMode, setShowPartyMode] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialState?.query || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(!!initialState?.filterGrape);
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterGrape, setFilterGrape] = useState<string>(initialState?.filterGrape || 'All');
  const [filterPrice, setFilterPrice] = useState<string>('All');

  // Trigger search on mount if initial state has query or filters
  useEffect(() => {
    if (initialState?.query || initialState?.filterGrape) {
      handleSearch();
    }
  }, [initialState]);

  const handleSearch = async (
    e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>,
    overrides?: { region?: string, grape?: string, price?: string }
  ) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    
    const currentRegion = overrides?.region || filterRegion;
    const currentGrape = overrides?.grape || filterGrape;
    const currentPrice = overrides?.price || filterPrice;

    if (!searchQuery.trim() && currentRegion === 'All' && currentGrape === 'All' && currentPrice === 'All') return;
    
    setIsSearching(true);
    setSearchResults(null);
    
    let filterContext = '';
    if (currentRegion !== 'All') filterContext += ` Must be from the ${currentRegion} region.`;
    if (currentGrape !== 'All') filterContext += ` Must be primarily made from ${currentGrape}.`;
    if (currentPrice !== 'All') filterContext += ` Must be in the price range of ${currentPrice}.`;

      try {
        let queryBuilder = supabase.from('wines').select('*');

        if (searchQuery.trim()) {
           // Basic search by name or region or grape
           queryBuilder = queryBuilder.or(`name.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%,grape.ilike.%${searchQuery}%`);
        }

        if (currentRegion !== 'All') {
           queryBuilder = queryBuilder.eq('region', currentRegion);
        }
        if (currentGrape !== 'All') {
           queryBuilder = queryBuilder.eq('grape', currentGrape);
        }

        const { data, error } = await queryBuilder.limit(20);
        
        if (error) throw error;
      
        setSearchResults(data || []);
      } catch (error) {
        console.error("Search error:", error);
        alert("Failed to perform search. Please try again.");
      } finally {
        setIsSearching(false);
      }
  };

  return (
    <div className="pb-32 pt-12 w-full max-w-7xl mx-auto mt-2">
      {/* Search Bar */}
      <div className="px-6 mb-4">
        <div className="text-[10px] tracking-[0.2em] font-mono text-[#C8A24A] uppercase mb-3 flex items-center gap-2">
           <div className="w-6 h-px bg-[#C8A24A]/40"></div>
           Explore Cellars
        </div>
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-[#C8A24A]" size={20} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="E.g., 'Fruity white under R300'" 
              className="w-full bg-[#0A0A0A]/90 border border-[#C8A24A]/20 rounded-full py-4 pl-12 pr-6 text-sm text-[#F2E7D5] placeholder-[#F2E7D5]/40 focus:outline-none focus:border-[#C8A24A]/60 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.5)] font-serif italic"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${showFilters || filterRegion !== 'All' || filterGrape !== 'All' || filterPrice !== 'All' ? 'bg-[#C8A24A] text-[#050505] shadow-[0_8px_30px_rgba(200,162,74,0.3)]' : 'bg-[#0A0A0A]/90 border border-[#C8A24A]/20 text-[#C8A24A]'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>



      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-8 overflow-hidden"
          >
            <div className="bg-[#0A0A0A]/90 luxury-border shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-5 rounded-2xl space-y-4">
              <div>
                <label className="text-[10px] text-[#C8A24A] uppercase font-mono tracking-[0.2em] mb-2 block font-bold">Region</label>
                <select 
                  value={filterRegion} 
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full bg-[#12100C] border border-white/5 rounded-xl p-3 text-sm text-[#F2E7D5] focus:outline-none focus:border-[#C8A24A]/50 transition-colors appearance-none"
                >
                  <option value="All">All Regions</option>
                  <option value="Stellenbosch">Stellenbosch</option>
                  <option value="Franschhoek">Franschhoek</option>
                  <option value="Swartland">Swartland</option>
                  <option value="Hemel-en-Aarde">Hemel-en-Aarde</option>
                  <option value="Paarl">Paarl</option>
                  <option value="Constantia">Constantia</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#C8A24A] uppercase font-mono tracking-[0.2em] mb-2 block font-bold">Grape Varietal</label>
                <select 
                  value={filterGrape} 
                  onChange={(e) => setFilterGrape(e.target.value)}
                  className="w-full bg-[#12100C] border border-white/5 rounded-xl p-3 text-sm text-[#F2E7D5] focus:outline-none focus:border-[#C8A24A]/50 transition-colors appearance-none"
                >
                  <option value="All">All Varietals</option>
                  <option value="Chenin Blanc">Chenin Blanc</option>
                  <option value="Pinotage">Pinotage</option>
                  <option value="Cabernet Sauvignon">Cabernet Sauvignon</option>
                  <option value="Shiraz">Shiraz / Syrah</option>
                  <option value="Chardonnay">Chardonnay</option>
                  <option value="Sauvignon Blanc">Sauvignon Blanc</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#C8A24A] uppercase font-mono tracking-[0.2em] mb-2 block font-bold">Price Range</label>
                <select 
                  value={filterPrice} 
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full bg-[#12100C] border border-white/5 rounded-xl p-3 text-sm text-[#F2E7D5] focus:outline-none focus:border-[#C8A24A]/50 transition-colors appearance-none"
                >
                  <option value="All">Any Price</option>
                  <option value="Under R150">Under R150</option>
                  <option value="R150 - R300">R150 - R300</option>
                  <option value="R300 - R600">R300 - R600</option>
                  <option value="Over R600">Over R600</option>
                </select>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-[#C8A24A] to-[#B38E36] text-[#050505] font-semibold py-3.5 rounded-xl mt-4 hover:from-[#dabb70] hover:to-[#C8A24A] transition-all duration-300 shadow-[0_4px_15px_rgba(200,162,74,0.3)] text-sm uppercase tracking-widest font-mono animate-pulse-glow"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-8 flex flex-col items-center justify-center py-8"
          >
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-4" />
            <p className="text-gold-500 font-serif animate-pulse">Finding the perfect matches...</p>
          </motion.div>
        )}

        {searchResults && !isSearching && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-12"
          >
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-semibold">AI Recommendations</h3>
              <button onClick={() => setSearchResults(null)} className="text-sm text-gray-400 hover:text-ivory">Clear</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((wine, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl flex gap-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onSelectWine(wine)}>
                  <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-wine-900/50">
                    <img src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop"} alt={wine.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-serif font-medium text-lg leading-tight pr-2">{wine.name}</h4>
                      <span className="text-gold-500 font-medium whitespace-nowrap">{wine.price}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{wine.region}, {wine.vintage} • {wine.grape}</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{wine.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Tools */}
      <div className="px-6 mb-12 flex gap-3">
        <button 
          onClick={() => setShowPartyMode(true)}
          className="flex-1 bg-[#12100C] border border-[#C8A24A]/20 shadow-[0_4px_15px_rgba(200,162,74,0.1)] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#1A1813] hover:border-[#C8A24A]/40 transition-all group"
        >
          <Users className="text-[#F2E7D5]/70 group-hover:text-[#C8A24A] transition-colors" size={24} />
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#F2E7D5]/70 font-bold group-hover:text-[#C8A24A]">Party Mode</span>
        </button>
        <button 
          onClick={() => setShowGiftEngine(true)}
          className="flex-1 bg-[#12100C] border border-[#C8A24A]/20 shadow-[0_4px_15px_rgba(200,162,74,0.1)] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#1A1813] hover:border-[#C8A24A]/40 transition-all group"
        >
          <Gift className="text-[#F2E7D5]/70 group-hover:text-[#C8A24A] transition-colors" size={24} />
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#F2E7D5]/70 font-bold group-hover:text-[#C8A24A]">Gift Engine</span>
        </button>
        <button 
          onClick={() => setShowAwards(true)}
          className="flex-1 bg-[#12100C] border border-[#C8A24A]/20 shadow-[0_4px_15px_rgba(200,162,74,0.1)] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#1A1813] hover:border-[#C8A24A]/40 transition-all group"
        >
          <Trophy className="text-[#F2E7D5]/70 group-hover:text-[#C8A24A] transition-colors" size={24} />
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#F2E7D5]/70 font-bold group-hover:text-[#C8A24A]">2026 Awards</span>
        </button>
      </div>

      {/* Taste DNA Section */}
      <div className="px-6">
        <TasteDNA />
      </div>

      {/* Explore Regions */}
      <div className="mb-12">
        <h3 className="text-lg font-serif italic text-[#C8A24A] px-6 mb-4">Explore Regions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-6">
          <RegionCard name="Stellenbosch" image="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Stellenbosch")} />
          <RegionCard name="Franschhoek" image="https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Franschhoek")} />
          <RegionCard name="Swartland" image="https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Swartland")} />
          <RegionCard name="Hemel-en-Aarde" image="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=600&auto=format&fit=crop" onClick={() => setSelectedRegion("Hemel-en-Aarde")} />
        </div>
      </div>

      {/* Grapes */}
      <div className="mb-12">
        <h3 className="text-lg font-serif italic text-[#C8A24A] px-6 mb-4">Grapes</h3>
        <div className="flex flex-wrap gap-3 px-6">
          <GrapeChip name="Pinotage 🇿🇦" onClick={() => navigateToPath('/grapes/pinotage')} />
          <GrapeChip name="Chenin Blanc" onClick={() => navigateToPath('/grapes/chenin-blanc')} />
          <GrapeChip name="Shiraz" onClick={() => navigateToPath('/grapes/shiraz')} />
          <GrapeChip name="Cabernet Sauvignon" onClick={() => navigateToPath('/grapes/cabernet-sauvignon')} />
          <GrapeChip name="Merlot" onClick={() => navigateToPath('/grapes/merlot')} />
          <GrapeChip name="Chardonnay" onClick={() => navigateToPath('/grapes/chardonnay')} />
        </div>
      </div>

      <AnimatePresence>
        {showGiftEngine && <GiftEngineModal onClose={() => setShowGiftEngine(false)} onSelectWine={onSelectWine} />}
        {showPartyMode && <PartyModeModal onClose={() => setShowPartyMode(false)} onSelectWine={onSelectWine} />}
        {showAwards && <AwardsModal onClose={() => setShowAwards(false)} />}
        {selectedRegion && <RegionModal regionName={selectedRegion} onClose={() => setSelectedRegion(null)} />}
      </AnimatePresence>
    </div>
  );
}

function WineThumbnail({ name, region, image, onClick }: any) {
  return (
    <div onClick={onClick} className="min-w-[140px] shrink-0 group cursor-pointer">
      <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative luxury-border shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent opacity-100 transition-opacity"></div>
      </div>
      <h4 className="font-serif text-[15px] text-[#F2E7D5] leading-tight mb-1">{name}</h4>
      <p className="text-[11px] uppercase font-mono tracking-wider text-[#C8A24A]/70">{region}</p>
    </div>
  );
}

function RegionCard({ name, image, onClick }: any) {
  return (
    <div onClick={onClick} className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group luxury-border shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
      <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-[#050505]/50 group-hover:bg-[#050505]/30 transition-colors"></div>
      <div className="absolute inset-0 flex items-center justify-center p-2 text-center border border-white/5 m-2 rounded-lg pointer-events-none">
        <h4 className="font-serif text-[15px] text-[#F2E7D5] font-medium tracking-wide leading-tight">{name}</h4>
      </div>
    </div>
  );
}

function GrapeChip({ name, onClick }: { name: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-5 py-2.5 rounded-full border border-[#C8A24A]/30 bg-[#0A0A0A]/80 hover:bg-[#C8A24A]/10 hover:border-[#C8A24A]/50 hover:text-[#C8A24A] transition-all text-[#F2E7D5] font-serif italic text-sm shadow-[0_4px_10px_rgba(0,0,0,0.3)] luxury-border">
      {name}
    </button>
  );
}
