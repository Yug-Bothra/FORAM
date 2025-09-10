// src/pages/Explore.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setResults([]);

    const { data, error } = await supabase
      .from("forum_users")
      .select("username, email, description, profile_photo")
      .ilike("username", `%${search.trim()}%`);

    if (error) {
      console.error("Search error:", error);
      setErrorMsg("Something went wrong. Try again.");
    } else if (!data || data.length === 0) {
      setErrorMsg("No users found.");
    } else {
      setResults(data);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex justify-center">
      <div className="bg-white rounded-2xl shadow-md max-w-2xl w-full border border-[#E5E7EB]">
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="sticky top-0 flex border-b border-[#E5E7EB] p-3 bg-white z-10"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
          />
          <button
            type="submit"
            className="ml-2 bg-[#6C63FF] text-white px-5 rounded-lg hover:bg-[#5B55E3] transition"
          >
            Search
          </button>
        </form>

        {/* Loading / Error */}
        {loading && (
          <p className="text-center py-4 text-[#6C63FF] font-medium animate-pulse">
            Searching...
          </p>
        )}
        {errorMsg && (
          <p className="text-center py-4 text-[#FF6584] font-medium">
            {errorMsg}
          </p>
        )}

        {/* Results List */}
        <div className="divide-y divide-[#E5E7EB]">
          {results.map((user, i) => (
            <div
              key={i}
              className="flex items-center p-4 hover:bg-[#F9FAFB] transition cursor-pointer"
              onClick={() => navigate(`/dashboard/user/${user.username}`)} // ✅ fixed route
            >
              <img
                src={user.profile_photo || "https://via.placeholder.com/100"}
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] mr-4"
              />
              <div>
                <p className="font-semibold text-[#111827]">{user.username}</p>
                <p className="text-sm text-[#6B7280] truncate max-w-xs">
                  {user.description || "No bio provided"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
