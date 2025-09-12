// src/pages/messages/Messages.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "@clerk/clerk-react";
import OneVOne from "./messages/OneVOne";
import Group from "./messages/Group";
import Community from "./messages/Community";

export default function Messages() {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchConversations();

    // subscribe to realtime changes in conversations
    const convSub = supabase
      .channel("public:conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convSub);
    };
  }, [user]);

  async function fetchConversations() {
    setLoading(true);

    const { data, error } = await supabase
      .from("conversation_participants")
      .select(
        `
        conversation:conversations (
          id, type, name, description, created_by, created_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("conversation.created_at", { ascending: false });

    if (error) {
      console.error("fetchConversations", error);
      setLoading(false);
      return;
    }

    const convs = (data || []).map((r) => r.conversation);
    setConversations(convs);

    // set first conversation as active if none selected
    if (!activeConv && convs.length) {
      setActiveConv(convs[0]);
    }

    setLoading(false);
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 p-3 flex flex-col">
        <h2 className="text-lg font-bold mb-3">Conversations</h2>

        <button
          className="w-full mb-3 p-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium"
          onClick={fetchConversations}
        >
          Refresh
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-slate-500">No conversations yet</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`p-2 rounded cursor-pointer transition ${
                  activeConv?.id === c.id
                    ? "bg-slate-100 font-medium"
                    : "hover:bg-slate-50"
                }`}
                onClick={() => setActiveConv(c)}
              >
                <div className="truncate">
                  {c.name || (c.type === "dm" ? "Direct Message" : c.type)}
                </div>
                {c.description && (
                  <div className="text-xs text-slate-500 truncate">
                    {c.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat content */}
      <main className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="p-6 text-slate-500">Select a conversation</div>
        ) : activeConv.type === "dm" ? (
          <OneVOne conversation={activeConv} />
        ) : activeConv.type === "group" ? (
          <Group conversation={activeConv} />
        ) : (
          <Community conversation={activeConv} />
        )}
      </main>
    </div>
  );
}
