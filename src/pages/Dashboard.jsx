// src/pages/Dashboard.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProfilePage from "./ProfilePage";
import Explore from "./Explore";
import Post from "./Post";
import HomePage from "./HomePage";
import UserProfile from "./UserProfile";
import EditProfile from "./EditProfile";
import Messages from "./Messages"; 
import OneVOne from "./messages/OneVOne";     // ✅ fixed
import Group from "./messages/Group";        // ✅ fixed
import Community from "./messages/Community"; // ✅ fixed

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-72 p-6 overflow-y-auto">
        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="home" replace />} />

          {/* Dashboard pages */}
          <Route path="home" element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="explore" element={<Explore />} />
          <Route path="post" element={<Post />} />

          {/* Messages pages */}
          <Route path="messages" element={<Messages />} />
          <Route path="messages/onevone" element={<OneVOne />} />
          <Route path="messages/group" element={<Group />} />
          <Route path="messages/community" element={<Community />} />

          {/* User profile */}
          <Route path="user/:username" element={<UserProfile />} />

          {/* Edit Profile */}
          <Route path="edit-profile" element={<EditProfile />} />

          {/* Catch-all */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
