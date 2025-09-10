// src/components/Share.jsx
import React from "react";

const Share = ({ imageUrl, postId }) => {
  const sharePost = async () => {
    const postLink = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check this post!",
          text: "Found this post interesting, take a look:",
          url: imageUrl || postLink, // if image, share image URL else fallback
        });
        console.log("Post shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl || postLink);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <button
      onClick={sharePost}
      className="flex items-center space-x-1 text-[#6B7280] hover:text-[#6C63FF]"
    >
      <span className="text-xl">📤</span>
    </button>
  );
};

export default Share;
