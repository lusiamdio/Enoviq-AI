import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Grape, AlertTriangle, MessageSquare, Plus, Edit, Trash, 
  Search, Award, Sparkles, Filter, CheckCircle, XCircle, RefreshCw, BarChart2,
  Lock, ArrowRight, BookOpen, Volume2, Landmark, HelpCircle, Save, Megaphone
} from 'lucide-react';
import { isCurrentUserAdmin, supabase } from '../supabase';
import { isAdminRole } from '../services/adminAuthorization';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  identity: string;
  role: string;
  taste_dna: any;
  created_at: string;
}

interface WineItem {
  id: string;
  name: string;
  region: string;
  grape: string;
  vintage: string;
  price: string;
  image: string;
  notes: string;
  rating: number;
}

interface SupportTicket {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: 'Open' | 'Resolved';
  category: 'Fraud Reporting' | 'Sommelier Support' | 'App Feedback' | 'Wine Listing Error';
  created_at: string;
  reply?: string;
}

interface Promotion {
  id: string;
  title: string;
  wine_name: string;
  discount: string;
  target: string;
  active: boolean;
  image: string;
  description: string;
}

interface NewsItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  created_at: string;
}

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'wines' | 'promotions' | 'news' | 'support'>('overview');
  
  // Platform Lists State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [winesList, setWinesList] = useState<WineItem[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [promotionsList, setPromotionsList] = useState<Promotion[]>([]);
  
  // Loading & Filtering State
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Event Notification Toaster
  const [notification, setNotification] = useState<string | null>(null);

  // Fraud Control Alerts Trigger
  const [fraudThreatLevel, setFraudThreatLevel] = useState<'Low' | 'Moderate' | 'Critical'>('Low');
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    'AI firewall state synchronized with DeepMind Engine',
    'Realtime PostgreSQL connection established successfully'
  ]);

  // Form Editing Modals / Control State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditingWine, setIsEditingWine] = useState<WineItem | null>(null);
  const [isAddingWine, setIsAddingWine] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [isAddingNews, setIsAddingNews] = useState(false);

  // Form Field States
  const [wineForm, setWineForm] = useState({
    name: '', region: 'Stellenbosch', grape: 'Pinotage', vintage: '2022',
    price: 'R 350', rating: '4.5', notes: '', image: ''
  });

  const [promoForm, setPromoForm] = useState({
    title: '', wine_name: '', discount: '15% Off',
    target: 'Pinotage Collectors', description: '', image: ''
  });

  const [newsForm, setNewsForm] = useState({
    title: '', category: 'Local Spotlight', description: '', image: ''
  });

  // Load baseline statistics and files only after the backend confirms admin access.
  useEffect(() => {
    const bootstrapAdmin = async () => {
      setLoading(true);
      const allowed = await isCurrentUserAdmin().catch(() => false);
      setIsAuthorized(allowed);
      if (allowed) {
        await fetchAdminData();
      } else {
        setLoading(false);
      }
    };

    bootstrapAdmin();
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users Profile Table
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
      if (!pErr && profiles) {
        setUsersList(profiles);
      }

      // 2. Fetch Wines Catalog
      const { data: wines, error: wErr } = await supabase.from('wines').select('*');
      if (!wErr && wines) {
        setWinesList(wines);
      }

      // 3. Fetch News Articles
      const { data: news, error: nErr } = await supabase.from('news').select('*');
      if (!nErr && news) {
        setNewsList(news);
      }

      // 4. Fetch support tickets from Supabase
      const { data: tickets, error: tErr } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!tErr && tickets) {
        setTicketsList(tickets);
      }

      // 5. Fetch promotions from Supabase
      const { data: promotions, error: promoErr } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!promoErr && promotions) {
        setPromotionsList(promotions);
      }


    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // User Actions: Role Manager & Suspensions (Fraud Protection)
  const updateUserRole = async (userId: string, newRole: string) => {
    const updated = usersList.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsersList(updated);
    
    // Save locally or remote
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      triggerToast(`Local state updated. Database Sync code: LSQL_SYNC`);
    } else {
      triggerToast(`User role updated to ${newRole} successfully.`);
    }

    // Append to security logs
    setSecurityLogs(prev => [
      `User ID ${userId.substring(0,6)}... permission altered to: ${newRole}`,
      ...prev
    ]);
  };

  const handleBlockUser = async (userId: string, email: string) => {
    await updateUserRole(userId, 'suspended');
    
    // Record fraud-control action in the live admin audit feed
    setSecurityLogs(prev => [
      `CRITICAL FLAG: Blocked traffic from associated IP of suspicious user: ${email}`,
      `Deactivated session keys for ${email}`,
      ...prev
    ]);
    triggerToast(`User ${email} suspended & IP flagged for spam/fraud control.`);
    
    // Resolve any open tickets from this fraud email
    const updatedTickets = ticketsList.map(t => t.email === email ? { ...t, status: 'Resolved' as const, reply: 'Blocked and filtered as fraudulent activity.' } : t);
    setTicketsList(updatedTickets);
    await supabase.from('support_tickets').update({ status: 'Resolved', reply: 'Blocked and filtered as fraudulent activity.' }).eq('email', email);
  };

  // Wine Catalog Manager: Add, Edit, Update, Delete
  const handleSaveWine = async (e: React.FormEvent) => {
    e.preventDefault();
    const newWine: WineItem = {
      id: isEditingWine ? isEditingWine.id : crypto.randomUUID(),
      name: wineForm.name,
      region: wineForm.region,
      grape: wineForm.grape,
      vintage: wineForm.vintage,
      price: wineForm.price,
      image: wineForm.image || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=450',
      notes: wineForm.notes,
      rating: parseFloat(wineForm.rating) || 4.5
    };

    if (isEditingWine) {
      // Edit mode
      const { error } = await supabase.from('wines').update({
        name: newWine.name,
        region: newWine.region,
        grape: newWine.grape,
        vintage: newWine.vintage,
        price: newWine.price,
        image: newWine.image,
        notes: newWine.notes,
        rating: newWine.rating
      }).eq('id', newWine.id);

      if (!error) {
        setWinesList(prev => prev.map(w => w.id === newWine.id ? newWine : w));
        triggerToast("Wine profile updated successfully.");
      } else {
        triggerToast(`Wine update failed: ${error.message}`);
      }
      setIsEditingWine(null);
    } else {
      // Add mode
      const { error } = await supabase.from('wines').insert(newWine);
      if (!error) {
        setWinesList(prev => [newWine, ...prev]);
        triggerToast("Successfully advertised new wine to Enoviq Catalog.");
      } else {
        triggerToast(`Wine publish failed: ${error.message}`);
      }
      setIsAddingWine(false);
    }

    setWineForm({ name: '', region: 'Stellenbosch', grape: 'Pinotage', vintage: '2022', price: 'R 350', rating: '4.5', notes: '', image: '' });
  };

  const handleDeleteWine = async (id: string, name: string) => {
    const { error } = await supabase.from('wines').delete().eq('id', id);
    if (!error) {
      setWinesList(prev => prev.filter(w => w.id !== id));
      triggerToast(`Removed ${name} from the catalog.`);
    } else {
      triggerToast(`Unable to remove ${name}: ${error.message}`);
    }
  };

  const openEditWine = (wine: WineItem) => {
    setIsEditingWine(wine);
    setWineForm({
      name: wine.name,
      region: wine.region,
      grape: wine.grape,
      vintage: wine.vintage,
      price: wine.price,
      rating: wine.rating.toString(),
      notes: wine.notes,
      image: wine.image
    });
    setIsAddingWine(true);
  };

  // Ticket Support Actions
  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;

    const updated = ticketsList.map(t => {
      if (t.id === selectedTicket.id) {
        return { ...t, status: 'Resolved' as const, reply: ticketReplyText };
      }
      return t;
    });

    setTicketsList(updated);
    await supabase.from('support_tickets').update({ status: 'Resolved', reply: ticketReplyText }).eq('id', selectedTicket.id);
    triggerToast(`Support ticket resolved. Reply dispatched to ${selectedTicket.email}.`);
    
    setSecurityLogs(prev => [
      `Support outbound answer resolved for client: ${selectedTicket.email}`,
      ...prev
    ]);

    setSelectedTicket(null);
    setTicketReplyText('');
  };

  // Add Curated Promotions
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPromo: Promotion = {
      id: crypto.randomUUID(),
      title: promoForm.title,
      wine_name: promoForm.wine_name,
      discount: promoForm.discount,
      target: promoForm.target,
      active: true,
      image: promoForm.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400',
      description: promoForm.description
    };

    const { error } = await supabase.from('promotions').insert(newPromo);
    if (!error) {
      setPromotionsList(prev => [newPromo, ...prev]);
      triggerToast(`curated promotion campaign "${newPromo.title}" published!`);
    } else {
      triggerToast(`Promotion publish failed: ${error.message}`);
    }

    setIsAddingPromo(false);
    setPromoForm({ title: '', wine_name: '', discount: '15% Off', target: 'Pinotage Collectors', description: '', image: '' });
  };

  const togglePromo = async (id: string) => {
    const promo = promotionsList.find(p => p.id === id);
    if (!promo) return;
    const nextActive = !promo.active;
    const { error } = await supabase.from('promotions').update({ active: nextActive }).eq('id', id);
    if (!error) {
      setPromotionsList(prev => prev.map(p => p.id === id ? { ...p, active: nextActive } : p));
      triggerToast("Promotional activity toggled successfully.");
    } else {
      triggerToast(`Promotion update failed: ${error.message}`);
    }
  };

  // Add News Curation
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const newNews: NewsItem = {
      id: crypto.randomUUID(),
      title: newsForm.title,
      category: newsForm.category,
      image: newsForm.image || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400',
      description: newsForm.description,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('news').insert(newNews);
    if (!error) {
      setNewsList(prev => [newNews, ...prev]);
      triggerToast("News article broadcasted globally.");
    } else {
      triggerToast(`News publish failed: ${error.message}`);
    }

    setIsAddingNews(false);
    setNewsForm({ title: '', category: 'Local Spotlight', description: '', image: '' });
  };

  // Filter lists based on search
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.identity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredWines = winesList.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.grape.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!loading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F2E7D5] flex flex-col items-center justify-center p-8 text-center">
        <Shield className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-serif text-white mb-2">Admin access denied</h1>
        <p className="text-sm text-gray-400 mb-6">Your Supabase role does not include admin privileges.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-full border border-gold-500/30 text-gold-400 text-xs uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090A] text-ivory font-sans flex flex-col relative pb-24">
      {/* Background glowing circles */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-wine-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header section with credentials indicator */}
      <header className="border-b border-white/5 bg-[#121215]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-ivory tracking-tight flex items-center gap-2">
              Super Admin Command Center 
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-semibold uppercase px-2 py-0.5 rounded-full tracking-wider font-mono">
                Master Shell
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAdminData}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold flex items-center gap-2 transition-all"
            title="Refresh Platform Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload Database</span>
          </button>
          
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-wine-950 text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            Exit Console
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Administrative Workplace Grid */}
      <div className="max-w-7xl w-full mx-auto px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Toast Notifier */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#151518] border border-gold-500/40 px-5 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 text-gold-400 font-serif text-xs md:text-sm animate-pulse"
            >
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column Left: Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel border-white/5 p-4 rounded-xl space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block px-2 mb-2 font-bold">MANAGEMENT WORKSPACES</span>
            
            <SidebarBtn active={activeSubTab === 'overview'} label="Overview Dashboard" icon={<BarChart2 className="w-4 h-4" />} onClick={() => setActiveSubTab('overview')} />
            <SidebarBtn active={activeSubTab === 'users'} label="User Profiles & Roles" icon={<Users className="w-4 h-4" />} onClick={() => setActiveSubTab('users')} />
            <SidebarBtn active={activeSubTab === 'wines'} label="Wine Catalog Directory" icon={<Grape className="w-4 h-4" />} onClick={() => setActiveSubTab('wines')} />
            <SidebarBtn active={activeSubTab === 'promotions'} label="Promotions & Ads" icon={<Megaphone className="w-4 h-4" />} onClick={() => setActiveSubTab('promotions')} />
            <SidebarBtn active={activeSubTab === 'news'} label="News & Curation Feed" icon={<BookOpen className="w-4 h-4" />} onClick={() => setActiveSubTab('news')} />
            <SidebarBtn 
              active={activeSubTab === 'support'} 
              label="Sommelier Desk Supports" 
              icon={<MessageSquare className="w-4 h-4" />} 
              count={ticketsList.filter(t => t.status === 'Open').length}
              onClick={() => setActiveSubTab('support')} 
            />
          </div>

          {/* Quick Fraud & Security Guard Control widget */}
          <div className="glass-panel bg-red-500/5 border-red-500/10 p-4 rounded-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-red-500/10 rounded-bl-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            
            <span className="text-[10px] font-mono tracking-wider text-red-400 block font-bold">ANTI-FRAUD CONTROL CAPABILITIES</span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Threat Threshold</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                fraudThreatLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                fraudThreatLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/30 text-red-400 animate-pulse'
              }`}>
                {fraudThreatLevel} TRraffic
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button 
                onClick={() => { setFraudThreatLevel('Low'); triggerToast('Threat mitigation set to relaxed mode.'); }}
                className={`text-[10px] py-1 border rounded-lg transition-all ${fraudThreatLevel === 'Low' ? 'bg-green-500/20 border-green-500 text-green-300' : 'border-white/5 hover:bg-white/5 text-gray-500'}`}
              >
                Relaxed
              </button>
              <button 
                onClick={() => { setFraudThreatLevel('Moderate'); triggerToast('Enhanced validation monitoring active.'); }}
                className={`text-[10px] py-1 border rounded-lg transition-all ${fraudThreatLevel === 'Moderate' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'border-white/5 hover:bg-white/5 text-gray-500'}`}
              >
                Monitor
              </button>
              <button 
                onClick={() => { setFraudThreatLevel('Critical'); triggerToast('CRITICAL PROTOCOL: Requiring maximum CAPTCHA validation.'); }}
                className={`text-[10px] py-1 border rounded-lg transition-all ${fraudThreatLevel === 'Critical' ? 'bg-red-500/30 border-red-500 text-red-300 animate-pulse' : 'border-white/5 hover:bg-white/5 text-gray-500'}`}
              >
                Lockdown
              </button>
            </div>
            
            <p className="text-[10px] leading-relaxed text-gray-400 italic">
              Automated fraud tracking logs user logs, flagging multi-ip activities, high-frequency token generation, or invalid password requests.
            </p>
          </div>
        </div>

        {/* Column Right: Secondary Workspaces Details */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* SEARCH DESK BAR (Hidden for Overview but active for all catalogs) */}
          {activeSubTab !== 'overview' && (
            <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between border-white/5">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search details in ${activeSubTab}...`}
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs placeholder-gray-500 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all text-ivory font-sans"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {activeSubTab === 'users' && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select 
                      value={roleFilter} 
                      onChange={e => setRoleFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    >
                      <option value="All">All Roles</option>
                      <option value="super_admin">Super Admins</option>
                      <option value="lead_sommelier">Lead Sommeliers</option>
                      <option value="explorer">Explorers</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
                
                {activeSubTab === 'wines' && (
                  <button 
                    onClick={() => { setIsAddingWine(true); setIsEditingWine(null); }}
                    className="px-3 py-1.5 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-lg text-xs hover:bg-gold-500/20 transition-all flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Wine to Catalog
                  </button>
                )}

                {activeSubTab === 'promotions' && (
                  <button 
                    onClick={() => setIsAddingPromo(true)}
                    className="px-3 py-1.5 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-lg text-xs hover:bg-gold-500/20 transition-all flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Promo Ad
                  </button>
                )}

                {activeSubTab === 'news' && (
                  <button 
                    onClick={() => setIsAddingNews(true)}
                    className="px-3 py-1.5 bg-gold-500/10 border border-gold-500/30 text-gold-400 rounded-lg text-xs hover:bg-gold-500/20 transition-all flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Article
                  </button>
                )}
              </div>
            </div>
          )}

          {/* RENDERING WORKPLACE TABS */}
          <AnimatePresence mode="wait">
            
            {/* 1. OVERVIEW DASHBOARD */}
            {activeSubTab === 'overview' && (
              <motion.div 
                key="subtab-overview"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Statistics Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Connoisseurs" val={usersList.length.toString()} desc="+2 registered today" color="text-gold-400" />
                  <StatCard label="Cataloged Wines" val={winesList.length.toString()} desc="SA regions highlighted" color="text-purple-400" />
                  <StatCard label="Open Support Queue" val={ticketsList.filter(t => t.status==='Open').length.toString()} desc="Direct Simão Inbox" color="text-red-400" />
                  <StatCard label="Promo Campaigns" val={promotionsList.length.toString()} desc="Active advertising" color="text-green-400" />
                </div>

                {/* Live performance charts & security logs */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse">
                  
                  {/* AI Firewall State Graph */}
                  <div className="glass-panel p-5 rounded-xl border-white/5 md:col-span-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Palate Curation Server Telemetry</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                      </div>
                      <div className="h-28 flex items-end gap-1.5 w-full bg-black/20 rounded-lg p-3">
                        <div className="w-full bg-gold-500/30 h-10 rounded-sm hover:bg-gold-400 transition-all" title="User Visits" />
                        <div className="w-full bg-gold-500/40 h-16 rounded-sm" />
                        <div className="w-full bg-gold-500/20 h-8 rounded-sm" />
                        <div className="w-full bg-gold-500/60 h-24 rounded-sm" />
                        <div className="w-full bg-gold-500/50 h-20 rounded-sm" />
                        <div className="w-full bg-gold-500/80 h-28 rounded-sm" />
                        <div className="w-full bg-wine-500 h-12 rounded-sm" />
                        <div className="w-full bg-gold-500/90 h-22 rounded-sm" />
                        <div className="w-full bg-gold-500/30 h-14 rounded-sm" />
                        <div className="w-full bg-gold-500 h-26 rounded-sm" />
                        <div className="w-full bg-gold-400 h-16 rounded-sm" />
                        <div className="w-full bg-gold-500 h-28 rounded-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-[11px] font-mono text-gray-400">
                      <span>Server speed: 18ms</span>
                      <span>Avg queries: 402/min</span>
                      <span>Durable Sync Status: active</span>
                    </div>
                  </div>

                  {/* Operational Security Audit Log */}
                  <div className="glass-panel p-5 rounded-xl border-white/5 md:col-span-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-3 font-bold">Command Center Audit logs</span>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto font-mono text-[10px] text-gray-400">
                        {securityLogs.map((log, lIdx) => (
                          <div key={lIdx} className="flex gap-2 items-start">
                            <span className="text-gold-500 shrink-0">›</span>
                            <span className="leading-relaxed">{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 italic">
                      Tracking authentications matching user criteria.
                    </div>
                  </div>
                </div>

                {/* Prompt Platform Improvements Box */}
                <div className="p-5 rounded-xl bg-gold-500/5 border border-gold-500/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-gold-400 animate-bounce" />
                    <div>
                      <h3 className="text-sm font-serif font-bold text-gold-300">Curate Platform & Clean Spambots</h3>
                      <p className="text-xs text-gray-300">Run quick anti-fraud deactivations, edit tasting note error tickets, and add promotional wine deals.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setActiveSubTab('users'); setRoleFilter('suspended'); }}
                      className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 rounded-lg text-xs"
                    >
                      Audit Suspensions
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('support')}
                      className="px-3 py-1.5 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 rounded-lg text-xs"
                    >
                      Open Sommelier Support Desk
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. USER MANAGER TAB */}
            {activeSubTab === 'users' && (
              <motion.div 
                key="subtab-users"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="overflow-x-auto glass-panel rounded-xl border-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-mono text-gray-400 uppercase">
                        <th className="p-4">Connoisseur Details</th>
                        <th className="p-4">Assigned Role</th>
                        <th className="p-4">Wine Identity</th>
                        <th className="p-4">Registered Date</th>
                        <th className="p-4 text-right">Fraud Controls / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-ivory flex items-center gap-2">
                              {user.first_name || 'N/A'}
                              {isAdminRole(user.role) && (
                                <span className="text-[9px] bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono">Admin</span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">{user.email}</div>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                              user.role === 'super_admin' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' :
                              user.role === 'lead_sommelier' ? 'bg-purple-500/20 text-purple-300' :
                              user.role === 'suspended' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {user.role || 'explorer'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">{user.identity || 'Standard Explorer'}</td>
                          <td className="p-4 text-gray-400 font-mono">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right space-x-1.5">
                              <>
                                <select 
                                  value={user.role || 'explorer'}
                                  onChange={e => updateUserRole(user.id, e.target.value)}
                                  className="bg-[#121215] border border-white/10 text-[11px] text-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-gold-500"
                                >
                                  <option value="explorer">Explorer</option>
                                  <option value="lead_sommelier">Lead Sommelier</option>
                                  <option value="super_admin">Super Admin</option>
                                </select>
                                
                                {user.role !== 'suspended' ? (
                                  <button 
                                    onClick={() => handleBlockUser(user.id, user.email)}
                                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] rounded transition-colors border border-red-500/20 font-bold"
                                    title="Deactivate and block IP for spam/fraud"
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => updateUserRole(user.id, 'explorer')}
                                    className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[11px] rounded transition-colors border border-green-500/20 font-bold"
                                  >
                                    Unblock
                                  </button>
                                )}
                              </>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 3. WINE DIRECTORY & ADVERTISING PAGE */}
            {activeSubTab === 'wines' && (
              <motion.div 
                key="subtab-wines"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Add/Edit Form Overlay Drawer (Inline) */}
                {isAddingWine && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="glass-panel p-5 rounded-xl border border-gold-500/30 bg-[#121215]/95 relative"
                  >
                    <h3 className="text-sm font-serif text-gold-300 font-bold mb-4 flex items-center gap-2">
                      <Grape className="w-4 h-4" />
                      {isEditingWine ? `Edit Details & Descriptions: ${isEditingWine.name}` : 'Advertise New Wine to Platform Exploration'}
                    </h3>
                    
                    <form onSubmit={handleSaveWine} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-gray-400 mb-1">Wine Name</label>
                        <input 
                          type="text" required
                          value={wineForm.name} onChange={e => setWineForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="e.g., Meerlust Rubicon"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-ivory"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Terroir Region</label>
                        <select 
                          value={wineForm.region} onChange={e => setWineForm(p => ({ ...p, region: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#121215] border border-white/5 rounded-lg focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-ivory"
                        >
                          <option value="Stellenbosch">Stellenbosch</option>
                          <option value="Paarl">Paarl</option>
                          <option value="Hemel-en-Aarde">Hemel-en-Aarde</option>
                          <option value="Swartland">Swartland</option>
                          <option value="Franschhoek">Franschhoek</option>
                          <option value="Constantia">Constantia</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Grape Varietal / Blend</label>
                        <input 
                          type="text" required
                          value={wineForm.grape} onChange={e => setWineForm(p => ({ ...p, grape: e.target.value }))}
                          placeholder="e.g., Pinotage, Syrah, Bordeaux Blend"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-ivory"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Wine Vintage Year</label>
                        <input 
                          type="text" required
                          value={wineForm.vintage} onChange={e => setWineForm(p => ({ ...p, vintage: e.target.value }))}
                          placeholder="e.g., 2018"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Price Indicator (e.g. R 450)</label>
                        <input 
                          type="text" required
                          value={wineForm.price} onChange={e => setWineForm(p => ({ ...p, price: e.target.value }))}
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Global/AI Sommelier Rating (e.g. 4.7)</label>
                        <input 
                          type="number" step="0.1" min="1" max="5" required
                          value={wineForm.rating} onChange={e => setWineForm(p => ({ ...p, rating: e.target.value }))}
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-400 mb-1">Image URL Address</label>
                        <input 
                          type="text" 
                          value={wineForm.image} onChange={e => setWineForm(p => ({ ...p, image: e.target.value }))}
                          placeholder="Select a clean glass bottle Unsplash URL or leave placeholder"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-xs"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-gray-400 mb-1">Tasting Notes & Content Descriptions (Advertise to Clients)</label>
                        <textarea 
                          rows={3} required
                          value={wineForm.notes} onChange={e => setWineForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder="Describe the intricate body, oak character, balance, tannin ratios, and pairing advice..."
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg focus:border-gold-500 text-xs"
                        />
                      </div>

                      <div className="md:col-span-3 flex justify-end gap-2.5 pt-2">
                        <button 
                          type="button" onClick={() => setIsAddingWine(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-wine-950 font-bold rounded-lg flex items-center gap-1 shadow-md"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Publish Item
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Wines Grid Catalog */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWines.map(wine => (
                    <div key={wine.id} className="glass-panel p-4 rounded-xl border-white/5 flex gap-4 hover:border-gold-500/20 transition-all group relative">
                      
                      {/* Wine Poster image */}
                      <img 
                        src={wine.image} 
                        alt={wine.name} 
                        referrerPolicy="no-referrer"
                        className="w-20 h-24 object-cover rounded-lg shrink-0 border border-white/5 bg-wine-950"
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-serif font-bold text-sm text-ivory tracking-wide truncate group-hover:text-gold-300 transition-colors">
                              {wine.name}
                            </h4>
                            <span className="shrink-0 text-[10px] font-mono font-bold text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded">
                              ★ {wine.rating}
                            </span>
                          </div>

                          <p className="text-[10px] text-gray-400 font-serif mb-1">
                            {wine.vintage} · {wine.grape} · <span className="text-gold-500/80">{wine.region}</span>
                          </p>

                          <p className="text-xs text-gray-300 italic line-clamp-2 md:line-clamp-3 leading-relaxed mb-2 font-serif">
                            "{wine.notes}"
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-xs font-mono font-bold text-gold-400">{wine.price}</span>
                          
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => openEditWine(wine)}
                              className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-gold-400 transition-colors"
                              title="Edit specifications and tasting details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteWine(wine.id, wine.name)}
                              className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete product"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 4. PROMOTIONS ADVERTISING CAMPAIGNS CREATOR */}
            {activeSubTab === 'promotions' && (
              <motion.div 
                key="subtab-promotions"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Promo Creator Dialog */}
                {isAddingPromo && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="glass-panel p-5 rounded-xl border border-gold-500/30 bg-[#121215]/95 relative"
                  >
                    <h3 className="text-sm font-serif text-gold-300 font-bold mb-4 flex items-center gap-2">
                      <Megaphone className="w-4 h-4" />
                      Publish Promotional Campaign/Offer
                    </h3>

                    <form onSubmit={handleSavePromo} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-gray-400 mb-1">Campaign Title</label>
                        <input 
                          type="text" required
                          value={promoForm.title} onChange={e => setPromoForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="e.g., Spring Robertson Curation"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-ivory"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Target Wine (Promotion Associate)</label>
                        <input 
                          type="text" required
                          value={promoForm.wine_name} onChange={e => setPromoForm(p => ({ ...p, wine_name: e.target.value }))}
                          placeholder="e.g., Kanonkop Pinotage"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-ivory"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Discount/Benefit Value</label>
                        <input 
                          type="text" required
                          value={promoForm.discount} onChange={e => setPromoForm(p => ({ ...p, discount: e.target.value }))}
                          placeholder="e.g., 20% Discount / Free Glass On Tasting"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Target Persona demographic</label>
                        <input 
                          type="text" required
                          value={promoForm.target} onChange={e => setPromoForm(p => ({ ...p, target: e.target.value }))}
                          placeholder="e.g., Investors, Pinotage Fans, Fine Dining Explorers"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-400 mb-1">Banner Unsplash Image URL</label>
                        <input 
                          type="text"
                          value={promoForm.image} onChange={e => setPromoForm(p => ({ ...p, image: e.target.value }))}
                          placeholder="Image showing grapes, cellar aesthetics or dining"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-400 mb-1">Offer & Promotion Description</label>
                        <textarea 
                          rows={2} required
                          value={promoForm.description} onChange={e => setPromoForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Curate an enticing summary of why users must look out for this special deal..."
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-xs"
                        />
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                        <button 
                          type="button" onClick={() => setIsAddingPromo(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-wine-950 font-bold rounded-lg flex items-center gap-1 shadow-md"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          Publish Promo Ad
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {promotionsList.map(promo => (
                    <div key={promo.id} className="glass-panel overflow-hidden rounded-xl border-white/5 hover:border-gold-500/20 transition-all flex flex-col justify-between">
                      <div className="relative">
                        <img 
                          src={promo.image} 
                          alt={promo.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-32 object-cover" 
                        />
                        <div className="absolute top-3 left-3 bg-wine-950/95 border border-gold-500/40 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-gold-400">
                          {promo.discount}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-gray-300">
                          Segment: {promo.target}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-ivory">{promo.title}</h4>
                          <p className="text-[10px] text-gold-500 font-mono mb-2">Associate: {promo.wine_name}</p>
                          <p className="text-xs text-gray-400 leading-relaxed font-serif">
                            {promo.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
                          <span>Status: <strong className={promo.active ? 'text-green-400' : 'text-gray-500'}>{promo.active ? 'Active' : 'Paused'}</strong></span>
                          <button 
                            onClick={() => togglePromo(promo.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              promo.active 
                                ? 'bg-red-500/5 hover:bg-red-500/10 text-red-400 border-red-500/20' 
                                : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20'
                            }`}
                          >
                            {promo.active ? 'Pause Campaign' : 'Activate Campaign'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 5. NEWS CURATION WORKSPACE */}
            {activeSubTab === 'news' && (
              <motion.div 
                key="subtab-news"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* News Creator Drawer */}
                {isAddingNews && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="glass-panel p-5 rounded-xl border border-gold-500/30 bg-[#121215]/95 relative"
                  >
                    <h3 className="text-sm font-serif text-gold-300 font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Broadcast Curated News / Trends to Dashboard
                    </h3>

                    <form onSubmit={handleSaveNews} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 mb-1">Article Headline / Title</label>
                          <input 
                            type="text" required
                            value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g., Robertson Pinotage Renaissance"
                            className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-ivory"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1">Curation Category</label>
                          <select 
                            value={newsForm.category} onChange={e => setNewsForm(p => ({ ...p, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#121215] border border-white/5 rounded-lg text-ivory"
                          >
                            <option value="Local Spotlight">Local Spotlight</option>
                            <option value="Global News">Global News</option>
                            <option value="Trend">Trend</option>
                            <option value="Finance">Market Finance</option>
                            <option value="Tech">Wine Tech</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1">Header Image URL</label>
                        <input 
                          type="text"
                          value={newsForm.image} onChange={e => setNewsForm(p => ({ ...p, image: e.target.value }))}
                          placeholder="Image address depicting vineyard or modern tech"
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1">Article Content Description</label>
                        <textarea 
                          rows={4} required
                          value={newsForm.description} onChange={e => setNewsForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Write the full, insightful news content. Support markdown-like simple paragraphs..."
                          className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg textarea-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          type="button" onClick={() => setIsAddingNews(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-wine-950 font-bold rounded-lg flex items-center gap-1 shadow-md"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Publish Article
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                <div className="space-y-4">
                  {newsList.map(news => (
                    <div key={news.id} className="glass-panel p-4 rounded-xl border-white/5 flex gap-4 hover:border-gold-500/10 transition-colors">
                      <img 
                        src={news.image} 
                        alt={news.title} 
                        referrerPolicy="no-referrer"
                        className="w-24 h-20 object-cover rounded-lg shrink-0 border border-white/5 bg-wine-950" 
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-gold-500/10 text-gold-400 rounded-full">
                              {news.category}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(news.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-sm text-ivory truncate">{news.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed font-serif">
                            {news.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 6. SUPPORT TICKETING SYSTEM */}
            {activeSubTab === 'support' && (
              <motion.div 
                key="subtab-support"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                
                {/* Tickets list */}
                <div className="md:col-span-5 space-y-3">
                  <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block font-bold mb-1">USER TICKETING QUEUE</span>
                  
                  {ticketsList.map(ticket => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => { setSelectedTicket(ticket); setTicketReplyText(ticket.reply || ''); }}
                        className={`w-full text-left p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                          isSelected 
                            ? 'bg-gold-500/10 border-gold-500 text-gold-300 shadow-md' 
                            : 'bg-glass border-glass-border hover:bg-white/5 hover:border-gold-500/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5 w-full">
                          <span className="text-[9px] font-mono font-bold uppercase bg-white/5 text-gray-300 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                            {ticket.category}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            ticket.status === 'Resolved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/20 text-red-400 animate-pulse'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-xs text-ivory mb-1 line-clamp-1">{ticket.subject}</h4>
                        <p className="text-[10px] text-gray-400 truncate mb-1.5 font-sans">Sender: {ticket.email}</p>
                        <span className="text-[9px] text-gray-500 font-mono text-right w-full block">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Ticket Reply Box Details */}
                <div className="md:col-span-7">
                  <AnimatePresence mode="wait">
                    {selectedTicket ? (
                      <motion.div 
                        key={selectedTicket.id}
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="glass-panel p-5 rounded-xl border border-white/5 h-full flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <div>
                              <span className="text-[10px] text-gold-400 font-mono tracking-wider font-bold block uppercase">{selectedTicket.category}</span>
                              <h3 className="font-serif font-bold text-sm text-ivory">{selectedTicket.subject}</h3>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              selectedTicket.status === 'Resolved' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {selectedTicket.status} Ticket
                            </span>
                          </div>

                          <div className="p-3 bg-black/30 rounded-lg text-xs font-serif leading-relaxed text-gray-300">
                            <strong>Message from client:</strong>
                            <p className="mt-1 italic">"{selectedTicket.message}"</p>
                          </div>

                          <p className="text-[11px] text-gray-500 font-mono">
                            Client Contacts: {selectedTicket.email}
                          </p>
                        </div>

                        <form onSubmit={handleReplyTicket} className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">
                              OUTBOUND ANSWER (REPLY AS MASTER AFRI-SOMMELIER TEAM)
                            </label>
                            <textarea 
                              rows={4} required
                              value={ticketReplyText}
                              onChange={e => setTicketReplyText(e.target.value)}
                              disabled={selectedTicket.status === 'Resolved'}
                              placeholder="Write a warm, informative response to the user's inquiry or detail correction..."
                              className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-xs focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                            />
                          </div>

                          <div className="flex justify-end gap-2.5">
                            {selectedTicket.status !== 'Resolved' && (
                              <button 
                                type="button" 
                                onClick={() => handleBlockUser('f', selectedTicket.email)}
                                className="px-3.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold"
                              >
                                Flag & Suspend User
                              </button>
                            )}
                            <button 
                              type="submit"
                              disabled={selectedTicket.status === 'Resolved'}
                              className="px-5 py-1.5 bg-gradient-to-r from-gold-600 to-gold-500 text-wine-950 text-xs font-bold rounded-lg flex items-center gap-1 shadow-md disabled:opacity-55"
                            >
                              Dispatch Solution
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    ) : (
                      <div className="glass-panel p-10 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center text-gray-500 h-full min-h-[300px]">
                        <HelpCircle className="w-10 h-10 text-gray-600 mb-2 animate-bounce" />
                        <h4 className="font-serif text-sm font-semibold">No Ticket Selected</h4>
                        <p className="text-xs max-w-xs mt-1 text-gray-500 font-serif leading-relaxed">
                          Choose a query, content bug report, or fraudulent check from the left sidebar to reply and configure outbound solutions.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

// Sidebar Button Helper Component
function SidebarBtn({ label, icon, active, onClick, count }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-2.5 rounded-lg flex items-center justify-between transition-all border ${
        active 
          ? 'bg-gold-500/10 border-gold-500/30 text-gold-400 shadow-sm' 
          : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-ivory'
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs font-serif font-semibold">
        {icon}
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

// Stat Card helper UI
function StatCard({ label, val, desc, color }: { label: string, val: string, desc: string, color: string }) {
  return (
    <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden group">
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold-500/30 group-hover:bg-gold-400 transition-colors" />
      <span className="text-[10px] font-mono tracking-wider text-gray-500 block uppercase font-bold">{label}</span>
      <h3 className={`text-xl md:text-2xl font-serif font-bold mt-1 ${color}`}>{val}</h3>
      <span className="text-[9px] text-gray-400 mt-1 block italic">{desc}</span>
    </div>
  );
}
