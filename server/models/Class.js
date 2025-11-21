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
    link: {
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
    taggedStudents: {
        type: [String],
        default: []
    },
    teacherId: {
        type: String,
        required: true
    },
    teacherName: {
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
