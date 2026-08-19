import React, { useState } from 'react';
import { X, ArrowLeft, MousePointer, BookOpen, Calendar, AlertTriangle, Sparkles, Mail, RefreshCw } from 'lucide-react';

const InterventionsModal = ({ isOpen, onClose, students = [], classAverages = {} }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const riskStyles = {
    'Green': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    'Yellow': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    'Red': 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    'Black': 'bg-slate-800 text-white border-slate-900 line-through decoration-slate-500 dark:bg-slate-950 dark:text-slate-200'
  };

  // Filter Red & Black risk students only, sort Black first then Red
  const interventionStudents = students
    .filter(s => s.risk === 'Red' || s.risk === 'Black')
    .sort((a, b) => {
      if (a.risk === 'Black' && b.risk !== 'Black') return -1;
      if (a.risk !== 'Black' && b.risk === 'Black') return 1;
      return 0;
    });

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setIsFlipped(false);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedStudent(null);
    setIsFlipped(false);
  };

  const handleCloseModal = () => {
    setCurrentView('list');
    setSelectedStudent(null);
    setIsFlipped(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentView === 'list' ? 'Priority Interventions Register' : 'Student Intervention Profile'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentView === 'list' 
                  ? `${interventionStudents.length} high-risk student(s) requiring immediate attention`
                  : `Detailed risk & engagement metrics for ${selectedStudent?.name || 'Student'}`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={handleCloseModal}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentView === 'list' ? (
            /* SCREEN 1: COHORT LIST VIEW */
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Student ID</th>
                      <th className="px-6 py-3.5">Failure Probability</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-sm">
                    {interventionStudents.length > 0 ? (
                      interventionStudents.map((student) => (
                        <tr 
                          key={student.id} 
                          onClick={() => handleSelectStudent(student)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {student.id}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {(student.prob * 100).toFixed(0)}%
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${riskStyles[student.risk] || 'bg-slate-100 text-slate-800'}`}>
                              {student.risk}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                          No high-risk students currently requiring intervention.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* SCREEN 2: STUDENT DETAIL VIEW */
            selectedStudent && (
              <div className="space-y-6">
                {/* Back Button & Banner */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={handleBackToList}
                    className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Cohort List
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Course: {selectedStudent.course || 'N/A'}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${riskStyles[selectedStudent.risk]}`}>
                      {selectedStudent.risk}
                    </span>
                  </div>
                </div>

                {/* Section A: Engagement Snapshot (Student vs Class Average) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Section A — Engagement Snapshot (Student vs. Class Average)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* VLE Clicks */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <MousePointer size={16} className="text-indigo-500" />
                        <span>Total VLE Clicks</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Student</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {selectedStudent.engagement?.clicks ?? 0}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 uppercase font-semibold">Class Avg</div>
                          <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                            {classAverages?.clicks ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resources Viewed */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <BookOpen size={16} className="text-emerald-500" />
                        <span>Resources Viewed</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Student</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {selectedStudent.engagement?.resources_viewed ?? 0}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 uppercase font-semibold">Class Avg</div>
                          <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                            {classAverages?.resourcesViewed ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Days */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <Calendar size={16} className="text-amber-500" />
                        <span>Active Days</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <div className="text-xs text-slate-400 uppercase font-semibold">Student</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {selectedStudent.engagement?.active_days ?? 0}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 uppercase font-semibold">Class Avg</div>
                          <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                            {classAverages?.activeDays ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Weak Topic */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Section B — Weak Topic Analysis
                  </h3>
                  <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-center gap-3">
                    <Sparkles size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Primary Weak Area</div>
                      <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {selectedStudent.weakTopic || 'No specific weak topic identified'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Suggested Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Section C — Suggested Actions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Action 1: Static Card */}
                    <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase">
                          <BookOpen size={16} /> Action 1
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Suggest Extra Resources & Quizzes
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                          Recommend targeted remedial materials and self-assessment quizzes on{' '}
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {selectedStudent.weakTopic || 'weak topics'}
                          </span>.
                        </p>
                      </div>
                      <div className="pt-2 text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                        Read-only recommendation
                      </div>
                    </div>

                    {/* Action 2: Card Flip Animation */}
                    <div className="w-full h-40 [perspective:1000px]">
                      <div 
                        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                          isFlipped ? '[transform:rotateY(180deg)]' : ''
                        }`}
                      >
                        {/* Front Face */}
                        <div 
                          onClick={() => setIsFlipped(true)}
                          className="absolute inset-0 w-full h-full p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-md cursor-pointer [backface-visibility:hidden] flex flex-col justify-between hover:from-indigo-600 hover:to-indigo-800 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase">
                              <Mail size={16} /> Action 2
                            </div>
                            <h4 className="text-base font-bold">Contact the Student</h4>
                            <p className="text-xs text-indigo-100 pt-1">
                              Initiate direct outreach and schedule an intervention meeting.
                            </p>
                          </div>
                          <div className="text-xs font-semibold underline decoration-indigo-300 flex items-center gap-1">
                            Click to execute action &rarr;
                          </div>
                        </div>

                        {/* Back Face */}
                        <div 
                          onClick={() => setIsFlipped(false)}
                          className="absolute inset-0 w-full h-full p-5 bg-slate-800 text-white rounded-xl shadow-md cursor-pointer [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between border border-slate-700"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Notice</span>
                              <RefreshCw size={14} className="text-slate-400" />
                            </div>
                            <h4 className="text-lg font-bold text-white pt-1">Feature coming soon</h4>
                            <p className="text-xs text-slate-300">
                              Direct student messaging and automated intervention tracking will be enabled in Cycle 3.
                            </p>
                          </div>
                          <div className="text-xs text-slate-400 underline">
                            Click to flip back
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InterventionsModal;
