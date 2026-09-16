import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Heart, Wine } from 'lucide-react';
import { supabase } from '../supabase';
import AddWineModal from './AddWineModal';

function calculateSmartAlert(vintage: string) {
  const currentYear = new Date().getFullYear();
  const year = parseInt(vintage, 10);
  if (isNaN(year)) return { status: 'Drink Now', color: 'text-green-400' };
  
  const age = currentYear - year;
  if (age > 15) return { status: 'Past Peak ⚠️', color: 'text-red-400' };
  if (age >= 8 && age <= 15) return { status: 'Peak Window ✨', color: 'text-gold-500' };
  if (age >= 4 && age < 8) return { status: 'Drink Now', color: 'text-green-400' };
  return { status: 'Hold ⏳', color: 'text-blue-400' };
}

export default function CellarTab({ onSelectWine, onNavigate, initialViewMode = 'cellar' }: { onSelectWine: (wine: any) => void, onNavigate: (tab: string, state?: any) => void, initialViewMode?: 'cellar' | 'wishlist' }) {
  const [wines, setWines] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cellar' | 'wishlist'>(initialViewMode);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'shelf'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'vintage' | 'price' | 'dateAdded'>('dateAdded');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCellar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('cellar')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data) {
        const fetchedWines = data.map((doc: any) => {
          const smartAlert = calculateSmartAlert(doc.vintage);
          return { ...doc, status: smartAlert.status, statusColor: smartAlert.color };
        });
        if (isMounted) setWines(fetchedWines);
      }
      if (isMounted) setLoading(false);
    };

    const fetchWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data && isMounted) {
        setWishlist(data);
      }
    };

    fetchCellar();
    fetchWishlist();

    const fetchUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const cellarChannel = supabase
        .channel(`cellar_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cellar', filter: `user_id=eq.${user.id}` }, () => {
          fetchCellar();
        })
        .subscribe();
        
      const wishlistChannel = supabase
        .channel(`wishlist_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist', filter: `user_id=eq.${user.id}` }, () => {
          fetchWishlist();
        })
        .subscribe();
        
      return { cellarChannel, wishlistChannel };
    };

    let channelsPromise = fetchUserAndSubscribe();

    return () => {
      isMounted = false;
      channelsPromise.then(channels => {
        if (channels) {
          supabase.removeChannel(channels.cellarChannel);
          supabase.removeChannel(channels.wishlistChannel);
        }
      });
    };
  }, []);

  const totalValue = wines.reduce((acc, wine) => {
    const priceStr = wine.price ? wine.price.replace(/[^0-9]/g, '') : '0';
    return acc + parseInt(priceStr, 10);
  }, 0);

  const drinkNowCount = wines.filter(w => w.status.includes('Drink Now')).length;
  const agingWellCount = wines.filter(w => w.status.includes('Hold') || w.status.includes('Peak Window')).length;
  const pastPeakCount = wines.filter(w => w.status.includes('Past Peak')).length;

  let displayData = viewMode === 'cellar' ? wines : wishlist;

  // Apply Filter
  if (viewMode === 'cellar' && filterStatus !== 'All') {
    if (filterStatus === 'Peak/Hold') {
      displayData = displayData.filter(w => w.status.includes('Hold') || w.status.includes('Peak Window'));
    } else {
      displayData = displayData.filter(w => w.status.includes(filterStatus));
    }
  }

  // Apply Sort
  displayData = [...displayData].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'vintage') {
      const yearA = parseInt(a.vintage, 10) || 0;
      const yearB = parseInt(b.vintage, 10) || 0;
      return yearB - yearA; // Newest first
    } else if (sortBy === 'price') {
      const priceA = a.price ? parseInt(a.price.replace(/[^0-9]/g, ''), 10) : 0;
      const priceB = b.price ? parseInt(b.price.replace(/[^0-9]/g, ''), 10) : 0;
      return priceB - priceA; // Highest first
    } else if (sortBy === 'dateAdded') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    }
    return 0;
  });

  return (
    <div className="pb-32 pt-12 px-6 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-serif font-normal text-[#F2E7D5] mb-1">My Collection</h2>
          <p className="text-[#F2E7D5]/50 text-sm font-serif italic">{wines.length} Bottles • R {totalValue.toLocaleString()}</p>
        </div>
        <button 
          onClick={() => onNavigate('collection-add')}
          className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-[#C8A24A]/40 flex items-center justify-center hover:bg-[#C8A24A]/10 hover:border-[#C8A24A] transition-all shadow-[0_0_15px_rgba(200,162,74,0.15)] hover:shadow-[0_0_25px_rgba(200,162,74,0.3)] text-[#C8A24A] animate-pulse-glow"
          id="add_wine_plus_btn"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* View Toggle and Sort */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex bg-[#0A0A0A]/80 border border-[#C8A24A]/20 rounded-xl p-1 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setViewMode('cellar')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'cellar' ? 'bg-[#12100C] text-[#C8A24A] shadow-[0_2px_10px_rgba(200,162,74,0.15)] border border-[#C8A24A]/30' : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'}`}
          >
            <Wine size={14} /> Cellar
          </button>
          <button 
            onClick={() => setViewMode('wishlist')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'wishlist' ? 'bg-[#12100C] text-[#C8A24A] shadow-[0_2px_10px_rgba(200,162,74,0.15)] border border-[#C8A24A]/30' : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'}`}
          >
            <Heart size={14} /> Wishlist
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {viewMode === 'cellar' && (
              <>
                <button 
                  onClick={() => setLayoutMode('grid')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase font-bold transition-colors ${layoutMode === 'grid' ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'}`}
                >
                  Grid
                </button>
                <button 
                  onClick={() => setLayoutMode('shelf')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase font-bold transition-colors ${layoutMode === 'shelf' ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'}`}
                >
                  Shelf
                </button>
              </>
            )}
            {viewMode === 'wishlist' && (
              <span className="text-[10px] font-mono text-[#C8A24A] uppercase tracking-widest pl-1 py-1 font-bold">
                Wishlist Vault
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#F2E7D5]/50 font-bold">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0A0A0A] border border-[#C8A24A]/30 rounded-lg py-1.5 px-3 text-[10px] uppercase font-mono tracking-widest text-[#C8A24A] font-bold focus:outline-none focus:border-[#C8A24A] w-28 md:w-32 cursor-pointer shadow-[0_0_10px_rgba(200,162,74,0.1)] appearance-none"
            >
              <option value="name">Name</option>
              <option value="dateAdded">Added</option>
              <option value="vintage">Vintage</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Insights (Only for Cellar) */}
      <AnimatePresence>
        {viewMode === 'cellar' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar pb-2"
          >
            <InsightChip label="All" count={wines.length} active={filterStatus === 'All'} onClick={() => setFilterStatus('All')} />
            <InsightChip label="Drink Now" count={drinkNowCount} active={filterStatus === 'Drink Now'} onClick={() => setFilterStatus('Drink Now')} />
            <InsightChip label="Peak/Hold" count={agingWellCount} active={filterStatus === 'Peak/Hold'} onClick={() => setFilterStatus('Peak/Hold')} />
            <InsightChip label="Past Peak" count={pastPeakCount} active={filterStatus === 'Past Peak'} onClick={() => setFilterStatus('Past Peak')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid / Shelf */}
      {loading ? (
        <div className="text-center text-[#C8A24A] py-10 font-serif italic text-lg">Loading...</div>
      ) : displayData.length === 0 ? (
        <div className="text-center text-[#F2E7D5]/50 py-10 luxury-border rounded-2xl bg-[#0A0A0A]/50">
          <p className="font-serif italic text-lg">Your {viewMode} is empty.</p>
          <p className="text-[10px] mt-2 font-mono uppercase tracking-widest text-[#C8A24A]">Scan or discover a bottle to add it.</p>
        </div>
      ) : (layoutMode === 'grid' || viewMode === 'wishlist') ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayData.map((wine) => (
            <CellarBottle 
              key={wine.id}
              name={wine.name} 
              vintage={wine.vintage} 
              status={viewMode === 'cellar' ? wine.status : 'Wishlist'} 
              statusColor={viewMode === 'cellar' ? wine.statusColor : 'text-pink-400'}
              image={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop"} 
              onClick={() => onSelectWine(wine)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-12 mt-8">
          {Array.from({ length: Math.ceil(displayData.length / 3) }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex justify-around items-end border-b-[12px] border-[#3E2723] pb-1 relative">
              {/* Wood texture overlay */}
              <div className="absolute bottom-[-12px] left-0 right-0 h-3 bg-gradient-to-b from-[#5D4037] to-[#3E2723] shadow-[0_10px_20px_rgba(0,0,0,0.5)]"></div>
              
              {displayData.slice(rowIndex * 3, rowIndex * 3 + 3).map((wine) => (
                <motion.div 
                  key={wine.id}
                  whileHover={{ y: -10, scale: 1.05 }}
                  onClick={() => onSelectWine(wine)}
                  className="w-24 h-40 relative group cursor-pointer z-10"
                >
                  <img src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop"} alt={wine.name} className="w-full h-full object-cover rounded-t-xl drop-shadow-2xl" referrerPolicy="no-referrer" />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-black/90 backdrop-blur-md text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <p className="font-serif font-medium truncate">{wine.name}</p>
                    <p className="text-gray-400">{wine.vintage}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
      {/* Add Wine Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddWineModal 
            onClose={() => setShowAddModal(false)} 
            onSelectOption={(option) => {
              setShowAddModal(false);
              if (option === 'scan') {
                onNavigate('scan');
              } else if (option === 'search') {
                onNavigate('discover');
              } else {
                alert("Manual entry form coming soon!");
              }
            }} 
          />
        )}
      </AnimatePresence>
      {/* Add Wine Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddWineModal 
            onClose={() => setShowAddModal(false)} 
            onSelectOption={(option) => {
              setShowAddModal(false);
              if (option === 'scan') {
                onNavigate('scan');
              } else if (option === 'search') {
                onNavigate('discover');
              } else {
                alert("Manual entry form coming soon!");
              }
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InsightChip({ label, count, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full border whitespace-nowrap text-[10px] uppercase tracking-widest font-mono transition-all font-bold ${
        active 
          ? 'bg-[#C8A24A]/20 text-[#C8A24A] border-[#C8A24A]/40 shadow-[0_0_15px_rgba(200,162,74,0.15)]' 
          : 'bg-[#0A0A0A] border-[#C8A24A]/20 text-[#F2E7D5]/50 hover:text-[#C8A24A] hover:border-[#C8A24A]'
      }`}
    >
      {label} <span className="ml-1 opacity-60">({count})</span>
    </button>
  );
}

function CellarBottle({ name, vintage, status, statusColor, image, onClick }: any) {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -5, rotate: 2 }}
      className="bg-[#0A0A0A]/90 luxury-border rounded-xl p-3 cursor-pointer group relative overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#C8A24A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 relative border border-white/5">
        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
      </div>
      <h4 className="font-serif text-[15px] text-[#F2E7D5] leading-tight mb-1">{name}</h4>
      <p className="text-xs text-[#F2E7D5]/70 font-serif italic mb-2">{vintage}</p>
      <p className={`text-[9px] uppercase tracking-widest font-mono font-bold ${statusColor.replace('text-gold-500', 'text-[#C8A24A]')}`}>{status}</p>
    </motion.div>
  );
}
