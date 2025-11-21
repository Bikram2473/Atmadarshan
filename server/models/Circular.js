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
    description: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true
    },
    files: {
        type: [String],
        default: []
    },
    createdAt: {
        type: String,
        required: true
    },
    updatedAt: {
        type: String
    }
});

const Circular = mongoose.model('Circular', circularSchema);

export default Circular;
