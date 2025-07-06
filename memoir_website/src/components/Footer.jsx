import { FaTwitter, FaLinkedin, FaGithub, FaDiscord } from 'react-icons/fa';
import { useScrollAnimation, useStaggeredAnimation } from '../hooks/useScrollAnimation';
import { useTheme } from '../hooks/useTheme.jsx';
import memoirLogo from '../assets/memoirlogo.svg';
import memoirLogoLight from '../assets/memoirlight.svg';

const Footer = () => {
  const columnsRef = useStaggeredAnimation('.animate-item', 0.1);
  const bottomRef = useScrollAnimation();
  const { isDark, theme } = useTheme();

  console.log('Footer: Rendering with theme:', theme, 'isDark:', isDark);

  const logoSrc = isDark ? memoirLogoLight : memoirLogo;
  console.log('Footer: Using logo:', logoSrc.includes('light') ? 'LIGHT' : 'DARK');

  const footerLinks = [
    { label: 'About', href: '#about' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Contact Us', href: '#contact' }
  ];

  const socialIcons = [
    { label: 'Twitter', icon: '🐦' },
    { label: 'LinkedIn', icon: '💼' },
    { label: 'GitHub', icon: '💻' }
  ];

  return (
    <footer className="theme-bg-secondary py-12" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--border-color)' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div ref={columnsRef} className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1 animate-item">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <img 
                  key={`footer-${theme}`}
                  src={logoSrc} 
                  alt="Memoir Logo" 
                  className="w-11 h-12 transition-opacity duration-200" 
                  onLoad={() => console.log('✅ Footer logo loaded:', logoSrc.includes('light') ? 'LIGHT' : 'DARK')}
                />
              </div>
              <h1 className="text-lg font-bold theme-text-primary">memoir</h1>
            </div>
            <p className="theme-text-muted text-sm leading-relaxed mb-6">
              Transform your messy notes into organized Notion pages with the power of AI.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="#" className="theme-text-muted hover:opacity-70 transition-colors">
                <FaTwitter className="w-5 h-5 theme-icon" />
              </a>
              <a href="#" className="theme-text-muted hover:opacity-70 transition-colors">
                <FaLinkedin className="w-5 h-5 theme-icon" />
              </a>
              <a href="https://github.com/basilisk-in" className="theme-text-muted hover:opacity-70 transition-colors">
                <FaGithub className="w-5 h-5 theme-icon" />
              </a>
              <a href="#" className="theme-text-muted hover:opacity-70 transition-colors">
                <FaDiscord className="w-5 h-5 theme-icon" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="animate-item">
            <h3 className="text-sm font-semibold theme-text-primary mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  How it Works
                </a>
              </li>
              {/* <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  API
                </a>
              </li> */}
            </ul>
          </div>

          {/* Company Links */}
          <div className="animate-item">
            <h3 className="text-sm font-semibold theme-text-primary mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="animate-item">
            <h3 className="text-sm font-semibold theme-text-primary mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div ref={bottomRef} className="mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--border-color)' }}>
          <p className="theme-text-muted text-sm">
            © 2025 Memoir. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
              Terms
            </a>
            <a href="#" className="theme-text-muted hover:opacity-70 transition-colors text-sm">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 