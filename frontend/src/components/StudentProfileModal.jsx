import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, ChevronDown, ChevronUp, User, BookOpen, MousePointer, Calendar, AlertTriangle, AlertCircle, CheckCircle, Info, FileText, Send, Lock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import avatarImg from '../assets/person icon.png';

const StudentProfileModal = ({ student, onClose }) => {
  const [openCards, setOpenCards] = useState({
    enrollment: false,
    engagement: false,
    risk: false
  });

  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (!student?.id) return;
    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/notes/${student.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotes(res.data || []);
      } catch (err) {
        console.error("Error fetching notes:", err);
      } finally {
        setLoadingNotes(false);
      }
    };
    fetchNotes();
  }, [student?.id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/notes`, {
        student_id: student.id,
        text: newNoteText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotes(prev => [res.data, ...prev]);
      setNewNoteText('');
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!student) return null;

  const toggleCard = (cardKey) => {
    setOpenCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const riskStyles = {
    'Green': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Yellow': 'bg-amber-100 text-amber-800 border-amber-200',
    'Red': 'bg-rose-100 text-rose-800 border-rose-200',
    'Black': 'bg-slate-800 text-white border-slate-900 line-through decoration-slate-500'
  };

  const demographics = student.demographics || {};
  const enrollmentInfo = student.enrollment_info || {};
  const engagement = student.engagement || { clicks: 0, active_days: 0, resources_viewed: 0 };
  const timeline = student.performance_timeline || [];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] my-auto border border-slate-200 dark:border-slate-800 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar (~25% width) */}
        <div className="w-full md:w-1/4 bg-slate-900 dark:bg-slate-950 text-slate-200 p-6 flex flex-col items-center text-center shrink-0 border-b md:border-b-0 md:border-r border-slate-800">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-indigo-500/30 bg-slate-800 shadow-inner flex items-center justify-center">
            <img 
              src={avatarImg} 
              alt="Student Avatar" 
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">{student.name}</h3>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md mt-1 border border-indigo-800/40">
            {student.id}
          </span>

          <div className="w-full pt-6 mt-6 border-t border-slate-800/80 text-left space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Course Enrolled</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">{student.course}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Stage</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">{student.stage}</p>
            </div>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="w-full md:w-3/4 p-6 overflow-y-auto space-y-6 relative flex flex-col justify-between">
          
          {/* Top Close Button */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Profile & Analytics</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Three Independently Expandable Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1 — Enrollment Info */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => toggleCard('enrollment')}
                className="w-full p-4 flex items-center justify-between font-bold text-slate-800 dark:text-white text-sm hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
              >
                <span>Enrollment Info</span>
                {openCards.enrollment ? <ChevronUp size={18} className="text-slate-500 dark:text-slate-400"/> : <ChevronDown size={18} className="text-slate-500 dark:text-slate-400"/>}
              </button>

              {openCards.enrollment && (
                <div className="p-4 pt-0 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Age Band:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{demographics.age_band || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Education:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{demographics.education || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">IMD Band:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{demographics.imd_band || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Module:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{enrollmentInfo.module || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Presentation:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{enrollmentInfo.presentation || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Status:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{enrollmentInfo.status || 'Active'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2 — Engagement Metrics */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => toggleCard('engagement')}
                className="w-full p-4 flex items-center justify-between font-bold text-slate-800 dark:text-white text-sm hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
              >
                <span>Engagement Metrics</span>
                {openCards.engagement ? <ChevronUp size={18} className="text-slate-500 dark:text-slate-400"/> : <ChevronDown size={18} className="text-slate-500 dark:text-slate-400"/>}
              </button>

              {openCards.engagement && (
                <div className="p-4 pt-0 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Total VLE Clicks:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{engagement.clicks}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Active Days:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{engagement.active_days}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Resources Viewed:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{engagement.resources_viewed}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Timeline Stage:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{student.stage}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3 — Risk & Performance */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => toggleCard('risk')}
                className="w-full p-4 flex items-center justify-between font-bold text-slate-800 dark:text-white text-sm hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
              >
                <span>Risk & Performance</span>
                {openCards.risk ? <ChevronUp size={18} className="text-slate-500 dark:text-slate-400"/> : <ChevronDown size={18} className="text-slate-500 dark:text-slate-400"/>}
              </button>

              {openCards.risk && (
                <div className="p-4 pt-0 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Fail Probability:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{(student.prob * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Risk Status:</span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${riskStyles[student.risk]}`}>
                      {student.risk}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Confidence:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {typeof student.confidence === 'number' ? (student.confidence * 100).toFixed(0) + '%' : student.confidence || '80%'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Weak Topic:</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{student.weakTopic}</span>
                  </div>
                  <div className="pt-1">
                    <span className="font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Feedback:</span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg leading-relaxed border border-slate-100 dark:border-slate-700">
                      {student.feedback || 'No feedback generated.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Performance Timeline Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4 transition-colors duration-200">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center justify-between">
              <span>Progressive Prediction Timeline</span>
              <span className="text-xs text-slate-400 font-normal">Score progression</span>
            </h4>
            <div className="h-44 w-full">
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.3} />
                    <XAxis 
                      dataKey="stage" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '10px', border: 'none', backgroundColor: '#1e293b', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                      formatter={(value, name, props) => [`Score: ${value}`, `Risk: ${props.payload.risk}`]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} 
                      activeDot={{ r: 7, fill: "#4f46e5" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No timeline data recorded
                </div>
              )}
            </div>
          </div>

          {/* Teacher Notes Section (Private, Per-Teacher) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4 space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Teacher Notes</span>
              </h4>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Lock size={12} /> Private to you
              </span>
            </div>

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                disabled={submittingNote}
                placeholder="Add a private note about this student..."
                rows={3}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim() || submittingNote}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  {submittingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>

            {/* Notes History */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {loadingNotes ? (
                <div className="text-center py-4 text-xs text-slate-400">Loading notes...</div>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note._id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  No notes yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
