import React, { createContext, useContext, useEffect, useState } from "react";

// ✅ Context to store settings globally
export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "system";
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem("app-fontSize") || "medium";
  });

  useEffect(() => {
    const appliedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    document.body.dataset.theme = appliedTheme;

    document.body.style.fontSize =
      fontSize === "small"
        ? "14px"
        : fontSize === "large"
        ? "18px"
        : "16px";

    localStorage.setItem("app-theme", theme);
    localStorage.setItem("app-fontSize", fontSize);
  }, [theme, fontSize]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
};

// ✅ Settings UI Component
const Settings = () => {
  const { theme, setTheme, fontSize, setFontSize } = useContext(SettingsContext);

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded mt-10 dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-purple-600 mb-6">Appearance Settings</h2>

      {/* Theme Selector */}
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Theme
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded bg-white text-black dark:bg-gray-700 dark:text-white"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System Default</option>
        </select>
      </div>

      {/* Font Size Selector */}
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Font Size
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded bg-white text-black dark:bg-gray-700 dark:text-white"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );
};

// ✅ Final Exported Component
export default function SettingsPage() {
  return (
    <SettingsProvider>
      <Settings />
    </SettingsProvider>
  );
}
