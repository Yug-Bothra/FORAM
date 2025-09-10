// src/components/PostsGrid.jsx
import React from "react";

const PostsGrid = ({ postList, openPostModal }) => {
  return postList.length > 0 ? (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {postList.map((post) => {
        const attachment = post.attachments?.[0];
        const isVideo =
          attachment?.type === "video" ||
          (attachment?.url &&
            (attachment.url.includes(".mp4") ||
              attachment.url.includes(".webm") ||
              attachment.url.includes(".mov") ||
              attachment.url.includes(".avi")));

        return (
          <div
            key={post.id}
            className="relative aspect-square bg-black cursor-pointer group"
            onClick={() => openPostModal(post)}
          >
            {attachment ? (
              isVideo ? (
                <video
                  src={attachment.url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={attachment.url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="flex items-center justify-center text-white text-sm p-2 text-center">
                {post.content}
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex space-x-6 text-white font-semibold text-sm">
                <div className="flex items-center space-x-1">
                  <span>❤</span>
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>💬</span>
                  <span>{post.comments_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Video Icon Overlay */}
            {isVideo && (
              <div className="absolute top-2 right-2 text-white text-lg opacity-80">
                🎥
              </div>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-16">
      <div className="text-4xl mb-4 opacity-60">📱</div>
      <p className="text-[#111827] text-lg font-semibold mb-2">No posts yet</p>
      <p className="text-[#6B7280] text-sm mb-4">
        Share your first post to get started!
      </p>
    </div>
  );
};

export default PostsGrid;
