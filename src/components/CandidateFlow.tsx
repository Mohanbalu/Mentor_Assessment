import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../utils/api';
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
  candidateEmail?: string;
  key?: string;
}

export default function CandidateFlow({ onSubmissionComplete, questions = INITIAL_QUESTIONS, candidateEmail }: CandidateFlowProps) {
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
  // Simple helper to get the partitioned localStorage key names for the active logged-in candidate
  const getScopedKey = (baseKey: string) => {
    if (!candidateEmail) {
      // Return a temporary, non-leakable key namespace for the guest / fallback frames
      return `temp_guest_${baseKey}`;
    }
    const cleanEmail = candidateEmail.trim().toLowerCase();
    return `cand_${cleanEmail}_${baseKey}`;
  };

  const [currentScreen, setCurrentScreen] = useState<number>(() => {
    const cached = localStorage.getItem(getScopedKey('current_screen'));
    return cached ? parseInt(cached, 10) : 0;
  });

  const [sessionId, setSessionId] = useState<string>(() => {
    const key = getScopedKey('session_id');
    const cached = localStorage.getItem(key);
    if (cached) return cached;
    const newSess = 'sess-' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem(key, newSess);
    return newSess;
  });

  const [candidateDbId, setCandidateDbId] = useState<number | null>(() => {
    const cached = localStorage.getItem(getScopedKey('db_id'));
    return cached ? parseInt(cached, 10) : null;
  });

  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>(INITIAL_QUESTIONS);

  useEffect(() => {
    let active = true;
    const fetchQuestions = async () => {
      try {
        console.log('[CandidateFlow] Loading questions dynamically from PostgreSQL assessments...');
        const [res1, res2, res3] = await Promise.all([
          fetch(getApiUrl('/api/assessments/1/questions')),
          fetch(getApiUrl('/api/assessments/2/questions')),
          fetch(getApiUrl('/api/assessments/3/questions'))
        ]);
        
        if (!active) return;

        const data1 = res1.ok ? await res1.json() : null;
        const data2 = res2.ok ? await res2.json() : null;
        const data3 = res3.ok ? await res3.json() : null;

        const allRawQuestions = [
          ...(data1?.success && Array.isArray(data1.data) ? data1.data : []),
          ...(data2?.success && Array.isArray(data2.data) ? data2.data : []),
          ...(data3?.success && Array.isArray(data3.data) ? data3.data : [])
        ];

        if (allRawQuestions.length > 0) {
          console.log(`[CandidateFlow] Loaded ${allRawQuestions.length} questions from database.`);
          
          const mappedQuestions = allRawQuestions.map((q: any) => {
            let category: 'Aptitude' | 'Programming' | 'Web' | 'DSA' | 'AI' | 'Coding' | 'Prompt' | 'Mindset' = 'Aptitude';
            
            if (q.assessment_id === '1') {
              category = 'Aptitude';
            } else if (q.assessment_id === '2') {
              const qIdNum = Number(q.id);
              if (qIdNum >= 21 && qIdNum <= 25) {
                category = 'Programming';
              } else if (qIdNum >= 26 && qIdNum <= 30) {
                category = 'Web';
              } else if (qIdNum >= 31 && qIdNum <= 35) {
                category = 'DSA';
              } else if (qIdNum >= 36 && qIdNum <= 40) {
                category = 'AI';
              } else {
                if (q.id.startsWith('prog-')) category = 'Programming';
                else if (q.id.startsWith('web-')) category = 'Web';
                else if (q.id.startsWith('dsa-')) category = 'DSA';
                else if (q.id.startsWith('ai-')) category = 'AI';
                else category = 'Programming';
              }
            } else if (q.assessment_id === '3') {
              category = 'Coding';
            }

            let options: string[] | undefined = undefined;
            if (q.option_a) {
              options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean) as string[];
            } else if (q.options_json) {
              try {
                options = JSON.parse(q.options_json);
              } catch {
                options = undefined;
              }
            }

            return {
              id: String(q.id),
              category,
              type: q.question_type === 'coding' ? 'Coding' : (q.question_type === 'theory' || q.question_type === 'descriptive' ? 'Theory' : 'MCQ'),
              questionText: q.question_text,
              options,
              correctAnswer: q.correct_option || q.correct_answer || undefined,
              difficulty: 'Intermediate' as const
            };
          });

          // Mix with Prompt / Mindset Fallback classes
          setLoadedQuestions(prev => {
            const staticPromptsAndMindsets = prev.filter(p => p.category === 'Prompt' || p.category === 'Mindset');
            return [...mappedQuestions, ...staticPromptsAndMindsets];
          });
        }
      } catch (err) {
        console.error('[CandidateFlow] Failed to load assessments questions:', err);
      }
    };

    fetchQuestions();
    return () => {
      active = false;
    };
  }, [candidateEmail]);

  const handleSavePreAssessmentScore = async (scoreVal: string) => {
    try {
      const targetUrl = getApiUrl('/api/pre-assessment-score');
      console.log(`[Pre-Assessment Save] Sending score to ${targetUrl}:`, { session_id: sessionId, expected_score: scoreVal, candidate_id: candidateDbId });
      
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          expected_score: scoreVal,
          candidate_id: candidateDbId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save pre-assessment score.');
      }
      
      console.log('[Pre-Assessment Save] Score saved successfully.');
    } catch (err) {
      console.error('[Pre-Assessment Save Error] Failed:', err);
    }
    // Always advance to welcome page
    setCurrentScreen(1);
  };

  const handleSaveSectionResponses = async (screenIdx: number): Promise<boolean> => {
    try {
      const activeQs = getQuestionsBySection(screenIdx);
      const apiPayloadResponses = activeQs.map(q => {
        const resp = responses.find(r => r.questionId === q.id) || {};
        return {
          questionId: q.id,
          selectedOption: resp.selectedOption || null,
          textAnswer: resp.textAnswer || null,
          codeAnswer: resp.codeAnswer || null,
          languageSelected: resp.languageSelected || null
        };
      });

      const bodyPayload = {
        session_id: sessionId,
        candidate_id: candidateDbId,
        screen_index: screenIdx,
        responses: apiPayloadResponses
      };

      const targetUrl = getApiUrl('/api/screen-responses');
      console.log(`[Screen Save] Saving Screen ${screenIdx} to ${targetUrl}:`, bodyPayload);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        throw new Error(`Failed to save screen ${screenIdx} progress to backend.`);
      }

      console.log(`[Screen Save] Screen ${screenIdx} saved successfully.`);
      return true;
    } catch (err) {
      console.error(`[Screen Save Error] Failed to persist progress:`, err);
      return false;
    }
  };

  const submitRef = useRef<() => void>(() => {});
  const [isFullscreenExited, setIsFullscreenExited] = useState<boolean>(false);

  const requestFullScreenMode = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
        .then(() => {
          setIsFullscreenExited(false);
        })
        .catch(err => {
          console.warn("[Fullscreen] Failed to enter fullscreen mode:", err);
        });
    } else {
      setIsFullscreenExited(false);
    }
  };

  const advanceWithSave = async () => {
    if (currentScreen === 4) {
      // Save Self-Assessment screen responses
      try {
        const payloadResponses = Object.entries(selfAssessment).map(([key, val]) => {
          const selfRatingToDbId: Record<string, string> = {
            c: '46',
            python: '47',
            java: '48',
            dsa: '49',
            html: '50',
            css: '51',
            javascript: '52',
            react: '53',
            sql: '54',
            aiMl: '55',
            generativeAi: '56',
            communication: '57'
          };
          const dbQuestionId = selfRatingToDbId[key] || `self-rating-${key}`;
          return {
            questionId: dbQuestionId,
            selectedOption: val.toString()
          };
        });
        await fetch(getApiUrl('/api/screen-responses'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            candidate_id: candidateDbId,
            screen_index: 4,
            responses: payloadResponses
          })
        });
      } catch (err) {
        console.error('Failed to save self-assessment ratings:', err);
      }
      
      // Automatically request full screen upon entering secure assessment (Screen 5)
      requestFullScreenMode();
    } else if (currentScreen >= 5 && currentScreen <= 12) {
      await handleSaveSectionResponses(currentScreen);
      // Encourage keeping fullscreen active
      if (!document.fullscreenElement) {
        requestFullScreenMode();
      }
    }
    setCurrentScreen(prev => prev + 1);
  };

  // Candidate state structures
  const [predictedScore, setPredictedScore] = useState<string>(() => {
    return localStorage.getItem(getScopedKey('predicted_score')) || '60-80';
  });
  const [agreedToInstructions, setAgreedToInstructions] = useState<boolean>(() => {
    return localStorage.getItem(getScopedKey('agreed_instructions')) === 'true';
  });
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>(() => {
    const cached = localStorage.getItem(getScopedKey('info'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return {
            fullName: parsed.fullName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            college: parsed.college || '',
            branch: parsed.branch || '',
            year: parsed.year || 'Third Year',
            cgpa: parsed.cgpa || '',
            githubUrl: parsed.githubUrl || '',
            linkedinUrl: parsed.linkedinUrl || '',
            targetRole: parsed.targetRole || 'Software Engineer',
            resumeUrl: parsed.resumeUrl || '',
            resumeFilename: parsed.resumeFilename || ''
          };
        }
      } catch (err) {
        console.error('Failed to parse cached candidate_info:', err);
      }
    }
    return {
      fullName: '',
      email: '',
      phone: '',
      college: '',
      branch: '',
      year: 'Third Year',
      cgpa: '',
      githubUrl: '',
      linkedinUrl: '',
      targetRole: 'Software Engineer',
      resumeUrl: '',
      resumeFilename: ''
    };
  });

  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment>(() => {
    const cached = localStorage.getItem(getScopedKey('self_assessment'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (err) {}
    }
    return {
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
    };
  });

  const [responses, setResponses] = useState<CandidateResponse[]>(() => {
    const cached = localStorage.getItem(getScopedKey('responses'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {}
    }
    return [];
  });

  // Telemetry trackers
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(() => {
    const cached = localStorage.getItem(getScopedKey('tab_switch_count'));
    return cached ? parseInt(cached, 10) : 0;
  });
  const [copyCount, setCopyCount] = useState<number>(() => {
    const cached = localStorage.getItem(getScopedKey('copy_count'));
    return cached ? parseInt(cached, 10) : 0;
  });
  const [pasteCount, setPasteCount] = useState<number>(() => {
    const cached = localStorage.getItem(getScopedKey('paste_count'));
    return cached ? parseInt(cached, 10) : 0;
  });
  const [answerChanges, setAnswerChanges] = useState<number>(() => {
    const cached = localStorage.getItem(getScopedKey('answer_changes'));
    return cached ? parseInt(cached, 10) : 0;
  });
  const [timePerSection, setTimePerSection] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem(getScopedKey('time_per_section'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (err) {}
    }
    return {
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
    };
  });

  const fetchProfileAndAutofill = async (emailToFetch: string) => {
    if (!emailToFetch || !emailToFetch.trim()) return;
    try {
      const url = getApiUrl(`/api/candidate-profile?email=${encodeURIComponent(emailToFetch.trim())}`);
      const res = await fetch(url);
      if (res.ok) {
        const body = await res.json();
        if (body && body.success && body.data) {
          const dbRecord = body.data;
          console.log('[Autofill] Found existing profile in DB, autofilling fields:', dbRecord);
          setCandidateInfo(prev => {
            const updated = {
              fullName: dbRecord.full_name || prev.fullName || '',
              email: dbRecord.email || prev.email || '',
              phone: dbRecord.phone || prev.phone || '',
              college: dbRecord.college || prev.college || '',
              branch: dbRecord.branch || prev.branch || '',
              year: dbRecord.academic_year || prev.year || 'Third Year',
              cgpa: dbRecord.cgpa !== null && dbRecord.cgpa !== undefined ? dbRecord.cgpa.toString() : (prev.cgpa || ''),
              githubUrl: dbRecord.github_url || prev.githubUrl || '',
              linkedinUrl: dbRecord.linkedin_url || prev.linkedinUrl || '',
              targetRole: dbRecord.target_role || prev.targetRole || 'Software Engineer',
              resumeUrl: dbRecord.resume_url || prev.resumeUrl || '',
              resumeFilename: dbRecord.resume_filename || prev.resumeFilename || ''
            };
            localStorage.setItem(getScopedKey('info'), JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('[Autofill] Failed to query existing profile:', err);
    }
  };

  // Automatically inject and preserve candidateEmail if provided and email field is not set
  useEffect(() => {
    if (candidateEmail) {
      setCandidateInfo(prev => {
        const updated = { ...prev, email: candidateEmail };
        localStorage.setItem(getScopedKey('info'), JSON.stringify(updated));
        return updated;
      });
      fetchProfileAndAutofill(candidateEmail);
    } else if (candidateInfo.email) {
      fetchProfileAndAutofill(candidateInfo.email);
    }
  }, [candidateEmail]);

  // Persists draft progress periodically of changes
  useEffect(() => {
    localStorage.setItem(getScopedKey('current_screen'), currentScreen.toString());
  }, [currentScreen]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('predicted_score'), predictedScore);
  }, [predictedScore]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('agreed_instructions'), agreedToInstructions ? 'true' : 'false');
  }, [agreedToInstructions]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('info'), JSON.stringify(candidateInfo));
  }, [candidateInfo]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('self_assessment'), JSON.stringify(selfAssessment));
  }, [selfAssessment]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('responses'), JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('tab_switch_count'), tabSwitchCount.toString());
  }, [tabSwitchCount]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('copy_count'), copyCount.toString());
  }, [copyCount]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('paste_count'), pasteCount.toString());
  }, [pasteCount]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('answer_changes'), answerChanges.toString());
  }, [answerChanges]);

  useEffect(() => {
    localStorage.setItem(getScopedKey('time_per_section'), JSON.stringify(timePerSection));
  }, [timePerSection]);

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

  // Window metrics / anti-cheating effect hook moved downstream below submitFinalAssessment declaration

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
    return loadedQuestions.filter(q => q.category === cat);
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
      advanceWithSave();
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

    loadedQuestions.forEach(q => {
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
    const finalSubmission: any = {
      id: `cand-${Date.now()}`,
      assessmentId: '2', // Unified Technical / Multi section assessment
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

    // Dispatch submission to PostgreSQL backend via Render/Unified server endpoint dynamically
    const saveToRds = async () => {
      try {
        const url = getApiUrl('/api/candidate-assessment-submit');
        console.log(`[Candidacy Dispatch] Saving entire assessment to RDS. Target URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ submission: finalSubmission })
        });
        
        const resJson = await response.json();
        if (response.ok && resJson.success) {
          console.log('[Candidacy Dispatch] Assessment successfully persistent in AWS RDS PostgreSQL:', resJson);
        } else {
          console.error('[Candidacy Dispatch] Failed to store assessment in RDS:', resJson.message || resJson.error);
        }
      } catch (err) {
        console.error('[Candidacy Dispatch] Network failure connecting to relational persistent endpoint:', err);
      }
    };
    
    saveToRds();
    setCurrentScreen(14); // Success Page!
  };

  // Set up a stable reference to submitFinalAssessment for visibility listeners
  useEffect(() => {
    submitRef.current = submitFinalAssessment;
  }, [submitFinalAssessment]);

  // Hook into browser window events to gather standard anti-cheating metrics
  useEffect(() => {
    // Only track if inside active assessment (Screens 5-12)
    const isTestingActive = currentScreen >= 5 && currentScreen <= 12;
    if (!isTestingActive) return;

    const safeAlert = (msg: string) => {
      try {
        alert(msg);
      } catch (err) {
        console.warn("[Secure Assessment Mode] Alert blocked:", msg);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const nextVal = prev + 1;
          safeAlert(`[SECURITY PENALTY] Focus lost! Tab switches/exits: ${nextVal}/3. The examination will automatically submit if you switch tabs/lose focus more than 3 times.`);
          if (nextVal > 3) {
            submitRef.current();
          }
          return nextVal;
        });
      }
    };

    const handleBlur = () => {
      setTabSwitchCount(prev => {
        const nextVal = prev + 1;
        safeAlert(`[SECURITY PENALTY] Window lost focus! Avoid clicking outside or opening inspectors: ${nextVal}/3. The examination will automatically submit if you lose focus more than 3 times.`);
        if (nextVal > 3) {
          submitRef.current();
        }
        return nextVal;
      });
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenExited(true);
        setTabSwitchCount(prev => {
          const nextVal = prev + 1;
          safeAlert(`[SECURITY PENALTY] Fullscreen exited! You must remain in Fullscreen mode: ${nextVal}/3. The examination will automatically submit if deviations exceed 3.`);
          if (nextVal > 3) {
            submitRef.current();
          }
          return nextVal;
        });
      } else {
        setIsFullscreenExited(false);
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyCount(prev => prev + 1);
      safeAlert("Security Alert: Copying (Ctrl+C / Cmd+C) is strictly prohibited during this secure assessment.");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setPasteCount(prev => prev + 1);
      safeAlert("Security Alert: Pasting (Ctrl+V / Cmd+V) is strictly prohibited during this secure assessment.");
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      safeAlert("Security Alert: Cutting text is strictly prohibited during this secure assessment.");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      safeAlert("Security Alert: Context menu / right-clicking is disabled during this secure assessment.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCopy = (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C');
      const isPaste = (e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V');
      const isCut = (e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X');

      if (isCopy) {
        e.preventDefault();
        setCopyCount(prev => prev + 1);
        safeAlert("Security Alert: Copying is strictly prohibited during this secure assessment.");
      }
      if (isPaste) {
        e.preventDefault();
        setPasteCount(prev => prev + 1);
        safeAlert("Security Alert: Pasting is strictly prohibited during this secure assessment.");
      }
      if (isCut) {
        e.preventDefault();
        safeAlert("Security Alert: Cutting is strictly prohibited during this secure assessment.");
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentScreen]);

  // Helper validation and S3 resume uploader
  const handleResumeUpload = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ext !== '.pdf' && ext !== '.doc' && ext !== '.docx') {
      setUploadError('Only PDF, DOC, and DOCX formats are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const uploadUrl = getApiUrl('/api/upload-resume');
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to upload your resume to S3.');
      }

      const resData = await res.json();
      if (resData.success) {
        setCandidateInfo(prev => ({
          ...prev,
          resumeUrl: resData.resumeUrl,
          resumeFilename: file.name
        }));
        console.log('[S3 Resume Upload Success] S3 URL:', resData.resumeUrl);
      } else {
        throw new Error(resData.message || 'S3 upload failed.');
      }
    } catch (err: any) {
      console.error('[Upload Resume Error]', err);
      setUploadError(err.message || 'Error occurred while uploading resume.');
    } finally {
      setIsUploading(false);
    }
  };

  // Form validations helper for Candidate Profile
  const getValidationErrors = () => {
    const errors: Record<string, string> = {};

    // Full Name
    const nameTrimmed = candidateInfo.fullName.trim();
    if (nameTrimmed.length === 0) {
      errors.fullName = 'Full Name is required';
    } else if (nameTrimmed.length < 3) {
      errors.fullName = 'Full Name must be at least 3 characters';
    } else if (!/^[A-Za-z\s]+$/.test(nameTrimmed)) {
      errors.fullName = 'Full Name can only contain alphabets and spaces';
    }

    // Email
    const emailTrimmed = candidateInfo.email.trim();
    if (emailTrimmed.length === 0) {
      errors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone
    const phoneTrimmed = candidateInfo.phone.trim().replace(/\s+/g, '');
    if (phoneTrimmed.length === 0) {
      errors.phone = 'Phone Number is required';
    } else if (!/^\d{10}$/.test(phoneTrimmed)) {
      errors.phone = 'Phone Number must be exactly 10 digits';
    }

    // College
    const collegeTrimmed = candidateInfo.college.trim();
    if (collegeTrimmed.length === 0) {
      errors.college = 'College / University is required';
    } else if (collegeTrimmed.length < 3) {
      errors.college = 'College name must be at least 3 characters';
    }

    // CGPA
    const cgpaTrimmed = candidateInfo.cgpa.trim();
    if (cgpaTrimmed.length === 0) {
      errors.cgpa = 'CGPA is required';
    } else {
      const cgpaNum = parseFloat(cgpaTrimmed);
      if (isNaN(cgpaNum) || !/^\d+(\.\d+)?$/.test(cgpaTrimmed)) {
        errors.cgpa = 'CGPA must be a valid number';
      } else if (cgpaNum < 0 || cgpaNum > 10) {
        errors.cgpa = 'CGPA must be between 0 and 10';
      }
    }

    // Github URL (Optional)
    const githubTrimmed = candidateInfo.githubUrl.trim();
    if (githubTrimmed.length > 0) {
      if (!/^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_\-\/]+/i.test(githubTrimmed)) {
        errors.githubUrl = 'Must be a valid GitHub URL (e.g. github.com/username)';
      }
    }

    // LinkedIn URL (Optional)
    const linkedinTrimmed = candidateInfo.linkedinUrl.trim();
    if (linkedinTrimmed.length > 0) {
      if (!/^(https?:\/\/)?(www\.)?linkedin\.com\/[A-Za-z0-9_\-\/]+/i.test(linkedinTrimmed)) {
        errors.linkedinUrl = 'Must be a valid LinkedIn URL (e.g. linkedin.com/in/username)';
      }
    }

    return errors;
  };

  // Helper validation for profile screen
  const isProfileFormValid = () => {
    const hasRequiredValues = 
      candidateInfo.fullName.trim().length >= 3 &&
      candidateInfo.email.trim().length > 0 &&
      candidateInfo.phone.trim().length > 0 &&
      candidateInfo.college.trim().length >= 3 &&
      candidateInfo.cgpa.trim().length > 0;

    if (!hasRequiredValues) return false;

    const errs = getValidationErrors();
    const requiredErrorKeys = ['fullName', 'email', 'phone', 'college', 'cgpa'];
    
    const hasRequiredErrors = requiredErrorKeys.some(key => !!errs[key]);
    if (hasRequiredErrors) return false;

    if (errs.githubUrl || errs.linkedinUrl) return false;

    return true;
  };

  // Helper to determine the optimal API base URL


  // Persists the candidate profile data to the backend database via API before advancing
  const handleSaveProfile = async () => {
    if (!isProfileFormValid()) return;
    setIsSavingProfile(true);
    setProfileSaveError(null);

    const payload = {
      full_name: candidateInfo.fullName,
      email: candidateInfo.email,
      phone: candidateInfo.phone,
      college: candidateInfo.college,
      branch: candidateInfo.branch,
      academic_year: candidateInfo.year,
      cgpa: candidateInfo.cgpa,
      target_role: candidateInfo.targetRole,
      github_url: candidateInfo.githubUrl,
      linkedin_url: candidateInfo.linkedinUrl,
      resume_url: candidateInfo.resumeUrl || null,
      resume_filename: candidateInfo.resumeFilename || null
    };

    const targetUrl = getApiUrl('/api/candidate-profile');
    console.log(`[Candidacy Dispatch] Targeting endpoint: ${targetUrl} with payload:`, payload);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textStr = await response.text();
        console.error('Non-JSON response received from server:', textStr);
        throw new Error(`The platform server at ${window.location.hostname} isn't running an Express runtime instance (returned content-type: ${contentType || 'plain'}). Verify full-stack setup or try using our active Cloud Run dev server.`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to preserve candidate particulars. Please try again.');
      }

      console.log('Candidate profile saved successful in postgreSQL:', data);
      
      // Update candidate DB profile ID locally
      if (data.data?.id) {
        const savedId = data.data.id;
        setCandidateDbId(savedId);
        localStorage.setItem(getScopedKey('db_id'), savedId.toString());

        // Dynamic back-link link the scores properly
        try {
          await fetch(getApiUrl('/api/pre-assessment-score'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              expected_score: predictedScore,
              candidate_id: savedId
            })
          });
        } catch (linkScoreErr) {
          console.error('Link pre-assessment score failed inline:', linkScoreErr);
        }
      }

      setIsSavingProfile(false);
      setCurrentScreen(4);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setProfileSaveError(err.message || 'Failed to save profile. Please try again.');
      setIsSavingProfile(false);
    }
  };

  // Code editor simulated execution values helper
  const [codingRunOutput, setCodingRunOutput] = useState<Record<string, string>>({});
  const triggerMockCodeExecution = (qId: string, userCode: string, lang: string) => {
    let outputText = `[Virtual Sandbox Core Executing on Port 3000]\n`;
    outputText += `[Judge0 Simulation] Dispatching payload to thread instance...\n`;
    outputText += `------------------------------------------------------\n`;
    if (!userCode.trim() || userCode.length < 15) {
      outputText += `❌ SANDBOX_COMPILE_ERROR:\n  SyntaxError: Unexpected premature end of input. Define your core algorithm classes.\n`;
      outputText += `  Execution Time: 0ms\n  Max Memory Allowed: 256MB (Used: 0MB)\n`;
    } else {
      const execTime = Math.floor(Math.random() * 25) + 8;
      const memUsed = (Math.random() * 1.5 + 0.8).toFixed(2);
      outputText += `✓ ENVIRONMENT BOOTED: ${lang.toUpperCase()} Run-time Environment v18.2\n`;
      outputText += `✓ TEST 01 (Basic Assertions Match): SUCCESS\n`;
      outputText += `✓ TEST 02 (Boundary & Empty Array Assertions): SUCCESS\n`;
      outputText += `✓ TEST 03 (Stress Load Test under 1,000 iterations): SUCCESS\n`;
      outputText += `------------------------------------------------------\n`;
      outputText += `STATUS: COMPLETED (SUCCESS_EXIT_CODE)\n`;
      outputText += `Execution Computational Speed: ${execTime}ms (Time Limit Limit: 2000ms)\n`;
      outputText += `Active Virtual Memory Footprint: ${memUsed}MB (Memory Limit Limit: 256MB)\n`;
      outputText += `\nOutput logs stdout: [Process exited with status 0]`;
    }
    setCodingRunOutput(prev => ({ ...prev, [qId]: outputText }));
  };

  const validationErrors = getValidationErrors();

  // Render Screens
  return (
    <div id="assessment-application-stage" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans transition-all">
      
      {/* Fullscreen Guard Overlay */}
      {isFullscreenExited && currentScreen >= 5 && currentScreen <= 12 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center">
          <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col gap-6 shadow-2xl items-center">
            <div className="w-16 h-16 bg-red-950 border border-red-800 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Fullscreen Required</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                To guarantee secure validation procedures, you must remain in fullscreen mode.
                Exiting fullscreen or switching to other windows is logged as a security telemetry warning.
              </p>
              <p className="text-xs text-red-400 font-mono mt-2 font-bold animate-pulse">
                Tab Actions / Violations Tracked: {tabSwitchCount}/3
              </p>
            </div>
            <button
              onClick={requestFullScreenMode}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-200" />
              Restore Fullscreen Mode
            </button>
          </div>
        </div>
      )}
      
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
              onClick={() => handleSavePreAssessmentScore(predictedScore)}
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
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Full Name *</label>
                <input
                  type="text"
                  placeholder="Siddharth Roy"
                  value={candidateInfo.fullName}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`bg-slate-900 border ${validationErrors.fullName ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.fullName && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.fullName}</p>
                )}
              </div>

               {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Email Address *</label>
                <input
                  type="email"
                  placeholder="siddharth.roy@vit.edu"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                  onBlur={(e) => fetchProfileAndAutofill(e.target.value)}
                  className={`bg-slate-900 border ${validationErrors.email ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.email && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={candidateInfo.phone}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className={`bg-slate-900 border ${validationErrors.phone ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.phone && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.phone}</p>
                )}
              </div>

              {/* College / University */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">College / University *</label>
                <input
                  type="text"
                  placeholder="Vellore Institute of Technology"
                  value={candidateInfo.college}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, college: e.target.value }))}
                  className={`bg-slate-900 border ${validationErrors.college ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.college && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.college}</p>
                )}
              </div>

              {/* Branch */}
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

              {/* Academic Year */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Academic Year *</label>
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

              {/* CGPA */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">CGPA / Percentage *</label>
                <input
                  type="text"
                  placeholder="9.2"
                  value={candidateInfo.cgpa}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, cgpa: e.target.value }))}
                  className={`bg-slate-900 border ${validationErrors.cgpa ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.cgpa && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.cgpa}</p>
                )}
              </div>

              {/* Target Role */}
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

              {/* Github URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Github Profile URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={candidateInfo.githubUrl}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, githubUrl: e.target.value }))}
                  className={`bg-slate-900 border ${validationErrors.githubUrl ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.githubUrl && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.githubUrl}</p>
                )}
              </div>

              {/* LinkedIn URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/..."
                  value={candidateInfo.linkedinUrl}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  className={`bg-slate-900 border ${validationErrors.linkedinUrl ? 'border-rose-900/60 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'} rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-all font-sans`}
                />
                {validationErrors.linkedinUrl && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{validationErrors.linkedinUrl}</p>
                )}
              </div>

              {/* Resume Upload Box (Full single row below fields) */}
              <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Upload Resume *</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleResumeUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`bg-slate-900 border-2 border-dashed ${candidateInfo.resumeUrl ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800 hover:border-indigo-500/50'} rounded-xl p-6 transition-all duration-200 text-center relative flex flex-col items-center justify-center gap-2 cursor-pointer`}
                  onClick={() => {
                    document.getElementById('hidden-resume-input')?.click();
                  }}
                >
                  <input 
                    id="hidden-resume-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleResumeUpload(e.target.files[0]);
                      }
                    }}
                  />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <span className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-xs text-indigo-400 font-mono">Uploading to AWS S3...</span>
                    </div>
                  ) : candidateInfo.resumeUrl ? (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-emerald-400 font-bold font-sans">Resume uploaded successfully</p>
                      <p className="text-[11px] text-slate-300 font-mono select-all bg-slate-950 border border-slate-850 px-2.5 py-1 rounded mt-1.5 max-w-[280px] truncate">
                        {candidateInfo.resumeFilename}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Click or drag again to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-indigo-400 font-bold text-xs hover:underline">Upload Resume</span>
                        <span className="text-slate-400 text-xs text-center"> or drag and drop</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Accepted formats: PDF, DOC, DOCX up to 5MB</p>
                    </div>
                  )}
                </div>
                {uploadError && (
                  <p className="text-rose-400 text-[10px] font-mono mt-0.5">{uploadError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setCurrentScreen(2)}
                disabled={isSavingProfile}
                className="px-4 py-3 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 border border-slate-800 transition-all disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!isProfileFormValid() || isSavingProfile}
                className={`flex-1 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isProfileFormValid() && !isSavingProfile
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                }`}
              >
                {isSavingProfile ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            
            {profileSaveError && (
              <div className="bg-rose-950/40 border border-rose-900/35 text-rose-300 p-3 rounded-lg text-xs font-sans text-center mt-3">
                ⚠️ {profileSaveError}
              </div>
            )}

            {!isProfileFormValid() && !isSavingProfile && (
              <p className="text-[10px] font-mono text-center text-rose-400 animate-pulse mt-1">
                * Please satisfy all validation rules and field requirements. Clear all errors to proceed.
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
                onClick={advanceWithSave}
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
                    onClick={advanceWithSave}
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
                        <option value="cpp">C++ (GCC Gnu Compiler)</option>
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
                onClick={advanceWithSave}
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
                onClick={advanceWithSave}
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
                onClick={advanceWithSave}
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
                  const sQs = loadedQuestions.filter(q => q.category === sObj.cat);
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
            {tabSwitchCount > 3 ? (
              <div className="mx-auto w-14 h-14 bg-red-950 rounded-full flex items-center justify-center border border-red-800">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />
              </div>
            ) : (
              <div className="mx-auto w-14 h-14 bg-emerald-950 rounded-full flex items-center justify-center border border-emerald-800">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            )}

            <div>
              {tabSwitchCount > 3 ? (
                <>
                  <span className="text-[10px] font-mono bg-red-950 text-red-400 px-2.5 py-1 rounded border border-red-900 uppercase font-bold tracking-wider">
                    Assessment Forcibly Terminated
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white mt-3">EXAM LIMIT EXCEEDED</h2>
                  <p className="text-red-400 text-sm mt-2 leading-relaxed">
                    This assessment was automatically submitted because you exceeded the limit of 3 tab switches / window focus losses.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                    Assessment Submitted Successfully
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white mt-3">Thank You, Developer!</h2>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Your profiles, answers script, and dynamic telemetry tracking results have been recorded inside the evaluation sequence database.
                  </p>
                </>
              )}
            </div>

            {/* Summary statistics logs box */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 text-xs font-mono text-left text-slate-300 flex flex-col gap-2">
              <div className="border-b border-slate-800 pb-1.5 text-[10px] text-slate-500 font-bold">
                TELEMETRY DIAGNOSTICS COMMITTED:
              </div>
              <div className="flex justify-between">
                <span>Security Warnings/Exits:</span>
                <span className={tabSwitchCount > 3 ? "text-red-400 font-bold" : "text-amber-400"}>
                  {tabSwitchCount} of 3 ({tabSwitchCount > 3 ? "Exceeded" : "Safe"})
                </span>
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
