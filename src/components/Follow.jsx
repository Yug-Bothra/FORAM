// src/components/Follow.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "@clerk/clerk-react";

const Follow = ({ type, onClose, ...otherProps }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingState, setFollowingState] = useState({});

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      setLoading(true);

      // 1. Get current forum_user id
      const { data: currentUser } = await supabase
        .from("forum_users")
        .select("id")
        .eq("email", user.primaryEmailAddress.emailAddress)
        .single();

      if (!currentUser) return;

      let query;
      if (type === "followers") {
        // followers of current user
        query = supabase
          .from("follows")
          .select(`
            follower_id,
            follower:forum_users!follows_follower_id_fkey (
              id,
              username,
              profile_photo
            )
          `)
          .eq("following_id", currentUser.id);
      } else {
        // following by current user
        query = supabase
          .from("follows")
          .select(`
            following_id,
            following:forum_users!follows_following_id_fkey (
              id,
              username,
              profile_photo
            )
          `)
          .eq("follower_id", currentUser.id);
      }

      const { data, error } = await query;
      if (error) return console.error(error);

      // map users based on type
      const mappedUsers = data.map((item) => {
        if (type === "followers") {
          const u = item.follower;
          return { id: u.id, username: u.username, profile_photo: u.profile_photo };
        } else {
          const u = item.following;
          return { id: u.id, username: u.username, profile_photo: u.profile_photo };
        }
      });

      // Fetch who the current user is following (for button state)
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUser.id);

      const followingIds = followingData?.map((f) => f.following_id) || [];
      const followState = {};
      mappedUsers.forEach((u) => {
        followState[u.id] = followingIds.includes(u.id);
      });

      setFollowingState(followState);
      setUsers(mappedUsers);
      setLoading(false);
    };

    fetchUsers();
  }, [user, type]);

  // ✅ Navigate to user profile
  const navigateToProfile = (username) => {
    onClose(); // Close modal first
    navigate(`/dashboard/user/${username}`); // Match UserProfile route
  };

  const toggleFollow = async (uId) => {
    if (!user) return;

    // Get current user's forum_user id first
    const { data: currentUser } = await supabase
      .from("forum_users")
      .select("id")
      .eq("email", user.primaryEmailAddress.emailAddress)
      .single();

    if (!currentUser) return;

    const isFollowing = followingState[uId];
    const { error } = isFollowing
      ? await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", uId)
      : await supabase
          .from("follows")
          .insert([{ follower_id: currentUser.id, following_id: uId }]);

    if (!error) {
      setFollowingState((prev) => ({ ...prev, [uId]: !isFollowing }));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-[#111827] capitalize">{type}</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827] text-xl">
            ×
          </button>
        </div>

        {/* Users List */}
        <div className="p-4">
          {loading ? (
            <p className="text-center text-[#6B7280]">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-[#6B7280]">No {type} found</p>
          ) : (
            <ul className="space-y-4">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100"
                >
                  {/* User Info - Clickable to navigate to profile */}
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => navigateToProfile(u.username)}
                  >
                    {u.profile_photo ? (
                      <img
                        src={u.profile_photo}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#6C63FF] text-white flex items-center justify-center font-semibold">
                        {u.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="font-medium text-[#111827] hover:text-[#6C63FF] transition-colors">
                        {u.username}
                      </span>
                    </div>
                  </div>

                  {/* Follow Button - Only show if not current user */}
                  {user && u.id !== user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the profile navigation
                        toggleFollow(u.id);
                      }}
                      className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                        followingState[u.id]
                          ? "bg-gray-200 text-black hover:bg-gray-300"
                          : "bg-[#6C63FF] text-white hover:bg-[#5B55E3]"
                      }`}
                    >
                      {followingState[u.id] ? "Following" : "Follow"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Follow;
