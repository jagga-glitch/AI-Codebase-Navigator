import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';
import User from '../models/User.js';

// Helper function generateToken(userId): returns jwt.sign with 7d expiry
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper function sanitizeUser(user): returns { id, name, email, createdAt } — never expose password
const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user)
  });
};

export default {
  register,
  login,
  getMe
};

