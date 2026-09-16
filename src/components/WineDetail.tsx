import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Heart, Share, Star, Leaf, Activity, Droplet, Edit3, Check, ShoppingCart, Music, Image as ImageIcon, Loader2, Tag, Plus, PenLine, NotebookTabs } from 'lucide-react';
import { supabase } from '../supabase';
import { WHOP_WINE_CHECKOUT_URL, openWhopCheckout } from '../services/checkoutLinks';
import LogGlassModal from './LogGlassModal';

export default function WineDetail({ wine, onClose }: { wine: any, onClose: () => void }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<string | null>(null);
  const [personalNotes, setPersonalNotes] = useState(wine.personalNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showLogGlass, setShowLogGlass] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isInCellar, setIsInCellar] = useState(Boolean(wine.inCellar));
  const [isInMyWines, setIsInMyWines] = useState(Boolean(wine.inMyWines || wine.id));

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
  const [showCouponInput, setShowCouponInput] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!wine.name) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', wine.name);
          
        if (data && data.length > 0) {
          setIsWishlisted(true);
          setWishlistDocId(data[0].id);
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    };

    const fetchReviews = async () => {
      if (!wine.name) return;
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('wine_name', wine.name)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.error("Error fetching reviews", err);
      }
    };

    checkWishlist();
    fetchReviews();

    let reviewsChannel: any;
    if (wine.name) {
      reviewsChannel = supabase
        .channel(`reviews_changes_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `wine_name=eq.${wine.name}` }, () => {
          fetchReviews();
        })
        .subscribe();
    }

    return () => {
      if (reviewsChannel) supabase.removeChannel(reviewsChannel);
    };
  }, [wine.name]);

  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) return;
    setIsSubmittingReview(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        wine_name: wine.name,
        rating: newReviewRating,
        review_text: newReviewText
      });
      
      if (error) throw error;
      
      setNewReviewText('');
      setNewReviewRating(5);
      
      // Refresh reviews
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('wine_name', wine.name)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
    } catch (err) {
      console.error("Error adding review", err);
      alert("Failed to add review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const toggleWishlist = async () => {
    setIsLiking(true);
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLiking(false);
        return;
      }
      
      if (isWishlisted && wishlistDocId) {
        await supabase.from('wishlist').delete().eq('id', wishlistDocId);
        setIsWishlisted(false);
        setWishlistDocId(null);
      } else {
        const { data, error } = await supabase.from('wishlist').insert({
          user_id: user.id,
          name: wine.name,
          vintage: wine.vintage,
          region: wine.region,
          grape: wine.grape,
          image: wine.image,
          price: wine.price,
          created_at: new Date().toISOString()
        }).select();
        
        if (error) throw error;
        
        setIsWishlisted(true);
        if (data && data.length > 0) {
          setWishlistDocId(data[0].id);
        }
        
        // Track event
        console.log("Event logged:", {
          event: "like_wine",
          wine_id: wine.id || wine.name,
          user_id: user.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setTimeout(() => setIsLiking(false), 300);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Discover ${wine.name} on Enoviq`,
      text: `Check out this amazing wine: ${wine.name} from ${wine.region || 'South Africa'}.`,
      url: `${window.location.origin}/share?wine_id=${wine.id || encodeURIComponent(wine.name)}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const addToCellar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to collect.");
        return;
      }

      const { error } = await supabase.from('cellar').insert({
        user_id: user.id,
        name: wine.name,
        vintage: wine.vintage || 'NV',
        region: wine.region || 'South Africa',
        grape: wine.grape || '',
        status: 'Hold (Peak Window ✨)',
        status_color: 'text-gold-500',
        image: wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop",
        rating: Number(wine.rating) || 92,
        price: wine.price || 'R 380',
        notes: wine.notes || 'Curated into collection.',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      setIsInCellar(true);
      setIsInMyWines(true);
      alert("✅ Added to Cellar!");
    } catch (e) {
      console.error(e);
      alert("Unable to add this wine to your live cellar. Please check your connection and try again.");
    }
  };

  const toggleCellar = () => {
    if (isInCellar) {
      setIsInCellar(false);
      alert(`${wine.name} removed from your cellar view.`);
      return;
    }

    addToCellar();
  };

  const toggleMyWines = () => {
    setIsInMyWines((current) => !current);
  };

  const handleBuy = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Track event
    console.log("Event logged:", {
      event: "buy_now_click",
      wine_id: wine.id || wine.name,
      user_id: user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    try {
      openWhopCheckout(WHOP_WINE_CHECKOUT_URL, {
        source: 'enoviq',
        flow: 'wine',
        wine: wine.name || wine.id || 'selected-wine'
      });
    } catch (error: any) {
      alert(error?.message || 'Checkout is not configured yet. Please try again later.');
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'SOMMELIER10') {
      setDiscountPercent(0.10);
      setCouponMessage({ text: '10% discount applied!', type: 'success' });
    } else if (code === 'VINTAGE20') {
      setDiscountPercent(0.20);
      setCouponMessage({ text: '20% discount applied!', type: 'success' });
    } else {
      setDiscountPercent(0);
      setCouponMessage({ text: 'Invalid coupon code', type: 'error' });
    }
  };

  const priceString = wine.price || 'R 950';
  const numericPriceMatch = priceString.match(/[\d,.]+/);
  const numericPrice = numericPriceMatch ? parseFloat(numericPriceMatch[0].replace(/,/g, '')) : 0;
  const currencySymbol = priceString.replace(/[\d,.\s]/g, '') || 'R ';
  const discountedPrice = numericPrice > 0 ? numericPrice * (1 - discountPercent) : 0;
  const displayPrice = discountPercent > 0 && numericPrice > 0
    ? `${currencySymbol} ${discountedPrice.toFixed(2).replace(/\.00$/, '')}`
    : priceString;

  const saveNotes = async () => {
    if (!wine.id) return;
    setIsSavingNotes(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from('cellar').update({ notes: personalNotes }).eq('id', wine.id);
      if (error) throw error;
      
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save tasting notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const generateMusic = async () => {
    alert("Audio generation (Lyria) is currently not supported via the OpenRouter text-only API integration.");
  };

  const generateImage = async () => {
    alert("Image generation (Imagen) is currently not supported via the OpenRouter text-only API integration.");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[60] bg-wine-900/90 overflow-y-auto hide-scrollbar backdrop-blur-sm"
    >
     <div className="w-full max-w-3xl mx-auto bg-wine-900 min-h-screen relative shadow-2xl">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-3">
          <motion.button 
            onClick={toggleWishlist}
            animate={isLiking ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-colors ${isWishlisted ? 'text-pink-500 hover:bg-black/60' : 'text-white hover:bg-black/60'}`}
          >
            <Heart size={20} className={isWishlisted ? 'fill-pink-500' : ''} />
          </motion.button>
          <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <Share size={20} />
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="h-[60vh] relative">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={wine.image || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop"} 
          alt={wine.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-32 relative z-10 pb-32">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {wine.rating && (
            <div className="bg-gold-500 text-wine-900 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <Star size={12} className="fill-wine-900" /> {wine.rating}
            </div>
          )}
          {wine.awards && (
            <div className="bg-white/10 border border-white/20 text-ivory px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
              🏆 {wine.awards}
            </div>
          )}
          <span className="text-gold-450 text-xs font-mono font-bold bg-gold-500/15 px-2.5 py-1 rounded-lg border border-gold-500/20">{wine.match || '96%'} Match Profile</span>
        </div>

        <h1 className="text-4xl font-serif font-bold tracking-tight mb-1">{wine.name}</h1>
        <p className="text-gray-400 font-serif italic mb-6">{wine.region || 'Stellenbosch'}, {wine.vintage || '2019'} • {wine.grape || 'Fine Wine'}</p>

        {/* Elegant Bento Triple-Score Module */}
        <div className="grid grid-cols-3 gap-3.5 mb-8">
          <div className="bg-wine-950/60 p-3.5 rounded-2xl border border-glass-border text-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400">Sommelier AI</span>
            <div className="text-xl font-serif font-extrabold text-ivory mt-1">98<span className="text-xs text-gray-500">/100</span></div>
            <span className="text-[9px] font-mono text-gray-400">Master Class</span>
          </div>
          <div className="bg-wine-950/60 p-3.5 rounded-2xl border border-glass-border text-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400">Community</span>
            <div className="text-xl font-serif font-extrabold text-ivory mt-1">4.8<span className="text-xs text-gray-500">/5</span></div>
            <span className="text-[9px] font-mono text-gray-400">Fine Ratings</span>
          </div>
          <div className="bg-wine-950/60 p-3.5 rounded-2xl border border-glass-border text-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400">Critics Peak</span>
            <div className="text-xl font-serif font-extrabold text-ivory mt-1">97<span className="text-xs text-gray-500">/100</span></div>
            <span className="text-[9px] font-mono text-gray-400">Platter's Guide</span>
          </div>
        </div>

        {/* Primary Actions: direct, visible shortcuts from the proposed Wine Details flow */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-gold-400">Primary Actions</h2>
            <span className="text-[10px] text-gray-500">Save • Purchase • Personalize</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <ActionButton icon={<Heart size={16} className={isWishlisted ? 'fill-pink-500 text-pink-500' : ''} />} label={isWishlisted ? 'Wishlisted' : 'Wishlist'} onClick={toggleWishlist} />
            <ActionButton icon={<Share size={16} />} label="Share" onClick={handleShare} />
            <ActionButton primary icon={<ShoppingCart size={16} />} label="Add to Cart" onClick={handleBuy} />
            <ActionButton icon={<Star size={16} />} label="Add Rating" onClick={() => document.getElementById('wine-reviews')?.scrollIntoView({ behavior: 'smooth' })} />
            <ActionButton icon={<Tag size={16} />} label="Add Price" onClick={() => setShowCouponInput(true)} />
            <ActionButton icon={<Plus size={16} />} label={isInCellar ? 'Remove Cellar' : 'Add Cellar'} onClick={toggleCellar} />
            <ActionButton icon={<NotebookTabs size={16} />} label={isInMyWines ? 'Remove My Wines' : 'Add My Wines'} onClick={toggleMyWines} />
            <ActionButton icon={<PenLine size={16} />} label="Personal Note" onClick={() => setIsEditingNotes(true)} />
          </div>
        </div>

        {/* Summary */}
        <div className="glass-panel p-6 mb-8 bg-gradient-to-br from-wine-950/70 to-wine-900/45">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-gold-400 mb-2">Summary: Highlights & Facts</h3>
          <p className="text-lg font-serif leading-relaxed italic">
            "{wine.notes || "Bold, smoky, with hints of blackberry and cedar. It perfectly matches your preference for full-bodied reds with structured tannins."}"
          </p>
        </div>

        {/* AI Features */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Star size={20} className="text-gold-500" />
            AI Experiences
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              {musicUrl ? (
                <audio controls src={musicUrl} className="w-full h-10" />
              ) : (
                <button 
                  onClick={generateMusic}
                  disabled={isGeneratingMusic}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-gold-500 hover:text-gold-400 transition-colors disabled:opacity-50"
                >
                  {isGeneratingMusic ? <Loader2 size={24} className="animate-spin" /> : <Music size={24} />}
                  <span className="text-sm font-medium">{isGeneratingMusic ? 'Composing...' : 'Generate Vibe Music'}</span>
                </button>
              )}
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              {generatedImageUrl ? (
                <img src={generatedImageUrl} alt="Visualized Wine" className="w-full h-24 object-cover rounded-lg" />
              ) : (
                <button 
                  onClick={generateImage}
                  disabled={isGeneratingImage}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-gold-500 hover:text-gold-400 transition-colors disabled:opacity-50"
                >
                  {isGeneratingImage ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                  <span className="text-sm font-medium">{isGeneratingImage ? 'Visualizing...' : 'Visualize Flavor'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Taste & Pairing */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-gold-500" />
            Taste & Pairing
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Droplet size={20} className="text-blue-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">ABV</p>
              <p className="font-medium text-ivory">{wine.abv || '13.5%'}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Activity size={20} className="text-orange-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Calories</p>
              <p className="font-medium text-ivory">{wine.caloriesPerGlass || '120'} <span className="text-[10px] text-gray-500">/glass</span></p>
            </div>
            <div className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center ${wine.isOrganic ? 'border border-green-500/30 bg-green-500/5' : ''}`}>
              <Leaf size={20} className={wine.isOrganic ? 'text-green-400 mb-2' : 'text-gray-500 mb-2'} />
              <p className="text-xs text-gray-400 mb-1">Farming</p>
              <p className={`font-medium ${wine.isOrganic ? 'text-green-400' : 'text-ivory'}`}>
                {wine.isOrganic ? 'Organic' : 'Standard'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowLogGlass(true)}
            className="w-full mt-4 py-3 rounded-xl border border-gold-500/30 text-gold-500 font-medium hover:bg-gold-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <Droplet size={16} />
            Log a Glass
          </button>
        </div>

        {/* My Log */}
        {wine.id && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">My Log: Personal Note</h3>
              {!isEditingNotes ? (
                <button 
                  onClick={() => setIsEditingNotes(true)}
                  className="text-gold-500 hover:text-gold-400 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <Edit3 size={16} /> Edit
                </button>
              ) : (
                <button 
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="text-green-400 hover:text-green-300 flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Check size={16} /> {isSavingNotes ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Add your personal tasting notes, memories, or pairing ideas here..."
                className="w-full h-32 bg-glass border border-gold-500/50 rounded-xl p-4 text-ivory placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all resize-none"
              />
            ) : (
              <div 
                className="w-full min-h-[5rem] bg-glass border border-glass-border rounded-xl p-4 text-gray-300 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsEditingNotes(true)}
              >
                {personalNotes ? (
                  <p className="whitespace-pre-wrap">{personalNotes}</p>
                ) : (
                  <p className="text-gray-500 italic">Tap to add your personal tasting notes...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div id="wine-reviews" className="mb-10 scroll-mt-6">
          <h3 className="text-xl font-semibold mb-6">Reviews</h3>
          
          <div className="bg-glass border border-glass-border p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">Rate this wine:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setNewReviewRating(star)}>
                    <Star size={20} className={star <= newReviewRating ? "fill-gold-500 text-gold-500" : "text-gray-600"} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="w-full h-24 bg-wine-900/50 border border-white/10 rounded-lg p-3 text-sm text-ivory placeholder-gray-500 mb-3 focus:outline-none focus:border-gold-500/50 resize-none"
              placeholder="What did you think of this wine? Share your thoughts..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
            />
            <button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || !newReviewText.trim()}
              className="w-full bg-gold-500 text-wine-900 font-medium py-2 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50"
            >
              {isSubmittingReview ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Post Review'}
            </button>
          </div>

          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="glass-panel p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? "fill-gold-500 text-gold-500" : "text-gray-600"} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{review.review_text}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No reviews yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>

        {/* Taste Profile */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6">Taste Profile</h3>
          <div className="space-y-4">
            <TasteBar label="Boldness" value={90} />
            <TasteBar label="Tannin" value={85} />
            <TasteBar label="Sweetness" value={15} />
            <TasteBar label="Acidity" value={60} />
            <TasteBar label="Fruit" value={75} />
          </div>
        </div>

        {/* Food Pairing */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6">Food Pairing & Serving Tips</h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-6 px-6">
            <PairingCard food="Braai Ribeye" image="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" />
            <PairingCard food="Aged Cheddar" image="https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=400&auto=format&fit=crop" />
            <PairingCard food="Venison" image="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop" />
          </div>
        </div>

        {/* Wine Knowledge & Ranking */}
        <div className="mb-10 glass-panel p-6 rounded-2xl bg-wine-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-gold-500/10 text-gold-500 text-[10px] font-mono rounded-bl-xl border-l border-b border-gold-500/20">
            INVESTMENT: AAA
          </div>
          <h3 className="text-lg font-serif font-bold text-wine-50 mb-1 flex items-center gap-2">
            🏅 Wine Ranking & Vintage Comparison
          </h3>
          <p className="text-xs text-gray-400 mb-6">Real-time appreciation index & historical cellar performance</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-xs text-gray-500 block">Release Price (MSRP)</span>
              <span className="text-sm font-semibold text-gray-300">R 520 ZAR</span>
            </div>
            <div>
              <span className="text-xs text-gold-400 block">Est. Market Value</span>
              <span className="text-sm font-bold text-gold-400">{priceString}</span>
            </div>
          </div>

          {/* Scarcity Appreciation SVG Line Graph */}
          <div className="bg-wine-900/50 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-4">
              <span>5 Year Yield Curve</span>
              <span className="text-green-400">+47.2% Appreciation</span>
            </div>
            <div className="h-20 relative w-full flex items-end">
              <svg className="w-full h-full overflow-visible" stroke="currentColor" strokeWidth="2" fill="none">
                {/* Visual gridlines */}
                <line x1="0" y1="60" x2="100%" y2="60" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                <line x1="0" y1="20" x2="100%" y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                {/* Spline curve of wine price going up over time */}
                <path
                  d="M 5,75 Q 80,68 150,55 T 300,10"
                  stroke="#C6A96B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_2px_8px_rgba(198,169,107,0.4)]"
                />
                {/* Glow markers for milestones */}
                <circle cx="5" cy="75" r="3" fill="#ffffff" />
                <circle cx="150" cy="55" r="3" fill="#C6A96B" />
                <circle cx="300" cy="10" r="4.5" fill="#facc15" className="animate-pulse" />
              </svg>
            </div>
            <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-2 uppercase tracking-wider">
              <span>{Number(wine.vintage || 2019) - 1}</span>
              <span>Release</span>
              <span>Current</span>
            </div>
          </div>
        </div>

        {/* Winery & Related Wines */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4">Winery & Related Wines</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard title="Meet the Winery" body={wine.winery || 'Learn the estate story, cellar style and maker philosophy.'} />
            <InfoCard title="Wines from This Winery" body="Browse bottles from the same producer." />
            <InfoCard title="Vintage Comparison" body="Compare this year against nearby vintages." />
            <InfoCard title="You Might Also Like" body="Similar bottles based on taste and region." />
          </div>
        </div>

        {/* Cart */}
        <div className="mb-12 mt-4 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Best Price</p>
              <div className="flex flex-wrap items-center gap-2">
                {discountPercent > 0 ? (
                  <>
                    <span className="text-lg text-gray-500 line-through">{priceString}</span>
                    <span className="text-2xl font-serif font-semibold text-green-400">{displayPrice}</span>
                  </>
                ) : (
                  <span className="text-2xl font-serif font-semibold text-gold-500">{priceString}</span>
                )}
              </div>
            </div>
            <button 
              onClick={handleBuy}
              className="bg-gold-500 text-wine-900 font-medium py-3 px-6 rounded-xl hover:scale-[0.98] transition-transform flex items-center gap-2 flex-shrink-0"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          </div>

          <div className="pt-4 border-t border-glass-border">
            {!showCouponInput ? (
              <button 
                onClick={() => setShowCouponInput(true)} 
                className="text-sm text-gold-500 hover:text-gold-400 flex items-center gap-1 transition-colors"
              >
                <Tag size={14} /> Have a discount code?
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. VINTAGE20)"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponMessage({ text: '', type: '' });
                    }}
                    className="flex-1 bg-wine-900/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-ivory placeholder-gray-500 focus:outline-none focus:border-gold-500/50 uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-white/10 hover:bg-white/20 text-ivory text-sm px-4 py-2 rounded-lg transition-colors border border-glass-border whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage.text && (
                  <p className={`text-xs ${couponMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogGlass && (
          <LogGlassModal wine={wine} onClose={() => setShowLogGlass(false)} />
        )}
      </AnimatePresence>
     </div>
    </motion.div>
  );
}


function ActionButton({ icon, label, onClick, primary = false }: { icon: ReactNode, label: string, onClick: () => void, primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-14 rounded-2xl border px-3 py-3 flex items-center gap-2 text-left text-xs font-semibold transition-all active:scale-[0.98] ${
        primary
          ? 'bg-gold-500 text-wine-950 border-gold-400 shadow-[0_4px_20px_rgba(198,169,107,0.22)]'
          : 'bg-white/5 hover:bg-white/10 border-glass-border text-ivory'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function InfoCard({ title, body }: { title: string, body: string }) {
  return (
    <button
      onClick={() => alert(`${title}: ${body}`)}
      className="glass-panel p-4 rounded-2xl text-left hover:bg-white/10 transition-colors min-h-28"
    >
      <h4 className="text-sm font-serif font-bold text-ivory mb-2">{title}</h4>
      <p className="text-[11px] text-gray-400 leading-relaxed">{body}</p>
    </button>
  );
}

function TasteBar({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
      </div>
      <div className="h-2 bg-glass rounded-full overflow-hidden">
        <div className="h-full bg-gold-500 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PairingCard({ food, image }: any) {
  return (
    <div className="min-w-[140px] relative rounded-2xl overflow-hidden aspect-square shrink-0">
      <img src={image} alt={food} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <p className="font-serif font-medium">{food}</p>
      </div>
    </div>
  );
}
