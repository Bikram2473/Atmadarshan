import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import api from '../../api/axios';
import { Send, Users, MessageSquare, MoreVertical, Trash2, LogOut, Info, UserPlus, X, Shield } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow() {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [showNewDMModal, setShowNewDMModal] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const [users, setUsers] = useState([]); // For creating groups/DMs

    const isAdmin = user?.role === 'admin';

    // Initialize Socket.io
    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        console.log('Initializing socket connection to:', apiUrl);

        const newSocket = io(apiUrl, {
            transports: ['websocket', 'polling'],
            path: '/socket.io',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Register user with socket
    useEffect(() => {
        if (socket && user?.id) {
            const registerUser = () => {
                if (socket.connected) {
                    console.log('Registering user with socket:', user.id);
                    socket.emit('register_user', user.id);
                }
            };

            // Try to register immediately
            registerUser();

            // Also register on any reconnect
            socket.on('connect', registerUser);

            return () => {
                socket.off('connect', registerUser);
            };
        }
    }, [socket, user]);

    // Fetch Chats
    const fetchMyChats = async () => {
        try {
            const res = await api.get(`/api/chat/my-chats/${user.id}`);
            setChats(res.data);
        } catch (error) {
            console.error("Failed to fetch chats", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMyChats();
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/chat/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    // Join room when active chat changes
    useEffect(() => {
        if (socket && activeChat) {
            socket.emit('join_room', activeChat.id);
            fetchMessages(activeChat.id);

            // Mark messages as read
            api.post(`/api/chat/mark-read/${activeChat.id}`, { userId: user.id })
                .catch(err => console.error("Failed to mark messages as read", err));
        }
    }, [socket, activeChat]);

    const fetchMessages = async (roomId) => {
        try {
            const res = await api.get(`/api/chat/messages/${roomId}/${user.id}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to fetch messages", error);
            if (error.response?.status === 403) {
                alert("You don't have access to this chat");
                setActiveChat(null);
            }
        }
    };

    // Listen for incoming messages and events
    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', (message) => {
            if (activeChat && message.roomId === activeChat.id) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
            // Refresh chat list to update last message preview (if we implemented that)
            fetchMyChats();
        });

        socket.on('group_deleted', (data) => {
            if (activeChat && activeChat.id === data.groupId) {
                alert('This group has been deleted by the creator.');
                setActiveChat(null);
            }
            fetchMyChats();
        });

        socket.on('user_left_group', (data) => {
            if (activeChat && activeChat.id === data.groupId) {
                // Refresh group info if looking at it
                if (showGroupInfo) {
                    // Trigger re-fetch in GroupInfo component (needs implementation or key reset)
                }
            }
        });

        socket.on('message_error', (data) => {
            alert(data.message);
        });

        return () => {
            socket.off('receive_message');
            socket.off('group_deleted');
            socket.off('user_left_group');
            socket.off('message_error');
        };
    }, [socket, activeChat, showGroupInfo]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        if (isAdmin) {
            alert("Admins cannot send messages.");
            return;
        }

        const messageData = {
            roomId: activeChat.id,
            senderId: user.id,
            senderName: user.name,
            content: newMessage,
            timestamp: new Date().toISOString(),
        };

        await socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const createGroup = async (groupName, selectedMembers) => {
        try {
            const res = await api.post('/api/chat/groups', {
                name: groupName,
                members: selectedMembers,
                createdBy: user.id
            });
            setChats([...chats, res.data]);
            setShowNewGroupModal(false);
            setActiveChat(res.data);
        } catch (error) {
            console.error("Failed to create group", error);
            alert("Failed to create group");
        }
    };

    const createDM = async (otherUserId) => {
        try {
            const res = await api.post('/api/chat/dm', {
                userId1: user.id,
                userId2: otherUserId
            });

            // Check if DM already exists in chats list
            const existingDM = chats.find(c => c.id === res.data.id);
            if (!existingDM) {
                await fetchMyChats();
            }

            setActiveChat(res.data);
            setShowNewDMModal(false);
        } catch (error) {
            console.error("Failed to create DM", error);
            if (error.response?.status === 403) {
                alert(error.response.data.message);
            }
        }
    };

    const deleteGroup = async () => {
        if (!activeChat || !activeChat.isGroup) return;

        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api/chat/groups/${activeChat.id}`, {
                data: { userId: user.id }
            });

            // Emit socket event to notify members
            socket.emit('delete_group', { groupId: activeChat.id, userId: user.id });

            setActiveChat(null);
            setMessages([]);
            fetchMyChats();
            setShowOptionsMenu(false);
        } catch (error) {
            console.error("Failed to delete group", error);
            alert(error.response?.data?.message || "Failed to delete group");
        }
    };

    const leaveGroup = async () => {
        if (!activeChat || !activeChat.isGroup) return;

        if (!confirm('Are you sure you want to leave this group?')) {
            return;
        }

        try {
            await api.post(`/api/chat/groups/${activeChat.id}/leave`, {
                userId: user.id
            });

            // Emit socket event
            socket.emit('leave_group', { groupId: activeChat.id, userId: user.id, userName: user.name });

            setActiveChat(null);
            setMessages([]);
            fetchMyChats();
            setShowOptionsMenu(false);
        } catch (error) {
            console.error("Failed to leave group", error);
            alert("Failed to leave group");
        }
    };

    // Helper to get display name for DM
    const getChatName = (chat) => {
        if (chat.isGroup) return chat.name;

        if (isAdmin) {
            // For admin, we might receive a combined name from backend or we can just show the name provided
            return chat.name;
        }

        // For regular users, find the other participant
        const otherUserId = chat.members?.find(id => id !== user.id);
        const otherUser = users.find(u => u.id === otherUserId);
        return otherUser ? otherUser.name : chat.name;
    };

    const getChatInitial = (chat) => {
        const name = getChatName(chat);
        return name ? name[0].toUpperCase() : '?';
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-slate-900 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-white dark:bg-slate-800 border-r border-secondary-200 dark:border-slate-700 flex flex-col shadow-sm z-10">
                <div className="p-5 border-b border-secondary-200 dark:border-slate-700 flex justify-between items-center bg-secondary-50/50 dark:bg-slate-800/30">
                    <h2 className="text-xl font-heading font-bold text-primary-900 dark:text-white">Messages</h2>
                    {!isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewGroupModal(true)}
                                className="p-2 text-secondary-400 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                title="New Group"
                            >
                                <Users size={20} />
                            </button>
                            <button
                                onClick={() => setShowNewDMModal(true)}
                                className="p-2 text-secondary-400 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                title="New Message"
                            >
                                <UserPlus size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chats.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-full text-secondary-500 dark:text-slate-500">
                            <div className="w-16 h-16 bg-secondary-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium text-secondary-400 dark:text-slate-400">No chats yet</p>
                            <p className="text-sm mt-1">Start a conversation to connect</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-secondary-100 dark:divide-slate-700/50">
                            {chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className={clsx(
                                        "p-4 cursor-pointer hover:bg-secondary-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-4 border-l-4",
                                        activeChat?.id === chat.id
                                            ? "bg-primary-50 dark:bg-slate-700/30 border-primary-500"
                                            : "border-transparent"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm",
                                        chat.isGroup ? "bg-primary-600 dark:bg-primary-700" : "bg-accent-500 dark:bg-accent-600"
                                    )}>
                                        {chat.isGroup ? <Users size={20} /> : getChatInitial(chat)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={clsx(
                                            "font-bold truncate text-sm",
                                            activeChat?.id === chat.id ? "text-primary-900 dark:text-white" : "text-secondary-700 dark:text-slate-300"
                                        )}>
                                            {getChatName(chat)}
                                        </h3>
                                        <p className="text-xs text-secondary-500 dark:text-slate-500 truncate mt-0.5">
                                            {chat.isGroup ? 'Group Chat' : 'Direct Message'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-secondary-50 dark:bg-slate-950 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shadow-sm z-20 relative">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm",
                                    activeChat.isGroup ? "bg-primary-600 dark:bg-primary-700" : "bg-accent-500 dark:bg-accent-600"
                                )}>
                                    {activeChat.isGroup ? <Users size={20} /> : getChatInitial(activeChat)}
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-primary-900 dark:text-white text-lg">{getChatName(activeChat)}</h3>
                                    <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-slate-400">
                                        <span className={clsx("w-2 h-2 rounded-full", activeChat.isGroup ? "bg-primary-500" : "bg-green-500")}></span>
                                        {activeChat.isGroup ? 'Group Conversation' : 'Online'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <div className="px-3 py-1.5 bg-secondary-100 dark:bg-slate-700 text-secondary-600 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-secondary-200 dark:border-slate-600">
                                        <Shield size={14} />
                                        Read Only Mode
                                    </div>
                                )}

                                {activeChat.isGroup && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                            className="text-secondary-400 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 hover:bg-secondary-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {showOptionsMenu && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-secondary-200 dark:border-slate-700 overflow-hidden z-30 py-1">
                                                <button
                                                    onClick={() => {
                                                        setShowGroupInfo(true);
                                                        setShowOptionsMenu(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-slate-700 flex items-center gap-3 text-secondary-700 dark:text-slate-300 text-sm font-medium transition-colors"
                                                >
                                                    <Info size={18} className="text-secondary-400 dark:text-slate-400" />
                                                    Group Information
                                                </button>

                                                {!isAdmin && (
                                                    <>
                                                        {activeChat.createdBy === user.id && (
                                                            <button
                                                                onClick={deleteGroup}
                                                                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-500 dark:text-red-400 text-sm font-medium transition-colors border-t border-secondary-100 dark:border-slate-700"
                                                            >
                                                                <Trash2 size={18} />
                                                                Delete Group
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={leaveGroup}
                                                            className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-3 text-orange-500 dark:text-orange-400 text-sm font-medium transition-colors border-t border-secondary-100 dark:border-slate-700"
                                                        >
                                                            <LogOut size={18} />
                                                            Leave Group
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user.id;
                                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                                return (
                                    <div
                                        key={idx}
                                        className={clsx(
                                            "flex flex-col max-w-[75%]",
                                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        {!isMe && activeChat.isGroup && showAvatar && (
                                            <span className="text-xs font-bold text-secondary-500 dark:text-slate-400 mb-1 ml-1">{msg.senderName}</span>
                                        )}
                                        <div
                                            className={clsx(
                                                "px-5 py-3 shadow-sm text-sm leading-relaxed relative group",
                                                isMe
                                                    ? "bg-primary-600 dark:bg-primary-700 text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-white dark:bg-slate-800 text-secondary-700 dark:text-slate-200 rounded-2xl rounded-tl-sm border border-secondary-200 dark:border-slate-700"
                                            )}
                                        >
                                            {msg.content}
                                            <span className={clsx(
                                                "text-[10px] absolute bottom-1 right-3 opacity-0 group-hover:opacity-70 transition-opacity",
                                                isMe ? "text-primary-100 dark:text-primary-200" : "text-secondary-400 dark:text-slate-400"
                                            )}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {!isAdmin && (
                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-secondary-200 dark:border-slate-700 z-20">
                                <form onSubmit={sendMessage} className="flex gap-3 items-center max-w-4xl mx-auto">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-6 py-3.5 bg-secondary-50 dark:bg-slate-900 rounded-xl border border-secondary-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-secondary-400 dark:placeholder-slate-500 text-primary-900 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        )}
                        {isAdmin && (
                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-secondary-200 dark:border-slate-700 text-center text-secondary-500 dark:text-slate-400 text-sm font-medium z-20">
                                <Shield size={16} className="inline mr-2 -mt-0.5" />
                                Read-only view. Administrators cannot send messages.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-secondary-500 dark:text-slate-500 z-10">
                        <div className="w-24 h-24 bg-secondary-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-secondary-200 dark:border-slate-700">
                            <MessageSquare size={40} className="text-secondary-400 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-primary-900 dark:text-white mb-2">Welcome to Messages</h3>
                        <p className="text-secondary-500 dark:text-slate-400 max-w-xs text-center">Select a conversation from the sidebar or start a new chat to begin messaging.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showNewGroupModal && (
                    <NewGroupForm
                        users={users}
                        onClose={() => setShowNewGroupModal(false)}
                        onCreate={createGroup}
                    />
                )}
                {showNewDMModal && (
                    <DMSelector
                        users={users}
                        onClose={() => setShowNewDMModal(false)}
                        onSelect={createDM}
                    />
                )}
                {showGroupInfo && activeChat && (
                    <GroupInfoModal
                        groupId={activeChat.id}
                        onClose={() => setShowGroupInfo(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function NewGroupForm({ users, onClose, onCreate }) {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!groupName.trim() || selectedUsers.length === 0) return;
        onCreate(groupName, selectedUsers);
    };

    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-secondary-100 dark:border-slate-700 flex justify-between items-center bg-secondary-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-heading font-bold text-primary-900 dark:text-white">Create New Group</h3>
                    <button onClick={onClose} className="text-secondary-400 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-primary-700 dark:text-slate-300 mb-2">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 transition-all placeholder-secondary-300 dark:placeholder-slate-500 text-primary-900 dark:text-white"
                            placeholder="Enter group name"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-primary-700 dark:text-slate-300 mb-2">Select Members</label>
                        <div className="max-h-60 overflow-y-auto border border-secondary-200 dark:border-slate-600 rounded-xl divide-y divide-secondary-100 dark:divide-slate-700 custom-scrollbar">
                            {users.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => toggleUser(u.id)}
                                    className={clsx(
                                        "p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary-50 dark:hover:bg-slate-700 transition-colors",
                                        selectedUsers.includes(u.id) && "bg-primary-50 dark:bg-primary-900/30"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                        selectedUsers.includes(u.id) ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500" : "border-secondary-300 dark:border-slate-500 bg-white dark:bg-slate-800"
                                    )}>
                                        {selectedUsers.includes(u.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary-900 dark:text-white text-sm">{u.name}</p>
                                        <p className="text-xs text-secondary-500 dark:text-slate-400 capitalize">{u.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                        className="w-full py-3 bg-primary-900 dark:bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-800 dark:hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        Create Group
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

function DMSelector({ users, onClose, onSelect }) {
    const { user } = useAuth();

    // Filter users: Students can only chat with teachers, and teachers can only chat with students
    const filteredUsers = users.filter(u => {
        if (user.role === 'student') {
            return u.role === 'teacher';
        } else if (user.role === 'teacher') {
            return u.role === 'student';
        }
        return false;
    });

    return (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-secondary-100 dark:border-slate-700 flex justify-between items-center bg-secondary-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-heading font-bold text-primary-900 dark:text-white">New Message</h3>
                    <button onClick={onClose} className="text-secondary-400 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-secondary-500 dark:text-slate-400">
                            <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
                            <p>{user.role === 'student' ? 'No teachers available' : 'No students available'}</p>
                        </div>
                    )}
                    <div className="space-y-1">
                        {filteredUsers.map(u => (
                            <div
                                key={u.id}
                                onClick={() => onSelect(u.id)}
                                className="p-3 hover:bg-secondary-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-4 transition-all rounded-xl group"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold group-hover:bg-primary-600 dark:group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    {u.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-primary-900 dark:text-white">{u.name}</p>
                                    <p className="text-xs text-secondary-500 dark:text-slate-400 capitalize">{u.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function GroupInfoModal({ groupId, onClose }) {
    const { user } = useAuth();
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const [addingMembers, setAddingMembers] = useState(false);

    useEffect(() => {
        const fetchGroupInfo = async () => {
            try {
                const res = await api.get(`/api/chat/groups/${groupId}`);
                setGroupData(res.data);
            } catch (error) {
                console.error("Failed to fetch group info", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUsers = async () => {
            try {
                const res = await api.get('/api/chat/users');
                setAllUsers(res.data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };

        fetchGroupInfo();
        fetchUsers();
    }, [groupId]);

    const isCreator = groupData && groupData.createdBy === user.id;

    // Filter users who are not already in the group
    const availableUsers = allUsers.filter(u =>
        !groupData?.members.includes(u.id)
    );

    const toggleNewMember = (userId) => {
        if (selectedNewMembers.includes(userId)) {
            setSelectedNewMembers(selectedNewMembers.filter(id => id !== userId));
        } else {
            setSelectedNewMembers([...selectedNewMembers, userId]);
        }
    };

    const handleAddMembers = async () => {
        if (selectedNewMembers.length === 0) return;

        setAddingMembers(true);
        try {
            const res = await api.post(
                `/api/chat/groups/${groupId}/add-members`,
                {
                    userId: user.id,
                    newMembers: selectedNewMembers
                }
            );

            // Update group data with new members
            setGroupData(res.data.group);
            setSelectedNewMembers([]);
            setShowAddMembers(false);

            // Refresh group info
            const updatedRes = await api.get(`/api/chat/groups/${groupId}`);
            setGroupData(updatedRes.data);

            alert(`Successfully added ${res.data.addedCount} member(s)!`);
        } catch (error) {
            console.error("Failed to add members", error);
            alert(error.response?.data?.message || "Failed to add members");
        } finally {
            setAddingMembers(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-secondary-100 dark:border-slate-700 flex justify-between items-center bg-secondary-50/50 dark:bg-slate-800/50 shrink-0">
                    <h3 className="text-xl font-heading font-bold text-primary-900 dark:text-white">Group Info</h3>
                    <button onClick={onClose} className="text-secondary-400 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-secondary-500 dark:text-slate-400">
                            <div className="animate-spin w-8 h-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            Loading...
                        </div>
                    ) : groupData ? (
                        <div>
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-primary-600 dark:bg-primary-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary-900/20">
                                    <Users size={32} />
                                </div>
                                <h4 className="text-2xl font-heading font-bold text-primary-900 dark:text-white">{groupData.name}</h4>
                                <p className="text-sm text-secondary-500 dark:text-slate-400 font-medium mt-1">{groupData.memberDetails.length} members</p>
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <div className="font-bold text-primary-900 dark:text-white text-sm uppercase tracking-wide">Members</div>
                                {isCreator && !showAddMembers && availableUsers.length > 0 && (
                                    <button
                                        onClick={() => setShowAddMembers(true)}
                                        className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-1.5 transition-all font-bold shadow-sm"
                                    >
                                        <UserPlus size={14} />
                                        Add Members
                                    </button>
                                )}
                            </div>

                            {/* Add Members Section */}
                            <AnimatePresence>
                                {showAddMembers && isCreator && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6 p-4 bg-secondary-50 dark:bg-slate-700/30 rounded-xl border border-secondary-200 dark:border-slate-600 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-bold text-primary-900 dark:text-white text-sm">Select New Members</h5>
                                            <button onClick={() => {
                                                setShowAddMembers(false);
                                                setSelectedNewMembers([]);
                                            }} className="text-secondary-400 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-slate-200">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto border border-secondary-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl divide-y divide-secondary-100 dark:divide-slate-700 custom-scrollbar">
                                            {availableUsers.length === 0 ? (
                                                <p className="p-4 text-sm text-secondary-500 dark:text-slate-400 text-center">All users are already in this group</p>
                                            ) : (
                                                availableUsers.map(u => (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => toggleNewMember(u.id)}
                                                        className={clsx(
                                                            "p-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary-50 dark:hover:bg-slate-700 transition-colors",
                                                            selectedNewMembers.includes(u.id) && "bg-primary-50 dark:bg-primary-900/30"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                            selectedNewMembers.includes(u.id) ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500" : "border-secondary-300 dark:border-slate-500"
                                                        )}>
                                                            {selectedNewMembers.includes(u.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-primary-900 dark:text-white text-xs">{u.name}</p>
                                                            <p className="text-[10px] text-secondary-500 dark:text-slate-400 capitalize">{u.role}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <button
                                            onClick={handleAddMembers}
                                            disabled={selectedNewMembers.length === 0 || addingMembers}
                                            className="w-full mt-3 py-2 bg-primary-900 dark:bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-800 dark:hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs shadow-sm"
                                        >
                                            {addingMembers ? 'Adding...' : `Add ${selectedNewMembers.length} Member${selectedNewMembers.length !== 1 ? 's' : ''}`}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="max-h-60 overflow-y-auto border border-secondary-200 dark:border-slate-600 rounded-xl divide-y divide-secondary-100 dark:divide-slate-700 bg-white dark:bg-slate-800 custom-scrollbar">
                                {groupData.memberDetails.map(member => (
                                    <div key={member.id} className="p-3 flex items-center justify-between hover:bg-secondary-50 dark:hover:bg-slate-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs">
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary-900 dark:text-white text-sm">{member.name}</p>
                                                <p className="text-xs text-secondary-500 dark:text-slate-400 capitalize">{member.role}</p>
                                            </div>
                                        </div>
                                        {member.id === groupData.createdBy && (
                                            <span className="px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-[10px] rounded-full font-bold border border-accent-200 dark:border-accent-800">
                                                ADMIN
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-red-500 font-medium">Failed to load group info</div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
