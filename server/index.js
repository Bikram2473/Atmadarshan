import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db from './db.js';
import authRoutes from './routes/auth.js';
import circularsRoutes from './routes/circulars.js';
import chatRoutes from './routes/chat.js';
import classesRoutes from './routes/classes.js';

import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import bugsRoutes from './routes/bugs.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ["GET", "POST"]
    }
});

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/circulars', circularsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/classes', classesRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bugs', bugsRoutes);

// Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('register_user', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} registered as ${userId}`);
    });

    socket.on('send_message', async (data) => {
        // data = { roomId, senderId, senderName, content, timestamp, messageType, fileUrl, fileName }

        // Check if sender is admin and block them
        await db.read();
        const sender = db.data.users.find(u => u.id === data.senderId);

        if (sender && sender.role === 'admin') {
            socket.emit('message_error', { message: 'Chat access is restricted to teachers and students only' });
            return;
        }

        // Check if sender is a member of the chat
        const chat = db.data.chats.find(c => c.id === data.roomId);
        if (!chat || !chat.members.includes(data.senderId)) {
            socket.emit('message_error', { message: 'You do not have access to this chat' });
            return;
        }

        const message = {
            ...data,
            id: Date.now().toString(),
            isDeleted: false,
            isForwarded: data.isForwarded || false,
            readBy: [data.senderId]
        };

        // Save to DB
        if (!db.data.messages) db.data.messages = [];
        db.data.messages.push(message);
        await db.write();

        // Broadcast to room
        io.to(data.roomId).emit('receive_message', message);

        // Notify members (for unread count)
        chat.members.forEach(memberId => {
            if (memberId !== data.senderId) {
                io.to(memberId).emit('new_message_notification', {
                    roomId: data.roomId,
                    messageId: message.id
                });
            }
        });
    });

    socket.on('delete_group', async (data) => {
        // data = { groupId, userId }
        await db.read();

        const group = db.data.chats.find(c => c.id === data.groupId && c.isGroup);

        if (group && group.createdBy === data.userId) {
            // Notify all members
            io.to(data.groupId).emit('group_deleted', { groupId: data.groupId });
        }
    });

    socket.on('leave_group', async (data) => {
        // data = { groupId, userId, userName }
        io.to(data.groupId).emit('user_left_group', {
            groupId: data.groupId,
            userId: data.userId,
            userName: data.userName
        });
    });

    socket.on('delete_message', async (data) => {
        // data = { messageId, roomId, userId }
        await db.read();

        const message = db.data.messages.find(m => m.id === data.messageId);

        if (message && message.senderId === data.userId) {
            // Notify all members in the room
            io.to(data.roomId).emit('message_deleted', {
                messageId: data.messageId,
                roomId: data.roomId
            });
        }
    });

    socket.on('forward_message', async (data) => {
        // data = { forwardedMessages, targetChatIds }
        // Notify each target chat about the new forwarded message
        data.forwardedMessages.forEach(msg => {
            io.to(msg.roomId).emit('receive_message', msg);
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
