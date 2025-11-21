import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'general'
    },
    priority: {
        type: String,
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
    },
    createdAt: {
        type: String,
        required: true
    },
    resolvedAt: {
        type: String,
        default: null
    }
});

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;
