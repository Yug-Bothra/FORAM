// src/components/ProfileHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ProfileHeader = ({ 
  profile, 
  posts, 
  followersCount, 
  followingCount, 
  setOpenFollowModal 
}) => {
  const navigate = useNavigate();

  // Render bio with proper line breaks
  const renderBio = (text) => {
    return text.split("\n").map((line, idx) => (
      <p key={idx} className="text-[#111827] text-sm leading-relaxed">
        {line}
      </p>
    ));
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-[#E5E7EB] relative">
      <div className="flex flex-col xl:flex-row xl:items-center xl:space-x-12">
        
        {/* Profile Image */}
        <div className="flex justify-center xl:justify-start mb-6 xl:mb-0">
          <div className="relative">
            {profile.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt="Profile"
                className="w-32 h-32 xl:w-36 xl:h-36 rounded-full object-cover border border-[#E5E7EB] shadow-sm hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-32 h-32 xl:w-36 xl:h-36 rounded-full flex items-center justify-center border border-[#E5E7EB] bg-[#6C63FF] text-white text-3xl font-bold hover:scale-105 transition-transform duration-300">
                {profile.username ? profile.username.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center xl:text-left">
          <div className="flex flex-col xl:flex-row xl:items-center xl:space-x-6 mb-6">
            <h1 className="text-2xl xl:text-3xl font-bold text-[#111827] mb-3 xl:mb-0">
              {profile.username || "No Username"}
            </h1>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/dashboard/edit-profile")}
                className="bg-[#6C63FF] hover:bg-[#5B55E3] text-white font-medium px-6 py-2 rounded-lg transition-all duration-300"
              >
                Edit Profile
              </button>
              <button
                className="border border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF]/10 font-medium px-6 py-2 rounded-lg transition-all duration-300"
              >
                Share Profile
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center xl:justify-start space-x-12 mb-6">
            <div 
              className="text-center cursor-pointer hover:opacity-80"
              onClick={() => setOpenFollowModal("posts")}
            >
              <div className="text-xl font-bold text-[#111827]">
                {posts.public.length + posts.private.length}
              </div>
              <div className="text-[#6B7280] text-sm">Posts</div>
            </div>
            <div 
              className="text-center cursor-pointer hover:opacity-80"
              onClick={() => setOpenFollowModal("followers")}
            >
              <div className="text-xl font-bold text-[#111827]">
                {followersCount}
              </div>
              <div className="text-[#6B7280] text-sm">Followers</div>
            </div>
            <div 
              className="text-center cursor-pointer hover:opacity-80"
              onClick={() => setOpenFollowModal("following")}
            >
              <div className="text-xl font-bold text-[#111827]">
                {followingCount}
              </div>
              <div className="text-[#6B7280] text-sm">Following</div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB] text-left max-w-lg mx-auto xl:mx-0">
            {profile.full_name && (
              <p className="font-semibold text-[#111827] mb-2">{profile.full_name}</p>
            )}
            {renderBio(
              profile.description ||
              `✨ Living life to the fullest 🌟\n📍 Exploring the world\n💡 Sharing moments that matter`
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
