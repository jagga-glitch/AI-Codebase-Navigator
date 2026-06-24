import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const dest = location.state?.redirectUrl || '/dashboard';
      navigate(dest, { replace: true, state: location.state });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      toast.success('Account created successfully!');
      // Redirection is handled by the useEffect above
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try a different email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col justify-center items-center px-container-padding relative">
      {/* Background decoration */}
      <div className="absolute inset-0 hero-mesh opacity-20 pointer-events-none"></div>
      <div className="absolute w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-container border border-outline-variant p-stack-lg rounded-2xl relative z-10 shadow-2xl">
        <div className="text-center mb-stack-lg">
          <Link to="/" className="font-headline-md text-headline-md font-black text-primary tracking-tighter block mb-1">
            Navigator
          </Link>
          <h2 className="text-body-lg font-bold text-on-surface">Create an Account</h2>
          <p className="text-xs text-on-surface-variant mt-1">Get started mapping your codebases</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-stack-lg pt-4 border-t border-outline-variant/30 text-center">
          <p className="text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
