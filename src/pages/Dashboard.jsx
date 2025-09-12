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
import OneVOne from "./messages/OneVOne";
import Group from "./messages/Group";
import Community from "./messages/Community";
import SettingsPage from "../components/Settings";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 ml-72 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="explore" element={<Explore />} />
          <Route path="post" element={<Post />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/onevone" element={<OneVOne />} />
          <Route path="messages/group" element={<Group />} />
          <Route path="messages/community" element={<Community />} />
          <Route path="user/:username" element={<UserProfile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
