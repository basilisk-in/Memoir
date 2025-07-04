import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ 
        backgroundColor: '#fdf6e3', 
        color: '#282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#b57614' }}></div>
      </div>
    );
  }

  // Render children only if authenticated
  return isAuthenticated ? children : null;
};

export default ProtectedRoute; 