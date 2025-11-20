import express from 'express';
import multer from 'multer';
import db from '../db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `qr-${Date.now()}${join('', file.originalname.substring(file.originalname.lastIndexOf('.')))}`
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get current payment settings
router.get('/', async (req, res) => {
    try {
        await db.read();
        const settings = db.data.settings || {};
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// Upload QR code
router.post('/qr-code', upload.single('qrCode'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const qrCodeUrl = `/uploads/${req.file.filename}`;

        await db.read();
        if (!db.data.settings) db.data.settings = {};
        db.data.settings.qrCodeUrl = qrCodeUrl;
        await db.write();

        res.json({ message: 'QR code uploaded successfully', qrCodeUrl });
    } catch (error) {
        console.error('Error uploading QR code:', error);
        res.status(500).json({ message: 'Failed to upload QR code' });
    }
});

// Delete QR code
router.delete('/qr-code', async (req, res) => {
    try {
        await db.read();

        if (!db.data.settings || !db.data.settings.qrCodeUrl) {
            return res.status(404).json({ message: 'No QR code found' });
        }

        // Delete the file from disk
        const fs = await import('fs');
        const filePath = join(__dirname, '..', db.data.settings.qrCodeUrl);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from database
        db.data.settings.qrCodeUrl = null;
        await db.write();

        res.json({ message: 'QR code deleted successfully' });
    } catch (error) {
        console.error('Error deleting QR code:', error);
        res.status(500).json({ message: 'Failed to delete QR code' });
    }
});

export default router;
