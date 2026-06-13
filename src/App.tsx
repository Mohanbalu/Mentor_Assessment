import React, { useState, useEffect } from 'react';
import CandidateFlow from './components/CandidateFlow';
import AdminFlow from './components/AdminFlow';
import AuthGate from './components/AuthGate';
import ArchitectureBlueprints from './components/ArchitectureBlueprints';
import { getApiUrl } from './utils/api';
import { INITIAL_QUESTIONS, INITIAL_CANDIDATES } from './data/questions';
import { CandidateAssessmentSubmission, Question } from './types';
import { GraduationCap, BarChart2, ShieldAlert, Cpu, Layers, BookOpen, Sun, HelpCircle, LayoutGrid, CheckCircle } from 'lucide-react';

export default function App() {
  const [activePortal, setActivePortal] = useState<'candidate' | 'admin' | 'blueprints'>(() => {
    const cachedUser = localStorage.getItem('sa_admin_user');
    try {
      if (cachedUser) {
        const u = JSON.parse(cachedUser);
        if (u && u.email?.toLowerCase() === 'admin@indiwebpros.in') {
          return 'admin';
        }
      }
    } catch {}
    return 'candidate';
  });
  
  // JWT state managers
  const [token, setToken] = useState<string | null>(localStorage.getItem('sa_admin_jwt'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const cached = localStorage.getItem('sa_admin_user');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    // Scaffold and clear all potential candidate storage keys (scoped, guest, and legacy) to avoid any leakage to another user
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('candidate_') || key.startsWith('cand_') || key.startsWith('temp_guest_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('sa_admin_jwt');
    localStorage.removeItem('sa_admin_user');
    setActivePortal('candidate');

    // Force a full clean page refresh to completely rebuild all states from dry local storage
    window.location.reload();
  };
  
  // Persistent Storage states
  const [submissions, setSubmissions] = useState<CandidateAssessmentSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Initialize data structures from LocalStorage fallback triggers combined with dynamic PostgreSQL sync
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

    // Attempt to load questions from backend API first to satisfy audit dynamics
    const loadQuestionsFromBackend = async () => {
      try {
        const url = getApiUrl('/api/questions');
        console.log('[System Loader] Loading questions from PostgreSQL database:', url);
        const res = await fetch(url);
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && Array.isArray(resJson.data) && resJson.data.length > 0) {
            console.log(`[System Loader] Successfully loaded ${resJson.data.length} questions dynamically from PostgreSQL database.`);
            
            // Map keys of database rows to match frontend Question schema (e.g. options_json)
            const mappedQuestions = resJson.data.map((row: any) => ({
              id: row.id,
              assessment_id: row.assessment_id,
              questionText: row.question_text || row.questionText,
              questionType: row.question_type || row.questionType,
              options: row.options_json ? JSON.parse(row.options_json) : (row.options || []),
              correctAnswer: row.correct_answer || row.correctAnswer,
              marks: row.marks
            }));
            
            setQuestions(mappedQuestions);
            localStorage.setItem('sa_platform_questions_v2', JSON.stringify(mappedQuestions));
            return;
          }
        }
      } catch (err) {
        console.warn('[System Loader] Failed to load questions dynamically. Falling back to cached state/defaults.', err);
      }

      // Local storage or default fallback if backend fails or has no rows
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
    };

    loadQuestionsFromBackend();
  }, []);

  // Synchronizes full state records from PostgreSQL RDS
  const syncPostgresSubmissions = async () => {
    try {
      const url = getApiUrl('/api/admin/attempts');
      console.log('[System Loader] Fetching attempts from PostgreSQL database:', url);
      
      const tokenVal = localStorage.getItem('sa_admin_jwt');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (tokenVal) {
        headers['Authorization'] = `Bearer ${tokenVal}`;
      }

      const res = await fetch(url, { headers });
      
      if (res.status === 401 || res.status === 403) {
        console.warn('[System Loader] Token expired or unauthorized. Logging out.');
        handleLogout();
        return;
      }
      const resJson = await res.json();
      
      if (res.ok && resJson.success && Array.isArray(resJson.data)) {
        console.log(`[System Loader] Sync complete. Received ${resJson.data.length} records.`);
        
        // Map database attempt records directly to UI schemas
        const mapped: CandidateAssessmentSubmission[] = resJson.data.map((row: any) => {
          const rawScore = row.total_score ? parseFloat(row.total_score) : 70;
          return {
            id: row.id,
            info: {
              fullName: row.full_name || '',
              email: row.email || '',
              phone: row.phone || '',
              college: row.college || '',
              branch: row.branch || '',
              year: row.academic_year || '',
              cgpa: row.cgpa ? row.cgpa.toString() : '',
              githubUrl: row.github_url || '',
              linkedinUrl: row.linkedin_url || '',
              targetRole: row.target_role || 'Software Engineering Cohort',
              resumeUrl: row.resume_url || '',
              resumeFilename: row.resume_filename || ''
            },
            selfAssessment: {
              c: 5, python: 5, java: 5, dsa: 5, html: 5, css: 5, javascript: 5, react: 5, sql: 5, aiMl: 5, generativeAi: 5, communication: 5
            },
            responses: [], // lazy-loaded from /api/admin/attempts/:id upon clicking Report
            metrics: {
              tabSwitchCount: 0,
              copyCount: 0,
              pasteCount: 0,
              answerChanges: 0,
              timePerSection: {},
              preAssessmentScorePrediction: row.pre_assessment_score || '70-80'
            },
            status: row.status || 'Evaluated',
            submittedAt: row.submitted_at || row.started_at,
            score: rawScore,
            sectionScores: {
              Aptitude: row.aptitude_score ? parseFloat(row.aptitude_score) : 70,
              Programming: row.technical_score ? parseFloat(row.technical_score) : 70,
              Coding: row.coding_score ? parseFloat(row.coding_score) : 70,
              Mindset: row.mindset_score ? parseFloat(row.mindset_score) : 70
            },
            evaluation: {
              technicalScore: {
                programming: Math.round((row.technical_score || 70)/10),
                dsa: Math.round((row.technical_score || 70)/10),
                webDevelopment: Math.round((row.technical_score || 70)/10),
                ai: 8
              },
              behavioralScore: {
                communication: 8,
                learningAbility: Math.round((row.mindset_score || 70)/10),
                problemSolving: Math.round((row.coding_score || 70)/10)
              },
              overallRating: Number((rawScore / 10).toFixed(1)),
              level: rawScore >= 80 ? 'Advanced' : (rawScore >= 50 ? 'Intermediate' : 'Beginner'),
              recommendation: row.recommendation || '6 Month Training',
              reviewerNotes: row.reviewer_notes || 'Database synchronizer automatic record entry evaluation.'
            }
          };
        });

        setSubmissions(mapped);
      }
    } catch (err) {
      console.error('[System Loader ERR] Failed to retrieve and map attempts logs:', err);
    }
  };

  // Sync when entering the Admin tab
  useEffect(() => {
    if (activePortal === 'admin') {
      syncPostgresSubmissions();
    }
  }, [activePortal]);

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

      // Clear all potential candidate storage keys (scoped and legacy)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('candidate_') || key.startsWith('cand_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  if (!token || !adminUser) {
    return (
      <div id="ai-studio-applet-root" className="min-h-screen bg-slate-905 text-slate-100 flex flex-col font-sans select-none antialiased">
        <header className="bg-slate-950/95 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center border border-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-400">COHORT PLATFORM SECURE PORT</span>
              <h1 className="text-sm font-sans tracking-tight font-extrabold text-white">Mentorship Platform Entry</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1 text-slate-400 font-mono text-[10px] rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>RESTRICTED INGRESS</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <AuthGate
            getApiUrl={getApiUrl}
            onLoginSuccess={(jwtToken, loggedUser) => {
              setToken(jwtToken);
              setAdminUser(loggedUser);
              localStorage.setItem('sa_admin_jwt', jwtToken);
              localStorage.setItem('sa_admin_user', JSON.stringify(loggedUser));
              
              if (loggedUser.email.toLowerCase() === 'admin@indiwebpros.in') {
                setActivePortal('admin');
              } else {
                setActivePortal('candidate');
              }
            }}
          />
        </div>
        <footer className="bg-slate-950 border-t border-slate-850 px-4 py-4 text-center text-[10px] font-mono text-slate-500 tracking-wider">
          © 2026 COHORT EVALUATION & ASSESSMENT SYSTEM. TRACEABLE PRIVACY STANDARDS SECURED.
        </footer>
      </div>
    );
  }

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

        {/* Global Router Switch buttons: Only render if logged in user is the primary admin */}
        {adminUser && adminUser.email.toLowerCase() === 'admin@indiwebpros.in' ? (
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
        ) : (
          <div className="flex bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl text-xs font-mono text-indigo-300 font-bold gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>CANDIDATE COHORT SANDBOX ACTIVE</span>
          </div>
        )}

        {/* Action controllers resetting mock data & Admin status */}
        <div className="flex items-center gap-3">
          {adminUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <div className="px-3 py-1.5 flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{adminUser.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-550 active:bg-red-700 text-white text-xs font-sans font-bold rounded-lg transition-all cursor-pointer shadow"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-lg font-mono text-[10px] text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>PROD ENGINE POOL ACTIVE</span>
              </div>
              <button
                onClick={handleResetData}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all cursor-pointer"
                title="Reset storage to default seeds"
              >
                RESET SEEDS
              </button>
            </div>
          )}
        </div>

      </header>

      {/* Main Routing Stage Section */}
      <main className="flex-1 w-full bg-slate-950">
        
        {/* Strictly filter rendering: candidate mode for candidates; full choices for admin@indiwebpros.in */}
        {(!adminUser || adminUser.email.toLowerCase() !== 'admin@indiwebpros.in' || activePortal === 'candidate') && (
          <CandidateFlow 
            key={adminUser?.email || 'guest'}
            onSubmissionComplete={handleCandidateSubmission}
            questions={questions}
            candidateEmail={adminUser?.email}
          />
        )}

        {adminUser && adminUser.email.toLowerCase() === 'admin@indiwebpros.in' && activePortal === 'admin' && (
          <AdminFlow 
            submissions={submissions}
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onRefreshSubmissions={syncPostgresSubmissions}
          />
        )}

        {adminUser && adminUser.email.toLowerCase() === 'admin@indiwebpros.in' && activePortal === 'blueprints' && (
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
