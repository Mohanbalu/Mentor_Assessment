export interface CandidateInfo {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  cgpa: string;
  githubUrl: string;
  linkedinUrl: string;
  targetRole: string;
  resumeUrl?: string;
  resumeFilename?: string;
}

export interface SelfAssessment {
  c: number;
  python: number;
  java: number;
  dsa: number;
  html: number;
  css: number;
  javascript: number;
  react: number;
  sql: number;
  aiMl: number;
  generativeAi: number;
  communication: number;
}

export interface Question {
  id: string;
  category: 'Aptitude' | 'Programming' | 'Web' | 'DSA' | 'AI' | 'Coding' | 'Prompt' | 'Mindset';
  type: 'MCQ' | 'Theory' | 'Coding' | 'Prompt' | 'Mindset';
  questionText: string;
  options?: string[]; // for MCQ
  correctAnswer?: string; // for auto-scoring
  durationMinutes?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface CandidateResponse {
  questionId: string;
  selectedOption?: string; // for MCQ
  textAnswer?: string; // for Theory, Prompt, Mindset
  codeAnswer?: string; // for Coding
  languageSelected?: string; // for Coding
  answerChangesCount: number;
}

export interface TrackingMetrics {
  tabSwitchCount: number;
  copyCount: number;
  pasteCount: number;
  answerChanges: number;
  timePerSection: Record<string, number>; // Section name -> seconds
  preAssessmentScorePrediction: string; // "30-40" | "40-60" | etc.
}

export interface CandidateAssessmentSubmission {
  id: string;
  info: CandidateInfo;
  selfAssessment: SelfAssessment;
  responses: CandidateResponse[];
  metrics: TrackingMetrics;
  status: 'Pending' | 'Started' | 'Submitted' | 'Evaluated';
  submittedAt?: string;
  score?: number; // total out of 100
  sectionScores?: Record<string, number>;
  evaluation?: {
    technicalScore: {
      programming: number;
      dsa: number;
      webDevelopment: number;
      ai: number;
    };
    behavioralScore: {
      communication: number;
      learningAbility: number;
      problemSolving: number;
    };
    overallRating: number; // 1 to 10
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    recommendation: '3 Month Training' | '6 Month Training' | 'Placement Ready';
    reviewerNotes: string;
  };
}
