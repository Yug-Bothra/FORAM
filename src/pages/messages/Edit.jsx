// src/pages/message/Edit.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";
import { Pencil, Check, X } from "lucide-react";

export default function Edit({ message, onUpdated }) {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(message.content || "");
  const [loading, setLoading] = useState(false);

  // --- Save Edited Message ---
  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .update({
          content: text,
          edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", message.id)
        .select()
        .single();

      if (error) throw error;
      if (onUpdated) onUpdated(data);
      setIsEditing(false);
    } catch (err) {
      console.error("Edit error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (message.sender_id !== user.id) return null; // Only sender can edit

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="p-1 text-green-600 hover:text-green-800"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setText(message.content || "");
              setIsEditing(false);
            }}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}
