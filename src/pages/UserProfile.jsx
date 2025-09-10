// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "@clerk/clerk-react";
import { Grid, Settings } from "lucide-react";
import Comments from "../components/Comments";
import Like from "../components/Like";
import Share from "../components/Share";

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState("public");
  const [selectedPost, setSelectedPost] = useState(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const canViewPrivate = user?.id === profile?.id || isFollowing;

  // Fetch profile with stats
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("forum_users")
        .select("*")
        .eq("username", username)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setProfile(data);
        
        // Fetch followers count
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", data.id);
        setFollowersCount(followersCount || 0);

        // Fetch following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", data.id);
        setFollowingCount(followingCount || 0);

        // Fetch posts count
        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", data.id)
          .eq("visibility", "public");
        setPostsCount(postsCount || 0);
      }
      setLoading(false);
    };
    if (username) fetchProfile();
  }, [username]);

  // Check follow status
  useEffect(() => {
    if (!profile || !user) return;
    const checkFollow = async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle();
      if (error) console.error(error);
      else setIsFollowing(!!data);
    };
    checkFollow();
  }, [profile, user]);

  // Follow/Unfollow with optimistic updates
  const handleFollowToggle = async () => {
    if (!user || !profile) return;
    
    // Optimistic update
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else {
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
      if (error) {
        console.error(error);
        // Revert optimistic update
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } else {
      const { error } = await supabase.from("follows").insert([
        { follower_id: user.id, following_id: profile.id },
      ]);
      if (error) {
        console.error(error);
        // Revert optimistic update
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      }
    }
  };

  // Fetch posts with like/comment counts
  useEffect(() => {
    if (!profile) return;
    const fetchPostsWithStats = async () => {
      let query = supabase
        .from("posts")
        .select(`
          *,
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq("user_id", profile.id);

      if (visibilityFilter === "public") {
        query = query.eq("visibility", "public");
      } else if (visibilityFilter === "private") {
        if (!canViewPrivate) {
          setPosts([]);
          return;
        }
        query = query.eq("visibility", "private");
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        console.error(error);
      } else {
        // Process the data to get actual counts
        const postsWithCounts = data.map(post => ({
          ...post,
          likes_count: post.likes_count?.length || 0,
          comments_count: post.comments_count?.length || 0
        }));
        setPosts(postsWithCounts);
      }
    };
    fetchPostsWithStats();
  }, [profile, visibilityFilter, canViewPrivate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
  };

  const closePostModal = () => {
    setSelectedPost(null);
  };

  // Post Modal Component with Video Support
  const PostModal = ({ post, onClose }) => {
    const attachment = post.attachments && post.attachments[0];
    const isVideo = attachment?.type === "video" || 
                   (attachment?.url && (
                     attachment.url.includes('.mp4') || 
                     attachment.url.includes('.webm') || 
                     attachment.url.includes('.mov') ||
                     attachment.url.includes('.avi')
                   ));

    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex shadow-xl" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Media Section */}
          {attachment && (
            <div className="flex-1 bg-black flex items-center justify-center">
              {isVideo ? (
                <video
                  src={attachment.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay={false}
                  muted
                  loop
                  playsInline
                  style={{ outline: 'none' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={attachment.url}
                  alt="Post"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          )}
          
          {/* Content Section */}
          <div className="w-80 flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-3">
                {/* Profile Avatar */}
                {profile.profile_photo ? (
                  <div className="relative">
                    <img
                      src={profile.profile_photo}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#6C63FF] text-white font-semibold text-sm">
                      {profile.username ? profile.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#111827] text-sm">
                    {profile.username || "Unknown"}
                  </p>
                  <p className="text-xs text-[#6B7280]">{formatDate(post.created_at)}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-[#F9FAFB] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#111827] flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-[#111827] leading-relaxed text-sm">{post.content}</p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between py-3 border-t border-[#E5E7EB]">
                <div className="flex space-x-4">
                  <Like postId={post.id} initialCount={post.likes_count} />
                  <button
                    onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    className="flex items-center space-x-1 text-[#6B7280] hover:text-[#6C63FF]"
                  >
                    <span className="text-xl">💬</span>
                    {post.comments_count > 0 && <span>{post.comments_count}</span>}
                  </button>
                  <Share imageUrl={attachment?.url} postId={post.id} />
                </div>
              </div>

              {/* Comments Section */}
              {openCommentsPostId === post.id && (
                <div>
                  <Comments postId={post.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#6B7280] font-medium">Loading profile...</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#E5E7EB] rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">😔</span>
          </div>
          <p className="text-[#6B7280] text-lg font-medium">User not found</p>
          <p className="text-[#6B7280] text-sm mt-1">The user you're looking for doesn't exist</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Profile Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Header with username and settings */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-[#111827]">{profile.username}</h1>
              {user?.id === profile.id && (
                <button className="p-2">
                  <Settings className="w-6 h-6 text-[#6B7280]" />
                </button>
              )}
            </div>

            {/* Profile info */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#6C63FF] flex-shrink-0">
                <img
                  src={profile.profile_photo || `https://ui-avatars.com/api/?name=${profile.username}&background=6C63FF&color=fff&size=80`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex space-x-6 mb-3">
                  <div className="text-center">
                    <div className="font-bold text-lg text-[#111827]">{postsCount}</div>
                    <div className="text-[#6B7280] text-sm">posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-[#111827]">{followersCount}</div>
                    <div className="text-[#6B7280] text-sm">followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-[#111827]">{followingCount}</div>
                    <div className="text-[#6B7280] text-sm">following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <p className="text-[#111827] text-sm leading-relaxed">
                {profile.bio || ""}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {user?.id === profile.id ? (
                <>
                  <button className="flex-1 py-2 bg-[#F3F4F6] text-[#111827] rounded-lg font-semibold text-sm hover:bg-[#E5E7EB] transition">
                    Edit Profile
                  </button>
                  <button className="flex-1 py-2 bg-[#F3F4F6] text-[#111827] rounded-lg font-semibold text-sm hover:bg-[#E5E7EB] transition">
                    Share Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                      isFollowing
                        ? "bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
                        : "bg-[#6C63FF] text-white hover:bg-[#5B55E3]"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button className="flex-1 py-2 bg-[#F3F4F6] text-[#111827] rounded-lg font-semibold text-sm hover:bg-[#E5E7EB] transition">
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Avatar */}
            <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-[#6C63FF] flex-shrink-0">
              <img
                src={profile.profile_photo || `https://ui-avatars.com/api/?name=${profile.username}&background=6C63FF&color=fff&size=144`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-6 mb-4">
                <h1 className="text-3xl font-light text-[#111827]">{profile.username}</h1>
                
                {user?.id === profile.id ? (
                  <div className="flex space-x-2">
                    <button className="px-4 py-1.5 bg-[#F3F4F6] text-[#111827] rounded-lg font-semibold text-sm hover:bg-[#E5E7EB] transition">
                      Edit Profile
                    </button>
                    <button className="p-1.5">
                      <Settings className="w-6 h-6 text-[#6B7280]" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleFollowToggle}
                      className={`px-6 py-1.5 rounded-lg font-semibold text-sm transition ${
                        isFollowing
                          ? "bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
                          : "bg-[#6C63FF] text-white hover:bg-[#5B55E3]"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button className="px-4 py-1.5 bg-[#F3F4F6] text-[#111827] rounded-lg font-semibold text-sm hover:bg-[#E5E7EB] transition">
                      Message
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex space-x-8 mb-4">
                <div>
                  <span className="font-bold text-[#111827]">{postsCount}</span>
                  <span className="text-[#6B7280] ml-1">posts</span>
                </div>
                <div>
                  <span className="font-bold text-[#111827]">{followersCount}</span>
                  <span className="text-[#6B7280] ml-1">followers</span>
                </div>
                <div>
                  <span className="font-bold text-[#111827]">{followingCount}</span>
                  <span className="text-[#6B7280] ml-1">following</span>
                </div>
              </div>

              {/* Bio */}
              <div className="text-[#111827]">
                <p className="leading-relaxed">{profile.bio || ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center space-x-12">
            <button
              onClick={() => setVisibilityFilter("public")}
              className={`flex items-center space-x-1 py-3 border-t-2 transition ${
                visibilityFilter === "public"
                  ? "border-[#111827] text-[#111827]"
                  : "border-transparent text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <Grid className="w-3 h-3" />
              <span className="text-xs font-semibold uppercase tracking-wide">Posts</span>
            </button>
            
            {canViewPrivate && (
              <button
                onClick={() => setVisibilityFilter("private")}
                className={`flex items-center space-x-1 py-3 border-t-2 transition ${
                  visibilityFilter === "private"
                    ? "border-[#111827] text-[#111827]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                <span className="text-xs">🔒</span>
                <span className="text-xs font-semibold uppercase tracking-wide">Private</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-6">
            {posts.map((post) => {
              const isImage = post.attachments?.[0]?.type === "image";
              const isVideo = post.attachments?.[0]?.type === "video" || 
                             (post.attachments?.[0]?.url && (
                               post.attachments[0].url.includes('.mp4') || 
                               post.attachments[0].url.includes('.webm') || 
                               post.attachments[0].url.includes('.mov') ||
                               post.attachments[0].url.includes('.avi')
                             ));

              return (
                <div
                  key={post.id}
                  className="relative aspect-square bg-white rounded-lg overflow-hidden cursor-pointer group hover:opacity-90 transition"
                  onClick={() => openPostModal(post)}
                >
                  {/* Post Content */}
                  {isImage && (
                    <img
                      src={post.attachments[0].url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {isVideo && (
                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                      <video
                        src={post.attachments[0].url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <span className="text-white text-2xl">▶</span>
                      </div>
                    </div>
                  )}

                  {!isImage && !isVideo && (
                    <div className="w-full h-full bg-gradient-to-br from-[#6C63FF] to-[#FF6584] flex items-center justify-center p-4">
                      <p className="text-white text-center text-sm font-medium leading-relaxed line-clamp-4">
                        {post.content || "Text post"}
                      </p>
                    </div>
                  )}

                  {/* Hover Overlay with Stats */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center space-x-6 text-white">
                      <div className="flex items-center space-x-1">
                        <span className="text-lg">❤</span>
                        <span className="font-bold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-lg">💬</span>
                        <span className="font-bold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Video indicator */}
                  {isVideo && (
                    <div className="absolute top-2 right-2">
                      <span className="text-white text-sm">▶</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 border-2 border-[#111827] rounded-full mx-auto mb-6 flex items-center justify-center">
              <Grid className="w-8 h-8 text-[#111827]" />
            </div>
            <h2 className="text-2xl font-bold text-[#111827] mb-2">
              {visibilityFilter === "private" ? "No Private Posts" : "No Posts Yet"}
            </h2>
            <p className="text-[#6B7280]">
              {user?.id === profile.id 
                ? "When you share photos and videos, they'll appear on your profile." 
                : `${profile.username} hasn't shared any posts yet.`}
            </p>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={closePostModal} />
      )}
    </div>
  );
};

export default UserProfile;