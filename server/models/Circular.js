import mongoose from 'mongoose';

const circularSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    createdAt: {
        type: String,
        required: true
    }
});

const Circular = mongoose.model('Circular', circularSchema);

export default Circular;
