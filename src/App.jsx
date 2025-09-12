import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from "./components/Profile";
import { SettingsProvider } from "./components/Settings"; // Import Provider

export default function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/*" element={<Profile />} />
      </Routes>
    </SettingsProvider>
  );
}
