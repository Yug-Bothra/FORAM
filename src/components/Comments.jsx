// src/components/Comments.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "@clerk/clerk-react";

const Comments = ({ postId }) => {
  const { user } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [likedComments, setLikedComments] = useState([]);

  // Fetch comments with user info
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, forum_users(username)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) console.error("Error fetching comments:", error);
      else setComments(data || []);
    };
    fetchComments();
  }, [postId]);

  // Add comment
  const addComment = async () => {
    if (!user) return alert("Login required to comment!");
    if (!newComment.trim()) return;

    const { data: inserted, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: postId,
          user_id: user.id, // Clerk user_id matches forum_users.id
          content: newComment.trim(),
        },
      ])
      .select("*, forum_users(username)");

    if (error) {
      console.error("Error adding comment:", error);
    } else {
      // increment post.comments_count
      await supabase.rpc("increment_post_comments", { postid: postId });
      setComments([...comments, inserted[0]]);
      setNewComment("");
    }
  };

  // Delete comment
  const deleteComment = async (id, commentUserId) => {
    if (user.id !== commentUserId)
      return alert("You can only delete your own comment!");

    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) console.error("Error deleting comment:", error);
    else {
      setComments(comments.filter((c) => c.id !== id));
      // decrement post.comments_count
      await supabase.rpc("decrement_post_comments", { postid: postId });
    }
  };

  // Toggle like (simple counter in comments table)
  const toggleLikeComment = async (id, currentLikes) => {
    if (!user) return alert("Login required to like!");

    const isLiked = likedComments.includes(id);
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

    const { error } = await supabase
      .from("comments")
      .update({ likes_count: newLikes })
      .eq("id", id);

    if (error) console.error("Error updating like:", error);
    else {
      setComments(
        comments.map((c) =>
          c.id === id ? { ...c, likes_count: newLikes } : c
        )
      );
      setLikedComments((prev) =>
        isLiked ? prev.filter((cid) => cid !== id) : [...prev, id]
      );
    }
  };

  // Start editing
  const startEdit = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Save edit
  const saveEdit = async (id) => {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from("comments")
      .update({ content: editContent, updated_at: new Date() })
      .eq("id", id);

    if (error) console.error("Error editing comment:", error);
    else {
      setComments(
        comments.map((c) => (c.id === id ? { ...c, content: editContent } : c))
      );
      setEditingComment(null);
      setEditContent("");
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="bg-[#F9FAFB] text-[#111827] rounded-lg border border-[#E5E7EB]">
      {/* Comments List */}
      <div className="space-y-0 max-h-96 overflow-y-auto">
        {comments.map((c) => (
          <div
            key={c.id}
            className="flex items-start space-x-3 px-4 py-3 hover:bg-[#F3F4F6]"
          >
            {/* Profile Initial */}
            <div className="w-8 h-8 bg-[#6C63FF] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 mt-1">
              {c.forum_users?.username
                ? c.forum_users.username[0].toUpperCase()
                : "U"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editingComment === c.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] px-3 py-2 rounded text-sm text-[#111827] placeholder-[#6B7280] focus:border-[#6C63FF] focus:outline-none"
                    placeholder="Edit your comment..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveEdit(c.id)}
                      className="px-3 py-1 rounded bg-[#6C63FF] hover:bg-[#5B55E3] text-white text-xs font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-[#111827] text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-[#111827]">
                      {c.forum_users?.username || "Unknown"}
                    </span>
                    <span className="text-[#6B7280] text-xs">
                      {formatTimeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#111827] leading-relaxed break-words">
                    {c.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center space-x-4 mt-2">
                    <button
                      onClick={() => toggleLikeComment(c.id, c.likes_count)}
                      className={`text-xs flex items-center space-x-1 ${
                        likedComments.includes(c.id)
                          ? "text-[#FF6584]"
                          : "text-[#6B7280] hover:text-[#FF6584]"
                      }`}
                    >
                      <span className="text-sm">♥</span>
                      {c.likes_count > 0 && <span>{c.likes_count}</span>}
                    </button>

                    <button className="text-xs text-[#6B7280] hover:text-[#111827]">
                      Reply
                    </button>

                    {user?.id === c.user_id && (
                      <>
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs text-[#6B7280] hover:text-[#6C63FF]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteComment(c.id, c.user_id)}
                          className="text-xs text-[#6B7280] hover:text-[#FF6584]"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment */}
      {user && (
        <div className="border-t border-[#E5E7EB] px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#6C63FF] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.fullName ? user.fullName[0].toUpperCase() : "U"}
            </div>
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addComment()}
                className="flex-1 bg-transparent text-sm text-[#111827] placeholder-[#6B7280] border-none outline-none"
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className={`text-sm font-semibold ${
                  newComment.trim()
                    ? "text-[#6C63FF] hover:text-[#5B55E3] cursor-pointer"
                    : "text-[#6C63FF]/50 cursor-not-allowed"
                }`}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
