// src/pages/messages/OneVOne.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";
import MessageStatus from "./MessageStatus";
import Edit from "./Edit";
import Delete from "./Delete";
import Copy from "./Copy";
import Forward from "./Forward";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const colors = {
  primary: "#6C63FF",
  accent: "#FF6584",
  bg: "#F9FAFB",
  textDark: "#111827",
  textLight: "#6B7280",
  border: "#E5E7EB",
  sentMessage: "#6C63FF",
  receivedMessage: "#FFFFFF",
  messageHover: "#F0F0F0",
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDateHeader = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
};

export default function OneVOne() {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [forwardModal, setForwardModal] = useState({ open: false, message: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const scrollRef = useRef();

  const scrollToBottom = () =>
    scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight);

  // ---------- delete conversation ----------
  const deleteConversation = async (conversationId) => {
    try {
      // Delete all messages in the conversation
      await supabase.from("messages").delete().eq("conversation_id", conversationId);
      
      // Delete conversation participants
      await supabase.from("conversation_participants").delete().eq("conversation_id", conversationId);
      
      // Delete the conversation
      await supabase.from("conversations").delete().eq("id", conversationId);
      
      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If this was the active chat, clear it
      if (activeChat?.id === conversationId) {
        setActiveChat(null);
        setMessages([]);
      }
      
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  // ---------- fetch conversations ----------
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

        convos.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_at || 0) -
            new Date(a.lastMessage?.created_at || 0)
        );
        setConversations(convos);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, [user, messages]);

  // ---------- search users ----------
  useEffect(() => {
    if (!searchTerm.trim()) return setSearchResults([]);
    const doSearch = async () => {
      const { data, error } = await supabase
        .from("forum_users")
        .select("id, username, profile_photo")
        .ilike("username", `%${searchTerm}%`)
        .limit(10);
      if (error) console.error(error);
      else setSearchResults(data);
    };
    doSearch();
  }, [searchTerm]);

  // ---------- fetch messages & subscribe ----------
  useEffect(() => {
    if (!activeChat?.id) return setMessages([]);
    let cancelled = false;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeChat.id)
        .order("created_at", { ascending: true });
      if (!cancelled && !error) setMessages(data || []);
      setTimeout(scrollToBottom, 50);
    };
    fetchMessages();

    const channel = supabase
      .channel(`messages-${activeChat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeChat.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeChat?.id]);

  // ---------- Cloudinary upload ----------
  const uploadToCloudinary = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setUploading(false);
      return data?.secure_url ? { url: data.secure_url, type: file.type } : null;
    } catch (err) {
      setUploading(false);
      console.error(err);
      return null;
    }
  };

  // ---------- send message ----------
  const sendMessage = async (file = null) => {
    if (!newMessage.trim() && !file) return;
    if (!activeChat?.id) return;
    try {
      let attachments = null;
      if (file) {
        const uploaded = await uploadToCloudinary(file);
        if (uploaded)
          attachments = [
            { type: uploaded.type.startsWith("image") ? "image" : "file", url: uploaded.url },
          ];
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([{
          conversation_id: activeChat.id,
          sender_id: user.id,
          content: newMessage || null,
          attachments,
          reply_to: replyTo?.id || null,
          forwarded_from: null,
        }])
        .select()
        .single();
      if (error) throw error;

      setNewMessage("");
      setReplyTo(null);
      setMessages((prev) => [...prev, data]);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- message bubble ----------
  const MessageBubble = ({ m }) => {
    const mine = m.sender_id === user.id;
    const replied = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;
    const isSelected = selectedMessage?.id === m.id;
    
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-1`}>
        <div 
          className={`relative max-w-[70%] group cursor-pointer transition-all duration-200 ${
            isSelected ? 'ring-2 ring-purple-400' : ''
          }`}
          onClick={() => setSelectedMessage(isSelected ? null : m)}
        >
          <div
            className={`rounded-lg px-3 py-2 shadow-sm ${
              mine 
                ? 'text-white' 
                : 'bg-white text-gray-800 border border-gray-200'
            } ${isSelected ? 'ring-1 ring-purple-200' : ''}`}
            style={{
              backgroundColor: mine ? colors.primary : colors.receivedMessage,
              borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            }}
          >
            {replied && (
              <div className={`border-l-4 border-opacity-50 pl-3 py-2 mb-2 rounded text-sm ${
                mine 
                  ? 'bg-white bg-opacity-20 border-white' 
                  : 'bg-gray-100 border-purple-400'
              }`}>
                <div className={`font-semibold text-xs ${
                  mine ? 'text-white text-opacity-90' : 'text-purple-600'
                }`}>
                  {replied.sender_id === user.id ? "You" : activeChat.user.username}
                </div>
                <div className={`truncate text-sm ${
                  mine ? 'text-white text-opacity-80' : 'text-gray-700'
                }`}>
                  {replied.content || "📎 Attachment"}
                </div>
              </div>
            )}
            
            {m.content && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {m.content}
              </div>
            )}
            
            {m.attachments?.map((att, i) =>
              att.type === "image" ? (
                <img 
                  key={i} 
                  src={att.url} 
                  className="mt-2 rounded-lg max-w-[280px] cursor-pointer hover:opacity-90 transition-opacity" 
                  alt="Attachment"
                />
              ) : (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center mt-2 p-2 rounded-lg hover:opacity-90 transition-opacity ${
                    mine ? 'bg-white bg-opacity-20' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      mine ? 'bg-white bg-opacity-30' : 'bg-purple-500'
                    }`}>
                      📎
                    </div>
                    <span className={`text-sm hover:underline ${
                      mine ? 'text-white' : 'text-blue-600'
                    }`}>
                      Attachment
                    </span>
                  </div>
                </a>
              )
            )}
            
            <div className={`flex items-center justify-end mt-1 gap-1 text-xs ${
              mine ? 'text-white text-opacity-70' : 'text-gray-500'
            }`}>
              <span>{formatTime(m.created_at)}</span>
              {mine && <MessageStatus message={m} currentUserId={user.id} />}
            </div>
          </div>

          {/* WhatsApp-style linear action menu */}
          {isSelected && (
            <div className={`absolute -top-12 ${mine ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20 flex items-center gap-1`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyTo(m);
                  setSelectedMessage(null);
                }}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                title="Reply"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply
              </button>
              
              <div className="w-px h-4 bg-gray-300"></div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setForwardModal({ open: true, message: m });
                  setSelectedMessage(null);
                }}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                title="Forward"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Forward
              </button>
              
              <div className="w-px h-4 bg-gray-300"></div>
              
              <Copy msg={m} onAction={() => setSelectedMessage(null)} showText={true} />
              
              {mine && (
                <>
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <Edit
                    message={m}
                    onUpdated={(data) => {
                      setMessages((prev) => prev.map((x) => (x.id === data.id ? data : x)));
                      setSelectedMessage(null);
                    }}
                    onAction={() => setSelectedMessage(null)}
                    showText={true}
                  />
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <Delete
                    message={m}
                    onUpdated={(data) => {
                      setMessages((prev) => prev.map((x) => (x.id === data.id ? data : x)));
                      setSelectedMessage(null);
                    }}
                    onAction={() => setSelectedMessage(null)}
                    showText={true}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Click outside to deselect message
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.group')) {
        setSelectedMessage(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ backgroundColor: colors.bg }}>
      {/* Sidebar */}
      <div className="w-1/3 bg-white flex flex-col" style={{ borderRight: `1px solid ${colors.border}` }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200" style={{ backgroundColor: colors.primary }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-white">Forum Messages</h3>
            <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students or start new chat"
              className="w-full bg-white bg-opacity-90 border-0 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:bg-white focus:shadow-sm transition-all placeholder-gray-600"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 relative group ${
                activeChat?.id === c.id ? "bg-purple-50 border-l-4 border-l-purple-500" : ""
              }`}
            >
              <div
                className="flex items-center gap-3 flex-1"
                onClick={() => c.otherUser && setActiveChat({ id: c.id, user: c.otherUser })}
              >
                <div className="relative">
                  <img
                    src={c.otherUser?.profile_photo || "https://via.placeholder.com/48"}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                    alt={c.otherUser?.username}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-semibold text-gray-900 truncate">
                      {c.otherUser?.username || "Unknown Student"}
                    </div>
                    <div className="text-xs" style={{ color: colors.textLight }}>
                      {c.lastMessage ? formatTime(c.lastMessage.created_at) : ""}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {c.lastMessage?.content || (c.lastMessage?.attachments ? "📎 Attachment" : "Start a conversation...")}
                  </div>
                </div>
              </div>
              
              {/* Delete Chat Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-full transition-all duration-200"
                title="Delete Chat"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          {/* Search Results */}
          {searchTerm && searchResults.length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <div className="text-sm px-2 py-1 font-medium" style={{ color: colors.textLight }}>Search Results</div>
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // Handle creating new conversation
                  }}
                >
                  <img src={u.profile_photo || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full border-2 border-purple-200" alt={u.username} />
                  <div className="font-medium text-gray-900">{u.username}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500" style={{ backgroundColor: colors.bg }}>
            <div className="text-center">
              <div className="w-64 h-32 mx-auto mb-8 opacity-30">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  <defs>
                    <linearGradient id="forum-bg" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1"/>
                      <stop offset="100%" stopColor={colors.accent} stopOpacity="0.2"/>
                    </linearGradient>
                  </defs>
                  <rect width="200" height="120" fill="url(#forum-bg)" rx="20"/>
                  <circle cx="50" cy="40" r="15" fill={colors.primary} opacity="0.3"/>
                  <circle cx="100" cy="60" r="12" fill={colors.accent} opacity="0.3"/>
                  <circle cx="150" cy="45" r="18" fill={colors.primary} opacity="0.2"/>
                  <rect x="30" y="75" width="140" height="4" fill={colors.primary} opacity="0.2" rx="2"/>
                  <rect x="50" y="85" width="100" height="3" fill={colors.textLight} opacity="0.2" rx="1"/>
                </svg>
              </div>
              <h2 className="text-2xl font-medium text-gray-800 mb-2">College Forum Chat</h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              </div>
              <p className="text-gray-600 max-w-md">
                Connect with your fellow students, discuss assignments, share notes, and build meaningful academic relationships.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <img 
                  src={activeChat.user.profile_photo || "https://via.placeholder.com/40"} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-200" 
                  alt={activeChat.user.username}
                />
                <div>
                  <div className="font-semibold text-gray-900">{activeChat.user.username}</div>
                  <div className="text-sm" style={{ color: colors.accent }}>Active on forum</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-4 space-y-1"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236C63FF' fill-opacity='0.03'%3E%3Cpath d='M30 30c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12zm12-12c0 6.627 5.373 12 12 12s12-5.373 12-12-5.373-12-12-12-12 5.373-12 12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: colors.bg
              }}
            >
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const showDate = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                return (
                  <div key={m.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <div className="bg-white rounded-lg px-3 py-1 text-xs text-gray-600 shadow-sm border border-gray-200">
                          {formatDateHeader(m.created_at)}
                        </div>
                      </div>
                    )}
                    <MessageBubble m={m} />
                  </div>
                );
              })}
            </div>

            {/* Reply Bar */}
            {replyTo && (
              <div className="bg-purple-50 border-l-4 border-purple-400 p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-700 mb-1">
                    Replying to {replyTo.sender_id === user.id ? "yourself" : activeChat.user.username}
                  </div>
                  <div className="text-sm text-gray-700 truncate">
                    {replyTo.content || "📎 Attachment"}
                  </div>
                </div>
                <button 
                  onClick={() => setReplyTo(null)}
                  className="p-1 hover:bg-purple-200 rounded-full transition-colors ml-4"
                >
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="bg-white p-4 flex items-end gap-3 border-t border-gray-200">
              <label className="cursor-pointer flex-shrink-0">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => { 
                    const f = e.target.files?.[0]; 
                    if (f) sendMessage(f); 
                    e.target.value = ""; 
                  }} 
                />
                <div className="w-10 h-10 bg-gray-100 hover:bg-purple-100 rounded-full flex items-center justify-center transition-colors border border-gray-200">
                  <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
              </label>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type a message to your classmate..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-3 pr-12 focus:outline-none focus:bg-white focus:shadow-sm transition-all"
                  style={{ 
                    borderColor: newMessage.trim() ? colors.primary : colors.border,
                    boxShadow: newMessage.trim() ? `0 0 0 1px ${colors.primary}` : 'none'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              <button 
                onClick={() => sendMessage()} 
                disabled={uploading || (!newMessage.trim())}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  newMessage.trim() 
                    ? 'text-white shadow-sm' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                style={{ 
                  backgroundColor: newMessage.trim() ? colors.primary : undefined,
                  boxShadow: newMessage.trim() ? '0 2px 8px rgba(108, 99, 255, 0.3)' : undefined
                }}
              >
                {uploading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Chat Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chat</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this chat? This action cannot be undone and all messages will be permanently removed.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConversation(showDeleteModal)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardModal.open && (
        <Forward
          message={forwardModal.message}
          onClose={() => setForwardModal({ open: false, message: null })}
          onForwarded={(data) => setMessages((prev) => [...prev, data])}
        />
      )}
    </div>
  );
}