import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Settings, Award, Flame, LogOut, Wine, Activity, MapPin, Grape, BookOpen, Hexagon, Shield, Star, Trophy, Target, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { getCurrentKycVerification, submitKycVerification, type KycVerification } from '../services/kyc';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'star' | 'flame' | 'trophy' | 'target' | 'grape' | 'sparkles';
  color: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

export default function ProfileTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState({
    glasses: 0,
    streak: 0,
    uniqueWines: 0,
    topVarietal: 'Pinotage',
    topRegion: 'Stellenbosch',
    memberTier: 'Enoviq Initiate'
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refined Palate DNA for a "Professional" feel
  const [tasteDNA, setTasteDNA] = useState({
    Boldness: 85,
    Tannin: 70,
    Sweetness: 15,
    Acidity: 65,
    Fruitiness: 60,
    Earthiness: 50
  });

  const [firstName, setFirstName] = useState<string>('Connoisseur');
  const [identity, setIdentity] = useState<string>('A passionate explorer of South African terroirs. Curator of fine Cap Classiques and robust Stellenbosch reds.');
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [kyc, setKyc] = useState<KycVerification | null>(null);
  const [kycDocumentType, setKycDocumentType] = useState('passport');
  const [kycDocumentLast4, setKycDocumentLast4] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editIdentity, setEditIdentity] = useState('');

  useEffect(() => {
    let isMounted = true;
    let profilesChannel: any = null;

    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      try {
        const [profileResult, kycResult] = await Promise.all([
          supabase.from('profiles').select('first_name, identity, taste_dna, avatar_url').eq('id', user.id).single(),
          getCurrentKycVerification().catch(() => null),
        ]);
        const { data: profileData } = profileResult;
        if (isMounted) setKyc(kycResult);
        if (profileData && isMounted) {
          if (profileData.first_name) {
             setFirstName(profileData.first_name);
          } else if (user.email) {
             setFirstName(user.email.split('@')[0]);
          }
          if (profileData.identity) {
             setIdentity(profileData.identity);
          }
          if (profileData.avatar_url) {
             setProfileUrl(profileData.avatar_url);
          }
          if (profileData.taste_dna) {
             setTasteDNA(prev => ({ ...prev, ...profileData.taste_dna }));
          }
        }
        
        const { data: snapshot, error } = await supabase.from('consumption').select('*').eq('user_id', user.id);
        if (error) throw error;

        if (isMounted) {
          const unique = new Set();
          let regionCounts: Record<string, number> = {};
          let varietalCounts: Record<string, number> = {};

          snapshot?.forEach((doc: any) => {
            if (doc.wine_name) unique.add(doc.wine_name);
            if (doc.region) regionCounts[doc.region] = (regionCounts[doc.region] || 0) + 1;
            if (doc.grape) varietalCounts[doc.grape] = (varietalCounts[doc.grape] || 0) + 1;
          });

          // Calculate top region & varietal
          const topRegion = Object.keys(regionCounts).sort((a,b) => regionCounts[b] - regionCounts[a])[0] || 'Stellenbosch';
          const topVarietal = Object.keys(varietalCounts).sort((a,b) => varietalCounts[b] - varietalCounts[a])[0] || 'Pinotage';

          // Calculate real streak from consumption dates
          const calculateStreak = (logs: any[]): number => {
            if (!logs || logs.length === 0) return 0;

            // Get unique dates (normalized to day) sorted descending
            const dates = logs
              .map((l: any) => {
                const d = new Date(l.logged_at || l.created_at);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
              })
              .filter((d: number) => !isNaN(d));

            const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
            if (uniqueDates.length === 0) return 0;

            const today = new Date();
            const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;

            // Check if most recent activity is today or yesterday
            const mostRecent = uniqueDates[0];
            if (mostRecent !== todayNorm && mostRecent !== todayNorm - oneDayMs) {
              return 0; // Streak broken
            }

            let streak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
              const diff = uniqueDates[i - 1] - uniqueDates[i];
              if (diff === oneDayMs) {
                streak++;
              } else {
                break;
              }
            }
            return streak;
          };

          const realStreak = calculateStreak(snapshot || []);

          // Determine tier based on activity
          let tier = 'Enoviq Initiate';
          const totalLogs = snapshot?.length || 0;
          const uniqueCount = unique.size;

          if (totalLogs >= 50 || uniqueCount >= 30) tier = 'Grand Sommelier';
          else if (totalLogs >= 30 || uniqueCount >= 20) tier = 'Terroir Master';
          else if (totalLogs >= 10 || uniqueCount >= 5) tier = 'Estate Explorer';

          setStats({
            glasses: totalLogs,
            streak: realStreak,
            uniqueWines: uniqueCount,
            topRegion,
            topVarietal,
            memberTier: tier
          });

          // Calculate achievements based on real data
          const calculatedAchievements: Achievement[] = [
            {
              id: 'first_taste',
              title: 'First Taste',
              description: 'Log your first wine',
              icon: 'star',
              color: 'gold',
              earned: totalLogs >= 1,
              progress: Math.min(totalLogs, 1),
              maxProgress: 1
            },
            {
              id: 'streak_master',
              title: 'Streak Master',
              description: '7-day tasting streak',
              icon: 'flame',
              color: 'red',
              earned: realStreak >= 7,
              progress: Math.min(realStreak, 7),
              maxProgress: 7
            },
            {
              id: 'explorer',
              title: 'Wine Explorer',
              description: 'Try 10 unique wines',
              icon: 'target',
              color: 'blue',
              earned: uniqueCount >= 10,
              progress: Math.min(uniqueCount, 10),
              maxProgress: 10
            },
            {
              id: 'connoisseur',
              title: 'Connoisseur',
              description: 'Log 25 tastings',
              icon: 'trophy',
              color: 'purple',
              earned: totalLogs >= 25,
              progress: Math.min(totalLogs, 25),
              maxProgress: 25
            },
            {
              id: 'varietal_focus',
              title: `${topVarietal} Enthusiast`,
              description: `5+ ${topVarietal} wines logged`,
              icon: 'grape',
              color: 'purple',
              earned: (varietalCounts[topVarietal] || 0) >= 5,
              progress: Math.min(varietalCounts[topVarietal] || 0, 5),
              maxProgress: 5
            },
            {
              id: 'regional_expert',
              title: `${topRegion} Expert`,
              description: `Explore 5+ wines from ${topRegion}`,
              icon: 'sparkles',
              color: 'amber',
              earned: (regionCounts[topRegion] || 0) >= 5,
              progress: Math.min(regionCounts[topRegion] || 0, 5),
              maxProgress: 5
            }
          ];

          setAchievements(calculatedAchievements);
        }
        
        // Setup realtime subscription
        profilesChannel = supabase
          .channel(`profiles_changes_${user.id}_${Date.now()}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload: any) => {
             const newProfile = payload.new;
             if (isMounted) {
               if (newProfile.first_name) setFirstName(newProfile.first_name);
               if (newProfile.identity) setIdentity(newProfile.identity);
               if (newProfile.taste_dna) setTasteDNA(prev => ({ ...prev, ...newProfile.taste_dna }));
             }
          })
          .subscribe();

      } catch (error) {
         console.error('Error fetching profile stats:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
      if (profilesChannel) supabase.removeChannel(profilesChannel);
    };
  }, []);

  useEffect(() => {
    const saveTasteDNA = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      try {
        await supabase.from('profiles').update({ taste_dna: tasteDNA }).eq('id', user.id);
        
        // Propagate taste DNA to Cupido profile affinities
        const oldWorldAffinity = Math.round(tasteDNA.Earthiness);
        const boldRedsAffinity = Math.round(tasteDNA.Boldness);
        await supabase.from('cupido_profiles').update({
          old_world_affinity: oldWorldAffinity,
          bold_reds_affinity: boldRedsAffinity
        }).eq('id', user.id);
      } catch (err) {
        console.error("Error auto-saving taste DNA", err);
      }
    };
    
    // Only auto-save if we are not initially loading
    if (!loading) {
       const timeoutId = setTimeout(() => {
          saveTasteDNA();
       }, 1500);
       return () => clearTimeout(timeoutId);
    }
  }, [tasteDNA, loading]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleEditClick = () => {
    setEditFirstName(firstName);
    setEditIdentity(identity);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from('profiles').update({
        first_name: editFirstName,
        identity: editIdentity
      }).eq('id', user.id);
      
      if (error) throw error;

      // Determine cupido wine personality based on updated identity selection
      let personality: 'The Collector' | 'The Connoisseur' | 'The Avant-Garde Sommelier' | 'The Naturalist Rebel' = 'The Connoisseur';
      const cleanIdentity = (editIdentity || '').toLowerCase();
      if (cleanIdentity.includes('collector') || cleanIdentity.includes('investor')) {
        personality = 'The Collector';
      } else if (cleanIdentity.includes('explorer')) {
        personality = 'The Naturalist Rebel';
      } else if (cleanIdentity.includes('professional') || cleanIdentity.includes('sommelier') || cleanIdentity.includes('hospitality')) {
        personality = 'The Avant-Garde Sommelier';
      } else if (cleanIdentity.includes('dining')) {
        personality = 'The Connoisseur';
      }

      await supabase.from('cupido_profiles').update({
        full_name: editFirstName,
        personality: personality
      }).eq('id', user.id);
      
      setFirstName(editFirstName);
      setIdentity(editIdentity);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    }
  };

  const handleKycSubmit = async () => {
    setKycSubmitting(true);
    setKycError(null);
    try {
      const cleanLast4 = kycDocumentLast4.trim();
      if (!/^[A-Za-z0-9]{4}$/.test(cleanLast4)) {
        throw new Error('Enter the final 4 characters of the selected document.');
      }

      const nextKyc = await submitKycVerification({
        documentType: kycDocumentType,
        documentLast4: cleanLast4.toUpperCase(),
        selfieAttestation: true,
        consent: true,
        source: 'AfriSommelier profile security center',
      });
      setKyc(nextKyc);
    } catch (error: any) {
      setKycError(error.message || 'Unable to submit KYC verification.');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
       const base64String = reader.result as string;
       setProfileUrl(base64String);
       try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('profiles').update({ avatar_url: base64String }).eq('id', user.id);
          
          // Also sync avatar to Cupido profile photo URL
          await supabase.from('cupido_profiles').update({ photo_url: base64String }).eq('id', user.id);
       } catch (err) {
          console.error("Error saving avatar URL:", err);
       }
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="min-h-screen bg-[#0B0F14] pb-32"
    >
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 pt-12">
          <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-serif font-medium text-white tracking-wide uppercase text-sm">Dossier</h2>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>

        <div className="px-6 space-y-8">
          {/* Identity Card */}
          <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-b from-gold-500/50 via-gold-500/10 to-transparent">
            <div className="bg-[#121820] rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              
              <div className="flex flex-col items-center relative z-10">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gold-500/40 p-1 mb-4 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative group cursor-pointer">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img 
                      src={profileUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-colors">
                      <span className="text-white text-xs font-medium">Upload</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                
                {isEditingProfile ? (
                  <div className="w-full max-w-sm space-y-4 mb-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">First Name</label>
                      <input 
                        type="text" 
                        value={editFirstName} 
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold-500 text-center font-serif text-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Identity Statement</label>
                      <textarea 
                        value={editIdentity} 
                        onChange={(e) => setEditIdentity(e.target.value)}
                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold-500 text-center font-serif text-sm h-24 resize-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-center pt-2">
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="px-4 py-2 rounded-lg bg-gold-500 text-black font-medium text-sm hover:bg-gold-400 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-serif font-semibold text-white mb-1">
                      {firstName}
                      <button onClick={handleEditClick} className="ml-2 text-gray-500 hover:text-gold-500 transition-colors inline-block align-middle">
                        <Settings size={16} />
                      </button>
                    </h1>
                    
                    <div className="flex items-center gap-2 text-gold-500 mb-6">
                      <Shield size={16} />
                      <span className="text-sm tracking-widest uppercase font-medium">{stats.memberTier}</span>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

                    <p className="text-center text-gray-400 text-sm font-serif italic max-w-sm leading-relaxed">
                      "{identity}"
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>


          {/* KYC Access Security */}
          <div className="bg-[#121820] border border-gold-500/20 rounded-3xl p-6 relative overflow-hidden shadow-lg">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white">KYC Security Center</h3>
                <p className="text-gray-400 text-sm mt-1">Verify your identity before using high-trust access features like scans, social matching, events, and cellar transactions.</p>
              </div>
            </div>
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Verification Status</span>
                <span className={`text-xs px-3 py-1 rounded-full border uppercase tracking-widest ${kyc?.status === 'approved' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' : kyc?.status === 'rejected' ? 'text-rose-300 border-rose-500/40 bg-rose-500/10' : 'text-gold-300 border-gold-500/40 bg-gold-500/10'}`}>
                  {kyc?.status?.replace('_', ' ') || 'Not started'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">Assurance level {kyc?.assurance_level ?? 0}/3 • Risk tier {kyc?.risk_level || 'low'}</p>
            </div>
            {kyc?.status !== 'approved' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={kycDocumentType} onChange={(e) => setKycDocumentType(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-gold-500">
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                  <input value={kycDocumentLast4} onChange={(e) => setKycDocumentLast4(e.target.value.slice(0, 4))} placeholder="Last 4" className="bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-gold-500" />
                </div>
                {kycError && <p className="text-xs text-rose-300">{kycError}</p>}
                <button onClick={handleKycSubmit} disabled={kycSubmitting} className="w-full bg-gold-500 text-black p-3 rounded-xl font-bold text-sm hover:bg-gold-400 disabled:opacity-60 transition-colors">
                  {kycSubmitting ? 'Submitting Secure Review...' : 'Submit KYC Review'}
                </button>
              </div>
            )}
          </div>

          {/* Core Analytics Grid */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4 ml-2">Cellar Analytics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                <WindIcon className="text-gray-400 mb-3" />
                <div>
                  <p className="text-3xl font-serif font-medium text-white mb-1">{stats.glasses}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tastings Logged</p>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                <Flame className="text-gold-500 mb-3" size={22} />
                <div>
                  <p className="text-3xl font-serif font-medium text-gold-500 mb-1">{stats.streak}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Day Streak</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                <MapPin className="text-gray-400 mb-3" size={22} />
                <div>
                  <p className="text-xl font-serif font-medium text-white mb-1 truncate">{stats.topRegion}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Top Region</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                <Grape className="text-purple-400 mb-3" size={22} />
                <div>
                  <p className="text-xl font-serif font-medium text-white mb-1 truncate">{stats.topVarietal}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Top Cultivar</p>
                </div>
              </div>
            </div>
          </div>

          {/* TasteDNA Matrix - Improved */}
          <div className="bg-[#121820] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2">
                  <Activity size={22} className="text-gold-500" />
                  Palate Matrix
                </h3>
                <p className="text-gray-400 text-sm max-w-[240px]">Your evolving sensory preferences for personalized matchmaking.</p>
              </div>
              <div className="bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 rounded-full flex flex-col items-end shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                <span className="text-[10px] text-gold-500/70 font-bold uppercase tracking-widest leading-none mb-1">Palate Persona</span>
                <span className="text-gold-400 font-serif text-sm leading-none whitespace-nowrap">
                  {tasteDNA.Tannin > 75 && tasteDNA.Boldness > 75 ? "The Bold Traditionalist" :
                   tasteDNA.Acidity > 75 && tasteDNA.Fruitiness > 70 ? "The Crisp Fruit Seeker" :
                   tasteDNA.Earthiness > 75 && tasteDNA.Tannin > 60 ? "The Terroir Purist" :
                   tasteDNA.Sweetness > 60 ? "The Lush Enthusiast" :
                   tasteDNA.Boldness < 50 && tasteDNA.Acidity > 60 ? "The Elegant Minimalist" :
                   "The Balanced Connoisseur"}
                </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
              {/* Core Structure */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Core Structure</h4>
                <TasteBar label="Structure & Body" description="Light & subtle vs. Rich & full-bodied" value={tasteDNA.Boldness} color="bg-red-500/80" onChange={(val) => setTasteDNA(prev => ({ ...prev, Boldness: val }))} />
                <TasteBar label="Tannin Profile" description="Smooth & silky vs. Grippy & structured" value={tasteDNA.Tannin} color="bg-amber-600/80" onChange={(val) => setTasteDNA(prev => ({ ...prev, Tannin: val }))} />
                <TasteBar label="Crispness & Acidity" description="Soft & round vs. Tart & zesty" value={tasteDNA.Acidity} color="bg-green-500/80" onChange={(val) => setTasteDNA(prev => ({ ...prev, Acidity: val }))} />
              </div>

              {/* Flavor Profile */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Flavor Profile</h4>
                <TasteBar label="Residual Sugar" description="Bone dry vs. Lush & sweet" value={tasteDNA.Sweetness} color="bg-pink-500/80" onChange={(val) => setTasteDNA(prev => ({ ...prev, Sweetness: val }))} />
                <TasteBar label="Fruit Concentration" description="Restrained vs. Jammy & fruit-forward" value={tasteDNA.Fruitiness} color="bg-purple-500/80" onChange={(val) => setTasteDNA(prev => ({ ...prev, Fruitiness: val }))} />
                <TasteBar label="Earth & Minerality" description="Pure fruit vs. Savory & earthy" value={tasteDNA.Earthiness} color="bg-stone-500/80" onChange={(val) => setTasteDNA(prev => ({ ...prev, Earthiness: val }))} />
              </div>
            </div>
          </div>

          {/* Achievements & Badges */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4 ml-2">
              Achievements ({achievements.filter(a => a.earned).length}/{achievements.length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const IconComponent = achievement.icon === 'star' ? Star :
                                     achievement.icon === 'flame' ? Flame :
                                     achievement.icon === 'trophy' ? Trophy :
                                     achievement.icon === 'target' ? Target :
                                     achievement.icon === 'grape' ? Grape :
                                     Sparkles;

                const colorClasses = {
                  gold: { bg: 'bg-gold-500/10', border: 'border-gold-500/30', text: 'text-gold-500', shadow: 'shadow-[0_0_15px_rgba(212,175,55,0.1)]' },
                  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.1)]' },
                  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' },
                  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' },
                  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' },
                }[achievement.color] || { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-500', shadow: '' };

                return (
                  <div
                    key={achievement.id}
                    className={`bg-white/5 border p-4 rounded-2xl flex items-center gap-4 transition-colors ${
                      achievement.earned
                        ? `border-white/10 hover:${colorClasses.border}`
                        : 'border-white/5 opacity-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${colorClasses.bg} ${colorClasses.border} border flex items-center justify-center ${colorClasses.text} ${achievement.earned ? colorClasses.shadow : ''}`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-white font-serif truncate">{achievement.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{achievement.description}</p>
                      {!achievement.earned && achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="mt-2">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colorClasses.bg.replace('/10', '/50')} transition-all`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{achievement.progress}/{achievement.maxProgress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6">
            <button 
              onClick={handleLogout}
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-center gap-2 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all font-medium"
            >
              <LogOut size={18} />
              Sign Out of Dossier
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WindIcon({ className }: { className?: string }) {
  return <Wine size={22} className={className} />;
}

function TasteBar({ label, description, value, color, onChange }: { label: string, description?: string, value: number, color: string, onChange: (val: number) => void }) {
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <span className="text-gray-200 font-medium tracking-wide block text-sm">{label}</span>
          {description && <span className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider block mt-0.5">{description}</span>}
        </div>
        <span className="text-gold-500 font-mono text-xs">{value}%</span>
      </div>
      <div className="relative h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
        <motion.div 
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          className={`absolute top-0 left-0 h-full ${color} pointer-events-none opacity-80`} 
        />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
