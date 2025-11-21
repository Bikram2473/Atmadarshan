import express from 'express';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Class from '../models/Class.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    const userId = req.headers['user-id'];

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findOne({ id: userId });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Database read error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    // Return users without passwords for security
    const users = await User.find().select('-password -_id');

    res.json({ users });
});

// Delete a user
router.delete('/users/:userId', isAdmin, async (req, res) => {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findOne({ id: userId });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const deletedUser = { id: user.id, name: user.name, email: user.email };

    // Delete user
    await User.deleteOne({ id: userId });

    // Clean up related data
    // Remove from chats and delete empty chats
    const chats = await Chat.find({ members: userId });
    for (const chat of chats) {
        chat.members = chat.members.filter(memberId => memberId !== userId);
        if (chat.members.length === 0) {
            await Chat.deleteOne({ id: chat.id });
        } else {
            await chat.save();
        }
    }

    // Remove messages
    await Message.deleteMany({ senderId: userId });

    // Remove from classes
    await Class.deleteMany({ teacherId: userId });

    res.json({
        message: 'User deleted successfully',
        deletedUser
    });
});

export default router;
