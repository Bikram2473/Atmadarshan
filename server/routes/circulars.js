import express from 'express';
import Circular from '../models/Circular.js';
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
    const circulars = await Circular.find().sort({ createdAt: -1 });
    res.json(circulars);
});

// Create circular (Teacher only)
router.post('/', upload.single('file'), async (req, res) => {
    const { title, content, authorName } = req.body;
    const file = req.file;

    // Require either (title AND content) OR a file attachment
    if (!file && (!title || !content)) {
        return res.status(400).json({ message: 'Either provide title and content, or attach a file' });
    }

    const newCircular = {
        id: nanoid(),
        title: title || (file ? file.originalname : 'Untitled'),
        content: content || '',
        authorName,
        createdAt: new Date().toISOString(),
        fileUrl: file ? `/uploads/${file.filename}` : null,
        fileName: file ? file.originalname : null,
        fileType: file ? file.mimetype : null
    };

    await Circular.create(newCircular);

    res.status(201).json(newCircular);
});

// Delete circular (Teacher only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const circular = await Circular.findOne({ id });
    if (!circular) {
        return res.status(404).json({ message: 'Circular not found' });
    }

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

    await Circular.deleteOne({ id });

    res.json({ message: 'Circular deleted successfully' });
});

// Update circular (Teacher only)
router.put('/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const file = req.file;

    const circular = await Circular.findOne({ id });

    if (!circular) {
        return res.status(404).json({ message: 'Circular not found' });
    }

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

    await circular.save();

    res.json(circular);
});

export default router;
