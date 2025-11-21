import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    isGroup: {
        type: Boolean,
        required: true,
        default: false
    },
    members: {
        type: [String],
        required: true
    },
    createdBy: {
        type: String
    },
    createdAt: {
        type: String,
        required: true
    }
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
