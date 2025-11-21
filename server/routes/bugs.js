import express from 'express';
import Bug from '../models/Bug.js';
import User from '../models/User.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Submit a bug report (Teachers and Students only)
router.post('/report', async (req, res) => {
    const { userId, userName, userRole, title, description, category, priority } = req.body;

    if (!userId || !title || !description) {
        return res.status(400).json({ message: 'User ID, title, and description are required' });
    }

    // Prevent admin from submitting bug reports
    const user = await User.findOne({ id: userId });
    if (user && user.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot submit bug reports' });
    }

    const bugReport = {
        id: nanoid(),
        userId,
        userName,
        userRole,
        title,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        createdAt: new Date().toISOString(),
        resolvedAt: null
    };

    await Bug.create(bugReport);

    res.status(201).json({ message: 'Bug report submitted successfully', bugReport });
});

// Get all bug reports (Admin only)
router.get('/reports', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findOne({ id: userId });

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can view bug reports' });
    }

    const bugReports = await Bug.find();
    res.json(bugReports);
});

// Update bug report status (Admin only)
router.patch('/reports/:id/status', async (req, res) => {
    const { id } = req.params;
    const { userId, status } = req.body;

    if (!userId || !status) {
        return res.status(400).json({ message: 'User ID and status are required' });
    }

    const user = await User.findOne({ id: userId });

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update bug report status' });
    }

    const bugReport = await Bug.findOne({ id });
    if (!bugReport) {
        return res.status(404).json({ message: 'Bug report not found' });
    }

    bugReport.status = status;
    if (status === 'resolved') {
        bugReport.resolvedAt = new Date().toISOString();
    }

    await bugReport.save();

    res.json({ message: 'Bug report status updated', bugReport });
});

// Delete bug report (Admin only)
router.delete('/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findOne({ id: userId });

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can delete bug reports' });
    }

    const bugReport = await Bug.findOneAndDelete({ id });
    if (!bugReport) {
        return res.status(404).json({ message: 'Bug report not found' });
    }

    res.json({ message: 'Bug report deleted successfully' });
});

export default router;
