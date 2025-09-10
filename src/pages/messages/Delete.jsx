// src/pages/message/Delete.jsx
import { supabase } from "../../supabaseClient";
import { Trash2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";

export default function Delete({ message, onUpdated }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // --- Delete for Me ---
  const handleDeleteForMe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .update({
          deleted_for: supabase.fn.array_append("deleted_for", user.id),
        })
        .eq("id", message.id)
        .select()
        .single();

      if (error) throw error;
      if (onUpdated) onUpdated(data); // pass updated msg to parent state
    } catch (err) {
      console.error("Delete-for-me error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Delete for Everyone (only sender can do this) ---
  const handleDeleteForEveryone = async () => {
    if (!confirm("Delete this message for everyone?")) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .update({ is_deleted: true })
        .eq("id", message.id)
        .select()
        .single();

      if (error) throw error;
      if (onUpdated) onUpdated(data);
    } catch (err) {
      console.error("Delete-for-everyone error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 shadow-md rounded p-2 text-xs">
      {/* Delete for Me */}
      <button
        onClick={handleDeleteForMe}
        disabled={loading}
        className="px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
      >
        Delete for Me
      </button>

      {/* Delete for Everyone (only if I sent it) */}
      {message.sender_id === user.id && (
        <button
          onClick={handleDeleteForEveryone}
          disabled={loading}
          className="px-2 py-1 text-left hover:bg-red-100 dark:hover:bg-red-800 text-red-600 rounded"
        >
          Delete for Everyone
        </button>
      )}
    </div>
  );
}
