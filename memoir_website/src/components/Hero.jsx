import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.jsx';
import memoirLogo from '../assets/memoirlogo.svg';
import memoirLogoLight from '../assets/memoirlight.svg';

const Hero = () => {
  const heroRef = useScrollAnimation("bottom 90%", "top 90%");
  const navigate = useNavigate();
  const { isDark, theme } = useTheme();

  console.log('Hero: Rendering with theme:', theme, 'isDark:', isDark);

  const logoSrc = isDark ? memoirLogoLight : memoirLogo;
  console.log('Hero: Using logo:', logoSrc.includes('light') ? 'LIGHT' : 'DARK');

  const handleTryForFree = () => {
    navigate('/upload', { viewTransition: true });
  };

  const handleWatchDemo = () => {
    // Placeholder for demo functionality
    console.log('Demo clicked - smooth scroll or modal can be added here');
  };

  return (
    <section ref={heroRef} className="theme-bg-primary">
      <div className="relative min-h-screen bg-gradient-to-b from-accent-color/10 to-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center items-center text-center">
          {/* Hero Icon */}
          <div className="mb-6">
            <div className="w-19 h-20 bg-accent-color/10 rounded-full flex items-center justify-center">
              <img 
                key={`hero-${theme}`}
                src={logoSrc} 
                alt="Memoir Logo" 
                className="w-19 h-20 transition-opacity duration-200" 
                onLoad={() => console.log('✅ Hero logo loaded:', logoSrc.includes('light') ? 'LIGHT' : 'DARK')}
              />
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold theme-text-primary mb-6 leading-tight max-w-4xl">
            Transform Notes into <span className="theme-accent-text">Organized</span> Notion Pages
          </h1>
          <p className="text-lg md:text-xl theme-text-muted mb-8 max-w-2xl leading-relaxed">
            Upload your messy handwritten notes and let AI convert them into beautifully structured Notion pages
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button 
              onClick={handleTryForFree}
              className="px-8 py-3 theme-accent-bg theme-on-accent-text rounded-[20px] text-lg font-bold hover:opacity-90 transition-opacity"
            >
              Try For Free
            </button>
            <button 
              onClick={handleWatchDemo}
              className="px-8 py-3 theme-bg-tertiary theme-text-primary rounded-[20px] text-lg font-bold theme-hover-bg transition-colors"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 