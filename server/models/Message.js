import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    roomId: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    files: {
        type: [String],
        default: []
    },
    sentAt: {
        type: String,
        required: true
    },
    reactions: {
        type: Map,
        of: [String],
        default: new Map()
    },
    edited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedFor: {
        type: [String],
        default: []
    }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
