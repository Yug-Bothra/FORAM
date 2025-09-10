// src/pages/Messages.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import OneVOne from "./messages/OneVOne"; // One-to-one chat component

const Messages = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="flex-1 p-4">
        <Routes>
          {/* Default redirect: /dashboard/messages -> /dashboard/messages/onevone */}
          <Route index element={<Navigate to="onevone" replace />} />

          {/* One-to-One Chat */}
          <Route path="onevone" element={<OneVOne />} />

          {/* Future routes (group/community) */}
          {/* <Route path="group" element={<GroupChat />} /> */}
          {/* <Route path="community" element={<CommunityChat />} /> */}

          {/* Fallback */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a messaging option
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default Messages;
