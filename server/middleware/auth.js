import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized — no token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('Token invalid or expired', 401);
  }
};

export default protect;

