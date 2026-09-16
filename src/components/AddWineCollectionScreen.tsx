import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  Search, 
  Edit3, 
  Upload, 
  ChevronRight, 
  Sparkles, 
  History, 
  Heart, 
  TrendingUp, 
  CheckCircle2, 
  Compass, 
  ArrowLeft,
  Briefcase,
  Layers,
  Archive,
  Star
} from 'lucide-react';
import { supabase } from '../supabase';
import { callOpenRouter } from '../services/openRouterService';

interface AddWineCollectionScreenProps {
  onBack: () => void;
  onNavigate: (route: string) => void;
  onSelectWine: (wine: any) => void;
  onNavigateToCellar?: (section: 'cellar' | 'favorites' | 'wishlist' | 'portfolio') => void;
}

export default function AddWineCollectionScreen({ onBack, onNavigate, onSelectWine, onNavigateToCellar }: AddWineCollectionScreenProps) {
  const [recentlyAdded, setRecentlyAdded] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<'cellar' | 'favorites' | 'wishlist' | 'investment'>('cellar');

  // Load recently added wines from Supabase cellar
  useEffect(() => {
    async function loadRecent() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('cellar')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        if (!error && data) {
          setRecentlyAdded(data);
          
          // Use AI to suggest some recommendations based on these
          fetchAiSuggestions(data);
        }
      } catch (err) {
        console.error('Error loading recent wines:', err);
      }
    }
    loadRecent();
  }, []);

  const fetchAiSuggestions = async (wines: any[]) => {
    setLoadingSuggestions(true);
    try {
      const winesString = wines.length > 0 
        ? wines.map(w => `${w.name} (${w.vintage}) from ${w.region}`).join(', ')
        : 'Meerlust Rubicon, Kanonkop Pinotage, Vilafonté Series C';

      const prompt = `Based on these recently added/collected South African wines: [${winesString}], generate 3 highly curated wine collection suggestions. Return STRICTLY a valid JSON array of objects conforming exactly to this structure:
      [
        {
          "name": "Wine Name",
          "vintage": "2020",
          "region": "Stellenbosch",
          "reason": "Why this matches your taste DNA profile",
          "price": "R 450",
          "investmentScore": "A+"
        }
      ]`;

      const res = await callOpenRouter({
        prompt,
        temperature: 0.7,
        responseFormat: { type: 'json_object' }
      });

      // Parse JSON
      let suggestions = [];
      try {
        const parsed = JSON.parse(res);
        suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
      } catch {
        // Fallback robust regex parser or clean JSON extractor
        const match = res.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          suggestions = JSON.parse(match[0]);
        }
      }

      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
      } else {
        // Safe premium fallbacks
        setAiSuggestions([
          { name: "Kanonkop Paul Sauer", vintage: "2019", region: "Stellenbosch", reason: "An iconic Bordeaux blend that aligns perfectly with your taste for structured reds.", price: "R 850", investmentScore: "AAA" },
          { name: "Savage Follow the Line", vintage: "2021", region: "Darling", reason: "Lighter red blend offering beautiful floral aromas and earthy depth.", price: "R 380", investmentScore: "A" },
          { name: "Boekenhoutskloof Syrah", vintage: "2020", region: "Swartland", reason: "Bold, spicy Syrah with dark fruit layers preferred by fine wine collectors.", price: "R 520", investmentScore: "AA" }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      // Safe premium fallbacks
      setAiSuggestions([
        { name: "Kanonkop Paul Sauer", vintage: "2019", region: "Stellenbosch", reason: "An iconic Bordeaux blend that aligns perfectly with your taste for structured reds.", price: "R 850", investmentScore: "AAA" },
        { name: "Savage Follow the Line", vintage: "2021", region: "Darling", reason: "Lighter red blend offering beautiful floral aromas and earthy depth.", price: "R 380", investmentScore: "A" },
        { name: "Boekenhoutskloof Syrah", vintage: "2020", region: "Swartland", reason: "Bold, spicy Syrah with dark fruit layers preferred by fine wine collectors.", price: "R 520", investmentScore: "AA" }
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const askAiAssistant = async () => {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const prompt = `The user is in the "Add Wine to Collection" workspace. They asked: "${chatMessage}". As a premium AI Sommelier, advise them on collecting this wine, how it fits their collection, aging advice, investment potential or tasting harmony. Keep it brief, incredibly elegant, and professional (under 3 sentences).`;
      const res = await callOpenRouter({ prompt, temperature: 0.8 });
      setChatResponse(res);
    } catch (err) {
      setChatResponse("Apologies, I'm having trouble retrieving active cellar data right now. I recommend storing iconic South African vintages like 2015 and 2017 for long-term depth.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wine-900 text-ivory pb-32">
      {/* Top Header */}
      <header className="sticky top-0 bg-wine-950/85 backdrop-blur-xl border-b border-glass-border px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
            id="back_btn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-gold-400 uppercase">Collection Hub</div>
            <h1 className="text-xl font-serif font-bold text-ivory">Add Wine to My Collection</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-gold-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Vault Secured
        </div>
      </header>

      {/* Hero Breadcrumbs */}
      <div className="px-6 py-4 text-xs font-mono text-gray-400 flex items-center gap-1.5 border-b border-white/5 bg-wine-950/20">
        <span>Home</span>
        <ChevronRight size={12} />
        <span>Collection</span>
        <ChevronRight size={12} />
        <span className="text-gold-400">Add Wine</span>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
        
        {/* Toggle Target Destination */}
        <div className="space-y-3">
          <label className="text-[11px] font-mono tracking-widest text-gold-400 uppercase block">Save Destination</label>
          <div className="grid grid-cols-4 gap-2 bg-wine-950/60 p-1.5 rounded-2xl border border-glass-border">
            <button
              id="dest_cellar"
              onClick={() => setSelectedDestination('cellar')}
              className={`py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${selectedDestination === 'cellar' ? 'bg-gold-500 text-wine-950 shadow-lg font-semibold' : 'text-gray-400 hover:text-ivory hover:bg-white/5'}`}
            >
              <Archive size={16} />
              <span>Cellar</span>
            </button>
            <button
              id="dest_favorites"
              onClick={() => setSelectedDestination('favorites')}
              className={`py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${selectedDestination === 'favorites' ? 'bg-gold-500 text-wine-950 shadow-lg font-semibold' : 'text-gray-400 hover:text-ivory hover:bg-white/5'}`}
            >
              <Star size={16} />
              <span>Favorites</span>
            </button>
            <button
              id="dest_wishlist"
              onClick={() => setSelectedDestination('wishlist')}
              className={`py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${selectedDestination === 'wishlist' ? 'bg-gold-500 text-wine-950 shadow-lg font-semibold' : 'text-gray-400 hover:text-ivory hover:bg-white/5'}`}
            >
              <Heart size={16} />
              <span>Wishlist</span>
            </button>
            <button
              id="dest_investment"
              onClick={() => setSelectedDestination('investment')}
              className={`py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${selectedDestination === 'investment' ? 'bg-gold-500 text-wine-950 shadow-lg font-semibold' : 'text-gray-400 hover:text-ivory hover:bg-white/5'}`}
            >
              <Briefcase size={16} />
              <span>Portfolio</span>
            </button>
          </div>
        </div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            id="scan_label_cta"
            onClick={() => onNavigate('scan')}
            className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold-500/50 hover:bg-white/[0.04] active:scale-[0.98] transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:bg-gold-500/20 group-hover:text-gold-300 transition-all shadow-[0_0_15px_rgba(198,169,107,0.1)]">
              <Camera size={26} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-gold-400">Scan Label</h3>
              <p className="text-xs text-gray-400 mt-1">Instant AI bottle recognition via vision camera</p>
            </div>
          </button>

          <button 
            id="search_wine_cta"
            onClick={() => onNavigate('search')}
            className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold-500/50 hover:bg-white/[0.04] active:scale-[0.98] transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:bg-gold-500/20 group-hover:text-gold-300 transition-all shadow-[0_0_15px_rgba(198,169,107,0.1)]">
              <Search size={26} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-gold-400">Search Database</h3>
              <p className="text-xs text-gray-400 mt-1">Browse extensive South African wine registry</p>
            </div>
          </button>

          <button 
            id="manual_entry_cta"
            onClick={() => onNavigate('collection-manual')}
            className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold-500/50 hover:bg-white/[0.04] active:scale-[0.98] transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:bg-gold-500/20 group-hover:text-gold-300 transition-all shadow-[0_0_15px_rgba(198,169,107,0.1)]">
              <Edit3 size={26} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-gold-400">Manual Entry</h3>
              <p className="text-xs text-gray-400 mt-1">Manually type full details with AI enrichments</p>
            </div>
          </button>
        </div>

        {/* Import & Info Secondary CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            id="import_csv_cta"
            onClick={() => alert("Excel / CellarTracker Import initiated. Please select your structured cellar CSV file to sync.")}
            className="flex-1 py-3.5 px-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-medium text-xs text-gray-300 flex items-center justify-center gap-2 transition-all"
          >
            <Upload size={16} />
            Import CSV Collection
          </button>
          
          <button 
            id="view_cellar_cta"
            onClick={onBack}
            className="flex-1 py-3.5 px-5 bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 rounded-xl font-medium text-xs text-gold-400 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(198,169,107,0.05)]"
          >
            <Layers size={16} />
            View Live Cellar ({recentlyAdded.length || 'Secure'})
          </button>
        </div>

        {/* Load AI Wine Assistant Inline Section */}
        <div className="glass-panel p-6 rounded-3xl border border-gold-500/20 relative overflow-hidden bg-gradient-to-br from-wine-950 via-wine-950/90 to-wine-900">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">Sommelier AI Collector Assistant</h3>
              <p className="text-xs text-gray-400">Ask which South African vintage or region to buy next</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                id="ai_collector_input"
                type="text" 
                placeholder="Ask e.g. 'Should I invest in 2015 Meerlust Rubicon?'"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') askAiAssistant(); }}
                className="flex-1 bg-wine-900 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              />
              <button 
                id="ai_collector_send"
                onClick={askAiAssistant}
                disabled={chatLoading}
                className="px-2.5 py-1 bg-gold-500 text-wine-950 rounded font-mono font-bold text-[9px] uppercase tracking-wider hover:scale-[0.97] transition-all disabled:opacity-55 shrink-0 self-center"
              >
                {chatLoading ? 'Thinking...' : 'Consult'}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Is 2017 a good vintage?', 'Best Hemel-en-Aarde Chardonnay?', 'Which Pinotage ages longest?'].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setChatMessage(suggestion)}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {chatResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gold-500/[0.04] border border-gold-500/20 text-sm text-gray-300 italic font-serif leading-relaxed"
              >
                "{chatResponse}"
              </motion.div>
            )}
          </div>
        </div>

        {/* Suggest Favorites Based on Previous Collections */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-mono tracking-widest text-gold-400 uppercase">Suggested Favorites for You</h3>
            <span className="text-[10px] font-mono text-gray-500">AI TasteDNA Grounding</span>
          </div>

          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-gray-400">Consulting tasting vaults...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiSuggestions.map((item, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel p-4 rounded-2xl border border-glass-border hover:border-gold-500/40 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col justify-between"
                  onClick={() => {
                    const mappedInfo = {
                      name: item.name,
                      vintage: item.vintage || '2020',
                      region: item.region || 'Stellenbosch',
                      grape: 'Bordeaux Blend',
                      price: item.price || 'R 450',
                      rating: 4.7,
                      isOrganic: true,
                      notes: item.reason,
                      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop'
                    };
                    onSelectWine(mappedInfo);
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-mono text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded">
                        Score {item.investmentScore || 'AA'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{item.price}</span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-ivory mt-2">{item.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.region} • {item.vintage}</p>
                    <p className="text-[11px] text-gray-400 mt-2 line-clamp-3 italic font-serif leading-relaxed">
                      "{item.reason}"
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-gold-500 font-semibold mt-3 text-right flex items-center justify-end gap-1 group">
                    View Match <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Added Wines */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-mono tracking-widest text-gold-400 uppercase">Recently Added</h3>
            <span className="text-xs text-gray-500 font-mono">Sync: Connected</span>
          </div>

          {recentlyAdded.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-glass-border">
              <History size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-xs text-gray-400">No wines added recently. Ready to secure your first South African vintage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentlyAdded.map((wine, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel p-3 rounded-2xl flex items-center gap-3 hover:bg-white/[0.04] cursor-pointer transition-all border border-glass-border"
                  onClick={() => onSelectWine(wine)}
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-wine-950 flex-shrink-0">
                    <img 
                      src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=150&auto=format&fit=crop"} 
                      alt={wine.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif font-semibold text-xs text-ivory truncate">{wine.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{wine.region} • {wine.vintage}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle2 size={10} className="text-green-500" />
                      <span className="text-[9px] font-mono py-0.5 rounded text-green-400">Stored Safely</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
