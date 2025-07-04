import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import LandingPage from './components/LandingPage'
import Upload from './components/Upload'
import MyDocuments from './components/MyDocuments'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen theme-bg-primary theme-text-primary transition-colors duration-300">
            <Header />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/upload" element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <MyDocuments />
                </ProtectedRoute>
              } />
            </Routes>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
