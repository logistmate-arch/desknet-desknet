import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiUser as User, 
  HiMagnifyingGlass as Search, 
  HiPaperAirplane as Send,
  HiChevronRight as ChevronRight,
  HiXMark as X,
  HiChatBubbleLeftRight as MessageSquare,
  HiCheckCircle as CheckCircle,
  HiClock as Clock,
  HiPaperClip as PaperClip,
  HiPhoto as Photo,
  HiTrash as Trash,
  HiEllipsisVertical as MoreVertical
} from 'react-icons/hi2';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc
} from '../firebase';

import { useNotifications } from '../context/NotificationContext';

interface MessagingSystemProps {
  currentUser: any;
  role: 'admin' | 'engineer' | 'client';
  allUsers: any[]; // Pre-filtered based on role permissions
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ currentUser, role, allUsers }) => {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Presence System
  useEffect(() => {
    if (!currentUser?.uid) return;

    const presenceRef = doc(db, "presence", currentUser.uid);
    setDoc(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      displayName: currentUser.displayName || currentUser.fullName || 'User'
    });

    const q = query(collection(db, "presence"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const online: Record<string, boolean> = {};
      snapshot.docs.forEach(doc => {
        online[doc.id] = doc.data().online;
      });
      setOnlineUsers(online);
    });

    return () => {
      updateDoc(presenceRef, { online: false, lastSeen: serverTimestamp() });
      unsubscribe();
    };
  }, [currentUser.uid]);

  // Typing Indicator System
  useEffect(() => {
    if (!selectedChat || !currentUser?.uid) return;

    const chatParticipants = [currentUser.uid, selectedChat.uid].sort();
    const chatId = chatParticipants.join('_');
    const typingRef = doc(db, "typing", `${chatId}_${currentUser.uid}`);

    // Listen for other person typing
    const otherTypingRef = doc(db, "typing", `${chatId}_${selectedChat.uid}`);
    const unsubscribe = onSnapshot(otherTypingRef, (doc) => {
      if (doc.exists()) {
        setIsTyping(prev => ({ ...prev, [selectedChat.uid]: doc.data().isTyping }));
      } else {
        setIsTyping(prev => ({ ...prev, [selectedChat.uid]: false }));
      }
    });

    return () => {
      updateDoc(typingRef, { isTyping: false }).catch(() => {});
      unsubscribe();
    };
  }, [selectedChat, currentUser.uid]);

  const handleTyping = (val: string) => {
    setNewMessage(val);
    if (!selectedChat || !currentUser?.uid) return;

    const chatParticipants = [currentUser.uid, selectedChat.uid].sort();
    const chatId = chatParticipants.join('_');
    const typingRef = doc(db, "typing", `${chatId}_${currentUser.uid}`);

    setDoc(typingRef, { isTyping: val.length > 0 }, { merge: true });
  };

  // Fetch unread counts for all users
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", currentUser.uid),
      where("unread", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const senderId = data.senderId;
        counts[senderId] = (counts[senderId] || 0) + 1;
      });
      setUnreadCounts(counts);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    const adminUser = {
      id: 'admin_desklink',
      uid: 'admin_desklink',
      email: 'admin@desklink.com',
      displayName: 'DeskLink Admin Support',
      fullName: 'DeskLink Admin Support',
      role: 'admin',
      isSystem: true
    };

    let baseUsers = [...allUsers];
    
    // Remove current user from list
    baseUsers = baseUsers.filter(u => u.uid !== currentUser.uid);

    // If not admin, ensure admin is in the list and at the top
    if (role !== 'admin') {
      const existingAdmin = baseUsers.find(u => u.role === 'admin' || u.uid === 'admin_desklink');
      if (existingAdmin) {
        baseUsers = baseUsers.filter(u => u !== existingAdmin);
        baseUsers = [existingAdmin, ...baseUsers];
      } else {
        baseUsers = [adminUser, ...baseUsers];
      }
    }

    return baseUsers.filter(u => 
      (u.displayName || u.fullName || u.email || 'Unnamed').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm, currentUser.uid, role]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const chatParticipants = [currentUser.uid, selectedChat.uid].sort();
    const chatId = chatParticipants.join('_');

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);

      // Mark messages as read if they are for me
      snapshot.docs.forEach(async (d) => {
        const data = d.data();
        if (data.receiverId === currentUser.uid && data.unread) {
          try {
            await updateDoc(doc(db, "messages", d.id), { unread: false });
          } catch (err) {
            console.error("Error marking message as read:", err);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedChat, currentUser.uid]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const chatParticipants = [currentUser.uid, selectedChat.uid].sort();
    const chatId = chatParticipants.join('_');

    try {
      const messageData: any = {
        chatId,
        senderId: currentUser.uid,
        receiverId: selectedChat.uid,
        content: newMessage,
        timestamp: serverTimestamp(),
        senderName: currentUser.displayName || currentUser.fullName || currentUser.email || 'User',
        unread: true
      };

      await addDoc(collection(db, "messages"), messageData);
      
      // Add persistent notification for the receiver
      await addNotification({
        type: 'message',
        title: 'New Message',
        message: `${currentUser.displayName || currentUser.fullName || currentUser.email || 'User'}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        link: '/messages'
      }, selectedChat.uid);

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatUser: any) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the entire conversation with ${chatUser.displayName || chatUser.fullName || 'this user'}? This action cannot be undone.`)) return;
    
    const chatParticipants = [currentUser.uid, chatUser.uid].sort();
    const chatId = chatParticipants.join('_');

    try {
      // Find all messages for this chat
      const q = query(collection(db, "messages"), where("chatId", "==", chatId));
      const snapshot = await getDocs(q);
      
      // Delete each message
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "messages", d.id)));
      await Promise.all(deletePromises);
      
      if (selectedChat?.uid === chatUser.uid) {
        setSelectedChat(null);
      }
      addNotification({
        type: 'success',
        title: 'Conversation Deleted',
        message: 'Conversation deleted successfully.'
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete conversation.'
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    // Check file size (limit to 1MB for local storage mock)
    if (file.size > 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Please select a file smaller than 1MB.'
      });
      return;
    }

    // In a real app, we'd upload to Firebase Storage
    // For this mock, we'll convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const chatParticipants = [currentUser.uid, selectedChat.uid].sort();
      const chatId = chatParticipants.join('_');

      try {
        await addDoc(collection(db, "messages"), {
          chatId,
          senderId: currentUser.uid,
          receiverId: selectedChat.uid,
          content: type === 'image' ? 'Sent an image' : `Sent a file: ${file.name}`,
          fileUrl: base64,
          fileType: type,
          fileName: file.name,
          timestamp: serverTimestamp(),
          senderName: currentUser.displayName || currentUser.fullName || currentUser.email || 'User',
          unread: true
        });
      } catch (error) {
        console.error("Error sending file:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatMessageDate = (timestamp: any) => {
    if (!timestamp) return 'Sending...';
    
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'Just now';

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full bg-slate-50 flex overflow-hidden w-full">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-full md:w-80' : 'w-20'} ${selectedChat ? 'hidden md:flex' : 'flex'} border-r border-slate-200 flex-col transition-all duration-300 bg-white`}>
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 justify-between mb-4">
            {isSidebarOpen && <h3 className="font-bold text-slate-900">Conversations</h3>}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          {isSidebarOpen && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-brand-teal outline-none transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <div
                key={u.uid || u.id}
                onClick={() => setSelectedChat(u)}
                className={`w-full p-4 flex items-center gap-3 transition-all border-b border-slate-100 cursor-pointer group ${
                  selectedChat?.uid === u.uid ? 'bg-slate-50 shadow-sm border-l-4 border-l-brand-teal' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden">
                    {u.photoURL || u.profilePic ? (
                      <img src={u.photoURL || u.profilePic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${onlineUsers[u.uid || u.id] ? 'bg-emerald-500' : 'bg-slate-200'} border-2 border-white rounded-full`} />
                  {unreadCounts[u.uid || u.id] > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                      {unreadCounts[u.uid || u.id]}
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {u.displayName || u.fullName || u.email?.split('@')[0] || 'Unnamed'}
                      </h4>
                      <button 
                        onClick={(e) => handleDeleteChat(e, u)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete conversation"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{u.role}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm italic">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 ${!selectedChat ? 'hidden md:flex' : 'flex'} flex-col bg-white relative`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 bg-white border-b border-slate-200 flex items-center gap-4 justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden">
                  {selectedChat.photoURL || selectedChat.profilePic ? (
                    <img src={selectedChat.photoURL || selectedChat.profilePic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">
                    {selectedChat.displayName || selectedChat.fullName || selectedChat.email?.split('@')[0] || 'Unnamed'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${onlineUsers[selectedChat.uid] ? 'bg-emerald-500' : 'bg-slate-300'} rounded-full`} />
                    <span className={`text-[10px] ${onlineUsers[selectedChat.uid] ? 'text-emerald-500' : 'text-slate-500'} font-bold uppercase tracking-widest`}>
                      {onlineUsers[selectedChat.uid] ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 px-10 py-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50">
              {messages.length > 0 ? (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser.uid;
                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!isMe && (
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden shrink-0 mb-1">
                          {selectedChat.photoURL || selectedChat.profilePic ? (
                            <img src={selectedChat.photoURL || selectedChat.profilePic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      <div className={`group relative max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`p-4 rounded-2xl shadow-sm relative group/msg ${
                          isMe 
                            ? 'bg-brand-teal text-brand-dark rounded-br-none' 
                            : 'bg-white text-slate-900 rounded-bl-none border border-slate-200'
                        }`}>
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className={`absolute ${isMe ? '-left-8' : '-right-8'} top-2 p-1.5 bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-lg shadow-sm opacity-0 group-hover/msg:opacity-100 transition-all z-20`}
                            title="Delete message"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                          {msg.fileUrl && (
                            <div className="mb-2">
                              {msg.fileType === 'image' ? (
                                <img src={msg.fileUrl} alt="Sent" className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.fileUrl)} />
                              ) : (
                                <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                                  <PaperClip className="w-4 h-4" />
                                  <span className="text-xs font-medium truncate max-w-[150px]">{msg.fileName}</span>
                                </a>
                              )}
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 text-slate-400`}>
                          {formatMessageDate(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                </div>
              )}
              {isTyping[selectedChat.uid] && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                    {selectedChat.photoURL || selectedChat.profilePic ? (
                      <img src={selectedChat.photoURL || selectedChat.profilePic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-200">
              <div className="flex gap-2 mb-3">
                <label className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 cursor-pointer">
                  <Photo className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                </label>
                <label className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 cursor-pointer">
                  <PaperClip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                </label>
              </div>
              <form 
                onSubmit={handleSendMessage}
                className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-brand-teal/50 transition-all"
              >
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type your message here..." 
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 outline-none" 
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-brand-teal text-brand-dark rounded-xl flex items-center justify-center hover:bg-teal-300 transition-all shadow-lg shadow-brand-teal/20 disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center relative border border-slate-200">
              <MessageSquare className="w-12 h-12 text-brand-teal" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-brand-teal rounded-full flex items-center justify-center text-brand-dark"
              >
                <PlusSquare className="w-4 h-4" />
              </motion.div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Messages</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Select a contact from the sidebar to start chatting with engineers, clients, or support.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {['DeskLink Support', 'Recent Engineers', 'Active Clients'].map((tag) => (
                <span key={tag} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PlusSquare = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default MessagingSystem;
