// src/pages/messages/OneVOne.jsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@clerk/clerk-react";
import { uploadToCloudinary } from "../../utils/cloudinary";

export default function OneVOne() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [people, setPeople] = useState([]);
  const [forwardModal, setForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [forwardSearch, setForwardSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const listRef = useRef();
  const fileInputRef = useRef();

  // Enhanced forward targets: conversations + users
  const filteredForwardTargets = [
    ...forwardTargets.filter(t => 
      t.type === 'conversation' && 
      (t.name || "").toLowerCase().includes(forwardSearch.toLowerCase())
    ),
    ...forwardTargets.filter(t => 
      t.type === 'user' && 
      (t.name || "").toLowerCase().includes(forwardSearch.toLowerCase())
    )
  ];

  // Fetch user profiles for display names and avatars
  useEffect(() => {
    if (messages.length > 0) {
      fetchUserProfiles();
    }
  }, [messages]);

  async function fetchUserProfiles() {
    const userIds = [...new Set(messages.map(m => m.sender_id))];
    const { data, error } = await supabase
      .from("forum_users")
      .select("id, username, profile_photo")
      .in("id", userIds);

    if (!error && data) {
      const profiles = {};
      data.forEach(user => {
        profiles[user.id] = user;
      });
      setUserProfiles(profiles);
    }
  }

  // Get user display info
  const getUserInfo = (userId) => {
    const profile = userProfiles[userId];
    if (profile) {
      return {
        name: profile.username,
        avatar: profile.profile_photo,
        initials: profile.username ? profile.username.substring(0, 2).toUpperCase() : "U"
      };
    }
    return {
      name: "Unknown User",
      avatar: null,
      initials: "UN"
    };
  };

  // Generate avatar component
  const Avatar = ({ userId, size = "w-8 h-8" }) => {
    const userInfo = getUserInfo(userId);
    
    if (userInfo.avatar) {
      return (
        <img
          src={userInfo.avatar}
          alt={userInfo.name}
          className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm`}>
        {userInfo.initials}
      </div>
    );
  };

  // Fetch messages for the active conversation
  useEffect(() => {
    if (!activeConversation) return;
    fetchMessages();

    const sub = supabase
      .channel(`public:messages:conversation=${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation.id}`
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [activeConversation]);

  async function fetchMessages() {
    if (!activeConversation) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeConversation.id)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setMessages(data || []);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
  }

  // Fetch user's conversations
  useEffect(() => {
    if (!user) return;
    fetchPeople();
  }, [user]);

  async function fetchPeople() {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select("conversations(id, type, name, messages(id, created_at), conversation_participants(user_id, forum_users(username, profile_photo)))")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    const convs = (data || []).map((r) => {
      const conv = r.conversations;
      conv.participants = r.conversations.conversation_participants || [];
      conv.last_message = (r.conversations.messages || []).slice(-1)[0] || null;
      
      // Get other participant info for DM name display
      if (conv.type === "dm") {
        const otherParticipant = conv.participants.find(p => p.user_id !== user.id);
        if (otherParticipant && otherParticipant.forum_users) {
          conv.display_name = otherParticipant.forum_users.username;
          conv.avatar = otherParticipant.forum_users.profile_photo;
        } else {
          conv.display_name = conv.name;
        }
      } else {
        conv.display_name = conv.name;
      }
      
      return conv;
    });

    const uniqueConvs = convs.filter((c, i, self) => i === self.findIndex(t => t.id === c.id));
    setPeople(uniqueConvs);
  }

  // Get DM name properly
  const getDMName = (conversation) => {
    return conversation.display_name || conversation.name || "Unknown";
  };

  // Enhanced search for users
  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;

    const { data, error } = await supabase
      .from("forum_users")
      .select("id, username, description, profile_photo")
      .ilike("username", `%${search.trim()}%`);

    if (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } else {
      setSearchResults(data || []);
    }
  }

  // Start or open a conversation
  async function startConversation(otherUser) {
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    const userConvoIds = (participantData || []).map(p => p.conversation_id);

    const { data: existingConvos } = await supabase
      .from("conversations")
      .select("id")
      .eq("type", "dm")
      .in("id", userConvoIds);

    let conversationId = null;

    if (existingConvos?.length) {
      for (let convo of existingConvos) {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convo.id);
        const userIds = participants.map((p) => p.user_id);
        if (userIds.includes(user.id) && userIds.includes(otherUser.id)) {
          conversationId = convo.id;
          break;
        }
      }
    }

    if (!conversationId) {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({
          type: "dm",
          created_by: user.id,
          name: `${user.username}-${otherUser.username}`,
        })
        .select()
        .single();

      conversationId = newConvo.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: otherUser.id },
      ]);
    }

    setActiveConversation({ 
      id: conversationId, 
      name: otherUser.username,
      display_name: otherUser.username 
    });
    setMessages([]);
    setSearchResults([]);
    setSearch("");
  }

  // Enhanced file upload with multiple media types
  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded = [];
    
    for (const file of files) {
      try {
        const res = await uploadToCloudinary(file);
        if (res) {
          uploaded.push({
            ...res,
            file_type: getFileType(file.type),
            file_size: file.size,
            original_name: file.name
          });
        }
      } catch (error) {
        console.error("Upload failed for", file.name, error);
      }
    }
    
    setAttachments((a) => [...a, ...uploaded]);
    setUploading(false);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Get file type for better handling
  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('docx') || mimeType.includes('doc')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('xlsx') || mimeType.includes('xls')) return 'spreadsheet';
    return 'file';
  };

  // Format time helper
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatFullTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Enhanced Media Component with improved PDF, video, and document visibility
const Media = ({ attachments }) => {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const fetchUrls = async () => {
      const newUrls = await Promise.all(
        attachments.map(async (att) => {
          // If already public URL, return it
          if (att.secure_url || att.url) return { ...att, fileUrl: att.secure_url || att.url };

          // Otherwise, generate signed URL for private file
          const { data, error } = await supabase.storage
            .from("attachments") // change bucket name
            .createSignedUrl(att.path, 60); // expires in 60 seconds

          return { ...att, fileUrl: data?.signedUrl || "" };
        })
      );
      setUrls(newUrls);
    };

    fetchUrls();
  }, [attachments]);

  return (
    <div className="mt-2 space-y-2">
      {urls.map((attachment, i) => {
        const fileType =
          attachment.resource_type || attachment.file_type || getFileType(attachment.format);
        const fileUrl = attachment.fileUrl; // now uses signed URL
        const fileName = attachment.original_filename || attachment.original_name || "Unknown File";
        const fileSize = attachment.bytes || attachment.file_size;

        const fileIcons = { pdf: "📄", document: "📝", spreadsheet: "📊", default: "📎" };
        const fileColors = { pdf: "text-red-600", document: "text-blue-600", spreadsheet: "text-green-600", default: "text-gray-600" };
        const fileLabel =
          fileType === "pdf"
            ? "PDF"
            : fileType === "spreadsheet"
            ? "Spreadsheet"
            : fileType === "document"
            ? attachment.format?.toUpperCase() || "DOC"
            : "File";

        switch (fileType) {
          case "image":
            return (
              <div key={i} className="relative group">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-xs max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 shadow-sm"
                  onClick={() => window.open(fileUrl, "_blank")}
                />
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view
                </div>
              </div>
            );

          case "video":
            return (
              <div key={i} className="relative bg-gray-900 rounded-lg overflow-hidden max-w-sm">
                <video src={fileUrl} controls className="w-full max-h-64 bg-black" preload="metadata" poster={fileUrl ? `${fileUrl.replace(/\.[^/.]+$/, "")}.jpg` : undefined}>
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  Video
                </div>
              </div>
            );

          case "audio":
            return (
              <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200 max-w-sm flex flex-col space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🎵</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
                  </div>
                </div>
                <audio src={fileUrl} controls className="w-full" />
              </div>
            );

            case "pdf":
  return (
    <div key={i} className="max-w-sm border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      <div className="flex justify-between items-center p-2 bg-gray-100">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <div className="flex gap-2">
          {/* Open in new tab */}
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            📄 Open
          </a>
          {/* Download */}
          <a 
            href={fileUrl} 
            download={fileName} 
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            💾 Download
          </a>
        </div>
      </div>
    </div>
  );


          case "document":
          case "spreadsheet":
          default:
            return (
              <a key={i} href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 max-w-sm bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer">
                <div className={`w-10 h-10 flex items-center justify-center bg-gray-300 rounded-lg flex-shrink-0`}>
                  <span className={`text-lg ${fileColors[fileType] || fileColors.default}`}>
                    {fileIcons[fileType] || fileIcons.default}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                  <p className="text-xs text-gray-500">{fileLabel} • {formatFileSize(fileSize)}</p>
                </div>
                <div className="flex-shrink-0">
                  <a href={fileUrl} download={fileName} className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                    💾
                  </a>
                </div>
              </a>
            );
        }
      })}
    </div>
  );
};

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const MessageStatus = ({ message }) => (
    <span className="text-xs text-gray-500">
      {message?.created_at ? formatTime(message.created_at) : "Sending..."}
    </span>
  );

  const Reply = ({ message, onCancel }) => (
    <div className="p-3 mb-2 bg-purple-50 border border-purple-200 rounded-lg border-l-4 border-purple-500 flex justify-between items-center">
      <div>
        <div className="text-xs text-purple-600 font-medium">Replying to</div>
        <span className="text-gray-800 text-sm">{message.content}</span>
      </div>
      <button onClick={onCancel} className="text-pink-500 hover:text-pink-700 ml-2 font-bold">✕</button>
    </div>
  );

  const Copy = ({ message }) => {
    const copyText = () => {
      navigator.clipboard.writeText(message.content);
    };
    return <button onClick={copyText} className="text-xs text-gray-600 hover:text-purple-600 transition-colors">📋</button>;
  };

  const Delete = ({ message }) => {
    const deleteMessage = async () => {
      if (message.sender_id === user.id) {
        await supabase
          .from("messages")
          .update({ deleted_for_everyone: true })
          .eq("id", message.id);
      } else {
        await supabase
          .from("messages")
          .update({ deleted_for_users: [...(message.deleted_for_users || []), user.id] })
          .eq("id", message.id);
      }
      fetchMessages();
    };
    return <button onClick={deleteMessage} className="text-xs text-pink-500 hover:text-pink-700 transition-colors">🗑️</button>;
  };

  const Edit = ({ message }) => (
    <button
      onClick={() => {
        const newText = prompt("Edit message:", message.content);
        if (newText !== null && newText.trim() !== "") {
          supabase.from("messages").update({ content: newText, edited: true }).eq("id", message.id);
          fetchMessages();
        }
      }}
      className="text-xs text-purple-500 hover:text-purple-700 transition-colors"
    >
      ✏️
    </button>
  );

  // Enhanced Forward with global search
  const Forward = ({ message }) => {
    const openForwardModal = async () => {
      setForwardMessage(message);
      
      const { data: convData, error: convError } = await supabase
        .from("conversation_participants")
        .select("conversations(id, type, name)")
        .eq("user_id", user.id);

      const { data: userData, error: userError } = await supabase
        .from("forum_users")
        .select("id, username, profile_photo")
        .neq("id", user.id)
        .limit(50);

      if (convError || userError) {
        console.error("Error fetching forward targets:", convError, userError);
        return;
      }

      const conversations = (convData || [])
        .filter(c => c.conversations.id !== activeConversation?.id)
        .map(c => ({
          ...c.conversations,
          type: 'conversation',
          name: c.conversations.name
        }));

      const users = (userData || []).map(u => ({
        id: u.id,
        type: 'user',
        name: u.username,
        profile_photo: u.profile_photo
      }));

      setForwardTargets([...conversations, ...users]);
      setForwardSearch("");
      setForwardModal(true);
    };

    return <button onClick={openForwardModal} className="text-xs text-gray-600 hover:text-purple-600 transition-colors">➤</button>;
  };

  const handleForwardToTarget = async (target) => {
    if (!forwardMessage) return;

    let conversationId;

    if (target.type === 'conversation') {
      conversationId = target.id;
    } else if (target.type === 'user') {
      const otherUser = { id: target.id, username: target.name };
      conversationId = await getOrCreateConversation(otherUser);
    }

    if (!conversationId) {
      alert("Failed to forward message");
      return;
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: forwardMessage.content,
      attachments: forwardMessage.attachments || null,
      forwarded_from: forwardMessage.id
    });

    setForwardModal(false);
    setForwardMessage(null);
    alert("Message forwarded!");
  };

  // Helper to get or create conversation
  const getOrCreateConversation = async (otherUser) => {
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    const userConvoIds = (participantData || []).map(p => p.conversation_id);

    const { data: existingConvos } = await supabase
      .from("conversations")
      .select("id")
      .eq("type", "dm")
      .in("id", userConvoIds);

    let conversationId = null;

    if (existingConvos?.length) {
      for (let convo of existingConvos) {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convo.id);
        const userIds = participants.map((p) => p.user_id);
        if (userIds.includes(user.id) && userIds.includes(otherUser.id)) {
          conversationId = convo.id;
          break;
        }
      }
    }

    if (!conversationId) {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({
          type: "dm",
          created_by: user.id,
          name: `${user.username}-${otherUser.username}`,
        })
        .select()
        .single();

      conversationId = newConvo.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: otherUser.id },
      ]);
    }

    return conversationId;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Enhanced Sidebar with Purple Theme */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <h2 className="font-bold text-xl mb-4 text-white">Messages</h2>
          <form onSubmit={handleSearch} className="space-y-2">
            <input
              type="text"
              className="p-3 border border-purple-300 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        {searchResults.length > 0 && (
          <div className="border-b border-gray-200 max-h-48 overflow-y-auto">
            <div className="p-2">
              <h4 className="font-semibold text-sm mb-2 text-gray-600 uppercase tracking-wide">Search Results</h4>
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center p-3 cursor-pointer hover:bg-purple-50 rounded-lg transition-colors"
                  onClick={() => startConversation(u)}
                >
                  {u.profile_photo ? (
                    <img
                      src={u.profile_photo}
                      alt={u.username}
                      className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-purple-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full mr-3 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-purple-200">
                      {u.username ? u.username.substring(0, 2).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.username}</p>
                    <p className="text-sm text-gray-500 truncate">{u.description || "No bio"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <h4 className="font-semibold text-sm mb-2 text-gray-600 uppercase tracking-wide px-2">Conversations</h4>
            <div className="space-y-1">
              {people.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversation?.id === p.id 
                      ? 'bg-purple-100 border border-purple-300' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveConversation(p)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={getDMName(p)}
                          className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full mr-3 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                          {getDMName(p) ? getDMName(p).substring(0, 2).toUpperCase() : "UN"}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 truncate flex-1">{getDMName(p)}</span>
                    </div>
                    {p.last_message && (
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(p.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  {p.last_message && (
                    <p className="text-sm text-gray-500 truncate mt-1 ml-11">
                      {p.last_message.content || "Media message"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Enhanced Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            <header className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center">
                <Avatar userId={activeConversation.participants?.find(p => p.user_id !== user.id)?.user_id} size="w-10 h-10" />
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900">{getDMName(activeConversation)}</h3>
                  <p className="text-sm text-gray-500">Click on message time for full timestamp</p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((m) => {
                if (m.deleted_for_everyone || (m.deleted_for_users?.includes(user.id))) return null;
                const isOwn = m.sender_id === user.id;
                const senderInfo = getUserInfo(m.sender_id);
                
                return (
                  <div
                    key={m.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isOwn && (
                      <Avatar userId={m.sender_id} size="w-8 h-8" />
                    )}
                    
                    <div
                      className={`max-w-[70%] ${
                        isOwn
                          ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl rounded-br-md shadow-md"
                          : "bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-md border border-gray-200"
                      } p-4 relative group`}
                    >
                      {!isOwn && (
                        <div className="text-xs font-semibold mb-1 text-purple-600">
                          {senderInfo.name}
                        </div>
                      )}

                      {m.forwarded_from && (
                        <div className={`text-xs mb-2 ${isOwn ? 'text-purple-100' : 'text-gray-500'} italic flex items-center gap-1`}>
                          <span>📤</span> Forwarded
                        </div>
                      )}
                      
                      {m.reply_to && (
                        <div className={`text-xs mb-2 p-2 rounded ${
                          isOwn ? 'bg-purple-600' : 'bg-gray-100'
                        }`}>
                          <div className="font-medium">Replying to:</div>
                          <div className="truncate">Previous message content</div>
                        </div>
                      )}

                      {m.content && (
                        <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                      )}
                      
                      {m.attachments && <Media attachments={m.attachments} />}
                      
                      <div className="flex items-center justify-between mt-2 text-xs gap-2">
                        <div className={`${isOwn ? 'text-purple-100' : 'text-gray-500'}`}>
                          <span 
                            className="cursor-pointer hover:underline" 
                            title={formatFullTime(m.created_at)}
                          >
                            <MessageStatus message={m} />
                          </span>
                          {m.edited && <span className="ml-1">(edited)</span>}
                        </div>
                        
                        <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isOwn ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          <button onClick={() => setReplyTo(m)} className="hover:scale-110 transition-transform">💬</button>
                          <Copy message={m} />
                          <Forward message={m} />
                          {isOwn && <Edit message={m} />}
                          <Delete message={m} />
                        </div>
                      </div>
                    </div>

                    {isOwn && (
                      <Avatar userId={m.sender_id} size="w-8 h-8" />
                    )}
                  </div>
                );
              })}
              <div ref={listRef} />
            </div>
            

            {/* Enhanced Forward Modal */}
            {forwardModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl">
                    <h4 className="font-bold text-lg text-white">Forward message</h4>
                    <p className="text-sm text-purple-100">Send to a conversation or user</p>
                  </div>

                  <div className="p-4">
                    <input
                      type="text"
                      placeholder="Search conversations or users..."
                      value={forwardSearch}
                      onChange={(e) => setForwardSearch(e.target.value)}
                      className="w-full p-3 border border-purple-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {filteredForwardTargets.length === 0 && (
                      <p className="text-center py-8 text-gray-500">
                        {forwardSearch ? "No matches found" : "No targets available"}
                      </p>
                    )}

                    {filteredForwardTargets.map((target) => (
                      <div
                        key={`${target.type}-${target.id}`}
                        className="flex items-center p-4 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => handleForwardToTarget(target)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          {target.type === 'user' ? (
                            target.profile_photo ? (
                              <img src={target.profile_photo} alt={target.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {target.name ? target.name.substring(0, 2).toUpperCase() : "U"}
                              </span>
                            )
                          ) : (
                            <span className="text-white">💬</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{target.name}</p>
                          <p className="text-sm text-gray-500">
                            {target.type === 'user' ? 'User' : 'Conversation'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <button
                      className="w-full p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setForwardModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Input Area - Fixed positioning */}
            <div className="border-t border-gray-200 bg-white">
              {replyTo && (
                <div className="p-4 pb-0">
                  <Reply message={replyTo} onCancel={() => setReplyTo(null)} />
                </div>
              )}
              
              {attachments.length > 0 && (
                <div className="px-4 pt-4 pb-0">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700">
                        {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setAttachments([])}
                        className="text-pink-500 hover:text-pink-700 text-sm transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {attachments.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                          <div className="flex items-center flex-1 min-w-0">
                            <span className="text-lg mr-2">
                              {a.resource_type === 'image' ? '🖼️' : 
                               a.resource_type === 'video' ? '🎥' : 
                               a.format === 'pdf' ? '📄' : '📎'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {a.original_filename || a.original_name || 'File'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {a.format?.toUpperCase()} • {formatFileSize(a.bytes)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                            className="ml-2 text-pink-500 hover:text-pink-700 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message..."
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!text.trim() && attachments.length === 0) return;
                          
                          const messageData = {
                            conversation_id: activeConversation.id,
                            sender_id: user.id,
                            content: text.trim() || null,
                            attachments: attachments.length ? attachments : null,
                            reply_to: replyTo?.id || null,
                          };

                          await supabase.from("messages").insert(messageData);
                          setText("");
                          setAttachments([]);
                          setReplyTo(null);
                          fetchMessages();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="*/*"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-3 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      title="Attach files"
                    >
                      {uploading ? '⏳' : '📎'}
                    </button>

                    <button
                      onClick={async () => {
                        if (!text.trim() && attachments.length === 0) return;
                        
                        const messageData = {
                          conversation_id: activeConversation.id,
                          sender_id: user.id,
                          content: text.trim() || null,
                          attachments: attachments.length ? attachments : null,
                          reply_to: replyTo?.id || null,
                        };

                        await supabase.from("messages").insert(messageData);
                        setText("");
                        setAttachments([]);
                        setReplyTo(null);
                        fetchMessages();
                      }}
                      disabled={!text.trim() && attachments.length === 0}
                      className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-all disabled:cursor-not-allowed shadow-md"
                      title="Send message"
                    >
                      ➤
                    </button>
                  </div>
                </div>

                {uploading && (
                  <div className="mt-2 text-sm text-purple-600 flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    Uploading files...
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">Start a conversation</h3>
              <p className="text-gray-500">
                Select an existing conversation or search for a user to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}