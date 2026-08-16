import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'teacher' ? '/teacher' : '/'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'teacher' ? '/teacher' : '/'} replace />
          ) : (
            <Signup />
          )
        }
      />

      {/* Protected Layout Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm p-4 flex justify-between items-center transition-colors duration-200">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Early Warning System
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      Logged in as: <strong className="text-slate-800 dark:text-white">{user?.email}</strong> ({user?.role})
                    </span>
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                      {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                    </button>
                  </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-200">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher"
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <TeacherDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

