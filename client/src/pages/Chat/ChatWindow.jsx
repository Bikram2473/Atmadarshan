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
        const newSocket = io(apiUrl, {
            transports: ['websocket'], // Force websocket only
            path: '/socket.io',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true
        });
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

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
        <div className="flex h-[calc(100vh-64px)] bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary-900">Messages</h2>
                    {!isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewGroupModal(true)}
                                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-secondary-50 rounded-full transition-colors"
                                title="New Group"
                            >
                                <Users size={20} />
                            </button>
                            <button
                                onClick={() => setShowNewDMModal(true)}
                                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-secondary-50 rounded-full transition-colors"
                                title="New Message"
                            >
                                <UserPlus size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chats.length === 0 ? (
                        <div className="p-8 text-center text-secondary-400">
                            <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No chats yet. Start a conversation.</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={clsx(
                                    "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3",
                                    activeChat?.id === chat.id && "bg-primary-50"
                                )}
                            >
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                                    chat.isGroup ? "bg-primary-500" : "bg-gradient-to-br from-purple-500 to-pink-500"
                                )}>
                                    {chat.isGroup ? <Users size={20} /> : getChatInitial(chat)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {getChatName(chat)}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {chat.isGroup ? 'Group Chat' : 'Direct Message'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#efeae2]">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3",
                                    activeChat.isGroup ? "bg-primary-500" : "bg-gradient-to-br from-purple-500 to-pink-500"
                                )}>
                                    {activeChat.isGroup ? <Users size={20} /> : getChatInitial(activeChat)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary-900">{getChatName(activeChat)}</h3>
                                    <p className="text-xs text-secondary-500">
                                        {activeChat.isGroup ? 'Group' : 'Direct Message'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Shield size={12} />
                                        Read Only
                                    </div>
                                )}

                                {activeChat.isGroup && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                            className="text-secondary-400 hover:text-primary-600 p-2 hover:bg-secondary-50 rounded-full transition-all"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {showOptionsMenu && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 overflow-hidden z-20">
                                                <button
                                                    onClick={() => {
                                                        setShowGroupInfo(true);
                                                        setShowOptionsMenu(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-secondary-700"
                                                >
                                                    <Info size={16} />
                                                    Group Info
                                                </button>

                                                {!isAdmin && (
                                                    <>
                                                        {activeChat.createdBy === user.id && (
                                                            <button
                                                                onClick={deleteGroup}
                                                                className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                                                            >
                                                                <Trash2 size={16} />
                                                                Delete Group
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={leaveGroup}
                                                            className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-2 text-orange-600"
                                                        >
                                                            <LogOut size={16} />
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
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user.id;
                                return (
                                    <div
                                        key={idx}
                                        className={clsx(
                                            "flex flex-col max-w-[70%]",
                                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        {!isMe && activeChat.isGroup && (
                                            <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</span>
                                        )}
                                        <div
                                            className={clsx(
                                                "px-4 py-2 rounded-lg shadow-sm break-words",
                                                isMe
                                                    ? "bg-primary-600 text-white rounded-tr-none"
                                                    : "bg-white text-gray-800 rounded-tl-none"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {!isAdmin && (
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={sendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        )}
                        {isAdmin && (
                            <div className="p-4 bg-gray-100 border-t border-gray-200 text-center text-gray-500 text-sm">
                                Read-only view. Admins cannot send messages.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-secondary-400">
                        <MessageSquare size={64} className="mb-4 opacity-20" />
                        <p className="text-lg">Select a chat to start messaging</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter group name"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {users.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => toggleUser(u.id)}
                                    className={clsx(
                                        "p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50",
                                        selectedUsers.includes(u.id) && "bg-primary-50"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded border flex items-center justify-center",
                                        selectedUsers.includes(u.id) ? "bg-primary-600 border-primary-600" : "border-gray-300"
                                    )}>
                                        {selectedUsers.includes(u.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{u.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                        className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">New Message</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {filteredUsers.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            {user.role === 'student' ? 'No teachers available' : 'No students available'}
                        </div>
                    )}
                    {filteredUsers.map(u => (
                        <div
                            key={u.id}
                            onClick={() => onSelect(u.id)}
                            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                                {u.name[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                            </div>
                        </div>
                    ))}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Group Info</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : groupData ? (
                    <div>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white mx-auto mb-3">
                                <Users size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">{groupData.name}</h4>
                            <p className="text-sm text-gray-500">{groupData.memberDetails.length} members</p>
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                            <div className="font-medium text-gray-700">Members</div>
                            {isCreator && !showAddMembers && availableUsers.length > 0 && (
                                <button
                                    onClick={() => setShowAddMembers(true)}
                                    className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1 transition-colors"
                                >
                                    <UserPlus size={14} />
                                    Add Members
                                </button>
                            )}
                        </div>

                        {/* Add Members Section */}
                        {showAddMembers && isCreator && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 text-sm">Select New Members</h5>
                                    <button onClick={() => {
                                        setShowAddMembers(false);
                                        setSelectedNewMembers([]);
                                    }} className="text-gray-400 hover:text-gray-600">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-primary-200 bg-white rounded-lg divide-y divide-gray-100">
                                    {availableUsers.length === 0 ? (
                                        <p className="p-3 text-sm text-gray-500 text-center">All users are already in this group</p>
                                    ) : (
                                        availableUsers.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => toggleNewMember(u.id)}
                                                className={clsx(
                                                    "p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50",
                                                    selectedNewMembers.includes(u.id) && "bg-primary-100"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-4 h-4 rounded border flex items-center justify-center",
                                                    selectedNewMembers.includes(u.id) ? "bg-primary-600 border-primary-600" : "border-gray-300"
                                                )}>
                                                    {selectedNewMembers.includes(u.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button
                                    onClick={handleAddMembers}
                                    disabled={selectedNewMembers.length === 0 || addingMembers}
                                    className="w-full mt-2 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    {addingMembers ? 'Adding...' : `Add ${selectedNewMembers.length} Member${selectedNewMembers.length !== 1 ? 's' : ''}`}
                                </button>
                            </motion.div>
                        )}

                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {groupData.memberDetails.map(member => (
                                <div key={member.id} className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                                            {member.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                    {member.id === groupData.createdBy && (
                                        <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-red-500">Failed to load group info</div>
                )}
            </motion.div>
        </div>
    );
}
