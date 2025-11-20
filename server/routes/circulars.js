import express from 'express';
import db from '../db.js';
import { nanoid } from 'nanoid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all circulars
router.get('/', async (req, res) => {
    await db.read();
    // Sort by date desc
    const circulars = [...(db.data.circulars || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(circulars);
});

// Create circular (Teacher only)
router.post('/', upload.single('file'), async (req, res) => {
    const { title, content, authorName } = req.body;
    const file = req.file;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    const newCircular = {
        id: nanoid(),
        title,
        content,
        authorName,
        createdAt: new Date().toISOString(),
        fileUrl: file ? `/uploads/${file.filename}` : null,
        fileName: file ? file.originalname : null,
        fileType: file ? file.mimetype : null
    };

    await db.read();
    if (!db.data.circulars) db.data.circulars = [];
    db.data.circulars.push(newCircular);
    await db.write();

    res.status(201).json(newCircular);
});

// Delete circular (Teacher only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await db.read();

    const circularIndex = db.data.circulars.findIndex(c => c.id === id);
    if (circularIndex === -1) {
        return res.status(404).json({ message: 'Circular not found' });
    }

    const circular = db.data.circulars[circularIndex];

    // Delete file if exists
    if (circular.fileUrl) {
        const filePath = path.join(__dirname, '..', circular.fileUrl);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }
    }

    db.data.circulars.splice(circularIndex, 1);
    await db.write();

    res.json({ message: 'Circular deleted successfully' });
});

// Update circular (Teacher only)
router.put('/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const file = req.file;

    await db.read();
    const circularIndex = db.data.circulars.findIndex(c => c.id === id);

    if (circularIndex === -1) {
        return res.status(404).json({ message: 'Circular not found' });
    }

    const circular = db.data.circulars[circularIndex];

    // Update fields
    if (title) circular.title = title;
    if (content) circular.content = content;

    // Handle file update
    if (file) {
        // Delete old file if exists
        if (circular.fileUrl) {
            const oldFilePath = path.join(__dirname, '..', circular.fileUrl);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (err) {
                    console.error('Error deleting old file:', err);
                }
            }
        }

        circular.fileUrl = `/uploads/${file.filename}`;
        circular.fileName = file.originalname;
        circular.fileType = file.mimetype;
    }

    db.data.circulars[circularIndex] = circular;
    await db.write();

    res.json(circular);
});

export default router;
