import express from 'express';
import db from '../db.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    const { name, email, password, securityQuestion, securityAnswer } = req.body;

    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    await db.read();
    const userExists = db.data.users.find(u => u.email === email);

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // First user is admin, second user is teacher, rest are students
    let role = 'student';
    if (db.data.users.length === 0) {
        role = 'admin';
    } else if (db.data.users.length === 1) {
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

    db.data.users.push(newUser);
    await db.write();

    res.status(201).json({ user: newUser, message: 'User created successfully' });
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    await db.read();
    const user = db.data.users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ user, message: 'Login successful' });
});

// Password Reset - Step 1: Verify email and get security question
router.post('/forgot-password/verify-email', async (req, res) => {
    const { email } = req.body;

    await db.read();
    const user = db.data.users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({ securityQuestion: user.securityQuestion });
});

// Password Reset - Step 2: Verify answer and reset password
router.post('/forgot-password/reset', async (req, res) => {
    const { email, securityAnswer, newPassword } = req.body;

    await db.read();
    const user = db.data.users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.securityAnswer !== securityAnswer) {
        return res.status(401).json({ message: 'Incorrect security answer' });
    }

    user.password = newPassword;
    await db.write();

    res.json({ message: 'Password reset successful' });
});

export default router;
