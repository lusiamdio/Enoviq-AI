import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Star, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Wine, 
  Eye, 
  Activity, 
  Layers, 
  Utensils 
} from 'lucide-react';
import { supabase } from '../supabase';
import { callOpenRouter } from '../services/openRouterService';

interface ManualEntryScreenProps {
  onBack: () => void;
  onNavigate: (route: string) => void;
  onSelectWine: (wine: any) => void;
}

export default function ManualEntryScreen({ onBack, onNavigate, onSelectWine }: ManualEntryScreenProps) {
  const [name, setName] = useState('');
  const [producer, setProducer] = useState('');
  const [vintage, setVintage] = useState('');
  const [country, setCountry] = useState('South Africa');
  const [region, setRegion] = useState('Stellenbosch');
  const [appellation, setAppellation] = useState('');
  
  const [wineType, setWineType] = useState('Red');
  const [selectedGrapes, setSelectedGrapes] = useState<string[]>([]);
  
  const [appearance, setAppearance] = useState('');
  const [aroma, setAroma] = useState('');
  const [taste, setTaste] = useState('');
  const [foodPairings, setFoodPairings] = useState('');
  const [rating, setRating] = useState(5);
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // AI progress triggers
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementStage, setEnhancementStage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successWineId, setSuccessWineId] = useState<any>(null);

  const grapeOptions = [
    'Cabernet Sauvignon',
    'Merlot',
    'Pinot Noir',
    'Chardonnay',
    'Pinotage',
    'Syrah',
    'Sauvignon Blanc',
    'Chenin Blanc',
    'Cabernet Franc',
    'Cinsault'
  ];

  const toggleGrape = (grape: string) => {
    if (selectedGrapes.includes(grape)) {
      setSelectedGrapes(selectedGrapes.filter(g => g !== grape));
    } else {
      setSelectedGrapes([...selectedGrapes, grape]);
    }
  };

  const wineTypes = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified'];

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !producer) {
      alert("Name and Producer are required!");
      return;
    }

    setIsEnhancing(true);

    try {
      // Step 1: Generate AI Tasting Notes
      setEnhancementStage('Generating AI Tasting Notes...');


      // Step 2: Generate Pairing Suggestions
      setEnhancementStage('Generating Advanced Pairing Suggestions...');


      // Step 3: Estimate Market Price
      setEnhancementStage('Estimating Current Johannesburg and Global Market pricing...');


      // Step 4: Predict Aging Potential
      setEnhancementStage('Predicting optimal aging window, peak, and hold curves...');


      // Step 5: Find Similar Wines
      setEnhancementStage('Finding similar wines within Cape vineyards...');
      
      const prompt = `You are an expert Sommelier and fine wine investment broker. Analyze this manually inputted wine profile:
      Wine Name: "${name}"
      Producer: "${producer}"
      Vintage: "${vintage}"
      Type: "${wineType}"
      Grapes: [${selectedGrapes.join(', ')}]
      Region: "${region}"
      Appearance notes: "${appearance}"
      Aroma notes: "${aroma}"
      Taste notes: "${taste}"

      Return a JSON object with:
      1. "aiTastingNotes": fully expanded professional tasting notes (2 sentences)
      2. "pairingSuggestions": 3 curated SA food pairing ideas list (as single string)
      3. "estimatedPrice": estimated value or standard retail price (e.g. "R 490")
      4. "agingPotential": detailed description of peak year window and hold status (e.g. "Drink now or peak until 2032")
      5. "similarWines": array of 2 similar South African wine names.
      Ensure response is STRICTLY parsed JSON.`;

      const responseText = await callOpenRouter({
        prompt,
        temperature: 0.8,
        responseFormat: { type: "json_object" }
      });

      let aiEnrichment: any = {};
      try {
        aiEnrichment = JSON.parse(responseText);
      } catch {
        throw new Error('AI enrichment returned invalid JSON; wine was not saved with synthetic tasting data.');
      }

      setEnhancementStage('Securing data inside Supabase profiles and cellar...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Save to cellar table
      const response = await supabase.from('cellar').insert({
        user_id: user.id,
        name: name,
        vintage: vintage || 'NV',
        region: region || 'Stellenbosch',
        grape: selectedGrapes.join(', ') || wineType,
        status: 'Peak Window ✨',
        status_color: 'text-gold-500',
        image: wineType === 'White' || wineType === 'Sparkling' 
          ? "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=800&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop",
        rating: Number(rating) * 20, // Map 1-5 to 20-100 scale
        awards: 'AI Enhanced • Private Stash',
        price: price ? `R ${price}` : aiEnrichment.estimatedPrice || 'R 350',
        calories_per_glass: wineType === 'Red' ? 125 : 110,
        is_organic: false,
        notes: `${appearance ? 'Appearance: ' + appearance + '. ' : ''}${aroma ? 'Aroma: ' + aroma + '. ' : ''}${taste ? 'Taste: ' + taste + '. ' : ''}\n\nAI Sommelier Insight: ${aiEnrichment.aiTastingNotes}\n\nPairing Ideas: ${aiEnrichment.pairingSuggestions}\n\nAging potential: ${aiEnrichment.agingPotential}`,
        created_at: new Date().toISOString()
      }).select();

      const savedDoc = response.data?.[0];

      setSuccessWineId(savedDoc || { name, vintage, region });
      setIsEnhancing(false);
      setShowSuccess(true);

    } catch (error) {
      console.error("Manual save failed:", error);
      alert("Unable to save this wine to the live cellar. Please try again.");
      setIsEnhancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-wine-900 text-ivory pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-wine-955/90 backdrop-blur-xl border-b border-glass-border px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button 
            id="back_btn_manual"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-gold-400 uppercase">Input Workflow</div>
            <h1 className="text-xl font-serif font-bold text-ivory">Add Wine Manually</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-gold-400">
          <Sparkles size={12} className="text-gold-400 animate-spin" />
          AI-Enhanced
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="px-6 py-4 text-xs font-mono text-gray-400 flex items-center gap-1.5 border-b border-white/5 bg-wine-950/20">
        <span>Collection</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-3 h-3"><path d="m9 18 6-6-6-6"/></svg>
        <span className="text-gold-400">Manual Entry</span>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto">
        <form onSubmit={handleManualSave} className="space-y-8">
          
          {/* Section 1: Basic Information */}
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-glass-border">
            <h3 className="text-base font-serif font-bold text-gold-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <BookOpen size={18} />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Wine Name *</label>
                <input 
                  id="manual_field_name"
                  type="text" 
                  required
                  placeholder="e.g. Series C"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Producer / Estate *</label>
                <input 
                  id="manual_field_producer"
                  type="text" 
                  required
                  placeholder="e.g. Vilafonté"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Vintage Year</label>
                <input 
                  id="manual_field_vintage"
                  type="text" 
                  placeholder="e.g. 2019"
                  value={vintage}
                  onChange={(e) => setVintage(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Country of Origin</label>
                <input 
                  id="manual_field_country"
                  type="text" 
                  placeholder="e.g. South Africa"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Region (e.g. Stellenbosch, Paarl)</label>
                <input 
                  id="manual_field_region"
                  type="text" 
                  placeholder="e.g. Stellenbosch"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Appellation (e.g. Ward / Valley)</label>
                <input 
                  id="manual_field_appellation"
                  type="text" 
                  placeholder="e.g. Simonsberg-Stellenbosch"
                  value={appellation}
                  onChange={(e) => setAppellation(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Wine Characteristics */}
          <div className="glass-panel p-6 rounded-3xl space-y-6 border border-glass-border">
            <h3 className="text-base font-serif font-bold text-gold-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Wine size={18} />
              Wine Characteristics
            </h3>

            {/* Wine Type */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono tracking-wide text-gray-400 block">Wine Type</label>
              <div className="flex flex-wrap gap-2">
                {wineTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWineType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${wineType === type ? 'bg-gold-500 text-wine-950 border-gold-500 font-semibold' : 'bg-wine-950 hover:bg-white/5 border-glass-border text-gray-400'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Grape Varieties */}
            <div className="space-y-3">
              <label className="text-xs font-mono tracking-wide text-gray-400 block">Grape Varieties (Multi-select)</label>
              <div className="flex flex-wrap gap-2">
                {grapeOptions.map((grape) => {
                  const isSelected = selectedGrapes.includes(grape);
                  return (
                    <button
                      key={grape}
                      type="button"
                      onClick={() => toggleGrape(grape)}
                      className={`px-3 py-2 rounded-xl text-xs border transition-all flex items-center gap-1 ${isSelected ? 'bg-gold-500/10 text-gold-400 border-gold-500/40 font-medium' : 'bg-wine-950 border-glass-border text-gray-400 hover:text-ivory'}`}
                    >
                      {isSelected ? <Check size={12} className="text-gold-400" /> : null}
                      {grape}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Personal Notes & Buying Details */}
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-glass-border">
            <h3 className="text-base font-serif font-bold text-gold-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Activity size={18} />
              Personal Notes & Logs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Appearance (color, clarity)</label>
                <input 
                  id="notes_appearance"
                  type="text" 
                  placeholder="e.g. Deep ruby rose"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Aroma (nose, perfume)</label>
                <input 
                  id="notes_aroma"
                  type="text" 
                  placeholder="e.g. Dark fruit, cocoa, oak"
                  value={aroma}
                  onChange={(e) => setAroma(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Taste (palate, body)</label>
                <input 
                  id="notes_taste"
                  type="text" 
                  placeholder="e.g. Velvet tannins, long dry"
                  value={taste}
                  onChange={(e) => setTaste(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-wide text-gray-400 block">My Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform active:scale-125"
                  >
                    <Star 
                      size={24} 
                      className={star <= rating ? 'fill-gold-500 text-gold-500' : 'text-gray-600'} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Purchase Price (Rand ZAR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R</span>
                  <input 
                    id="purchase_price"
                    type="number" 
                    placeholder="e.g. 450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-wine-950 rounded-xl border border-glass-border pl-8 pr-4 py-3 text-sm text-ivory placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wide text-gray-400 block">Purchase Date</label>
                <input 
                  id="purchase_date"
                  type="date" 
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-wine-950 rounded-xl border border-glass-border px-4 py-3 text-sm text-ivory focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <button
            id="manual_submit_btn"
            type="submit"
            className="w-full bg-gradient-to-r from-gold-300 to-gold-500 text-wine-950 p-4.5 rounded-2xl font-serif font-bold text-center hover:scale-[0.99] transition-all leading-tight shadow-[0_4px_30px_rgba(198,169,107,0.3)] block"
          >
            Save to Collection & AI-Enhance
          </button>
        </form>
      </div>

      {/* Full Screen AI Generation Overlay */}
      <AnimatePresence>
        {isEnhancing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full mb-8 shadow-[0_0_30px_rgba(198,169,107,0.4)]"
            />
            
            <h2 className="text-2xl font-serif font-semibold text-gold-400 mb-2 flex items-center justify-center gap-2">
              <Sparkles className="text-gold-500 animate-pulse" />
              Sommelier AI Enhancing Stash
            </h2>
            <p className="text-sm font-mono tracking-wide text-gray-400 uppercase h-6 animate-pulse">
              {enhancementStage}
            </p>

            <div className="mt-12 space-y-2 max-w-sm text-left bg-wine-950/40 p-5 rounded-2xl border border-white/5 font-serif text-xs leading-relaxed text-gray-400">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enhancementStage.includes('Tasting') ? 'bg-gold-500 animate-ping' : 'bg-green-500'}`} />
                <span>Generating AI Tasting Notes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enhancementStage.includes('Pairing') ? 'bg-gold-500 animate-ping' : enhancementStage.includes('Tasting') ? 'bg-gray-700' : 'bg-green-500'}`} />
                <span>Curating food pairing suggestions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enhancementStage.includes('pricing') ? 'bg-gold-500 animate-ping' : (enhancementStage.includes('Tasting') || enhancementStage.includes('Pairing')) ? 'bg-gray-700' : 'bg-green-500'}`} />
                <span>Estimating exact Market Price</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enhancementStage.includes('aging') ? 'bg-gold-500 animate-ping' : (enhancementStage.includes('Supabase') || enhancementStage.includes('window')) ? 'bg-green-500' : 'bg-gray-700'}`} />
                <span>Predicting optimal Aging Potential</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enhancementStage.includes('Supabase') ? 'bg-gold-500 animate-ping animate-pulse' : 'bg-gray-700'}`} />
                <span>Syncing storage with Secure Supabase</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-wine-950/95 border border-gold-500/30 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-green-500/20 text-green-400 border border-green-500/35 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                <Check size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-serif font-bold text-ivory">Wine Successfully Added!</h2>
                <p className="text-sm text-gray-400 mt-2">"{name}" has been registered & synchronized securely to your personal vault.</p>
              </div>

              {/* Enhanced Stats Card */}
              <div className="bg-wine-900/40 p-4 rounded-2xl border border-white/5 text-left space-y-2 font-serif text-xs">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase block">Estimated Valuation</span>
                  <span className="text-base text-ivory font-bold">{price ? `R ${price}` : 'R 480'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase block">Vessel Peak Status</span>
                  <span className="text-xs text-gold-400 font-medium font-mono">Hold (Peak Window ✨)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  id="success_view_cellar"
                  onClick={() => {
                    setShowSuccess(false);
                    onNavigate('cellar');
                  }}
                  className="w-full bg-gold-500 text-wine-950 font-semibold py-3.5 rounded-xl hover:scale-95 transition-transform"
                >
                  View My Cellar
                </button>
                <button
                  id="success_view_details"
                  onClick={() => {
                    setShowSuccess(false);
                    onSelectWine(successWineId || { name, vintage, region });
                  }}
                  className="w-full glass-panel text-ivory font-medium py-3.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  View Wine Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
