import React, { useState, useEffect } from 'react';
import CandidateFlow from './components/CandidateFlow';
import AdminFlow from './components/AdminFlow';
import ArchitectureBlueprints from './components/ArchitectureBlueprints';
import { INITIAL_QUESTIONS, INITIAL_CANDIDATES } from './data/questions';
import { CandidateAssessmentSubmission, Question } from './types';
import { GraduationCap, BarChart2, ShieldAlert, Cpu, Layers, BookOpen, Sun, HelpCircle, LayoutGrid, CheckCircle } from 'lucide-react';

export default function App() {
  const [activePortal, setActivePortal] = useState<'candidate' | 'admin' | 'blueprints'>('candidate');
  
  // Persistent Storage states
  const [submissions, setSubmissions] = useState<CandidateAssessmentSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Initialize data structures from LocalStorage fallback triggers
  useEffect(() => {
    const cachedSubs = localStorage.getItem('sa_platform_submissions_v2');
    const cachedQuests = localStorage.getItem('sa_platform_questions_v2');

    if (cachedSubs) {
      try {
        setSubmissions(JSON.parse(cachedSubs));
      } catch (e) {
        setSubmissions(INITIAL_CANDIDATES);
      }
    } else {
      setSubmissions(INITIAL_CANDIDATES);
      localStorage.setItem('sa_platform_submissions_v2', JSON.stringify(INITIAL_CANDIDATES));
    }

    if (cachedQuests) {
      try {
        setQuestions(JSON.parse(cachedQuests));
      } catch (e) {
        setQuestions(INITIAL_QUESTIONS);
      }
    } else {
      setQuestions(INITIAL_QUESTIONS);
      localStorage.setItem('sa_platform_questions_v2', JSON.stringify(INITIAL_QUESTIONS));
    }
  }, []);

  // Update localStorage hooks
  const saveSubmissions = (newSubs: CandidateAssessmentSubmission[]) => {
    setSubmissions(newSubs);
    localStorage.setItem('sa_platform_submissions_v2', JSON.stringify(newSubs));
  };

  const saveQuestions = (newQuests: Question[]) => {
    setQuestions(newQuests);
    localStorage.setItem('sa_platform_questions_v2', JSON.stringify(newQuests));
  };

  // Callback triggers when Candidate completes and submits their screening test
  const handleCandidateSubmission = (newSubmission: CandidateAssessmentSubmission) => {
    // Check if duplicate ID exists, otherwise prepend
    const index = submissions.findIndex(s => s.id === newSubmission.id);
    let updated: CandidateAssessmentSubmission[];
    if (index > -1) {
      updated = [...submissions];
      updated[index] = newSubmission;
    } else {
      // Prepend to display right at the top of table logs
      updated = [newSubmission, ...submissions];
    }
    saveSubmissions(updated);
  };

  // Admin CRUD helper: Create
  const handleAddQuestion = (q: Question) => {
    const updated = [q, ...questions];
    saveQuestions(updated);
  };

  // Admin CRUD helper: Delete
  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    saveQuestions(updated);
  };

  // Force clean state reset handler
  const handleResetData = () => {
    if (confirm('Are you sure you want to restore the platform default mock values? This will clear all modifications.')) {
      setSubmissions(INITIAL_CANDIDATES);
      setQuestions(INITIAL_QUESTIONS);
      localStorage.setItem('sa_platform_submissions_v2', JSON.stringify(INITIAL_CANDIDATES));
      localStorage.setItem('sa_platform_questions_v2', JSON.stringify(INITIAL_QUESTIONS));
    }
  };

  return (
    <div id="ai-studio-applet-root" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Upper Panel: Portal Routing Selector Control */}
      <header className="sticky top-0 z-[1000] bg-slate-950/95 backdrop-blur-md border-b border-slate-850 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand System Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/60 border border-indigo-500/20 shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              SKILL & TRAINING
            </span>
            <h1 className="text-sm md:text-base font-sans tracking-tight font-extrabold text-white leading-tight -mt-0.5">
              Mentorship Platform
            </h1>
          </div>
        </div>

        {/* Global Router Switch buttons */}
        <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'candidate', label: 'Candidate Sandbox', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'admin', label: 'Admin Console', icon: <BarChart2 className="w-4 h-4" /> },
            { id: 'blueprints', label: 'Architecture & UX Wires', icon: <Layers className="w-4 h-4" /> }
          ].map((portal) => (
            <button
              key={portal.id}
              onClick={() => setActivePortal(portal.id as any)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all whitespace-nowrap ${
                activePortal === portal.id
                  ? 'bg-indigo-600 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {portal.icon}
              <span>{portal.label}</span>
            </button>
          ))}
        </div>

        {/* Action controllers resetting mock data */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleResetData}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all cursor-pointer"
            title="Reset storage to default seeds"
          >
            RESET SEEDS
          </button>
        </div>

      </header>

      {/* Main Routing Stage Section */}
      <main className="flex-1 w-full bg-slate-950">
        
        {activePortal === 'candidate' && (
          <CandidateFlow 
            onSubmissionComplete={handleCandidateSubmission}
            questions={questions}
          />
        )}

        {activePortal === 'admin' && (
          <AdminFlow 
            submissions={submissions}
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onRefreshSubmissions={() => {
              setSubmissions(INITIAL_CANDIDATES);
              localStorage.setItem('sa_platform_submissions_v2', JSON.stringify(INITIAL_CANDIDATES));
            }}
          />
        )}

        {activePortal === 'blueprints' && (
          <ArchitectureBlueprints />
        )}

      </main>

      {/* Corporate Platform footer */}
      <footer className="bg-slate-950 border-t border-slate-850 px-4 md:px-8 py-5 text-center text-[10px] font-mono text-slate-500 tracking-wider flex flex-col md:flex-row items-center justify-between gap-3">
        <span>© 2026 COHORT EVALUATION & ASSESSMENT SYSTEM. TRACEABLE TELEMETRY LABS PRIVACY STANDARD.</span>
        <div className="flex gap-4">
          <span className="hover:text-slate-400 transition-all cursor-pointer">PRIVACY RULES</span>
          <span className="hover:text-slate-400 transition-all cursor-pointer">DEVELOPER SDK</span>
          <span className="hover:text-slate-400 transition-all cursor-pointer" onClick={handleResetData}>RESET DATA</span>
        </div>
      </footer>

    </div>
  );
}
