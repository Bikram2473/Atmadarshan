import express from 'express';
import User from '../models/User.js';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
        const uniqueName = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Signup
router.post('/signup', async (req, res) => {
    try {
        console.log('Signup request received:', { email: req.body.email, name: req.body.name });

        const { name, email, password, securityQuestion, securityAnswer } = req.body;

        if (!name || !email || !password || !securityQuestion || !securityAnswer) {
            console.log('Signup failed: Missing fields');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userExists = await User.findOne({ email });
        console.log('User exists check:', userExists ? 'Yes' : 'No');

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // First user is admin, second user is teacher, rest are students
        const userCount = await User.countDocuments();
        console.log('Current user count:', userCount);

        let role = 'student';
        if (userCount === 0) {
            role = 'admin';
        } else if (userCount === 1) {
            role = 'teacher';
        }

        const newUser = {
            id: nanoid(),
            name,
            email,
            password, // In a real app, hash this!
            role,
            securityQuestion,
            securityAnswer,
            createdAt: new Date().toISOString()
        };

        console.log('Creating new user with role:', role);
        const createdUser = await User.create(newUser);
        console.log('User created successfully:', createdUser.id);

        res.status(201).json({
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error during signup', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', { email: req.body.email });

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('Login successful for user:', user.id);
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Password Reset - Step 1: Verify email and get security question
router.post('/forgot-password/verify-email', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ securityQuestion: user.securityQuestion });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Password Reset - Step 2: Verify answer and reset password
router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { email, securityAnswer, newPassword } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.securityAnswer !== securityAnswer) {
            return res.status(401).json({ message: 'Incorrect security answer' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Upload Profile Image
router.post('/profile-image', upload.single('profileImage'), async (req, res) => {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.profileImage = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ message: 'Profile image updated', profileImage: user.profileImage, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update profile image' });
    }
});

// Delete Profile Image
router.delete('/profile-image', async (req, res) => {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Delete the file from server if it exists
        if (user.profileImage) {
            const fs = await import('fs');
            const filePath = join(__dirname, '..', user.profileImage);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.error('Error deleting file:', error);
                }
            }
        }

        user.profileImage = null;
        await user.save();

        res.json({ message: 'Profile image removed', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove profile image' });
    }
});

export default router;
