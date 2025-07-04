import { useTheme } from '../hooks/useTheme.jsx';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button 
      className="relative flex items-center justify-center hover:opacity-80 transition-opacity duration-200 cursor-pointer h-10 px-1"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Current theme: ${theme}. Click to toggle.`}
      style={{ background: 'none', border: 'none' }}
    >
      {/* Slider Track */}
      <div className="relative w-12 h-6 rounded-full theme-bg-secondary border border-opacity-20 flex items-center" style={{ borderColor: 'var(--border-color)' }}>
        {/* Sliding Thumb */}
        <div 
          className="absolute w-5 h-5 rounded-full theme-accent-bg flex items-center justify-center transition-all duration-300 ease-out"
          style={{
            left: isDark ? '26px' : '2px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          {/* Icon in the thumb */}
          <span className="text-xs leading-none" style={{ color: 'var(--bg-primary)' }}>
            {isDark ? '☀' : '☾'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle; 