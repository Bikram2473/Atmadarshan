import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reportedBy: {
        type: String,
        required: true
    },
    reporterName: {
        type: String,
        required: true
    },
    reporterRole: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
    },
    createdAt: {
        type: String,
        required: true
    }
});

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;
