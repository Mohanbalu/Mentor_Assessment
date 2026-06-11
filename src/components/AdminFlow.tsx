import React, { useState } from 'react';
import { CandidateAssessmentSubmission, Question, CandidateResponse } from '../types';
import { 
  BarChart3, Users, Clock, Flame, ShieldAlert, CheckCircle, 
  Trash2, Plus, Edit3, Eye, Search, AlertOctagon, RefreshCw, 
  SlidersHorizontal, ChevronRight, FileSpreadsheet, LayoutDashboard, Brain, Award, Sparkles, X
} from 'lucide-react';
import { clientAi } from '../utils/aiClient';

interface AdminFlowProps {
  submissions: CandidateAssessmentSubmission[];
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onRefreshSubmissions: () => void;
}

export default function AdminFlow({ 
  submissions, 
  questions, 
  onAddQuestion, 
  onDeleteQuestion,
  onRefreshSubmissions
}: AdminFlowProps) {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'candidates' | 'questions' | 'results'>('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAssessmentSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // States for Question Form
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    category: 'Aptitude',
    type: 'MCQ',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'Intermediate'
  });

  const handleAiAutoGenerate = async () => {
    setIsAiGenerating(true);
    try {
      const q = await clientAi.generateQuestion(
        (newQuestion.category || 'Programming') as any,
        (newQuestion.type || 'MCQ') as any,
        (newQuestion.difficulty || 'Intermediate') as any
      );
      setNewQuestion(prev => ({
        ...prev,
        questionText: q.questionText,
        options: q.options || prev.options,
        correctAnswer: q.correctAnswer || prev.correctAnswer
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Calculate general statistics metrics
  const totalCount = submissions.length;
  const startedCount = submissions.filter(s => s.status === 'Started').length;
  const submittedCount = submissions.filter(s => s.status === 'Submitted' || s.status === 'Evaluated').length;
  const evaluatedCount = submissions.filter(s => s.status === 'Evaluated').length;
  const pendingEvaluationCount = submissions.filter(s => s.status === 'Submitted').length;

  // Question Form helpers
  const handleOptionChange = (idx: number, val: string) => {
    setNewQuestion(prev => {
      const opts = [...(prev.options || ['', '', '', ''])];
      opts[idx] = val;
      return { ...prev, options: opts };
    });
  };

  const handleCreateQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.questionText) return;

    const qToSave: Question = {
      id: `quest-${Date.now()}`,
      category: newQuestion.category as any,
      type: newQuestion.type as any,
      questionText: newQuestion.questionText,
      options: newQuestion.type === 'MCQ' ? newQuestion.options : undefined,
      correctAnswer: newQuestion.type === 'MCQ' ? newQuestion.correctAnswer : undefined,
      difficulty: newQuestion.difficulty as any
    };

    onAddQuestion(qToSave);
    setShowAddQuestionModal(false);
    // Reset form
    setNewQuestion({
      category: 'Aptitude',
      type: 'MCQ',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      difficulty: 'Intermediate'
    });
  };

  // Generate unique clean link helper mock alert
  const triggerGenerateTokenLink = (candidateId: string) => {
    const customLink = `${window.location.origin}/assessment/token_hlx_${candidateId}`;
    navigator.clipboard.writeText(customLink);
    alert(`Link generated and copied to clipboard:\n${customLink}`);
  };

  // Filter candidates list on active search parameters
  const filteredSubmissions = submissions.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.info.fullName.toLowerCase().includes(term) ||
      s.info.email.toLowerCase().includes(term) ||
      s.info.college.toLowerCase().includes(term) ||
      s.info.targetRole.toLowerCase().includes(term)
    );
  });

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      
      {/* Dashboard Top Header Navigation Area */}
      <div id="admin-dashboard-header" className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 text-xs font-mono bg-emerald-950/60 text-emerald-400 rounded-full border border-emerald-800 uppercase tracking-widest">
            Admin Workspace Console
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1.5">
            SaaS Evaluator Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5 max-w-xl font-sans">
            Track metrics, analyze behavioral diagnostics, compile reports, review anti-cheating logs, and manage questions.
          </p>
        </div>

        {/* Dashboard sub tabs navigation */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {[
            { id: 'dashboard', label: 'Summary Stats', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'candidates', label: 'Candidates Ledger', icon: <Users className="w-4 h-4" /> },
            { id: 'questions', label: 'Questions Pool', icon: <SlidersHorizontal className="w-4 h-4" /> },
            { id: 'results', label: 'Scores & Results', icon: <FileSpreadsheet className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setAdminTab(tab.id as any);
                setSelectedCandidate(null); // Clear active drawer view
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-sans font-semibold transition-all ${
                adminTab === tab.id
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* VIEW A: SUMMARY STATS (Dashboard tab) */}
        {adminTab === 'dashboard' && !selectedCandidate && (
          <div id="stats-summary-panel" className="flex flex-col gap-6">
            
            {/* Cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: 'Total Candidates', value: totalCount, desc: 'Registered entries', icon: <Users className="w-5 h-5 text-indigo-400" /> },
                { title: 'Started', value: startedCount, desc: 'Active in testing wizard', icon: <Flame className="w-5 h-5 text-amber-500" /> },
                { title: 'Submitted', value: submittedCount, desc: 'Awaiting checks or evaluated', icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
                { title: 'Awaiting Grading', value: pendingEvaluationCount, desc: 'Pending system checks', icon: <Clock className="w-5 h-5 text-indigo-300" /> },
                { title: 'Evaluated Reports', value: evaluatedCount, desc: 'Scorecards completed', icon: <Award className="w-5 h-5 text-teal-400" /> }
              ].map((card, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-1.5 shadow">
                  <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] uppercase font-bold">
                    <span>{card.title}</span>
                    {card.icon}
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono mt-1">
                    {card.value}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 italic">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Main grid: Analytics Insights & Alert Flags */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Security Telemetry Flag alerts */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Secure Telemetry Audits
                  </h3>
                  <span className="text-[10px] font-mono text-rose-400 font-bold px-1.5 py-0.5 bg-rose-955 border border-rose-900 rounded">
                    REALTIME FLAGS
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {submissions.filter(s => s.metrics.tabSwitchCount > 0 || (s.metrics.copyCount + s.metrics.pasteCount) > 1).map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-start gap-2.5">
                      <AlertOctagon className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200 block">{s.info.fullName}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Detected <strong className="text-slate-100">{s.metrics.tabSwitchCount} tab swaps</strong> and <strong className="text-slate-100">{s.metrics.copyCount + s.metrics.pasteCount} clipboard actions</strong>.
                        </p>
                        <span className="text-[9px] font-mono text-rose-400/90 tracking-wide mt-1 block">
                          RISK PROFILE: HIGH CHANCE OF COGNITIVE BIAS
                        </span>
                      </div>
                    </div>
                  ))}

                  {submissions.filter(s => s.metrics.tabSwitchCount > 0 || (s.metrics.copyCount + s.metrics.pasteCount) > 1).length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono">
                      No security telemetry anomalies flagged in active cohorts files.
                    </div>
                  )}
                </div>
              </div>

              {/* Center & Right Column: Analytics graphs placeholders and summary reports */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    Cohort Assessment Spread & Levels
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">NORMAL DISTRIBUTION</span>
                </div>

                {/* SVG Visual graph representing scores distributions */}
                <div className="h-44 bg-slate-950 rounded-xl border border-slate-850 p-4 relative flex flex-col justify-end">
                  
                  {/* Grid background markers */}
                  <div className="absolute inset-0 flex flex-col justify-between py-5 px-3 pointer-events-none text-[8px] font-mono text-slate-650">
                    <div className="border-b border-slate-900/60 pb-1 w-full text-left">80-100 Marks (Placement Ready)</div>
                    <div className="border-b border-slate-900/60 pb-1 w-full text-left">50-80 Marks (3M Training Required)</div>
                    <div className="border-b border-slate-900/60 pb-1 w-full text-left">0-50 Marks (6M Training Required)</div>
                  </div>

                  {/* Core Bars */}
                  <div className="flex justify-around items-end h-32 relative z-10 px-4">
                    {submissions.map((c, index) => {
                      const computedScore = c.score || 0;
                      const heightPercent = Math.max(12, computedScore);
                      return (
                        <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer w-10">
                          
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-[10px] font-sans border border-slate-800 px-2 py-1 rounded text-white absolute bottom-36 z-50 shadow-xl w-32 pointer-events-none">
                            <span className="font-bold">{c.info.fullName}</span>
                            <br />Score: <strong>{computedScore} Marks</strong>
                            <br />Expectation: {c.metrics.preAssessmentScorePrediction || 'N/A'}
                          </div>

                          <span className="text-[10px] font-mono font-bold text-slate-300">
                            {computedScore || 'Started'}
                          </span>
                          
                          <div 
                            className={`w-4.5 rounded-t-md transition-all duration-500 hover:brightness-110 ${
                              computedScore >= 80 
                                ? 'bg-emerald-500 shadow shadow-emerald-950/40' 
                                : computedScore >= 50 
                                ? 'bg-indigo-500 shadow shadow-indigo-950/40' 
                                : 'bg-amber-500 shadow shadow-amber-950/40'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                          
                          <span className="text-[9px] font-mono text-slate-500 truncate max-w-full text-center">
                            {c.info.fullName.split(' ')[0]}
                          </span>

                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mt-1">
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Cohort Average score</span>
                    <strong className="text-xl font-bold font-sans text-indigo-400 mt-1 block">
                      {submissions.filter(s => s.score).length > 0 
                        ? Math.round(submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.filter(s => s.score).length) 
                        : 0} Marks
                    </strong>
                  </div>
                  
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">High scorecard</span>
                    <strong className="text-xl font-bold font-sans text-emerald-400 mt-1 block">
                      {submissions.filter(s => s.score).length > 0 
                        ? Math.max(...submissions.map(s => s.score || 0)) 
                        : 0} Marks
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Confidence Gap Average</span>
                    <strong className="text-xl font-bold font-sans text-amber-400 mt-1 block">
                      ±12 Marks
                    </strong>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW B: CANDIDATES LEDGER TABLE */}
        {adminTab === 'candidates' && !selectedCandidate && (
          <div id="candidates-ledger-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            
            {/* Header controls bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg w-full md:max-w-xs">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter by name, college..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-200 outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRefreshSubmissions}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  title="Purge / Refresh dataset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Datatable Frame */}
            <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
              <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <th className="p-4">Candidate Specs</th>
                    <th className="p-4">Academy & College</th>
                    <th className="p-4 text-center">Status Badge</th>
                    <th className="p-4 text-center">Auto-Computed Score</th>
                    <th className="p-4 text-right">Action Modules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-200 block">{s.info.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{s.info.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 block font-medium">{s.info.college}</span>
                        <span className="text-[10.5px] text-slate-500 font-mono block mt-0.5">{s.info.branch} • Year: {s.info.year}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-full ${
                          s.status === 'Evaluated'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : s.status === 'Started'
                            ? 'bg-amber-950 text-amber-500 border border-amber-900/40'
                            : 'bg-indigo-950 text-indigo-400 border border-indigo-900/40'
                        }`}>
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-200">
                        {s.score !== undefined ? `${s.score} / 100` : '--'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCandidate(s)}
                            className="bg-indigo-950 text-indigo-300 hover:bg-slate-800 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 border border-indigo-900/40 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Report
                          </button>
                          <button
                            onClick={() => triggerGenerateTokenLink(s.id)}
                            className="bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 px-2 py-1.5 rounded-lg text-[10px] font-mono border border-slate-800 transition-all"
                            title="Generate Token Link"
                          >
                            Get Link
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-500 font-mono text-xs">
                        No candidate profiles detected matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* VIEW C: QUESTIONS CRUD MANAGER WORKSPACE */}
        {adminTab === 'questions' && !selectedCandidate && (
          <div id="questions-pool-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-white mb-0.5">Assigned Assessment Questions Core</h2>
                <p className="text-slate-400 text-xs font-sans">
                  Configure assessment parameters, MCQ elements, difficulty index, and scoring weights.
                </p>
              </div>

              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-sans font-bold flex items-center gap-1.5 border border-indigo-500/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {/* List container grouped by Section Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div key={q.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="px-2 py-0.5 bg-indigo-950/60 text-indigo-300 font-mono text-[9px] rounded uppercase border border-indigo-900/60 font-bold">
                        {q.category} Round • {q.type}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-900 text-slate-500 font-mono text-[9px] rounded max-content ml-1.5 uppercase font-medium">
                        {q.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-955 rounded transition-all cursor-pointer"
                      title="Decommission Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs md:text-sm text-slate-200 font-sans font-medium leading-relaxed">
                    {q.questionText}
                  </p>

                  {q.options && (
                    <div className="flex flex-col gap-1.5 border-t border-slate-900/60 pt-3">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Option parameters:</span>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-sans">
                        {q.options.map((opt, idx) => (
                          <span key={idx} className={`p-1.5 bg-slate-900/50 rounded truncate ${
                            opt === q.correctAnswer ? 'text-indigo-300 border border-indigo-950/40 bg-indigo-950/10' : ''
                          }`}>
                            {idx + 1}. {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW D: SCORES & RESULTS SHEET */}
        {adminTab === 'results' && !selectedCandidate && (
          <div id="results-table-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="border-b border-slate-850 pb-4">
              <h2 className="text-base font-bold tracking-tight text-white mb-0.5">Automated Scoring Spread Sheets</h2>
              <p className="text-slate-400 text-xs font-sans">
                Analytical logs comparing section-by-section breakdown matrices and durations.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <th className="p-4">Candidate Specs</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Aptitude</th>
                    <th className="p-4 text-center">Prog</th>
                    <th className="p-4 text-center">Web</th>
                    <th className="p-4 text-center">DSA</th>
                    <th className="p-4 text-center">AI</th>
                    <th className="p-4 text-center">Coding</th>
                    <th className="p-4 text-center">Plag Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {submissions.filter(s => s.score !== undefined).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-200 block">{s.info.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{s.info.targetRole}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-100 bg-slate-900/20">
                        {s.score}%
                      </td>
                      <td className="p-4 text-center font-mono text-slate-300">{s.sectionScores?.['Aptitude'] || 0}%</td>
                      <td className="p-4 text-center font-mono text-slate-300">{s.sectionScores?.['Programming'] || 0}%</td>
                      <td className="p-4 text-center font-mono text-slate-300">{s.sectionScores?.['Web'] || 0}%</td>
                      <td className="p-4 text-center font-mono text-slate-300">{s.sectionScores?.['DSA'] || 0}%</td>
                      <td className="p-4 text-center font-mono text-slate-300">{s.sectionScores?.['AI'] || 0}%</td>
                      <td className="p-4 text-center font-mono text-slate-300">{s.sectionScores?.['Coding'] || 0}%</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded ${
                          s.metrics.tabSwitchCount > 1 
                            ? 'bg-rose-950 text-rose-400 border border-rose-900/60' 
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                        }`}>
                          {s.metrics.tabSwitchCount > 1 ? 'CRITICAL' : 'SAFE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {submissions.filter(s => s.score !== undefined).length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-20 text-center text-slate-500 font-mono text-xs">
                        No submissions recorded to compute spreadsheets logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW E: CANDIDATE DETAILED REPORT SHEET / REVIEW DRAWER */}
        {selectedCandidate && (
          <div id="candidate-detailed-report-pane" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl">
            
            {/* Report Header panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <span className="px-2 py-1 text-[9px] font-mono bg-indigo-950/60 border border-indigo-900/60 rounded text-indigo-400 font-bold uppercase tracking-wider">
                    INDIVIDUAL COHORT SUMMARY REPORT
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                    {selectedCandidate.info.fullName}
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5 font-sans">
                    Email: {selectedCandidate.info.email} • Target Role: {selectedCandidate.info.targetRole}
                  </p>
                </div>
              </div>

              {selectedCandidate.evaluation && (
                <div className="flex items-center gap-3 font-sans">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block text-right">OVERALL RATING</span>
                    <strong className="text-2xl font-extrabold text-indigo-400 block text-right">
                      {selectedCandidate.evaluation.overallRating} <span className="text-xs text-slate-500">/ 10</span>
                    </strong>
                  </div>
                  
                  <div className="px-4 py-2 bg-indigo-600 rounded-xl text-center border border-indigo-500/30 text-xs md:text-sm font-bold text-white shadow shadow-indigo-950">
                    {selectedCandidate.evaluation.level.toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Assessment report specs cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box 1: Technical Scorecard Progress */}
              {selectedCandidate.evaluation && (
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col gap-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    TECHNICAL COMPETENCIES
                  </h3>

                  <div className="flex flex-col gap-3">
                    {[
                      { name: 'Core Programming Syntax', score: selectedCandidate.evaluation.technicalScore.programming },
                      { name: 'Data Structures & Algos', score: selectedCandidate.evaluation.technicalScore.dsa },
                      { name: 'Web Dev Frameworks', score: selectedCandidate.evaluation.technicalScore.webDevelopment },
                      { name: 'AI & Generative Engines', score: selectedCandidate.evaluation.technicalScore.ai }
                    ].map((tech, idx) => (
                      <div key={idx} className="text-xs flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 font-medium">{tech.name}</span>
                          <span className="font-mono text-[10.5px] text-indigo-300 font-bold">{tech.score} / 10</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${tech.score * 10}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box 2: Behavioral Diagnostic Map */}
              {selectedCandidate.evaluation && (
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col gap-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    BEHAVIORAL DIAGNOSTICS
                  </h3>

                  <div className="flex flex-col gap-3">
                    {[
                      { name: 'Technical Communication', score: selectedCandidate.evaluation.behavioralScore.communication },
                      { name: 'Self-driven learning Ability', score: selectedCandidate.evaluation.behavioralScore.learningAbility },
                      { name: 'Systemic Problem Solving', score: selectedCandidate.evaluation.behavioralScore.problemSolving }
                    ].map((beh, idx) => (
                      <div key={idx} className="text-xs flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 font-medium">{beh.name}</span>
                          <span className="font-mono text-[10.5px] text-emerald-300 font-bold">{beh.score} / 10</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${beh.score * 10}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box 3: Mentorship Recommendations Panel */}
              {selectedCandidate.evaluation && (
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col gap-4 h-full">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    MENTORSHIP RECOMMENDATION
                  </h3>

                  <div className="my-auto flex flex-col gap-3">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">RECOMMENDED TRACK:</span>
                    <strong className="text-xl font-bold font-sans text-purple-400 tracking-tight leading-none block">
                      {selectedCandidate.evaluation.recommendation}
                    </strong>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {selectedCandidate.evaluation.reviewerNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI DIAGNOSTIC REPORT CARD */}
            {selectedCandidate.evaluation && (() => {
              const aiAnalysisResult = clientAi.analyzeCandidatePerformance(selectedCandidate.score || 75);
              return (
                <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-indigo-500/20 p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3 flex-wrap gap-2">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold flex items-center gap-2">
                      <Brain className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                      GENERATIVE AI COGNITIVE DIAGNOSTIC REPORT
                    </h3>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-850">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      GEMINI REPORT ENGINE ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-slate-300">
                    <div className="md:col-span-8 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Candidate Cognitive Diagnostics</span>
                        <p className="text-xs font-sans text-slate-300 leading-relaxed bg-indigo-950/10 p-3.5 border border-indigo-900/15 rounded-lg">
                          {aiAnalysisResult.interviewFeedbackNotes}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Suggested Structured Curriculum / Training Track</span>
                        <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <Award className="w-8 h-8 text-indigo-400 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-sans font-bold text-slate-200">Recommended Milestone: {aiAnalysisResult.mentorshipPath}</span>
                            <span className="text-slate-400 font-mono text-[10px]">Syllabus Focus: {aiAnalysisResult.technicalSyllabus}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Identified Skill Deficiencies (Gaps)</span>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysisResult.skillGaps.map((gap, i) => (
                            <span key={i} className="px-2.5 py-1 bg-red-950/20 text-red-300 border border-red-900/35 rounded-full font-sans font-medium text-[10px]">
                              {gap}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-slate-850 pt-3">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Recruiter Conduct Guidelines</span>
                        <ul className="list-disc pl-4 flex flex-col gap-1.5 font-sans text-slate-400 text-[11px] leading-relaxed">
                          <li>Ask candidates to expand on optimizing high-pressure performance blocks.</li>
                          <li>Explore conceptual depth of structural data sharding boundaries.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Plagiarism Telemetry Analytics Section */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col gap-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold border-b border-slate-900 pb-2">
                ASSESSMENT TELEMETRY & PLAGIARISM METRICS
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-xs">
                <div className="p-3.5 bg-slate-900 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Tab switch alerts</span>
                  <strong className={`text-lg font-bold font-mono mt-1 block ${selectedCandidate.metrics.tabSwitchCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {selectedCandidate.metrics.tabSwitchCount} times
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Copy / Paste sequences</span>
                  <strong className="text-lg font-bold font-mono text-slate-300 mt-1 block">
                    {selectedCandidate.metrics.copyCount} C / {selectedCandidate.metrics.pasteCount} P
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Answer state toggles</span>
                  <strong className="text-lg font-bold font-mono text-indigo-400 mt-1 block">
                    {selectedCandidate.metrics.answerChanges} switches
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Expectation alignment</span>
                  <strong className="text-base font-bold font-sans text-slate-300 mt-1.5 block">
                    Predicted: {selectedCandidate.metrics.preAssessmentScorePrediction || 'N/A'}
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Completeness Check</span>
                  <strong className="text-base font-bold font-sans text-emerald-400 mt-1.5 block">
                    100% Verified
                  </strong>
                </div>
              </div>

              {/* Time Spend per section Bar Chart (SVG-based) */}
              <div className="mt-2 text-xs font-sans">
                <span className="text-[10px] font-mono text-slate-500 block mb-2 uppercase">Time Per Section Spent metrics (seconds):</span>
                <div className="flex flex-col gap-2">
                  {Object.entries(selectedCandidate.metrics.timePerSection || {}).map(([sec, secs]) => {
                    const values = Object.values(selectedCandidate.metrics.timePerSection || {}) as number[];
                    const maxTime = Math.max(...(values.length > 0 ? values : [100]));
                    const widthPercent = ((secs as number) / maxTime) * 100;
                    return (
                      <div key={sec} className="flex items-center justify-between gap-3">
                        <span className="w-24 text-slate-400 text-xs font-medium">{sec}</span>
                        <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-350" style={{ width: `${widthPercent}%` }}></div>
                        </div>
                        <span className="w-12 text-slate-200 text-right font-mono text-xs">{secs}s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Candidate Answers inspection area */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col gap-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold border-b border-slate-900 pb-2">
                SUBMITTED COHORT ANSWERS INSPECTIONS
              </h3>

              <div className="flex flex-col gap-4">
                {selectedCandidate.responses.map((ans, idx) => {
                  return (
                    <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-lg text-xs font-sans flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] font-bold text-indigo-400 uppercase">Answer Matrix Node {idx + 1}</span>
                        {ans.selectedOption && (
                          <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-900 text-indigo-300 font-mono text-[9px] rounded">
                            Selected MCQ: {ans.selectedOption}
                          </span>
                        )}
                        {ans.languageSelected && (
                          <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 font-mono text-[9px] rounded">
                            Lab Script: {ans.languageSelected.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {ans.textAnswer && (
                        <div>
                          <p className="text-slate-200 font-medium">{ans.textAnswer}</p>
                        </div>
                      )}

                      {ans.codeAnswer && (
                        <pre className="bg-slate-950 p-3 border border-slate-850 rounded-lg overflow-x-auto text-[10.5px] font-mono text-indigo-300 leading-relaxed mt-1">
                          <code>{ans.codeAnswer}</code>
                        </pre>
                      )}
                    </div>
                  );
                })}

                {selectedCandidate.responses.length === 0 && (
                  <div className="text-center py-6 text-slate-500 font-mono text-xs">
                    No active answer responses recorded for this candidate.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* QUESTION FORM MODAL DIALOG */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col gap-0 select-none">
            
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                Add Assessment Question
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAiAutoGenerate}
                  disabled={isAiGenerating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-md text-indigo-300 font-mono text-[9px] tracking-wide uppercase font-bold cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3 h-3 text-indigo-400 ${isAiGenerating ? 'animate-spin' : 'animate-pulse'}`} />
                  {isAiGenerating ? 'Generating...' : 'AI Auto-Fill'}
                </button>
                <button 
                  onClick={() => setShowAddQuestionModal(false)}
                  className="text-slate-500 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateQuestionSubmit} className="p-5 flex flex-col gap-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Category Round</label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value as any }))}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Programming">Programming</option>
                    <option value="Web">Web Dev</option>
                    <option value="DSA">DSA Concepts</option>
                    <option value="AI">Generative AI</option>
                    <option value="Coding">Lab Coding</option>
                    <option value="Prompt">Prompt Engineering</option>
                    <option value="Mindset">Growth Mindset</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Question Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, type: e.target.value as any }))}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="Theory">Technical Essay / Theory</option>
                    <option value="Coding">Lab Source Script</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Question Text Prompt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type your question content guidelines..."
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-indigo-500 font-sans placeholder:text-slate-650"
                />
              </div>

              {newQuestion.type === 'MCQ' && (
                <div className="flex flex-col gap-3.5 border-t border-slate-850 pt-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Multiple Choice Options</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate-500">Option {idx + 1}</label>
                        <input
                          type="text"
                          required
                          placeholder="Possible answer option..."
                          value={newQuestion.options?.[idx] || ''}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Correct Answer parameter (must match exactly)</label>
                    <input
                      type="text"
                      required
                      placeholder="Insert the correct value option..."
                      value={newQuestion.correctAnswer || ''}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-850 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-all text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-indigo-500/30 transition-all font-bold text-xs"
                >
                  Create Question Pool node
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
