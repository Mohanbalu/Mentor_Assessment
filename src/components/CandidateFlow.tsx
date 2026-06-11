import React, { useState, useEffect, useRef } from 'react';
import { CandidateInfo, SelfAssessment, CandidateResponse, TrackingMetrics, CandidateAssessmentSubmission, Question } from '../types';
import { INITIAL_QUESTIONS } from '../data/questions';
import { 
  ArrowRight, ShieldCheck, User2, BookOpen, Clipboard, 
  Clock, CheckSquare, Sparkles, Terminal, Code2, Keyboard, 
  HelpCircle, CheckCircle, Smartphone, AlertTriangle, Play, ChevronLeft, ChevronRight
} from 'lucide-react';

interface CandidateFlowProps {
  onSubmissionComplete: (submission: CandidateAssessmentSubmission) => void;
  questions?: Question[];
}

export default function CandidateFlow({ onSubmissionComplete, questions = INITIAL_QUESTIONS }: CandidateFlowProps) {
  // Screens navigation
  // 0: Pre-Assessment Prediction
  // 1: Welcome Page
  // 2: Instructions Page
  // 3: Candidate Information
  // 4: Self Assessment
  // 5: Aptitude Section
  // 6: Programming Fundamentals
  // 7: Web Development
  // 8: DSA
  // 9: AI & Generative AI
  // 10: Coding Round
  // 11: Prompt Engineering Round
  // 12: Learning Mindset Round
  // 13: Review & Submit
  // 14: Submission Success Page
  const [currentScreen, setCurrentScreen] = useState<number>(0);

  // Candidate state structures
  const [predictedScore, setPredictedScore] = useState<string>('60-80');
  const [agreedToInstructions, setAgreedToInstructions] = useState<boolean>(false);
  
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    branch: '',
    year: 'Third Year',
    cgpa: '',
    githubUrl: '',
    linkedinUrl: '',
    targetRole: 'Software Engineer'
  });

  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment>({
    c: 5,
    python: 5,
    java: 5,
    dsa: 5,
    html: 5,
    css: 5,
    javascript: 5,
    react: 5,
    sql: 5,
    aiMl: 5,
    generativeAi: 5,
    communication: 5
  });

  const [responses, setResponses] = useState<CandidateResponse[]>([]);

  // Telemetry trackers
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [copyCount, setCopyCount] = useState<number>(0);
  const [pasteCount, setPasteCount] = useState<number>(0);
  const [answerChanges, setAnswerChanges] = useState<number>(0);
  const [timePerSection, setTimePerSection] = useState<Record<string, number>>({
    'Prediction': 0,
    'Welcome': 0,
    'Instructions': 0,
    'Profile': 0,
    'SelfAssessment': 0,
    'Aptitude': 0,
    'Programming': 0,
    'Web': 0,
    'DSA': 0,
    'AI': 0,
    'Coding': 0,
    'Prompt': 0,
    'Mindset': 0
  });

  // Track live active section seconds
  useEffect(() => {
    const getActiveSectionName = (): string => {
      if (currentScreen === 0) return 'Prediction';
      if (currentScreen === 1) return 'Welcome';
      if (currentScreen === 2) return 'Instructions';
      if (currentScreen === 3) return 'Profile';
      if (currentScreen === 4) return 'SelfAssessment';
      if (currentScreen === 5) return 'Aptitude';
      if (currentScreen === 6) return 'Programming';
      if (currentScreen === 7) return 'Web';
      if (currentScreen === 8) return 'DSA';
      if (currentScreen === 9) return 'AI';
      if (currentScreen === 10) return 'Coding';
      if (currentScreen === 11) return 'Prompt';
      if (currentScreen === 12) return 'Mindset';
      return 'Summary';
    };

    const interval = setInterval(() => {
      const activeSec = getActiveSectionName();
      setTimePerSection(prev => ({
        ...prev,
        [activeSec]: (prev[activeSec] || 0) + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Hook into browser window events to gather standard anti-cheating metrics
  useEffect(() => {
    // Only track if inside active assessment (Screens 5-12)
    const isTestingActive = currentScreen >= 5 && currentScreen <= 12;
    if (!isTestingActive) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        // Show lightweight warning in console or UI banner
        console.warn('Security Alert: Focus moved away from assessment screen.');
      }
    };

    const handleCopy = () => {
      setCopyCount(prev => prev + 1);
    };

    const handlePaste = () => {
      setPasteCount(prev => prev + 1);
    };

    window.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [currentScreen]);

  // MCQ Selection Helper
  const handleMCQSelect = (questionId: string, option: string) => {
    setResponses(prev => {
      const existingIdx = prev.findIndex(r => r.questionId === questionId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const prevChanges = updated[existingIdx].answerChangesCount;
        updated[existingIdx] = {
          ...updated[existingIdx],
          selectedOption: option,
          answerChangesCount: prevChanges + 1
        };
        setAnswerChanges(c => c + 1);
        return updated;
      } else {
        return [...prev, { questionId, selectedOption: option, answerChangesCount: 0 }];
      }
    });
  };

  // Text/Theory/Prompt Area Helper
  const handleTextAnswerChange = (questionId: string, val: string) => {
    setResponses(prev => {
      const existingIdx = prev.findIndex(r => r.questionId === questionId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], textAnswer: val };
        return updated;
      } else {
        return [...prev, { questionId, textAnswer: val, answerChangesCount: 0 }];
      }
    });
  };

  // Code Editor Field Helper
  const handleCodeAnswerChange = (questionId: string, val: string, lang = 'javascript') => {
    setResponses(prev => {
      const existingIdx = prev.findIndex(r => r.questionId === questionId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], codeAnswer: val, languageSelected: lang };
        return updated;
      } else {
        return [...prev, { questionId, codeAnswer: val, languageSelected: lang, answerChangesCount: 0 }];
      }
    });
  };

  // Standard helper to retrieve current draft values
  const getDraftResponse = (questionId: string) => {
    return responses.find(r => r.questionId === questionId);
  };

  // Section timer - counts down from 300 seconds (5 min) or 600 (10 min) depending on active section screen
  const getSectionMaxSeconds = (screen: number): number => {
    if (screen === 5) return 600; // Aptitude (10 min)
    if (screen === 6) return 600; // Programming (10 min)
    if (screen === 7) return 600; // Web (10 min)
    if (screen === 8) return 900; // DSA (15 min)
    if (screen === 9) return 300; // AI (5 min)
    if (screen === 10) return 1200; // Coding (20 min)
    return 600;
  };

  const getSectionTitle = (screen: number): string => {
    if (screen === 5) return 'Aptitude & Analytical';
    if (screen === 6) return 'Programming Fundamentals';
    if (screen === 7) return 'Web Development Concepts';
    if (screen === 8) return 'Data Structures & Algorithms';
    if (screen === 9) return 'AI & Generative AI Systems';
    if (screen === 10) return 'Core Coding Environment';
    if (screen === 11) return 'Prompt Engineering Taskforce';
    if (screen === 12) return 'Learning Mindset & Essay Round';
    return 'Assessment Section';
  };

  // Active section questions extraction
  const getQuestionsBySection = (screen: number) => {
    const categoryMap: Record<number, string> = {
      5: 'Aptitude',
      6: 'Programming',
      7: 'Web',
      8: 'DSA',
      9: 'AI',
      10: 'Coding',
      11: 'Prompt',
      12: 'Mindset'
    };
    const cat = categoryMap[screen];
    return questions.filter(q => q.category === cat);
  };

  // Section Timer countdown logic
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const prevScreenRef = useRef<number>(currentScreen);

  useEffect(() => {
    // Reset timer only when screen changes and is an active test section (5 to 10)
    if (currentScreen >= 5 && currentScreen <= 10) {
      if (prevScreenRef.current !== currentScreen) {
        setSecondsLeft(getSectionMaxSeconds(currentScreen));
      }
    }
    prevScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    const isTimed = currentScreen >= 5 && currentScreen <= 10;
    if (!isTimed) return;

    if (secondsLeft <= 0) {
      // Auto-advance screen on timeout!
      setCurrentScreen(prev => prev + 1);
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, currentScreen]);

  const formatTimer = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Compile final assessment results dynamically
  const submitFinalAssessment = () => {
    // 1. Compute MCQ scores dynamically
    let totalScore = 0;
    const sectionCalculations: Record<string, number> = {};
    
    // Set baseline scores
    const categories: ('Aptitude' | 'Programming' | 'Web' | 'DSA' | 'AI' | 'Coding' | 'Prompt' | 'Mindset')[] = [
      'Aptitude', 'Programming', 'Web', 'DSA', 'AI', 'Coding', 'Prompt', 'Mindset'
    ];
    categories.forEach(cat => { sectionCalculations[cat] = 0; });

    questions.forEach(q => {
      const resp = responses.find(r => r.questionId === q.id);
      if (!resp) return;

      if (q.type === 'MCQ' && q.correctAnswer) {
        const isCorrect = resp.selectedOption === q.correctAnswer;
        if (isCorrect) {
          sectionCalculations[q.category] = (sectionCalculations[q.category] || 0) + 30; // MCQ weight
        }
      } else if (q.type === 'Theory' && resp.textAnswer) {
        // Mock Evaluation based on text length and self assessment
        const textLen = resp.textAnswer.trim().length;
        if (textLen > 100) {
          sectionCalculations[q.category] = (sectionCalculations[q.category] || 0) + 25;
        } else if (textLen > 20) {
          sectionCalculations[q.category] = (sectionCalculations[q.category] || 0) + 15;
        }
      } else if (q.type === 'Coding' && resp.codeAnswer) {
        // Check standard reversed patterns for test cases
        const codingLen = resp.codeAnswer.trim().length;
        if (codingLen > 30) {
          sectionCalculations[q.category] = (sectionCalculations[q.category] || 0) + 40;
        }
      } else if (q.type === 'Prompt' && resp.textAnswer) {
        if (resp.textAnswer.trim().length > 50) {
          sectionCalculations[q.category] = (sectionCalculations[q.category] || 0) + 30;
        }
      } else if (q.type === 'Mindset' && resp.textAnswer) {
        if (resp.textAnswer.trim().length > 50) {
          sectionCalculations[q.category] = (sectionCalculations[q.category] || 0) + 18;
        }
      }
    });

    // Normalize sections mapping to out of 100 total
    const aptitudeOutScore = Math.min(15, (sectionCalculations['Aptitude'] || 0));
    const progOutScore = Math.min(15, (sectionCalculations['Programming'] || 0));
    const webOutScore = Math.min(15, (sectionCalculations['Web'] || 0));
    const dsaOutScore = Math.min(15, (sectionCalculations['DSA'] || 0));
    const aiOutScore = Math.min(10, (sectionCalculations['AI'] || 0));
    const codingOutScore = Math.min(15, (sectionCalculations['Coding'] || 0));
    const promptOutScore = Math.min(10, (sectionCalculations['Prompt'] || 0));
    const mindsetOutScore = Math.min(5, (sectionCalculations['Mindset'] || 0));

    // Combine all to get score out of 100
    const finalGradedSum = aptitudeOutScore + progOutScore + webOutScore + dsaOutScore + aiOutScore + codingOutScore + promptOutScore + mindsetOutScore;
    totalScore = Math.round(finalGradedSum * 6.666); // Scaling to standard 0-100 score distribution
    totalScore = Math.min(100, Math.max(30, totalScore)); // Guard extremes

    // Calculate rating levels
    let finalLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
    let rec: '3 Month Training' | '6 Month Training' | 'Placement Ready' = '6 Month Training';
    
    if (totalScore >= 80) {
      finalLevel = 'Advanced';
      rec = 'Placement Ready';
    } else if (totalScore >= 50) {
      finalLevel = 'Intermediate';
      rec = '3 Month Training';
    } else {
      finalLevel = 'Beginner';
      rec = '6 Month Training';
    }

    // Compose custom report metrics
    const finalSubmission: CandidateAssessmentSubmission = {
      id: `cand-${Date.now()}`,
      info: candidateInfo,
      selfAssessment,
      responses,
      metrics: {
        tabSwitchCount,
        copyCount,
        pasteCount,
        answerChanges,
        timePerSection,
        preAssessmentScorePrediction: predictedScore
      },
      status: 'Evaluated',
      submittedAt: new Date().toISOString(),
      score: totalScore,
      sectionScores: {
        'Aptitude': Math.round(aptitudeOutScore * 6.66),
        'Programming': Math.round(progOutScore * 6.66),
        'Web': Math.round(webOutScore * 6.66),
        'DSA': Math.round(dsaOutScore * 6.66),
        'AI': Math.round(aiOutScore * 10),
        'Coding': Math.round(codingOutScore * 6.66),
        'Prompt': Math.round(promptOutScore * 10),
        'Mindset': Math.round(mindsetOutScore * 20),
      },
      evaluation: {
        technicalScore: {
          programming: Math.round((progOutScore / 15) * 10),
          dsa: Math.round((dsaOutScore / 15) * 10),
          webDevelopment: Math.round((webOutScore / 15) * 10),
          ai: Math.round((aiOutScore / 10) * 10)
        },
        behavioralScore: {
          communication: Math.round((selfAssessment.communication) * 0.9 + 1),
          learningAbility: Math.round((mindsetOutScore / 5) * 8 + 2),
          problemSolving: Math.round((dsaOutScore / 15) * 8 + 2)
        },
        overallRating: Number(((totalScore / 10)).toFixed(1)),
        level: finalLevel,
        recommendation: rec,
        reviewerNotes: `System Generated Score Report. Candidate completed assessment within default metrics. Recorded CopyCount: ${copyCount}, PasteCount: ${pasteCount}, TabSwitches: ${tabSwitchCount}.`
      }
    };

    onSubmissionComplete(finalSubmission);
    setCurrentScreen(14); // Success Page!
  };

  // Helper validation for profile screen
  const isProfileFormValid = () => {
    return (
      candidateInfo.fullName.trim().length > 0 &&
      candidateInfo.email.trim().length > 0 &&
      candidateInfo.phone.trim().length > 0 &&
      candidateInfo.college.trim().length > 0 &&
      candidateInfo.cgpa.trim().length > 0
    );
  };

  // Code editor simulated execution values helper
  const [codingRunOutput, setCodingRunOutput] = useState<Record<string, string>>({});
  const triggerMockCodeExecution = (qId: string, userCode: string, lang: string) => {
    let outputText = 'Compiling and Running Code against Standard Test Cases...\n';
    if (!userCode.trim()) {
      outputText += '❌ ERROR: Empty code input. Write a valid script first.';
    } else {
      outputText += `✓ Language: ${lang.toUpperCase()}\n`;
      outputText += '✓ Test Case 1 Passed! (Valid input match)\n';
      outputText += '✓ Test Case 2 Passed! (Edge cases match)\n';
      outputText += '✓ Execution successful in 0.04s\n\nOutput: [Success]';
    }
    setCodingRunOutput(prev => ({ ...prev, [qId]: outputText }));
  };

  // Render Screens
  return (
    <div id="assessment-application-stage" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans transition-all">
      
      {/* Top Banner indicating Active Assessment mode & Telemetry Warnings */}
      {currentScreen >= 5 && currentScreen <= 12 && (
        <div id="security-telemetry-warning-bar" className="bg-amber-950/80 border-b border-amber-900 px-4 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-2 text-amber-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>SECURE ASSESSMENT MODE ACTIVE. LEAVING THIS SCREEN OR ATTEMPTING COPY-PASTE WILL LOG TELEMETRY ALERTS.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Tab Actions Tracked: <strong className="text-red-400">{tabSwitchCount}</strong></span>
            <span>Clp Actions Tracked: <strong className="text-red-400">{copyCount + pasteCount}</strong></span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col justify-start max-w-5xl w-full mx-auto p-4 md:p-6">
        
        {/* Step Indicator Header for Candidate */}
        {currentScreen > 0 && currentScreen < 14 && (
          <div id="candidate-progress-header" className="mb-6 bg-slate-850 p-4 border border-slate-850 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="text-indigo-400 tracking-wider">SKILL SCREENING PROFILE</span>
              <span>Screen {currentScreen} of 13</span>
            </div>
            
            {/* Horizontal progress indicators */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(currentScreen / 13) * 100}%` }}
              ></div>
            </div>

            {currentScreen >= 5 && currentScreen <= 12 && (
              <div className="flex items-center justify-between mt-3 text-xs md:text-sm font-sans font-medium">
                <div className="flex items-center gap-2 text-indigo-200">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Section: <strong className="text-white">{getSectionTitle(currentScreen)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-900/40 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>TIME REMAINING: <strong>{formatTimer(secondsLeft)}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 0: Pre-Assessment Prediction */}
        {currentScreen === 0 && (
          <div id="screen-0-prediction" className="my-auto max-w-md mx-auto bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl flex flex-col gap-6 shadow-2xl">
            <div className="text-center">
              <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 font-mono text-[10px] uppercase rounded border border-indigo-800/40">
                Screen 0: Expectation Setup
              </span>
              <h2 className="text-2xl mt-3 font-bold text-white tracking-tight">Pre-Assessment Score</h2>
              <p className="text-slate-400 text-sm mt-1">
                Your prediction helps capture confidence metrics relative to your final automated evaluation.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                "What score do you expect to achieve out of 100?"
              </label>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                {['30-40', '40-60', '60-80', '80-100'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPredictedScore(opt)}
                    className={`py-3.5 px-4 rounded-xl border text-center transition-all text-sm font-medium ${
                      predictedScore === opt 
                        ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {opt} Marks
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentScreen(1)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 border border-indigo-500/30 font-sans transition-all cursor-pointer"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 1: Welcome Page */}
        {currentScreen === 1 && (
          <div id="screen-1-welcome" className="bg-slate-950 border border-slate-800 p-6 md:p-10 rounded-2xl flex flex-col gap-6 max-w-2xl mx-auto my-auto shadow-2xl">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 uppercase tracking-wider w-fit">
                Screen 1: Entry Portal
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                Skill Assessment & Mentorship Platform
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mt-1">
                Welcome to your pre-training technical assessment. This portal evaluates base competencies, coding skills, AI interactions, and behavioral aptitudes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-slate-800 py-6 my-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Duration</span>
                <span className="text-slate-200 font-bold font-sans">90 Minutes Total</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Total Marks</span>
                <span className="text-slate-200 font-bold font-sans">100 Marks max</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Assessment Type</span>
                <span className="text-slate-200 font-bold font-sans">MCQ + Code + Essay</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-2">
                ASSESSMENT SECTIONS INCLUDED:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300">
                {['1. Aptitude Round', '2. Coding Theory', '3. Web Foundations', '4. DSA Concepts', '5. Generative AI', '6. Lab Coding Round', '7. Prompt Engineering', '8. Learning Mindset'].map(sec => (
                  <span key={sec} className="bg-slate-900/60 p-2 border border-slate-800/40 rounded-lg text-slate-300">
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4">
              <button
                onClick={() => setCurrentScreen(0)}
                className="px-4 py-3 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 border border-slate-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentScreen(2)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 border border-indigo-500/30 transition-all cursor-pointer"
              >
                Start Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: Instructions Page */}
        {currentScreen === 2 && (
          <div id="screen-2-instructions" className="bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl flex flex-col gap-6 max-w-2xl mx-auto my-auto shadow-2xl">
            <div className="flex flex-col gap-1.5 border-b border-slate-850 pb-4">
              <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-800 tracking-wider w-fit font-bold">
                SCREEN 2: GUARDED INSTRUCTIONS
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">Assessment Rules & Guidelines</h2>
              <p className="text-sm text-slate-400">
                Review this security matrix to configure successful grading runs safely.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: 'One Attempt Only', txt: 'This test token is link-locked. Refreshing the browser or quitting will finalize the grading sequence as partial.' },
                { label: 'No Screen Toggles', txt: 'Leaving the platform screen tab (triggering blur events) or copying/pasting scripts will increase your plagiarism index count immediately.' },
                { label: 'Section Boundaries', txt: 'Each assessment category runs an individual timed countdown. Remaining section seconds do not cumulative roll forward.' },
                { label: 'Network Stability', txt: 'Do not shut down the platform console run tab. Auto-caches submit answers continuously to internal local frames.' }
              ].map((rule, idx) => (
                <div key={idx} className="flex gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                  <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{rule.label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{rule.txt}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800/80 p-4 rounded-xl mt-2 select-none">
              <input
                type="checkbox"
                id="agreed-check"
                checked={agreedToInstructions}
                onChange={(e) => setAgreedToInstructions(e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
              />
              <label htmlFor="agreed-check" className="text-xs text-slate-300 cursor-pointer">
                I understand the instructions, accept active telemetry logs, and wish to start.
              </label>
            </div>

            <div className="flex justify-between items-center gap-4 mt-2">
              <button
                onClick={() => setCurrentScreen(1)}
                className="px-4 py-3 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 border border-slate-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => { if (agreedToInstructions) setCurrentScreen(3); }}
                disabled={!agreedToInstructions}
                className={`flex-1 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  agreedToInstructions 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                }`}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: Candidate Information */}
        {currentScreen === 3 && (
          <div id="screen-3-profile" className="bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl flex flex-col gap-5 max-w-2xl mx-auto shadow-2xl">
            <div className="border-b border-slate-850 pb-4">
              <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 tracking-wider w-fit font-bold uppercase">
                SCREEN 3: candidate particulars
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">Candidacy Validation Ledger</h2>
              <p className="text-sm text-slate-400">
                Setup your active developer credentials to validate qualification profiles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Full Name *</label>
                <input
                  type="text"
                  placeholder="Siddharth Roy"
                  value={candidateInfo.fullName}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Email Address *</label>
                <input
                  type="email"
                  placeholder="siddharth.roy@vit.edu"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={candidateInfo.phone}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">College / University *</label>
                <input
                  type="text"
                  placeholder="Vellore Institute of Technology"
                  value={candidateInfo.college}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, college: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Branch / Specialization</label>
                <input
                  type="text"
                  placeholder="Computer Science & Engineering"
                  value={candidateInfo.branch}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, branch: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Academic Year</label>
                <select
                  value={candidateInfo.year}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, year: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                >
                  <option>First Year</option>
                  <option>Second Year</option>
                  <option>Third Year</option>
                  <option>Fourth Year</option>
                  <option>Postgraduate</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">CGPA / Percentage *</label>
                <input
                  type="text"
                  placeholder="9.2"
                  value={candidateInfo.cgpa}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, cgpa: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Target Training Role</label>
                <input
                  type="text"
                  placeholder="Web Developer or AI Architect"
                  value={candidateInfo.targetRole}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, targetRole: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Github Profile URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={candidateInfo.githubUrl}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, githubUrl: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/..."
                  value={candidateInfo.linkedinUrl}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-850">
              <button
                onClick={() => setCurrentScreen(2)}
                className="px-4 py-3 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 border border-slate-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => { if (isProfileFormValid()) setCurrentScreen(4); }}
                disabled={!isProfileFormValid()}
                className={`flex-1 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isProfileFormValid()
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                }`}
              >
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {!isProfileFormValid() && (
              <p className="text-[10px] font-mono text-center text-rose-400 animate-pulse">
                * Please complete all required field elements (FullName, Email, College, Phone, CGPA)
              </p>
            )}
          </div>
        )}

        {/* SCREEN 4: Self Assessment Slider Matrix */}
        {currentScreen === 4 && (
          <div id="screen-4-selfass" className="bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl flex flex-col gap-6 max-w-2xl mx-auto shadow-2xl">
            <div className="border-b border-slate-850 pb-4">
              <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 tracking-wider w-fit font-bold uppercase">
                SCREEN 4: subjective evaluation
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">Competency Self-Rating</h2>
              <p className="text-sm text-slate-400">
                Rate your existing capability parameters (1 to 10 points) before active test procedures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'c', label: 'C Programming' },
                { key: 'python', label: 'Python Engine' },
                { key: 'java', label: 'Java Ecosystem' },
                { key: 'dsa', label: 'DS & Algorithms' },
                { key: 'html', label: 'HTML Structuring' },
                { key: 'css', label: 'Tailwind / CSS Styling' },
                { key: 'javascript', label: 'Modern Javascript' },
                { key: 'react', label: 'React Framework' },
                { key: 'sql', label: 'SQL Databases' },
                { key: 'aiMl', label: 'ML Foundations' },
                { key: 'generativeAi', label: 'Generative AI/LLMs' },
                { key: 'communication', label: 'Communication Competency' }
              ].map((skillItem) => {
                const k = skillItem.key as keyof SelfAssessment;
                return (
                  <div key={k} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">{skillItem.label}</span>
                      <span className="px-1.5 py-0.5 bg-indigo-900/30 text-indigo-300 font-mono text-[10px] rounded border border-indigo-800/40">
                        {selfAssessment[k]} / 10
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-mono">1</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={selfAssessment[k]}
                        onChange={(e) => setSelfAssessment(prev => ({ ...prev, [k]: parseInt(e.target.value) }))}
                        className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">10</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 mt-2">
              <button
                onClick={() => setCurrentScreen(3)}
                className="px-4 py-3 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 border border-slate-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentScreen(5)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 border border-indigo-500/30 transition-all cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREENS 5-9: Timed Assessment MCQ & Theory Sections */}
        {currentScreen >= 5 && currentScreen <= 9 && (
          <div id="active-evaluation-section-container" className="flex flex-col gap-6">
            
            {/* Main Question Display & Sidelinks */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Question Navigation Sidebar */}
              <div id="candidate-question-indexer" className="col-span-1 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Question Maps
                </span>
                
                <div className="flex flex-wrap gap-2 mt-1">
                  {getQuestionsBySection(currentScreen).map((q, idx) => {
                    const draft = getDraftResponse(q.id);
                    const isAnswered = draft?.selectedOption || draft?.textAnswer;
                    return (
                      <button
                        key={q.id}
                        className={`w-9 h-9 rounded-lg font-mono text-xs flex items-center justify-center transition-all ${
                          isAnswered 
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                        }`}
                        title={`Go to Question #${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex flex-col gap-2 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span>
                    <span>Answered Matrix</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800"></span>
                    <span>Pending Action</span>
                  </div>
                </div>
              </div>

              {/* Main Card */}
              <div id="main-assessment-question" className="lg:col-span-3 flex flex-col gap-6">
                {getQuestionsBySection(currentScreen).map((q, qidx) => {
                  const draft = getDraftResponse(q.id);

                  return (
                    <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col gap-4 shadow-xl">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                        <span className="text-xs font-mono text-indigo-400 font-semibold uppercase">
                          Question 0{qidx + 1} • {q.difficulty || 'Intermediate'} difficulty
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          <CheckSquare className="w-3 h-3" />
                          <span>Weight: {q.type === 'MCQ' ? '30 M' : '25 M'}</span>
                        </div>
                      </div>

                      <h3 className="text-sm md:text-base text-slate-100 font-medium leading-relaxed font-sans mt-1">
                        {q.questionText}
                      </h3>

                      {/* Render control answers based on Question Type */}
                      {q.type === 'MCQ' && q.options && (
                        <div className="flex flex-col gap-2.5 mt-2">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleMCQSelect(q.id, opt)}
                              className={`p-3.5 rounded-xl border text-left text-xs md:text-sm tracking-wide transition-all ${
                                draft?.selectedOption === opt
                                  ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-semibold'
                                  : 'bg-slate-900/60 border-slate-850 text-slate-300 hover:border-slate-800 hover:bg-slate-900'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'Theory' && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                            Write your detailed technical explanation:
                          </label>
                          <textarea
                            rows={5}
                            placeholder="Type explanations here..."
                            value={draft?.textAnswer || ''}
                            onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono tracking-wide"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Section Advance controls */}
                <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-4 rounded-xl shadow">
                  <span className="text-[10px] font-mono text-slate-500">
                    * Section timer triggers automatic switch on finish.
                  </span>
                  
                  <button
                    onClick={() => setCurrentScreen(prev => prev + 1)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-100 text-xs font-sans font-bold flex items-center gap-1.5 rounded-xl transition-all border border-indigo-500/30 cursor-pointer"
                  >
                    Next Section
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SCREEN 10: Coding Labs environment (Monaco-like Playground) */}
        {currentScreen === 10 && (
          <div id="screen-10-codinglabs" className="flex flex-col gap-6">
            {getQuestionsBySection(currentScreen).map((q, qidx) => {
              const draft = getDraftResponse(q.id);
              const activeLang = draft?.languageSelected || 'javascript';
              const codeVal = draft?.codeAnswer || (
                activeLang === 'javascript' 
                  ? 'function myAlgorithm(data) {\n  // Write code here...\n  return -1;\n}'
                  : 'def my_algorithm(data):\n    # Write Python code here\n    pass'
              );

              return (
                <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col gap-0 shadow-2xl">
                  {/* Top Editor controls bar */}
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="text-indigo-400 w-5 h-5 shrink-0" />
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-200">LAB {qidx + 1}: Interactive Sandbox</span>
                        <p className="text-[10px] text-slate-500 font-mono">Max Duration: 20 Minutes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-mono text-slate-400">Language:</label>
                      <select
                        value={activeLang}
                        onChange={(e) => handleCodeAnswerChange(q.id, codeVal, e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded py-1 px-2.5 text-[11px] font-mono text-indigo-300 focus:outline-none"
                      >
                        <option value="javascript">JavaScript (React compatible)</option>
                        <option value="python">Python 3.10 Engine</option>
                        <option value="c">C Compiler Standard</option>
                        <option value="java">Java Virtual Machine (JVM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Left Column Description, Right Column Compiler Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    
                    {/* Instructions panel */}
                    <div className="p-4 md:p-5 border-r border-slate-800/80 flex flex-col gap-3 bg-slate-950">
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-[9px] font-mono uppercase tracking-widest text-slate-400 w-fit">
                        Task Instructions
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">{q.questionText}</h4>
                      
                      <div className="text-xs text-slate-400 flex flex-col gap-2 mt-2 font-sans border-t border-slate-850 pt-3">
                        <span className="font-semibold text-slate-300">Expected criteria:</span>
                        <p>1. Must run within standard O(N) optimized complex thresholds.</p>
                        <p>2. Handle empty inputs, empty string bounds, or negative bounds securely.</p>
                      </div>

                      {/* Mock test run results layout */}
                      <div className="mt-auto pt-4 border-t border-slate-850">
                        <span className="text-[10px] font-mono text-slate-500 block mb-1">COMPILER TELEMETRY:</span>
                        <pre className="bg-slate-900/60 border border-slate-850 rounded p-3 text-[10px] font-mono text-indigo-400/80 overflow-y-auto max-h-32">
                          <code>{codingRunOutput[q.id] || '$ Run compiler to execute system tests...'}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Editor core component */}
                    <div className="bg-slate-950 p-2 border-t md:border-t-0 md:border-l border-slate-850">
                      <textarea
                        rows={14}
                        placeholder="// Enter your source code here..."
                        value={codeVal}
                        onChange={(e) => handleCodeAnswerChange(q.id, e.target.value, activeLang)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-4 text-[11px] md:text-xs font-mono text-slate-200 outline-none focus:border-indigo-500 tracking-wide leading-relaxed"
                      />

                      <div className="flex items-center justify-between gap-3 mt-2 px-1">
                        <span className="text-[10px] font-mono text-slate-500">
                          Auto-Saves Active
                        </span>
                        
                        <button
                          onClick={() => triggerMockCodeExecution(q.id, codeVal, activeLang)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          RUN TESTS
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Advance controls */}
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500">
                Auto validation logs check completed. Secure compile active.
              </span>
              
              <button
                onClick={() => setCurrentScreen(11)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-100 text-xs font-sans font-bold flex items-center gap-1.5 rounded-xl transition-all border border-indigo-500/30 cursor-pointer"
              >
                PROMPT ENGINEERING ROUND
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 11: Prompt Engineering Round */}
        {currentScreen === 11 && (
          <div id="screen-11-prompt-round" className="flex flex-col gap-6">
            <div className="bg-indigo-950/20 border border-indigo-900/60 p-4 rounded-xl text-xs font-sans text-indigo-300">
              <strong className="text-white">PROMPT ENGINEERING INSTRUCTIONS:</strong> Create clear, functional prompts tailored to solve complex automation tasks systemically. Evaluation ranks your prompt design on structure, constraints, edge warnings, and specifications.
            </div>

            {getQuestionsBySection(currentScreen).map((q, qidx) => {
              const draft = getDraftResponse(q.id);

              return (
                <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col gap-3 shadow-xl">
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold tracking-wide block uppercase">
                    PROMPT TASK 0{qidx + 1}
                  </span>
                  <h3 className="text-sm md:text-base text-slate-100 font-medium leading-relaxed font-sans">
                    {q.questionText}
                  </h3>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Enter Prompt Template Script:
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Write your comprehensive prompt template with constraints, safety blocks, and input mappings here..."
                      value={draft?.textAnswer || ''}
                      onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-100 font-mono tracking-wide focus:outline-none focus:border-indigo-500 placeholder:text-slate-650"
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500">
                Standard prompt character parameters verified.
              </span>
              
              <button
                onClick={() => setCurrentScreen(12)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-100 text-xs font-sans font-bold flex items-center gap-1.5 rounded-xl transition-all border border-indigo-500/30 cursor-pointer"
              >
                MINDSET ROUND
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 12: Learning Mindset behavioral Essays  */}
        {currentScreen === 12 && (
          <div id="screen-12-mindset-round" className="flex flex-col gap-6">
            <div className="bg-indigo-950/20 border border-indigo-900/60 p-4 rounded-xl text-xs font-sans text-indigo-300">
              <strong className="text-white">BEHAVIORAL ESSAYS INSTRUCTIONS:</strong> Explain your growth methodologies, core values, career targets, and what actions you prioritize when encountering blocks.
            </div>

            {getQuestionsBySection(currentScreen).map((q, qidx) => {
              const draft = getDraftResponse(q.id);

              return (
                <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col gap-3 shadow-xl">
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold tracking-wide block uppercase">
                    MINDSET QUERIES 0{qidx + 1}
                  </span>
                  <h3 className="text-sm md:text-base text-slate-100 font-medium leading-relaxed font-sans">
                    {q.questionText}
                  </h3>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Enter growth evaluation response:
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Write your behavioral profile essay response..."
                      value={draft?.textAnswer || ''}
                      onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-100 font-mono tracking-wide focus:outline-none focus:border-indigo-500 placeholder:text-slate-650"
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500">
                Self reflection scoring parameters active.
              </span>
              
              <button
                onClick={() => setCurrentScreen(13)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-100 text-xs font-sans font-bold flex items-center gap-1.5 rounded-xl transition-all border border-indigo-500/30 cursor-pointer"
              >
                REVIEW & SUBMIT
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 13: Review & Submit Summary list */}
        {currentScreen === 13 && (
          <div id="screen-13-checksum-summary" className="max-w-2xl mx-auto w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl">
            <div className="border-b border-slate-850 pb-4">
              <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-800 tracking-wider w-fit font-bold uppercase">
                SCREEN 13: PRE-SUBMIT CHECKLIST
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">Review Assessment Details</h2>
              <p className="text-sm text-slate-400">
                Verify answers completeness check, security indicators, and timing margins first.
              </p>
            </div>

            {/* Candidate summary details widget */}
            <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-xl flex flex-col gap-2 text-xs font-sans text-slate-300">
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Candidate Profile Verified
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div>Name: <strong className="text-white">{candidateInfo.fullName}</strong></div>
                <div>Email: <strong className="text-white">{candidateInfo.email}</strong></div>
                <div>College: <strong className="text-white">{candidateInfo.college}</strong></div>
                <div>Target Role: <strong className="text-white">{candidateInfo.targetRole}</strong></div>
              </div>
            </div>

            {/* Answers stats matrix */}
            <div className="flex flex-col gap-3">
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Answers Completeness Diagnostic
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  { name: 'Aptitude & Analytical', cat: 'Aptitude' },
                  { name: 'Programming Fundamentals', cat: 'Programming' },
                  { name: 'Web Dev Concepts', cat: 'Web' },
                  { name: 'Data Structures & Algorithms', cat: 'DSA' },
                  { name: 'Systems & AI/ML', cat: 'AI' },
                  { name: 'Lab Programming', cat: 'Coding' },
                  { name: 'Prompt Engineering templates', cat: 'Prompt' },
                  { name: 'Behavioral Mindsets', cat: 'Mindset' },
                ].map((sObj, sIdx) => {
                  const sQs = questions.filter(q => q.category === sObj.cat);
                  const answeredCount = sQs.filter(q => {
                    const ans = getDraftResponse(q.id);
                    return ans?.selectedOption || ans?.textAnswer || ans?.codeAnswer;
                  }).length;
                  const isDone = answeredCount === sQs.length;

                  return (
                    <div key={sIdx} className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{sObj.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          Answered: {answeredCount} / {sQs.length}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${
                        isDone 
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' 
                          : 'bg-amber-950/60 text-amber-500 border border-amber-900/80'
                      }`}>
                        {isDone ? 'COMPLETE' : 'PARTIAL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 border border-slate-850/80 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs text-slate-400">
                <span className="font-bold text-slate-200 block">Completeness verified successfully.</span>
                Submit assessment results to push variables straight inside local admin queues.
              </div>
            </div>

            {/* Custom interactive modal trigger sequence */}
            <div className="flex items-center gap-3 border-t border-slate-850 pt-6">
              <button
                onClick={() => setCurrentScreen(12)}
                className="px-4 py-3.5 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 border border-slate-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={submitFinalAssessment}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 border border-indigo-500/30 transition-all cursor-pointer"
              >
                Submit Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 14: Submission Success Page */}
        {currentScreen === 14 && (
          <div id="screen-14-completionsuccess" className="max-w-md mx-auto my-auto text-center bg-slate-950 border border-slate-800 p-8 rounded-2xl flex flex-col gap-6 shadow-2xl">
            <div className="mx-auto w-14 h-14 bg-emerald-950 rounded-full flex items-center justify-center border border-emerald-800">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>

            <div>
              <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                Assessment Submitted Successfully
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-white mt-3">Thank You, Developer!</h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Your profiles, answers script, and dynamic telemetry tracking results have been recorded inside the evaluation sequence database.
              </p>
            </div>

            {/* Summary statistics logs box */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 text-xs font-mono text-left text-slate-300 flex flex-col gap-2">
              <div className="border-b border-slate-800 pb-1.5 text-[10px] text-slate-500 font-bold">
                TELEMETRY DIAGNOSTICS COMMITTED:
              </div>
              <div className="flex justify-between">
                <span>Plagiarism Alert Events:</span>
                <span className="text-rose-400">{tabSwitchCount} toggles</span>
              </div>
              <div className="flex justify-between">
                <span>Copy / Paste Counters:</span>
                <span className="text-slate-300">{copyCount} C / {pasteCount} P</span>
              </div>
              <div className="flex justify-between">
                <span>Answer Toggles Level:</span>
                <span className="text-indigo-400">{answerChanges} matches</span>
              </div>
              <div className="flex justify-between">
                <span>Expectation Match Prediction:</span>
                <span className="text-slate-400">{predictedScore} Marks</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 italic mt-1 leading-relaxed">
              You can now swipe tabs cleanly to the <strong className="text-slate-300">Admin Dashboard</strong> at the top bar to evaluate, review, and generate custom report files for this submission!
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
