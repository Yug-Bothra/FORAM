// src/pages/messages/Group.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";

const Group = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch groups user belongs to
  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations(name)")
        .eq("user_id", user.id);

      if (error) console.error(error);
      else {
        setGroups(data.map((g) => ({ id: g.conversation_id, name: g.conversations.name })));
      }
    };
    fetchGroups();
  }, [user]);

  // Fetch group messages
  useEffect(() => {
    if (!activeGroup) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", activeGroup.id)
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else setMessages(data);
    };
    fetchMessages();
  }, [activeGroup]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeGroup) return;
    await supabase.from("messages").insert([
      { conversation_id: activeGroup.id, sender_id: user.id, content: newMessage },
    ]);
    setNewMessage("");
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", activeGroup.id)
      .order("created_at", { ascending: true });
    setMessages(data);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-1/3 bg-white border-r p-4">
        <h2 className="font-bold mb-2">Your Groups</h2>
        {groups.map((g) => (
          <div
            key={g.id}
            onClick={() => setActiveGroup(g)}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded"
          >
            {g.name || "Unnamed Group"}
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {activeGroup ? (
          <>
            <div className="border-b p-4 font-semibold">{activeGroup.name}</div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 mb-2 rounded ${
                    m.sender_id === user.id
                      ? "bg-blue-500 text-white ml-auto"
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
                className="ml-2 px-4 bg-blue-500 text-white rounded"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a group to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Group;
