import express from 'express';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
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

    const user = await User.findOne({ id: userId });

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
    const users = await User.find({ role: { $ne: 'admin' } }).select('id name email role -_id');
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

    await Chat.create(newGroup);

    res.status(201).json(newGroup);
});

// Delete Group (creator only)
router.delete('/groups/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Chat.findOne({ id: groupId, isGroup: true });

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin (cannot delete)
    const user = await User.findOne({ id: userId });
    if (user && user.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot delete groups' });
    }

    // Only creator can delete
    if (group.createdBy !== userId) {
        return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    // Remove group
    await Chat.deleteOne({ id: groupId });

    res.json({ message: 'Group deleted successfully', groupId });
});

// Leave Group
router.post('/groups/:groupId/leave', requireNonAdmin, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Chat.findOne({ id: groupId, isGroup: true });

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Remove user from members
    group.members = group.members.filter(m => m !== userId);

    // If no members left, delete the group
    if (group.members.length === 0) {
        await Chat.deleteOne({ id: groupId });
    } else {
        await group.save();
    }

    res.json({ message: 'Left group successfully' });
});

// Add Members to Group (creator only)
router.post('/groups/:groupId/add-members', requireNonAdmin, async (req, res) => {
    const { groupId } = req.params;
    const { userId, newMembers } = req.body; // newMembers = array of user IDs to add

    if (!newMembers || !Array.isArray(newMembers) || newMembers.length === 0) {
        return res.status(400).json({ message: 'Please provide members to add' });
    }

    const group = await Chat.findOne({ id: groupId, isGroup: true });

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
    await group.save();

    res.json({
        message: 'Members added successfully',
        addedCount: membersToAdd.length,
        group
    });
});

// Get group details
router.get('/groups/:groupId', async (req, res) => {
    const { groupId } = req.params;

    const group = await Chat.findOne({ id: groupId, isGroup: true });

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Get full member details
    const members = await User.find({ id: { $in: group.members } }).select('id name email role -_id');

    const groupWithMembers = {
        ...group.toObject(),
        memberDetails: members
    };

    res.json(groupWithMembers);
});

// Create or get DM (1-on-1 chat)
router.post('/dm', requireNonAdmin, async (req, res) => {
    const { userId1, userId2 } = req.body;

    // Get both users
    const user1 = await User.findOne({ id: userId1 });
    const user2 = await User.findOne({ id: userId2 });

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
    let dm = await Chat.findOne({ id: roomId });

    if (!dm) {
        // Get the other user's name for the DM
        const otherUser = await User.findOne({ id: userId2 });

        dm = {
            id: roomId,
            name: otherUser ? otherUser.name : 'Direct Message',
            members: [userId1, userId2],
            isGroup: false,
            createdAt: new Date().toISOString()
        };

        await Chat.create(dm);
    }

    res.json(dm);
});

// Get all my chats (groups and DMs)
router.get('/my-chats/:userId', async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({ id: userId });
    const isAdmin = user && user.role === 'admin';

    // Completely block admin access
    if (isAdmin) {
        return res.status(403).json({ message: 'Admins do not have access to the chat system' });
    }

    // Regular users see only their chats
    const groups = await Chat.find({ isGroup: true, members: userId });
    const dms = await Chat.find({ isGroup: false, members: userId });

    // For DMs, update the name to show the other participant's name
    const dmsWithNames = await Promise.all(dms.map(async dm => {
        const otherUserId = dm.members.find(id => id !== userId);
        const otherUser = await User.findOne({ id: otherUserId });
        return {
            ...dm.toObject(),
            name: otherUser ? otherUser.name : 'Direct Message',
            otherUserId: otherUserId
        };
    }));

    const allChats = [...groups.map(g => g.toObject()), ...dmsWithNames];

    res.json(allChats);
});

// Get messages for a room (group or DM)
router.get('/messages/:roomId/:userId', async (req, res) => {
    const { roomId, userId } = req.params;

    const user = await User.findOne({ id: userId });
    const isAdmin = user && user.role === 'admin';

    // Completely block admin access
    if (isAdmin) {
        return res.status(403).json({ message: 'Admins do not have access to the chat system' });
    }

    // Check if user is a member of this chat
    const chat = await Chat.findOne({ id: roomId });

    if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.members.includes(userId)) {
        return res.status(403).json({ message: 'You do not have access to this chat' });
    }

    const messages = await Message.find({ roomId });
    res.json(messages);
});

// Delete Message (sender only)
router.delete('/messages/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findOne({ id: messageId });

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

    await message.save();

    res.json({ message: 'Message deleted successfully', messageId });
});

// Forward Message
router.post('/messages/forward', requireNonAdmin, async (req, res) => {
    const { messageId, targetChatIds, userId } = req.body;

    const originalMessage = await Message.findOne({ id: messageId });

    if (!originalMessage) {
        return res.status(404).json({ message: 'Message not found' });
    }

    const user = await User.findOne({ id: userId });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Create forwarded messages in each target chat
    const forwardedMessages = targetChatIds.map(targetChatId => ({
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
    }));

    await Message.insertMany(forwardedMessages);

    res.json({
        message: 'Message forwarded successfully',
        forwardedMessages
    });
});

// Get unread message count for a user
router.get('/unread-count/:userId', async (req, res) => {
    const { userId } = req.params;

    // Get all chats where user is a member
    const userChats = await Chat.find({ members: userId });
    const userChatIds = userChats.map(c => c.id);

    // Count messages in these chats that are NOT read by the user
    const unreadCount = await Message.countDocuments({
        roomId: { $in: userChatIds },
        senderId: { $ne: userId }, // Don't count own messages
        $or: [
            { readBy: { $exists: false } },
            { readBy: { $not: { $elemMatch: { $eq: userId } } } }
        ]
    });

    res.json({ unreadCount });
});

// Mark messages in a room as read
router.post('/mark-read/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    await Message.updateMany(
        {
            roomId,
            senderId: { $ne: userId },
            readBy: { $ne: userId }
        },
        {
            $addToSet: { readBy: userId }
        }
    );

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
