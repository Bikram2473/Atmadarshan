import express from 'express';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Get all classes (filtered by user visibility)
router.get('/', async (req, res) => {
    const { userId } = req.query; // Get userId from query params

    let classes = await Class.find();

    // If userId is provided, filter classes based on visibility rules
    if (userId) {
        const user = await User.findOne({ id: userId });

        if (user && user.role === 'student') {
            // For students: only show classes where they are tagged OR classes with no tags
            classes = classes.filter(cls => {
                // If no students tagged, show to everyone
                if (!cls.taggedStudents || cls.taggedStudents.length === 0) {
                    return true;
                }
                // If students are tagged, only show if this student's email is in the list
                return cls.taggedStudents.includes(user.email);
            });
        }
        // Teachers and admins see all classes (no filtering)
    }

    res.json(classes);
});

// Get all students (for tagging)
router.get('/students', async (req, res) => {
    try {
        console.log('Fetching all students for tagging...');
        const students = await User.find({ role: 'student' }).select('id name email -_id');
        console.log(`Found ${students.length} students for tagging.`);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students', error: error.message });
    }
});

// Create Class (Teacher only)
router.post('/', async (req, res) => {
    const { title, link, date, time, students, teacherId, teacherName } = req.body;
    // students = array of emails to tag

    if (!title || !link || !date || !time) {
        return res.status(400).json({ message: 'Title, Meeting Link, Date, and Time are required' });
    }

    const newClass = {
        id: nanoid(),
        title,
        link,
        date,
        time,
        taggedStudents: students || [], // Emails
        teacherId,
        teacherName,
        createdAt: new Date().toISOString()
    };

    await Class.create(newClass);

    res.status(201).json(newClass);
});

// Join Class (Verify if student is tagged or public)
// For now, we just return the link if the user is allowed
router.get('/:id/join', async (req, res) => {
    // In a real app, we'd check if req.user.email is in taggedStudents
    // For this MVP, we'll trust the frontend to show/hide, but here we could validate
    const { id } = req.params;
    const cls = await Class.findOne({ id });

    if (!cls) return res.status(404).json({ message: 'Class not found' });

    res.json({ link: cls.link });
});

// Delete Class (Teacher only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const deletedClass = await Class.findOneAndDelete({ id });
    if (!deletedClass) {
        return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
});

export default router;
