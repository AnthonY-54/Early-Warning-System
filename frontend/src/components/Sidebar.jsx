import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Users, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Student View', path: '/', icon: GraduationCap, role: 'student' },
    { name: 'Teacher View', path: '/teacher', icon: LayoutDashboard, role: 'teacher' },
  ];

  // Only show nav items that match the user's role
  const visibleNavItems = navItems.filter((item) => user && item.role === user.role);

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col pt-6 border-r border-slate-800">
      <div className="px-6 mb-8">
        <h2 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
          <Users className="text-indigo-500" />
          EWS Platform
        </h2>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium text-sm"
        >
          <span className="flex items-center gap-3">
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors font-medium text-sm"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>

        <p className="text-xs text-slate-500 text-center font-medium tracking-wide pt-1">
          v1.2 Predictive Model Active
        </p>
      </div>
    </div>
  );
};

export default Sidebar;


