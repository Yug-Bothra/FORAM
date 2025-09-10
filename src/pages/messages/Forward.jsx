// src/components/Forward.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";

const colors = {
  primary: "#6C63FF",
  accent: "#FF6584",
  bg: "#F9FAFB",
  textDark: "#111827",
  textLight: "#6B7280",
};

export default function Forward({ message, onClose, onForwarded }) {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async () => {
      try {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (!parts?.length) return setConversations([]);

        const convoIds = parts.map((p) => p.conversation_id);
        const convos = await Promise.all(
          convoIds.map(async (cid) => {
            const { data: conv } = await supabase.from("conversations").select("*").eq("id", cid).single();
            const { data: participants } = await supabase
              .from("conversation_participants")
              .select("user_id, forum_users(id, username, profile_photo)")
              .eq("conversation_id", cid);

            const otherUser = participants.find((p) => p.user_id !== user.id)?.forum_users || null;
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", cid)
              .order("created_at", { ascending: false })
              .limit(1);

            return { ...conv, otherUser, lastMessage: lastMsg?.[0] || null };
          })
        );

        setConversations(convos);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversations();
  }, [user]);

  const filtered = conversations.filter((c) =>
    c.otherUser?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const forwardMessage = async (convId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([{
          conversation_id: convId,
          sender_id: user.id,
          content: message.content,
          attachments: message.attachments || null,
          reply_to: null,
          forwarded_from: message.id,
        }])
        .select()
        .single();

      if (error) throw error;
      if (onForwarded) onForwarded(data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose} // click outside closes modal
    >
      <div
        className="bg-white rounded max-w-lg w-full p-4"
        onClick={(e) => e.stopPropagation()} // prevent modal click from closing
        style={{ background: colors.bg }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold" style={{ color: colors.textDark }}>Forward message</h3>
          <button onClick={onClose} className="text-sm" style={{ color: colors.textLight }}>Close</button>
        </div>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations..."
          className="w-full border p-2 rounded mb-2"
          style={{ borderColor: colors.border }}
        />

        <div className="max-h-64 overflow-y-auto space-y-2">
          {filtered.length ? filtered.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <img
                  src={c.otherUser?.profile_photo || "https://via.placeholder.com/40"}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-semibold" style={{ color: colors.textDark }}>
                    {c.otherUser?.username || "Conversation"}
                  </div>
                  <div className="text-xs" style={{ color: colors.textLight }}>
                    {c.lastMessage?.content?.slice(0, 40) || "No messages"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => forwardMessage(c.id)}
                className="px-3 py-1 rounded"
                style={{ background: colors.primary, color: "white" }}
              >
                Forward
              </button>
            </div>
          )) : <div className="text-sm" style={{ color: colors.textLight }}>No conversations found</div>}
        </div>
      </div>
    </div>
  );
}
