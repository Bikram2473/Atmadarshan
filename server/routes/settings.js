import express from 'express';
import multer from 'multer';
import Settings from '../models/Settings.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '../uploads/');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `qr-${Date.now()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
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
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ qrCodeUrl: null });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// Upload QR code
router.post('/qr-code', upload.single('qrCode'), async (req, res) => {
    try {
        console.log('QR Code upload request received');
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const qrCodeUrl = `/uploads/${req.file.filename}`;
        console.log('QR Code URL:', qrCodeUrl);

        let settings = await Settings.findOne();
        console.log('Existing settings:', settings);

        if (!settings) {
            console.log('Creating new settings document');
            settings = await Settings.create({ qrCodeUrl });
        } else {
            console.log('Updating existing settings');
            settings.qrCodeUrl = qrCodeUrl;
            await settings.save();
        }

        console.log('QR code uploaded successfully');
        res.json({ message: 'QR code uploaded successfully', qrCodeUrl });
    } catch (error) {
        console.error('Error uploading QR code:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Failed to upload QR code', error: error.message });
    }
});

// Delete QR code
router.delete('/qr-code', async (req, res) => {
    try {
        const settings = await Settings.findOne();

        if (!settings || !settings.qrCodeUrl) {
            return res.status(404).json({ message: 'No QR code found' });
        }

        // Delete the file from disk
        const filePath = join(__dirname, '..', settings.qrCodeUrl);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from database
        settings.qrCodeUrl = null;
        await settings.save();

        res.json({ message: 'QR code deleted successfully' });
    } catch (error) {
        console.error('Error deleting QR code:', error);
        res.status(500).json({ message: 'Failed to delete QR code' });
    }
});

export default router;
