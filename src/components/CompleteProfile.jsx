// src/components/CompleteProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../supabaseClient";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CompleteProfile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Check if profile already exists
  useEffect(() => {
    const checkProfile = async () => {
      if (!isLoaded || !user) return;

      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("forum_users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Supabase error:", error);
        }

        if (data) {
          // ✅ Profile already exists → Dashboard
          navigate("/dashboard", { replace: true });
        } else {
          // No profile yet → show form
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, isLoaded, navigate]);

  // 🔹 Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const email = user?.primaryEmailAddress?.emailAddress;
    const userId = user.id; // 👈 Get Clerk user ID

    if (!email || !userId) {
      console.error("Missing email or user ID");
      return;
    }

    try {
      const { error } = await supabase.from("forum_users").insert([
        {
          id: userId, // 👈 Add the user ID from Clerk
          email,
          username,
          description: bio || null,
          profile_photo: profilePhoto || null,
        },
      ]);

      if (error) throw error;

      // ✅ After creating profile → Dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error creating profile:", err);
    }
  };

  // 🔹 Upload image to Cloudinary
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
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

      if (data.secure_url) {
        setProfilePhoto(data.secure_url);
      } else {
        console.error("Cloudinary upload failed:", data);
      }
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
          Complete Your Profile
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
            required
            minLength={3}
            maxLength={20}
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
            maxLength={200}
            className="w-full border border-[#E5E7EB] rounded-lg p-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
            placeholder="Tell us a little about yourself..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#6C63FF] hover:bg-[#5B55E3] text-white font-semibold py-2 px-4 rounded-lg transition-all"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;