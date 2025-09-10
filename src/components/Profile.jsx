import React from "react";
import { Routes, Route } from "react-router-dom";
import EnrollmentAuth from "./EnrollmentAuth";
import ClerkLogin from "./ClerkLogin";
import CompleteProfile from "./CompleteProfile";
import Dashboard from "../pages/Dashboard";


export default function Profile() {
  return (
    <Routes>
      {/* Step 1: Enrollment check */}
      <Route path="/" element={<EnrollmentAuth />} />

      {/* Step 2: Clerk login/signup */}
      <Route path="/clerk-login/*" element={<ClerkLogin />} />

      {/* Step 3: Complete profile after signup */}
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Step 4: Show dashboard after login */}
      <Route path="/dashboard/*" element={<Dashboard />} />

    </Routes>
  );
}
