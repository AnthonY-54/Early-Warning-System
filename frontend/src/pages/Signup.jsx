import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, Mail, Lock, Key, AlertCircle, CheckCircle2, IdCard, Sun, Moon } from 'lucide-react';

const Signup = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (role === 'teacher' && !teacherId.trim()) {
      setError('Teacher ID is required for teacher registration.');
      return;
    }

    if (role === 'student' && !studentId.trim()) {
      setError('Student ID is required for student registration.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        password,
        role,
        ...(role === 'teacher' && { teacherId: teacherId.trim() }),
        ...(role === 'student' && { studentId: studentId.trim() })
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/auth/register`, payload);


      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to connect to backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 relative transition-colors duration-200">

      {/* Top Right Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 text-slate-300 dark:text-slate-400 rounded-2xl shadow-lg hover:text-white transition-all"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
      </button>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6 transition-colors duration-200">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <UserPlus className="text-indigo-600 dark:text-indigo-400" size={32} />
            Create Account
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Select your role to sign up for Early Warning System
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setRole('student'); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              role === 'student'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => { setRole('teacher'); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              role === 'teacher'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Teacher
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'student' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. S101"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Formatted as S followed by 3 digits (e.g., S101).</p>
            </div>
          )}

          {role === 'teacher' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Teacher ID</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  placeholder="e.g. T101"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Must be a valid ID issued by your school staff system.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-900/20 transition-all duration-200 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : `Register as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;


