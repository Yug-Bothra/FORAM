// src/pages/messages/Community.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";

const Community = () => {
  const { user } = useUser();
  const [communities, setCommunities] = useState([]);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, name, description")
        .eq("type", "community");

      if (error) console.error(error);
      else setCommunities(data);
    };
    fetchCommunities();
  }, []);

  // Fetch community messages
  useEffect(() => {
    if (!activeCommunity) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", activeCommunity.id)
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else setMessages(data);
    };
    fetchMessages();
  }, [activeCommunity]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeCommunity) return;
    await supabase.from("messages").insert([
      { conversation_id: activeCommunity.id, sender_id: user.id, content: newMessage },
    ]);
    setNewMessage("");
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", activeCommunity.id)
      .order("created_at", { ascending: true });
    setMessages(data);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-1/3 bg-white border-r p-4">
        <h2 className="font-bold mb-2">Communities</h2>
        {communities.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCommunity(c)}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded"
          >
            {c.name || "Unnamed Community"}
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {activeCommunity ? (
          <>
            <div className="border-b p-4 font-semibold">
              {activeCommunity.name}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 mb-2 rounded ${
                    m.sender_id === user.id
                      ? "bg-green-500 text-white ml-auto"
                      : "bg-gray-200 mr-auto"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>
            <div className="p-4 flex">
              <input
                type="text"
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <button
                onClick={sendMessage}
                className="ml-2 px-4 bg-green-500 text-white rounded"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a community to join discussion
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
