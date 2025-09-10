// src/pages/message/Reply.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";
import { Reply as ReplyIcon, X } from "lucide-react";

export default function Reply({ message, onSent }) {
  const { user } = useUser();
  const [replyingTo, setReplyingTo] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Start replying to a specific message ---
  const handleReplyClick = (msg) => {
    setReplyingTo(msg);
  };

  // --- Cancel reply ---
  const handleCancel = () => {
    setReplyingTo(null);
    setText("");
  };

  // --- Send reply ---
  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: user.id,
            content: text,
            reply_to: replyingTo?.id || null, // store reference
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (onSent) onSent(data);

      // reset
      setText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Reply error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {replyingTo && (
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-t">
          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
            Replying to:{" "}
            <span className="font-medium">{replyingTo.content}</span>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyingTo ? "Write a reply..." : "Type a message"}
          className="flex-1 px-3 py-2 border rounded text-sm"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Send
        </button>
      </div>

      {/* Example reply action button for each message */}
      {message && (
        <button
          onClick={() => handleReplyClick(message)}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mt-2"
        >
          <ReplyIcon size={14} /> Reply
        </button>
      )}
    </div>
  );
}
