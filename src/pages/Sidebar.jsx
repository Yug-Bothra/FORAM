import React, { useState } from "react";
import {
  Home,
  Search,
  User,
  Settings,
  LogOut,
  GraduationCap,
  MessageCircle,
  PlusCircle,
  Users,
  Globe,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerk, SignedIn } from "@clerk/clerk-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  const [showMessages, setShowMessages] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const buttonBase =
    "group flex items-center space-x-3 p-3 rounded-xl w-full text-left transition-all duration-200";
  const activeStyle = "bg-purple-100 text-purple-600 font-semibold shadow-md dark:bg-purple-900/50 dark:text-purple-400";
  const inactiveStyle =
    "text-gray-700 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-300 dark:hover:text-purple-400 dark:hover:bg-purple-900/20";

  return (
    <aside
      className="
        fixed top-0 left-0 
        h-screen w-72 
        bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
        border-r border-gray-200 dark:border-gray-700
        flex flex-col 
        shadow-lg
        z-50
      "
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            FORAM
          </h1>
        </div>
        <p className="text-sm text-gray-500 font-medium dark:text-gray-300">
          College Community Hub
        </p>
      </div>

      {/* Navigation Links */}
      <SignedIn>
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button
            onClick={() => navigate("/dashboard/home")}
            className={`${buttonBase} ${
              isActive("/dashboard/home") ? activeStyle : inactiveStyle
            }`}
          >
            <Home size={20} />
            <span className="font-semibold">Home</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/explore")}
            className={`${buttonBase} ${
              isActive("/dashboard/explore") ? activeStyle : inactiveStyle
            }`}
          >
            <Search size={20} />
            <span className="font-semibold">Explore</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/post")}
            className={`${buttonBase} ${
              isActive("/dashboard/post") ? activeStyle : inactiveStyle
            }`}
          >
            <PlusCircle size={20} />
            <span className="font-semibold">Post</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/profile")}
            className={`${buttonBase} ${
              isActive("/dashboard/profile") ? activeStyle : inactiveStyle
            }`}
          >
            <User size={20} />
            <span className="font-semibold">Profile</span>
          </button>

          {/* Settings Link */}
          <button
            onClick={() => navigate("/dashboard/settings")}
            className={`${buttonBase} ${
              isActive("/dashboard/settings") ? activeStyle : inactiveStyle
            }`}
          >
            <Settings size={20} />
            <span className="font-semibold">Settings</span>
          </button>

          {/* Messages Collapsible */}
          <div>
            <button
              onClick={() => setShowMessages(!showMessages)}
              className={`${buttonBase} ${
                isActive("/dashboard/messages") ? activeStyle : inactiveStyle
              }`}
            >
              <MessageCircle size={20} />
              <span className="font-semibold">Messages</span>
            </button>

            {showMessages && (
              <div className="ml-8 mt-1 space-y-1">
                <button
                  onClick={() => navigate("/dashboard/messages/onevone")}
                  className={`${buttonBase} ${
                    isActive("/dashboard/messages/onevone")
                      ? activeStyle
                      : inactiveStyle
                  }`}
                >
                  <MessageCircle size={18} />
                  <span>One-to-One</span>
                </button>

                <button
                  onClick={() => navigate("/dashboard/messages/group")}
                  className={`${buttonBase} ${
                    isActive("/dashboard/messages/group")
                      ? activeStyle
                      : inactiveStyle
                  }`}
                >
                  <Users size={18} />
                  <span>Group</span>
                </button>

                <button
                  onClick={() => navigate("/dashboard/messages/community")}
                  className={`${buttonBase} ${
                    isActive("/dashboard/messages/community")
                      ? activeStyle
                      : inactiveStyle
                  }`}
                >
                  <Globe size={18} />
                  <span>Community</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={() => signOut(() => navigate("/clerk-login"))}
            className="group flex items-center space-x-3 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:bg-red-900/30 p-3 rounded-xl w-full text-left transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-semibold">Sign Out</span>
          </button>
        </div>
      </SignedIn>
    </aside>
  );
};

export default Sidebar;
