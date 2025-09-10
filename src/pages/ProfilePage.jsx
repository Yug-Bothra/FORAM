// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../supabaseClient";
import Comments from "../components/Comments";
import Like from "../components/Like";
import Share from "../components/Share";
import Follow from "../components/Follow";
import ProfileHeader from "../components/ProfileHeader";
import PostsGrid from "../components/PostsGrid";

const ProfilePage = () => {
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("public");
  const [posts, setPosts] = useState({ public: [], private: [] });
  const [expandedPost, setExpandedPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); // For modal view
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [openFollowModal, setOpenFollowModal] = useState(null); // "followers" | "following" | null
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Fetch profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("forum_users") // ✅ public.forum_users
        .select("*")
        .eq("email", user.primaryEmailAddress.emailAddress)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setProfile(data);

        // Fetch followers/following counts dynamically
        const { count: followers } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", data.id);
        setFollowersCount(followers || 0);

        const { count: following } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", data.id);
        setFollowingCount(following || 0);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Fetch posts
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts") // ✅ public.posts
        .select("*")
        .eq("user_id", user.id) // ✅ correct column from schema
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts({
          public: data.filter((p) => p.visibility === "public"),
          private: data.filter((p) => p.visibility === "private"),
        });
      }
      setLoading(false);
    };

    fetchPosts();
  }, [user]);

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
    const isVideo =
      attachment?.type === "video" ||
      (attachment?.url &&
        (attachment.url.includes(".mp4") ||
          attachment.url.includes(".webm") ||
          attachment.url.includes(".mov") ||
          attachment.url.includes(".avi")));

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
                  style={{ outline: "none" }}
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
                      {profile.username
                        ? profile.username.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#111827] text-sm">
                    {profile.username || "Unknown"}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {formatDate(post.created_at)}
                  </p>
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
              <p className="text-[#111827] leading-relaxed text-sm">
                {post.content}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between py-3 border-t border-[#E5E7EB]">
                <div className="flex space-x-4">
                  <Like postId={post.id} initialCount={post.likes_count} />
                  <button
                    onClick={() =>
                      setOpenCommentsPostId(
                        openCommentsPostId === post.id ? null : post.id
                      )
                    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex justify-center items-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#E5E7EB] mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6C63FF] border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-[#6C63FF] rounded-full animate-bounce"></div>
            </div>
          </div>
          <p className="text-[#111827] text-lg font-semibold mb-1">
            Loading your profile...
          </p>
          <p className="text-[#6B7280] text-sm">Getting everything ready</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex justify-center items-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg border border-[#E5E7EB] max-w-sm">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-[#FF6584] text-lg font-semibold mb-2">
            Profile not found
          </p>
          <p className="text-[#6B7280] text-sm">
            We couldn't locate your profile information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          posts={posts}
          followersCount={followersCount}
          followingCount={followingCount}
          setOpenFollowModal={setOpenFollowModal}
        />

        {/* Navigation Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-[#E5E7EB] mb-6">
          <div className="flex justify-center p-2">
            <div className="flex space-x-2 bg-[#F9FAFB] rounded-lg p-2">
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium text-sm ${
                  activeTab === "public"
                    ? "bg-[#6C63FF] text-white shadow-md scale-105"
                    : "text-[#6B7280] hover:text-[#6C63FF] hover:bg-white hover:scale-105"
                }`}
                onClick={() => setActiveTab("public")}
              >
                <span className="text-lg">🌍</span>
                <span>Public Posts</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    activeTab === "public"
                      ? "bg-white/30 text-white"
                      : "bg-[#6C63FF]/10 text-[#6C63FF]"
                  }`}
                >
                  {posts.public.length}
                </span>
              </button>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium text-sm ${
                  activeTab === "private"
                    ? "bg-[#FF6584] text-white shadow-md scale-105"
                    : "text-[#6B7280] hover:text-[#FF6584] hover:bg-white hover:scale-105"
                }`}
                onClick={() => setActiveTab("private")}
              >
                <span className="text-lg">🔒</span>
                <span>Private Posts</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    activeTab === "private"
                      ? "bg-white/30 text-white"
                      : "bg-[#FF6584]/10 text-[#FF6584]"
                  }`}
                >
                  {posts.private.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-[#E5E7EB]">
          <PostsGrid
            postList={activeTab === "public" ? posts.public : posts.private}
            activeTab={activeTab}
            posts={posts}
            profile={profile}
            openCommentsPostId={openCommentsPostId}
            setOpenCommentsPostId={setOpenCommentsPostId}
            openPostModal={openPostModal}
            formatDate={formatDate}
          />
        </div>
      </div>

      {/* Post Modal */}
      {selectedPost && <PostModal post={selectedPost} onClose={closePostModal} />}

      {/* Followers/Following Modal */}
      {openFollowModal && (
        <Follow
          type={openFollowModal}
          userId={profile.id}
          onClose={() => setOpenFollowModal(null)}
        />
      )}

      {/* Custom Animations */}
      <style>{`
        .line-clamp-6 {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
