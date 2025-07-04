import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  // Simple initial theme detection
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme immediately
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme', theme);
    
    // Debug log
    console.log('Theme context updated to:', theme);
  }, [theme]);

  // Simple toggle function
  const toggleTheme = useCallback(() => {
    setTheme(current => {
      const newTheme = current === 'light' ? 'dark' : 'light';
      console.log('Context toggling theme from', current, 'to', newTheme);
      return newTheme;
    });
  }, []);

  const isDark = theme === 'dark';

  const contextValue = {
    theme,
    toggleTheme,
    isDark
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 