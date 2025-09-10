// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Comments from "../components/Comments";
import Like from "../components/Like";
import Share from "../components/Share";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);

  // Fetch public posts with user info + counts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          forum_users!inner(username, profile_photo)
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        const transformedPosts =
          data?.map((post) => ({
            ...post,
            username: post.forum_users?.username,
            profile_photo: post.forum_users?.profile_photo,
          })) || [];
        setPosts(transformedPosts);
      }
    } catch (err) {
      console.error("Unexpected error fetching posts:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return postDate.toLocaleDateString();
  };

  const renderMedia = (attachments) => {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return null;
    }

    return (
      <div className="relative">
        {attachments.map((att, index) => {
          if (att.type === "video") {
            return (
              <div key={index} className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden group">
                <video
                  src={att.url}
                  controls
                  className="w-full max-h-[600px] object-contain"
                  preload="metadata"
                  style={{ aspectRatio: "auto" }}
                  onError={(e) => {
                    console.error("Video failed to load:", att.url);
                    e.target.style.display = "none";
                  }}
                />
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 shadow-2xl border border-white/10">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>VIDEO</span>
                </div>
              </div>
            );
          } else if (att.type === "image") {
            return (
              <div key={index} className="relative group overflow-hidden rounded-2xl">
                <img
                  src={att.url}
                  alt={`Post attachment ${index + 1}`}
                  className="w-full object-cover max-h-[600px] rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {attachments.length > 1 && index === 0 && (
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 shadow-2xl border border-white/10">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />
                    </svg>
                    <span>1/{attachments.length}</span>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Update likes/comments counts in UI
  const updatePostCounts = (postId, newLikesCount, newCommentsCount) => {
    console.log('Updating post counts:', { postId, newLikesCount, newCommentsCount });
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes_count: newLikesCount !== undefined ? newLikesCount : post.likes_count,
              comments_count: newCommentsCount !== undefined ? newCommentsCount : post.comments_count,
            }
          : post
      )
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFAFA] via-[#F9FAFB] to-[#F3F4F6] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#6C63FF]/5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#5B55E3]/5 rounded-full animate-pulse delay-75"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-[#6C63FF]/3 rounded-full animate-pulse delay-150"></div>
        </div>
        
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#E5E7EB] border-t-[#6C63FF] mx-auto shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-[#6C63FF] to-[#5B55E3] rounded-full animate-pulse shadow-xl"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[#111827] text-xl font-bold">Loading your feed</p>
            <p className="text-[#6B7280] text-base">Discovering amazing content...</p>
          </div>
        </div>
      </div>
    );

  if (!posts.length)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFAFA] via-[#F9FAFB] to-[#F3F4F6] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#6C63FF]/5 rounded-full animate-bounce delay-100"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#5B55E3]/5 rounded-full animate-bounce delay-200"></div>
        </div>
        
        <div className="text-center max-w-md z-10">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#6C63FF] to-[#5B55E3] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-3">No posts yet!</h3>
            <p className="text-[#6B7280] mb-6">Be the first to share something amazing with the community.</p>
          </div>
          <button
            onClick={fetchPosts}
            className="group relative px-8 py-4 bg-gradient-to-r from-[#6C63FF] to-[#5B55E3] text-white rounded-2xl hover:shadow-xl hover:shadow-[#6C63FF]/25 transition-all duration-300 font-bold text-lg overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Refresh Feed</span>
            </span>
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F9FAFB] to-[#F3F4F6] pb-6 relative">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#6C63FF]/3 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5B55E3]/3 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB]/50 mb-6 shadow-sm">
        <div className="max-w-xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6C63FF] to-[#5B55E3] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#111827] to-[#6B7280] bg-clip-text text-transparent">Feed</h1>
                <p className="text-sm text-[#6B7280] font-medium">Discover what's happening</p>
              </div>
            </div>
            
            <button
              onClick={fetchPosts}
              disabled={loading}
              className="group relative p-3 text-[#6B7280] hover:text-[#6C63FF] bg-white/50 hover:bg-white/80 rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl border border-white/20"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Posts */}
      <div className="max-w-xl mx-auto px-4 space-y-6 relative z-10">
        {posts.map((post, index) => (
          <article
            key={post.id}
            className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl hover:shadow-[#6C63FF]/10 transition-all duration-500 hover:-translate-y-1"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-6 relative">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {post.profile_photo ? (
                    <img
                      src={post.profile_photo}
                      alt={`${post.username}'s profile`}
                      className="w-14 h-14 rounded-2xl object-cover shadow-xl border-3 border-white group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-14 h-14 bg-gradient-to-br from-[#6C63FF] to-[#5B55E3] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl border-3 border-white group-hover:scale-105 transition-transform duration-300"
                    style={{ display: post.profile_photo ? "none" : "flex" }}
                  >
                    {post.username ? post.username[0].toUpperCase() : "U"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[#111827] text-lg">
                    {post.username || "Unknown User"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-[#6B7280] font-medium">
                      {formatTimeAgo(post.created_at)}
                    </span>
                    <div className="w-1 h-1 bg-[#6B7280] rounded-full"></div>
                    <span className="text-xs text-[#6C63FF] font-bold bg-[#6C63FF]/10 px-2 py-1 rounded-full">
                      PUBLIC
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="p-2 text-[#6B7280] hover:text-[#6C63FF] hover:bg-[#6C63FF]/10 rounded-xl transition-all duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>

            {/* Enhanced Text */}
            {post.content && (
              <div className="px-6 pb-4">
                <p className="text-[#111827] whitespace-pre-wrap leading-relaxed text-base">
                  {post.content}
                </p>
              </div>
            )}

            {/* Enhanced Media */}
            <div className="px-6 pb-4">{renderMedia(post.attachments)}</div>

            {/* Enhanced Stats */}
            <div className="px-6 py-3 flex items-center justify-between text-sm text-[#6B7280] bg-[#F9FAFB]/50 border-t border-[#E5E7EB]/30">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs">❤️</span>
                    </div>
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs">👍</span>
                    </div>
                  </div>
                  <span className="font-medium">
                    {post.likes_count} {post.likes_count === 1 ? "like" : "likes"}
                  </span>
                </div>
                <span className="font-medium">
                  {post.comments_count}{" "}
                  {post.comments_count === 1 ? "comment" : "comments"}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#6C63FF] rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Live</span>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB]/30">
              <div className="flex items-center space-x-2 flex-1">
                <Like
                  postId={post.id}
                  initialCount={post.likes_count}
                  onCountChange={(newCount) =>
                    updatePostCounts(post.id, newCount, undefined)
                  }
                />
                <button
                  onClick={() =>
                    setOpenCommentsPostId(
                      openCommentsPostId === post.id ? null : post.id
                    )
                  }
                  className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 flex-1 justify-center font-medium ${
                    openCommentsPostId === post.id
                      ? "bg-[#6C63FF]/10 text-[#6C63FF] shadow-lg shadow-[#6C63FF]/20"
                      : "text-[#6B7280] hover:bg-[#6C63FF]/5 hover:text-[#6C63FF]"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${openCommentsPostId === post.id ? 'scale-110' : 'group-hover:scale-110'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>Comment</span>
                </button>
                <Share
                  imageUrl={post.attachments?.[0]?.url}
                  postId={post.id}
                  className="group flex items-center space-x-3 text-[#6B7280] hover:bg-[#6C63FF]/5 hover:text-[#6C63FF] px-6 py-3 rounded-2xl transition-all duration-300 flex-1 justify-center font-medium"
                />
              </div>
            </div>

            {/* Enhanced Comments */}
            {openCommentsPostId === post.id && (
              <div className="border-t border-[#E5E7EB]/30 bg-gradient-to-b from-[#F9FAFB]/50 to-white/50 backdrop-blur-sm">
                <div className="p-6">
                  <Comments
                    postId={post.id}
                    onCountChange={(newCount) =>
                      updatePostCounts(post.id, undefined, newCount)
                    }
                  />
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;