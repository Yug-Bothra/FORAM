// src/pages/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../supabaseClient";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const EditProfile = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("forum_users")
          .select("username, description, profile_photo")
          .eq("email", user.primaryEmailAddress.emailAddress)
          .single();

        if (error) throw error;

        if (data) {
          setUsername(data.username || "");
          setBio(data.description || "");
          setProfilePhoto(data.profile_photo || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // 🔹 Handle form submit (update existing record)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("forum_users")
        .update({
          username,
          description: bio,
          profile_photo: profilePhoto,
        })
        .eq("email", user.primaryEmailAddress.emailAddress);

      if (error) throw error;

      // ✅ After updating profile → back to ProfilePage
      navigate("/dashboard/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  // 🔹 Upload image to Cloudinary
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await response.json();
      setProfilePhoto(data.secure_url);
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <p className="text-[#6B7280] text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-[#111827] mb-6">
          Edit Profile
        </h1>

        {/* Profile Photo */}
        <div className="mb-4">
          <label className="block text-[#6B7280] mb-2">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full text-sm text-[#6B7280]"
          />
          {profilePhoto && (
            <img
              src={profilePhoto}
              alt="Profile Preview"
              className="mt-4 w-24 h-24 rounded-full object-cover border"
            />
          )}
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-[#6B7280] mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded-lg p-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label className="block text-[#6B7280] mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows="3"
            className="w-full border border-[#E5E7EB] rounded-lg p-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#6C63FF] hover:bg-[#5B55E3] text-white font-semibold py-2 px-4 rounded-lg transition-all"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
