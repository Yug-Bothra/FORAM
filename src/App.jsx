import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from "./components/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<Profile />} />
    </Routes>
  );
}
