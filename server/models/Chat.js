import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    citations: [String],
    timestamp: {
      type: Date,
      default: Date.now
    },
    _id: false
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: one chat thread per user per repository
chatSchema.index({ userId: 1, repoId: 1 }, { unique: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
