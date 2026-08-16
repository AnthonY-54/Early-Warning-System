import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { AlertCircle, AlertTriangle, CheckCircle, Info, MousePointer, Calendar, BookOpen, TrendingDown, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch identity-driven student data for the logged-in user
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    axios.get(`${API_URL}/api/dashboard/student/me`)
      .then(res => {

        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data: ", err);
        setLoading(false);
      });
  }, []);


  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!data) return <div>Failed to load data.</div>;

  // Visuals configuration based on Risk
  const riskConfig = {
    'Green': { color: 'bg-emerald-500', text: 'text-emerald-700', bgLight: 'bg-emerald-50', icon: CheckCircle, border: 'border-emerald-200' },
    'Yellow': { color: 'bg-amber-500', text: 'text-amber-700', bgLight: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-200' },
    'Red': { color: 'bg-rose-500', text: 'text-rose-700', bgLight: 'bg-rose-50', icon: AlertCircle, border: 'border-rose-200' },
    'Black': { color: 'bg-slate-800', text: 'text-slate-800', bgLight: 'bg-slate-200', icon: Info, border: 'border-slate-300' }
  };

  const currentRisk = riskConfig[data.risk_level] || riskConfig['Green'];
  const RiskIcon = currentRisk.icon;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className={`p-6 rounded-2xl border ${currentRisk.border} ${currentRisk.bgLight} shadow-sm transition-all duration-300 transform hover:scale-[1.01]`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${currentRisk.text}`}>
              <RiskIcon size={28} />
              Risk Status: {data.risk_level.toUpperCase()}
            </h2>
            <p className="mt-2 text-slate-700 max-w-3xl leading-relaxed">
              {data.feedback}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Prediction Confidence</div>
            <div className={`text-3xl font-black ${currentRisk.text}`}>{data.confidence}</div>
            <p className="text-xs text-slate-500 mt-1">based on learning patterns</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ENGAGEMENT METRICS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <MousePointer className="text-indigo-500" />
              Engagement Profile
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg"><MousePointer size={18}/></div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Total VLE Clicks</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{data.engagement.clicks}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg"><Calendar size={18}/></div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Active Days</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{data.engagement.active_days}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg"><BookOpen size={18}/></div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Resources Viewed</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{data.engagement.resources_viewed}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-amber-600 dark:text-amber-400">Tip:</span> Interactions at the {data.stage} timeline are crucial predictors for your final grade.
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl text-white border border-transparent dark:border-slate-800 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={100} /></div>
             <h3 className="text-lg font-bold text-indigo-200 mb-2">Grade Predictor Component</h3>
             <p className="font-medium text-xl leading-snug">
               If you score <span className="text-amber-300 font-bold">B</span> on your next assignment → <span className="text-emerald-400 font-bold tracking-wide">PASS GUARANTEED</span>
             </p>
             <div className="mt-4 text-sm text-slate-400">
               Historical model suggests increasing weekly active days by 2 will improve chances by 14%.
             </div>
          </div>
        </div>

        {/* PERFORMANCE GRAPH */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-500" />
              Progressive Prediction Timeline
            </div>
            <span className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-medium tracking-wide">
              EWS Module at {data.stage}
            </span>
          </h3>
          
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.performance_timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.3} />
                <XAxis 
                  dataKey="stage" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 13 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 13 }} 
                  domain={[0, 100]}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                  formatter={(value, name, props) => [`Score: ${value}`, `Risk: ${props.payload.risk}`]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} 
                  activeDot={{ r: 8, fill: "#4f46e5" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
