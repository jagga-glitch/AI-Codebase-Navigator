import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

console.log('AUTH ROUTES LOADED');

router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Auth router working'
  });
});
export default router;