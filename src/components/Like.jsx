// src/components/Like.jsx
import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../supabaseClient";

const Like = ({ postId, commentId = null }) => {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const userId = user?.id;

  // Fetch likes count + user like status
  useEffect(() => {
    const fetchLikes = async () => {
      if (!postId && !commentId) return;

      // total count
      const { count, error: countError } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq(postId ? "post_id" : "comment_id", postId || commentId);

      if (!countError) setLikeCount(count || 0);

      // check if this user liked
      if (userId) {
        const { data, error } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", userId)
          .eq(postId ? "post_id" : "comment_id", postId || commentId)
          .maybeSingle();

        if (!error && data) setLiked(true);
      }
    };

    fetchLikes();
  }, [postId, commentId, userId]);

  // Toggle like/unlike
  const toggleLike = async () => {
    if (!userId) return alert("You must be logged in to like!");

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq(postId ? "post_id" : "comment_id", postId || commentId);

      if (!error) {
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase.from("likes").insert([
        {
          user_id: userId,
          post_id: postId || null,
          comment_id: commentId || null,
        },
      ]);

      if (!error) {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    }
  };

  return (
    <button
      onClick={toggleLike}
      className={`flex items-center gap-2 px-3 py-1 rounded-2xl shadow ${
        liked ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
      }`}
    >
      <Heart className={`w-5 h-5 ${liked ? "fill-red-600" : "fill-none"}`} />
      <span>{likeCount}</span>
    </button>
  );
};

export default Like;
