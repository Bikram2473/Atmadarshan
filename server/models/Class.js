import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
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
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    meetingLink: {
        type: String,
        required: true
    },
    taggedStudents: {
        type: [String],
        default: []
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: String,
        required: true
    }
});

const Class = mongoose.model('Class', classSchema);

export default Class;
