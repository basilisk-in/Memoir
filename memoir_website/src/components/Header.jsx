import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import SignInModal from './SignInModal';
import { useTheme } from '../hooks/useTheme.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import memoirLogo from '../assets/memoirlogo.svg';
import memoirLogoLight from '../assets/memoirlight.svg';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { isDark, theme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  console.log('Header: Rendering with theme:', theme, 'isDark:', isDark);

  const logoSrc = isDark ? memoirLogoLight : memoirLogo;
  console.log('Header: Using logo:', logoSrc.includes('light') ? 'LIGHT' : 'DARK');

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/', { viewTransition: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { viewTransition: true });
  };

  return (
    <header className="theme-border-color theme-bg-primary sticky top-0 z-40" style={{ borderBottomWidth: '2px', borderBottomStyle: 'dashed' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" onClick={handleLogoClick} className="flex items-center">
              {/* Theme-reactive Logo */}
              <img 
                key={`header-${theme}`}
                src={logoSrc} 
                alt="Memoir Logo" 
                className="w-11 h-12 transition-opacity duration-200" 
                onLoad={() => console.log('✅ Header logo loaded:', logoSrc.includes('light') ? 'LIGHT' : 'DARK')}
              />
            </Link>
            <Link to="/" onClick={handleLogoClick} className="text-lg font-bold theme-text-primary">memoir</Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-9">
            {isAuthenticated ? (
              <>
                <Link to="/upload" className="text-sm font-medium theme-text-primary hover:opacity-70 transition-opacity">
                  Upload
                </Link>
                <Link to="/documents" className="text-sm font-medium theme-text-primary hover:opacity-70 transition-opacity">
                  My Documents
                </Link>
              </>
            ) : (
              <>
                <a href="#how-it-works" className="text-sm font-medium theme-text-primary hover:opacity-70 transition-opacity">
                  How It Works
                </a>
                <a href="#use-cases" className="text-sm font-medium theme-text-primary hover:opacity-70 transition-opacity">
                  Use Cases
                </a>
                <a href="#features" className="text-sm font-medium theme-text-primary hover:opacity-70 transition-opacity">
                  Features
                </a>
              </>
            )}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm theme-text-muted">
                  Welcome, {user?.username}
                </span>
                <button 
                  onClick={handleLogout}
                  className="px-4 h-10 theme-bg-tertiary theme-text-primary rounded-[20px] text-sm font-bold theme-hover-bg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSignInModalOpen(true)}
                className="px-4 h-10 theme-bg-tertiary theme-text-primary rounded-[20px] text-sm font-bold theme-hover-bg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 theme-text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--border-color)' }}>
            <nav className="flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/upload" className="text-sm font-medium theme-text-primary hover:opacity-70">
                    Upload
                  </Link>
                  <Link to="/documents" className="text-sm font-medium theme-text-primary hover:opacity-70">
                    My Documents
                  </Link>
                </>
              ) : (
                <>
                  <a href="#how-it-works" className="text-sm font-medium theme-text-primary hover:opacity-70">
                    How It Works
                  </a>
                  <a href="#use-cases" className="text-sm font-medium theme-text-primary hover:opacity-70">
                    Use Cases
                  </a>
                  <a href="#features" className="text-sm font-medium theme-text-primary hover:opacity-70">
                    Features
                  </a>
                </>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <span className="text-sm theme-text-muted">Theme</span>
                </div>
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm theme-text-muted">
                      Welcome, {user?.username}
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="px-4 h-10 theme-bg-tertiary theme-text-primary rounded-[20px] text-sm font-bold"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSignInModalOpen(true)}
                    className="px-4 h-10 theme-bg-tertiary theme-text-primary rounded-[20px] text-sm font-bold"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={isSignInModalOpen} 
        onClose={() => setIsSignInModalOpen(false)} 
      />
    </header>
  );
};

export default Header; 