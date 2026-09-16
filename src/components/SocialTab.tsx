import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gift,
  Loader2,
  Search,
  ShoppingBag,
  Star,
  UserCheck,
  UserPlus,
  Users,
  Wine,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  wine_type: string;
  location_name: string;
  favorite_wines: string[];
  isFollowing?: boolean;
}

interface FeedActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  action_type: 'cellar_add' | 'wishlist_add' | 'review' | 'consumption';
  wine_name: string;
  wine_image?: string;
  rating?: number;
  notes?: string;
  created_at: string;
}

export default function SocialTab() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [activityFeed, setActivityFeed] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'discover' | 'following' | 'feed'>('feed');
  const [followingInProgress, setFollowingInProgress] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Fetch current user and data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          if (isMounted) {
            setIsLoggedIn(false);
            setLoading(false);
            setFeedLoading(false);
          }
          return;
        }

        if (isMounted) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }

        // Fetch following list - handle if table doesn't exist
        let followingList: string[] = [];
        try {
          const { data: followsData, error: followsError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

          if (!followsError && followsData) {
            followingList = followsData.map((f: any) => f.following_id);
          }
        } catch {
          console.log('follows table may not exist yet');
        }

        if (isMounted) setFollowingIds(followingList);

        // Fetch all cupido_profiles (other users)
        const { data: profilesData, error: profilesError } = await supabase
          .from('cupido_profiles')
          .select('id, full_name, photo_url, wine_type, location_name, favorite_wines')
          .neq('id', user.id)
          .limit(50);

        if (!profilesError && profilesData && isMounted) {
          const mappedUsers: UserProfile[] = profilesData.map((p: any) => ({
            id: p.id,
            full_name: p.full_name || 'Wine Lover',
            avatar_url: p.photo_url,
            wine_type: p.wine_type || 'Enthusiast',
            location_name: p.location_name || 'South Africa',
            favorite_wines: p.favorite_wines || [],
            isFollowing: followingList.includes(p.id),
          }));
          setUsers(mappedUsers);
        }

        if (isMounted) setLoading(false);

        // Fetch activity feed from people you follow
        await fetchActivityFeed(user.id, followingList, isMounted);
      } catch (err) {
        console.error('Error fetching social data:', err);
        if (isMounted) {
          setLoading(false);
          setFeedLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchActivityFeed = async (userId: string, followingList: string[], isMounted: boolean) => {
    setFeedLoading(true);
    try {
      const activities: FeedActivity[] = [];

      // Include own activity + following users' activities
      const userIds = [userId, ...followingList];

      if (userIds.length === 0) {
        if (isMounted) {
          setActivityFeed([]);
          setFeedLoading(false);
        }
        return;
      }

      // Fetch cellar additions
      const { data: cellarData } = await supabase
        .from('cellar')
        .select('id, user_id, name, image, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, user_id, wine_name, rating, review_text, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch consumption logs
      const { data: consumptionData } = await supabase
        .from('consumption')
        .select('id, user_id, wine_name, notes, logged_at')
        .in('user_id', userIds)
        .order('logged_at', { ascending: false })
        .limit(20);

      // Get user profiles for names/avatars
      const { data: profilesData } = await supabase
        .from('cupido_profiles')
        .select('id, full_name, photo_url')
        .in('id', userIds);

      const profileMap = new Map(
        profilesData?.map((p: any) => [p.id, { name: p.full_name, avatar: p.photo_url }]) || []
      );

      // Map cellar additions
      cellarData?.forEach((item: any) => {
        const profile = profileMap.get(item.user_id) || { name: 'Wine Lover', avatar: null };
        activities.push({
          id: `cellar-${item.id}`,
          user_id: item.user_id,
          user_name: profile.name,
          user_avatar: profile.avatar,
          action_type: 'cellar_add',
          wine_name: item.name,
          wine_image: item.image,
          created_at: item.created_at,
        });
      });

      // Map reviews
      reviewsData?.forEach((item: any) => {
        const profile = profileMap.get(item.user_id) || { name: 'Wine Lover', avatar: null };
        activities.push({
          id: `review-${item.id}`,
          user_id: item.user_id,
          user_name: profile.name,
          user_avatar: profile.avatar,
          action_type: 'review',
          wine_name: item.wine_name,
          rating: item.rating,
          notes: item.review_text,
          created_at: item.created_at,
        });
      });

      // Map consumption
      consumptionData?.forEach((item: any) => {
        const profile = profileMap.get(item.user_id) || { name: 'Wine Lover', avatar: null };
        activities.push({
          id: `consumption-${item.id}`,
          user_id: item.user_id,
          user_name: profile.name,
          user_avatar: profile.avatar,
          action_type: 'consumption',
          wine_name: item.wine_name,
          notes: item.notes,
          created_at: item.logged_at,
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (isMounted) {
        setActivityFeed(activities.slice(0, 30));
        setFeedLoading(false);
      }
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      if (isMounted) setFeedLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser || followingInProgress) return;

    setFollowingInProgress(targetUserId);
    const isCurrentlyFollowing = followingIds.includes(targetUserId);

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId);

        setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: false } : u))
        );
      } else {
        // Follow
        await supabase.from('follows').insert({
          follower_id: currentUser.id,
          following_id: targetUserId,
        });

        setFollowingIds((prev) => [...prev, targetUserId]);
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
    } finally {
      setFollowingInProgress(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.wine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const followingUsers = users.filter((u) => u.isFollowing);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActionText = (type: FeedActivity['action_type']) => {
    switch (type) {
      case 'cellar_add':
        return 'added to cellar';
      case 'wishlist_add':
        return 'added to wishlist';
      case 'review':
        return 'reviewed';
      case 'consumption':
        return 'enjoyed';
      default:
        return 'interacted with';
    }
  };

  // Show login prompt if not authenticated
  if (isLoggedIn === false) {
    return (
      <div className="pb-32 pt-6 px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="text-[10px] tracking-[0.2em] font-mono text-[#C8A24A] uppercase mb-3 flex items-center gap-2">
            <div className="w-6 h-px bg-[#C8A24A]/40" />
            Community
          </div>
          <h2 className="text-4xl font-serif font-light mb-3 text-[#F2E7D5]">
            Wine <span className="italic text-[#C8A24A]">Friends</span>
          </h2>
        </motion.div>

        <div className="bg-[#0A0A0A]/90 border border-[#C8A24A]/20 rounded-2xl p-8 text-center">
          <Users className="w-16 h-16 text-[#C8A24A]/40 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-white mb-2">Sign in to connect</h3>
          <p className="text-[#F2E7D5]/60 text-sm mb-6 max-w-xs mx-auto">
            Join the wine community to follow tasters, see activity feeds, and share your wine journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-6 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-[10px] tracking-[0.2em] font-mono text-[#C8A24A] uppercase mb-3 flex items-center gap-2">
          <div className="w-6 h-px bg-[#C8A24A]/40" />
          Community
        </div>
        <h2 className="text-4xl font-serif font-light mb-3 text-[#F2E7D5]">
          Wine <span className="italic text-[#C8A24A]">Friends</span>
        </h2>
        <p className="text-[#F2E7D5]/60 text-sm leading-relaxed">
          Connect with wine lovers, follow tasters, and see what the community is drinking.
        </p>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 bg-[#0A0A0A]/80 p-1 rounded-xl border border-[#C8A24A]/20">
        <button
          onClick={() => setActiveSection('feed')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest font-bold transition-all ${
            activeSection === 'feed'
              ? 'bg-[#12100C] text-[#C8A24A] shadow-md border border-[#C8A24A]/30'
              : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setActiveSection('discover')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest font-bold transition-all ${
            activeSection === 'discover'
              ? 'bg-[#12100C] text-[#C8A24A] shadow-md border border-[#C8A24A]/30'
              : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveSection('following')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest font-bold transition-all ${
            activeSection === 'following'
              ? 'bg-[#12100C] text-[#C8A24A] shadow-md border border-[#C8A24A]/30'
              : 'text-[#F2E7D5]/40 hover:text-[#C8A24A]'
          }`}
        >
          Following ({followingIds.length})
        </button>
      </div>

      {/* Activity Feed Section */}
      <AnimatePresence mode="wait">
        {activeSection === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-[#C8A24A]">
                Activity Feed
              </h3>
              <Wine size={16} className="text-[#C8A24A]" />
            </div>

            {feedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#C8A24A] animate-spin" />
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-8 text-center">
                <Users className="w-12 h-12 text-[#C8A24A]/40 mx-auto mb-4" />
                <p className="text-[#F2E7D5]/60 text-sm mb-2">No activity yet</p>
                <p className="text-[#F2E7D5]/40 text-xs">
                  Follow wine lovers to see their cellar additions, reviews and tastings here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-4 hover:border-[#C8A24A]/30 transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#8B1538]/30 border border-[#C8A24A]/30 flex items-center justify-center text-[#C8A24A] font-serif font-bold shrink-0 overflow-hidden">
                        {activity.user_avatar ? (
                          <img
                            src={activity.user_avatar}
                            alt={activity.user_name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          activity.user_name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-semibold text-white">
                              {activity.user_name}
                            </span>
                            <span className="text-sm text-[#F2E7D5]/60 ml-1">
                              {getActionText(activity.action_type)}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#F2E7D5]/40 font-mono shrink-0">
                            {formatTimeAgo(activity.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-[#C8A24A] font-medium mt-1">
                          {activity.wine_name}
                        </p>

                        {/* Rating stars */}
                        {activity.rating && (
                          <div className="flex gap-0.5 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < activity.rating!
                                    ? 'fill-[#C8A24A] text-[#C8A24A]'
                                    : 'text-white/10'
                                }
                              />
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {activity.notes && (
                          <p className="text-xs text-[#F2E7D5]/50 mt-2 line-clamp-2 leading-relaxed">
                            "{activity.notes}"
                          </p>
                        )}
                      </div>

                      {/* Wine image thumbnail */}
                      {activity.wine_image && (
                        <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <img
                            src={activity.wine_image}
                            alt={activity.wine_name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Discover Users Section */}
        {activeSection === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8A24A]/60"
              />
              <input
                type="text"
                placeholder="Search wine lovers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#C8A24A]/20 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#F2E7D5]/30 focus:outline-none focus:border-[#C8A24A]/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F2E7D5]/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-[#C8A24A]">
                Wine Lovers
              </h3>
              <Users size={16} className="text-[#C8A24A]" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#C8A24A] animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-8 text-center">
                <Users className="w-12 h-12 text-[#C8A24A]/40 mx-auto mb-4" />
                <p className="text-[#F2E7D5]/60 text-sm">
                  {searchQuery ? 'No users found' : 'No other users yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onFollow={() => handleFollow(user.id)}
                    isLoading={followingInProgress === user.id}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Following Section */}
        {activeSection === 'following' && (
          <motion.div
            key="following"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-[#C8A24A]">
                People You Follow
              </h3>
              <UserCheck size={16} className="text-[#C8A24A]" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#C8A24A] animate-spin" />
              </div>
            ) : followingUsers.length === 0 ? (
              <div className="bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-8 text-center">
                <UserPlus className="w-12 h-12 text-[#C8A24A]/40 mx-auto mb-4" />
                <p className="text-[#F2E7D5]/60 text-sm mb-2">Not following anyone yet</p>
                <p className="text-[#F2E7D5]/40 text-xs">
                  Discover wine lovers and follow them to see their activity.
                </p>
                <button
                  onClick={() => setActiveSection('discover')}
                  className="mt-4 px-4 py-2 rounded-full bg-[#C8A24A] text-black text-xs font-bold uppercase tracking-wider"
                >
                  Discover People
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {followingUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onFollow={() => handleFollow(user.id)}
                    isLoading={followingInProgress === user.id}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <section className="grid grid-cols-3 gap-3 mt-8">
        <ActionCard
          icon={<Users size={18} />}
          title="Party Mode"
          description="Group wine ranking"
        />
        <ActionCard
          icon={<ShoppingBag size={18} />}
          title="Marketplace"
          description="Buy from vineyards"
        />
        <ActionCard
          icon={<Gift size={18} />}
          title="Gift Engine"
          description="Find perfect bottle"
        />
      </section>
    </div>
  );
}

function UserCard({
  user,
  onFollow,
  isLoading,
}: {
  user: UserProfile;
  onFollow: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:border-[#C8A24A]/30 transition-colors"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#8B1538]/30 border border-[#C8A24A]/30 flex items-center justify-center text-[#C8A24A] font-serif font-bold overflow-hidden shrink-0">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          user.full_name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
        <p className="text-[11px] text-[#C8A24A] truncate">{user.wine_type}</p>
        <p className="text-[10px] text-[#F2E7D5]/40 truncate">{user.location_name}</p>
      </div>

      {/* Follow Button */}
      <button
        onClick={onFollow}
        disabled={isLoading}
        className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
          user.isFollowing
            ? 'bg-[#C8A24A]/20 text-[#C8A24A] border border-[#C8A24A]/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-[#C8A24A] text-black hover:bg-[#D4AF37]'
        }`}
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : user.isFollowing ? (
          <>
            <UserCheck size={12} /> Following
          </>
        ) : (
          <>
            <UserPlus size={12} /> Follow
          </>
        )}
      </button>
    </motion.div>
  );
}

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      className="bg-[#0A0A0A]/90 border border-white/10 p-4 rounded-2xl text-left hover:border-[#C8A24A]/40 transition-colors"
    >
      <div className="mb-2 bg-[#C8A24A]/10 w-9 h-9 rounded-full flex items-center justify-center text-[#C8A24A]">
        {icon}
      </div>
      <h4 className="font-serif text-sm font-semibold mb-0.5 text-white">{title}</h4>
      <p className="text-[10px] text-gray-400 leading-relaxed">{description}</p>
    </motion.button>
  );
}
