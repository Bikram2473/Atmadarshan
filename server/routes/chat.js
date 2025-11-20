import express from 'express';
import db from '../db.js';
import { nanoid } from 'nanoid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/chat/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: images, PDF, DOC, TXT, ZIP'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Middleware to block admin access to chat features (mutation only)
const requireNonAdmin = async (req, res, next) => {
    const userId = req.body.userId || req.body.createdBy || req.body.userId1 || req.params.userId;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    await db.read();
    const user = db.data.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admins have read-only access to chats' });
    }

    next();
};

// Get all users (for 1-on-1 chat selection) - exclude admins
router.get('/users', async (req, res) => {
    await db.read();
    const users = db.data.users
        .filter(u => u.role !== 'admin') // Exclude admin users
        .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
    res.json(users);
});

// Create Group
router.post('/groups', requireNonAdmin, async (req, res) => {
    const { name, members, createdBy } = req.body; // members = array of user IDs

    const newGroup = {
        id: nanoid(),
        name,
        members: [...members, createdBy], // Add creator to members
        createdBy, // Track who created the group
        isGroup: true,
        createdAt: new Date().toISOString()
    };

    await db.read();
    if (!db.data.chats) db.data.chats = []; // Ensure chats array exists
    db.data.chats.push(newGroup);
    await db.write();

    res.status(201).json(newGroup);
});

// Delete Group (creator only)
router.delete('/groups/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    await db.read();

    const groupIndex = db.data.chats.findIndex(c => c.id === groupId && c.isGroup);

    if (groupIndex === -1) {
        return res.status(404).json({ message: 'Group not found' });
    }

    const group = db.data.chats[groupIndex];

    // Check if user is admin (cannot delete)
    const user = db.data.users.find(u => u.id === userId);
    if (user && user.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot delete groups' });
    }

    // Only creator can delete
    if (group.createdBy !== userId) {
        return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    // Remove group from chats array
    db.data.chats.splice(groupIndex, 1);
    await db.write();

    res.json({ message: 'Group deleted successfully', groupId });
});

// Leave Group
router.post('/groups/:groupId/leave', requireNonAdmin, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    await db.read();

    const group = db.data.chats.find(c => c.id === groupId && c.isGroup);

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Remove user from members
    group.members = group.members.filter(m => m !== userId);

    // If no members left, delete the group
    if (group.members.length === 0) {
        const groupIndex = db.data.chats.findIndex(c => c.id === groupId);
        db.data.chats.splice(groupIndex, 1);
    }

    await db.write();

    res.json({ message: 'Left group successfully' });
});

// Add Members to Group (creator only)
router.post('/groups/:groupId/add-members', requireNonAdmin, async (req, res) => {
    const { groupId } = req.params;
    const { userId, newMembers } = req.body; // newMembers = array of user IDs to add

    if (!newMembers || !Array.isArray(newMembers) || newMembers.length === 0) {
        return res.status(400).json({ message: 'Please provide members to add' });
    }

    await db.read();

    const group = db.data.chats.find(c => c.id === groupId && c.isGroup);

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can add members
    if (group.createdBy !== userId) {
        return res.status(403).json({ message: 'Only the group creator can add members' });
    }

    // Filter out members who are already in the group
    const membersToAdd = newMembers.filter(memberId => !group.members.includes(memberId));

    if (membersToAdd.length === 0) {
        return res.status(400).json({ message: 'All selected members are already in the group' });
    }

    // Add new members
    group.members = [...group.members, ...membersToAdd];
    await db.write();

    res.json({
        message: 'Members added successfully',
        addedCount: membersToAdd.length,
        group
    });
});

// Get group details
router.get('/groups/:groupId', async (req, res) => {
    const { groupId } = req.params;

    await db.read();

    const group = db.data.chats.find(c => c.id === groupId && c.isGroup);

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Get full member details
    const members = db.data.users
        .filter(u => group.members.includes(u.id))
        .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));

    const groupWithMembers = {
        ...group,
        memberDetails: members
    };

    res.json(groupWithMembers);
});

// Create or get DM (1-on-1 chat)
router.post('/dm', requireNonAdmin, async (req, res) => {
    const { userId1, userId2 } = req.body;

    await db.read();

    // Get both users
    const user1 = db.data.users.find(u => u.id === userId1);
    const user2 = db.data.users.find(u => u.id === userId2);

    if (!user1 || !user2) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Validate that one is a teacher and one is a student
    const isValidPair = (user1.role === 'teacher' && user2.role === 'student') ||
        (user1.role === 'student' && user2.role === 'teacher');

    if (!isValidPair) {
        return res.status(403).json({ message: 'Only teachers and students can chat with each other' });
    }

    // Generate consistent room ID using sorted user IDs
    const sortedIds = [userId1, userId2].sort();
    const roomId = `dm_${sortedIds[0]}_${sortedIds[1]}`;

    // Check if DM already exists
    let dm = db.data.chats.find(c => c.id === roomId);

    if (!dm) {
        // Get the other user's name for the DM
        const otherUser = db.data.users.find(u => u.id === userId2);

        dm = {
            id: roomId,
            name: otherUser ? otherUser.name : 'Direct Message',
            members: [userId1, userId2],
            isGroup: false,
            createdAt: new Date().toISOString()
        };

        if (!db.data.chats) db.data.chats = [];
        db.data.chats.push(dm);
        await db.write();
    }

    res.json(dm);
});

// Get all my chats (groups and DMs)
router.get('/my-chats/:userId', async (req, res) => {
    const { userId } = req.params;

    await db.read();

    const user = db.data.users.find(u => u.id === userId);
    const isAdmin = user && user.role === 'admin';

    // Completely block admin access
    if (isAdmin) {
        return res.status(403).json({ message: 'Admins do not have access to the chat system' });
    }

    // Regular users see only their chats
    const groups = (db.data.chats || []).filter(c => c.isGroup && c.members.includes(userId));
    const dms = (db.data.chats || []).filter(c => !c.isGroup && c.members.includes(userId));

    // For DMs, update the name to show the other participant's name
    const dmsWithNames = dms.map(dm => {
        const otherUserId = dm.members.find(id => id !== userId);
        const otherUser = db.data.users.find(u => u.id === otherUserId);
        return {
            ...dm,
            name: otherUser ? otherUser.name : 'Direct Message',
            otherUserId: otherUserId
        };
    });

    const allChats = [...groups, ...dmsWithNames];

    res.json(allChats);
});

// Get messages for a room (group or DM)
router.get('/messages/:roomId/:userId', async (req, res) => {
    const { roomId, userId } = req.params;

    await db.read();

    const user = db.data.users.find(u => u.id === userId);
    const isAdmin = user && user.role === 'admin';

    // Completely block admin access
    if (isAdmin) {
        return res.status(403).json({ message: 'Admins do not have access to the chat system' });
    }

    // Check if user is a member of this chat
    const chat = db.data.chats.find(c => c.id === roomId);

    if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.members.includes(userId)) {
        return res.status(403).json({ message: 'You do not have access to this chat' });
    }

    const messages = (db.data.messages || []).filter(m => m.roomId === roomId);
    res.json(messages);
});

// Delete Message (sender only)
router.delete('/messages/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { userId } = req.body;

    await db.read();

    const message = db.data.messages.find(m => m.id === messageId);

    if (!message) {
        return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.senderId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Soft delete - keep the message but mark as deleted
    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.fileUrl = null;
    message.fileName = null;

    await db.write();

    res.json({ message: 'Message deleted successfully', messageId });
});

// Forward Message
router.post('/messages/forward', requireNonAdmin, async (req, res) => {
    const { messageId, targetChatIds, userId } = req.body;

    await db.read();

    const originalMessage = db.data.messages.find(m => m.id === messageId);

    if (!originalMessage) {
        return res.status(404).json({ message: 'Message not found' });
    }

    const user = db.data.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Create forwarded messages in each target chat
    const forwardedMessages = targetChatIds.map(targetChatId => {
        const forwardedMessage = {
            id: nanoid(),
            roomId: targetChatId,
            senderId: userId,
            senderName: user.name,
            content: originalMessage.content,
            messageType: originalMessage.messageType || 'text',
            fileUrl: originalMessage.fileUrl || null,
            fileName: originalMessage.fileName || null,
            isDeleted: false,
            isForwarded: true,
            timestamp: new Date().toISOString()
        };

        db.data.messages.push(forwardedMessage);
        return forwardedMessage;
    });

    await db.write();

    res.json({
        message: 'Message forwarded successfully',
        forwardedMessages
    });
});

// Get unread message count for a user
router.get('/unread-count/:userId', async (req, res) => {
    const { userId } = req.params;

    await db.read();

    // Get all chats where user is a member
    const userChats = (db.data.chats || []).filter(c => c.members.includes(userId));
    const userChatIds = userChats.map(c => c.id);

    // Count messages in these chats that are NOT read by the user
    const unreadCount = (db.data.messages || []).filter(m =>
        userChatIds.includes(m.roomId) &&
        m.senderId !== userId && // Don't count own messages
        (!m.readBy || !m.readBy.includes(userId))
    ).length;

    res.json({ unreadCount });
});

// Mark messages in a room as read
router.post('/mark-read/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    await db.read();

    let updated = false;
    (db.data.messages || []).forEach(m => {
        if (m.roomId === roomId && m.senderId !== userId) {
            if (!m.readBy) m.readBy = [];
            if (!m.readBy.includes(userId)) {
                m.readBy.push(userId);
                updated = true;
            }
        }
    });

    if (updated) {
        await db.write();
    }

    res.json({ success: true });
});

// Upload File/Image
router.post('/messages/upload', requireNonAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;
        const fileName = req.file.originalname;
        const fileSize = req.file.size;

        // Determine message type based on file mimetype
        let messageType = 'file';
        if (req.file.mimetype.startsWith('image/')) {
            messageType = 'image';
        }

        res.json({
            success: true,
            fileUrl,
            fileName,
            fileSize,
            messageType
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'File upload failed', error: error.message });
    }
});

export default router;
