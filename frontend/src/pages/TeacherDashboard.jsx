import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, FileWarning, Search, Filter, AlertOctagon, Check } from 'lucide-react';
import StudentProfileModal from '../components/StudentProfileModal';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filterRef = useRef(null);


  useEffect(() => {
    // Fetch Teacher Overview Data
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    axios.get(`${API_URL}/api/dashboard/teacher/overview`)
      .then(res => {

        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data: ", err);
        setLoading(false);
      });
  }, []);

  // Outside click listener for filter popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!data) return <div>Failed to load data.</div>;

  const riskStyles = {
    'Green': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Yellow': 'bg-amber-100 text-amber-800 border-amber-200',
    'Red': 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse',
    'Black': 'bg-slate-800 text-white border-slate-900 line-through decoration-slate-500'
  };

  const riskOptions = ['Green', 'Yellow', 'Red', 'Black'];

  const handleRiskToggle = (risk) => {
    if (selectedRisks.includes(risk)) {
      setSelectedRisks(selectedRisks.filter(r => r !== risk));
    } else {
      setSelectedRisks([...selectedRisks, risk]);
    }
  };

  // Client-side multi-field Search + Status Filter
  const filteredStudents = data.students.filter(student => {
    const query = searchTerm.toLowerCase().trim();
    
    // Search matches across name, id, course, weakTopic
    const matchesSearch = !query || 
      (student.name && student.name.toLowerCase().includes(query)) ||
      (student.id && student.id.toLowerCase().includes(query)) ||
      (student.course && student.course.toLowerCase().includes(query)) ||
      (student.weakTopic && student.weakTopic.toLowerCase().includes(query));

    // Filter matches selected risk statuses (empty means show all)
    const matchesFilter = selectedRisks.length === 0 || selectedRisks.includes(student.risk);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors duration-200">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl"><Users size={24}/></div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Cohort</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalCohort}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors duration-200">
          <div className="p-4 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl"><FileWarning size={24}/></div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">At-Risk Rate</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.atRiskRate}%</div>
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 md:col-span-2 p-6 justify-between rounded-2xl shadow-sm flex items-center gap-4 transition-colors duration-200">
          <div className="flex gap-4 items-center">
            <div className="p-4 bg-rose-600 text-white rounded-xl shadow-lg"><AlertOctagon size={24}/></div>
            <div>
              <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Dropout Alerts Detected</div>
              <div className="text-lg font-bold text-rose-900 dark:text-rose-200">5 students dormant across the timeline! action required immediately.</div>
            </div>
          </div>
          <button className="px-6 py-2 bg-rose-600 text-white text-sm font-bold tracking-wide rounded-lg hover:bg-rose-700 transition-colors shadow flex items-center gap-2">
            View Interventions
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">5</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* RISK DISTRIBUTION DONUT CHART */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-between">
            Risk Distribution
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stage: 40%</span>
          </h3>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => [`${value}%`, `Status: ${name}`]} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STUDENT REGISTER TABLE */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Student Early Warning Register</h3>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search" 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Filter Popover Container */}
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 border rounded-lg transition-colors flex items-center gap-1 ${
                    selectedRisks.length > 0
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Filter by Status"
                >
                  <Filter size={18} />
                  {selectedRisks.length > 0 && (
                    <span className="text-xs bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {selectedRisks.length}
                    </span>
                  )}
                </button>

                {/* Filter Popover Panel */}
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 p-3 space-y-2">
                    <div className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider px-1">Filter Status</div>
                    <div className="space-y-1">
                      {riskOptions.map(risk => {
                        const isChecked = selectedRisks.includes(risk);
                        return (
                          <label 
                            key={risk} 
                            onClick={() => handleRiskToggle(risk)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200 select-none"
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${riskStyles[risk]}`}>
                              {risk}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedRisks.length > 0 && (
                      <button 
                        onClick={() => setSelectedRisks([])}
                        className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 pt-2 border-t border-slate-100 dark:border-slate-800"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto text-left rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full min-w-max table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Failure Probability</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Weak Topic</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{student.id}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-slate-800 dark:text-slate-200">
                        {(student.prob * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${riskStyles[student.risk]}`}>
                          {student.risk}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {student.course}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {student.weakTopic}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedStudent(student)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold text-sm"
                        >
                          Analyze Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

export default TeacherDashboard;

