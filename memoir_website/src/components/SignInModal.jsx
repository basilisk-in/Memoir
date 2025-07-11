import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../hooks/useAuth';
import { createPortal } from 'react-dom';

const SignInModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  const handleClose = () => {
    if (isSigningIn) return;
    setError('');

    const tl = gsap.timeline({
      onComplete: () => {
        onClose();
        if (overlayRef.current) {
          // Reset display property for next time it opens
          gsap.set(overlayRef.current, { display: 'none' });
        }
      }
    });

    if (contentRef.current && contentRef.current.children.length > 0) {
      tl.to(contentRef.current.children, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        stagger: 0.05,
        ease: "power2.in"
      });
    }

    if (modalRef.current) {
      tl.to(modalRef.current, {
        scale: 0.7,
        opacity: 0,
        y: 50,
        duration: 0.3,
        ease: "back.in(1.7)"
      }, "-=0.1");
    }

    if (overlayRef.current) {
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in"
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!overlayRef.current || !modalRef.current || !contentRef.current) {
      return; 
    }

    const ctx = gsap.context(() => {
        gsap.set(overlayRef.current, { display: 'flex' });
        
        const tl = gsap.timeline();
        
        tl.fromTo(overlayRef.current, 
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        )
        .fromTo(modalRef.current,
          { scale: 0.7, opacity: 0, y: 50 },
          { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" },
          "-=0.1"
        )
        .fromTo(contentRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        );
    });

    return () => ctx.revert();
  }, [isOpen]);

  useEffect(() => {
    return () => {
      const elementsToCleanup = [overlayRef.current, modalRef.current, contentRef.current].filter(Boolean);
      elementsToCleanup.forEach(element => {
        if (element) {
          gsap.killTweensOf(element);
          const children = element.querySelectorAll('*');
          gsap.killTweensOf(Array.from(children));
        }
      });
    }
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const result = await login(username, password);
      
      if (result.success) {
        onClose();
        // Use view transition for smooth navigation
        navigate('/upload', { viewTransition: true });
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="theme-bg-primary theme-border-color shadow-theme-lg rounded-2xl w-full max-w-md p-8 relative"
        style={{ border: '2px solid' }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSigningIn}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full theme-text-muted hover:theme-bg-tertiary transition-colors text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          ×
        </button>

        <div ref={contentRef}>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold theme-text-primary mb-2">Welcome Back</h2>
            <p className="theme-text-muted">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium theme-text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                disabled={isSigningIn}
                className="w-full px-4 py-3 rounded-lg theme-bg-secondary theme-text-primary theme-border-color border-2 focus:theme-accent-bg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your username"
                style={{ '--focus-ring-color': 'var(--accent-color)' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium theme-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                disabled={isSigningIn}
                className="w-full px-4 py-3 rounded-lg theme-bg-secondary theme-text-primary theme-border-color border-2 focus:theme-accent-bg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                style={{ '--focus-ring-color': 'var(--accent-color)' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-3 px-4 theme-accent-bg theme-on-accent-text rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ '--focus-ring-color': 'var(--accent-color)' }}
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm theme-text-muted">
              Don't have an account?{' '}
              <button 
                disabled={isSigningIn}
                className="theme-accent-text hover:opacity-70 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SignInModal; 