import Chat from '../models/Chat.js';
import Repository from '../models/Repository.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateChatResponse } from '../services/aiService.js';

/**
 * Sends a message to the AI about a specific repository and saves history.
 */
export const sendMessage = async (req, res) => {
  const { message } = req.body;
  const { repoId } = req.params;
  const userId = req.user._id;

  // Validate req.body.message is present and non-empty string
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new AppError('Message is required and must be a non-empty string', 400);
  }

  // Limit message length to 2000 characters
  if (message.length > 2000) {
    throw new AppError('Message exceeds maximum limit of 2000 characters', 400);
  }

  // Find Repository by req.params.repoId
  const repo = await Repository.findById(repoId);
  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  // Verify ownership
  if (repo.userId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  // If repo.status !== 'done'
  if (repo.status !== 'done') {
    throw new AppError('Repository analysis not complete. Please wait for analysis to finish.', 400);
  }

  // Find or create Chat
  const chat = await Chat.findOneAndUpdate(
    { userId, repoId },
    { $setOnInsert: { userId, repoId } },
    { upsert: true, new: true }
  );

  // Limit conversation history to last 20 messages (performance)
  const history = chat.messages.slice(-20).map(m => ({
    role: m.role,
    content: m.content
  }));

  // Call generateChatResponse
  const result = await generateChatResponse(repo, history, message);

  // Push both messages to chat.messages
  chat.messages.push(
    { role: 'user', content: message, citations: [] },
    { role: 'assistant', content: result.text, citations: result.citations }
  );

  // Trim chat.messages to last 100 messages to prevent unbounded growth
  if (chat.messages.length > 100) {
    chat.messages = chat.messages.slice(-100);
  }

  await chat.save();

  // Return response
  res.status(200).json({
    success: true,
    message: result.text,
    citations: result.citations
  });
};

/**
 * Retrieves the chat history for a specific repository.
 */
export const getHistory = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;

  // Find Chat
  const chat = await Chat.findOne({ userId, repoId });
  if (!chat) {
    return res.status(200).json({
      success: true,
      messages: []
    });
  }

  // Return messages
  res.status(200).json({
    success: true,
    messages: chat.messages,
    count: chat.messages.length
  });
};

/**
 * Clears the chat history for a repository.
 */
export const clearHistory = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;

  // Find Chat, verify userId matches
  const chat = await Chat.findOne({ repoId });
  if (!chat) {
    return res.status(200).json({
      success: true,
      message: 'Chat history cleared'
    });
  }

  if (chat.userId.toString() !== userId.toString()) {
    throw new AppError('Not authorized to clear this chat history', 403);
  }

  // Set chat.messages = [] and save
  chat.messages = [];
  await chat.save();

  // Return success
  res.status(200).json({
    success: true,
    message: 'Chat history cleared'
  });
};

export default {
  sendMessage,
  getHistory,
  clearHistory
};
