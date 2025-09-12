import React from "react";
import { Routes, Route } from "react-router-dom";
import EnrollmentAuth from "./EnrollmentAuth";
import ClerkLogin from "./ClerkLogin";
import CompleteProfile from "./CompleteProfile";
import Dashboard from "../pages/Dashboard";
import { useContext } from "react";
import { SettingsContext } from "./Settings";  // Import context

export default function Profile() {
  const { theme } = useContext(SettingsContext);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Routes>
        <Route path="/" element={<EnrollmentAuth />} />
        <Route path="/clerk-login/*" element={<ClerkLogin />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Routes>
    </div>
  );
}
