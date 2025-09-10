// src/pages/message/Copy.jsx
import { useState } from "react";
import { Copy as CopyIcon, Check } from "lucide-react";

export default function Copy({ msg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // reset after 1.5s
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      title="Copy"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <CopyIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
}
