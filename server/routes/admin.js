import express from 'express';
import db from '../db.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const userId = req.headers['user-id'];

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    db.read().then(() => {
        const user = db.data.users.find(u => u.id === userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        req.user = user;
        next();
    }).catch(err => {
        console.error('Database read error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    });
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    await db.read();

    // Return users without passwords for security
    const users = db.data.users.map(({ password, ...user }) => user);

    res.json({ users });
});

// Delete a user
router.delete('/users/:userId', isAdmin, async (req, res) => {
    const { userId } = req.params;

    await db.read();

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const userIndex = db.data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    const deletedUser = db.data.users[userIndex];
    db.data.users.splice(userIndex, 1);

    // Also clean up related data
    // Remove from chats
    if (db.data.chats) {
        db.data.chats = db.data.chats.filter(chat => {
            chat.members = chat.members.filter(memberId => memberId !== userId);
            return chat.members.length > 0; // Remove empty chats
        });
    }

    // Remove messages
    if (db.data.messages) {
        db.data.messages = db.data.messages.filter(msg => msg.senderId !== userId);
    }

    // Remove from classes
    if (db.data.classes) {
        db.data.classes = db.data.classes.filter(cls => cls.teacherId !== userId);
    }

    await db.write();

    res.json({
        message: 'User deleted successfully',
        deletedUser: { id: deletedUser.id, name: deletedUser.name, email: deletedUser.email }
    });
});

export default router;
