import { Question, CandidateAssessmentSubmission } from '../types';

export const INITIAL_QUESTIONS: Question[] = [
  // --- APTITUDE (MCQ, 10 Minutes section) ---
  {
    id: 'apt-1',
    category: 'Aptitude',
    type: 'MCQ',
    questionText: 'A train 120m long passes a telegraph post in 6 seconds. Find the speed of the train in km/h.',
    options: ['36 km/h', '54 km/h', '72 km/h', '90 km/h'],
    correctAnswer: '72 km/h',
    difficulty: 'Beginner'
  },
  {
    id: 'apt-2',
    category: 'Aptitude',
    type: 'MCQ',
    questionText: 'If 12 men can build a wall in 20 days, how many men will be required to build the same wall in 15 days?',
    options: ['15 men', '16 men', '18 men', '24 men'],
    correctAnswer: '16 men',
    difficulty: 'Intermediate'
  },
  {
    id: 'apt-3',
    category: 'Aptitude',
    type: 'MCQ',
    questionText: 'What is the next number in the series: 3, 5, 9, 17, 33, ...?',
    options: ['45', '50', '65', '72'],
    correctAnswer: '65',
    difficulty: 'Beginner'
  },

  // --- PROGRAMMING FUNDAMENTALS (MCQ + Theory, 10 minutes) ---
  {
    id: 'prog-1',
    category: 'Programming',
    type: 'MCQ',
    questionText: 'Which of the following describes the OOP concept "Polymorphism"?',
    options: [
      'Hiding internal implementation details',
      'Creating a child class from a parent class',
      'The ability of different classes to respond to the same message in unique ways',
      'Restricting direct access to some of an object\'s components'
    ],
    correctAnswer: 'The ability of different classes to respond to the same message in unique ways',
    difficulty: 'Intermediate'
  },
  {
    id: 'prog-2',
    category: 'Programming',
    type: 'MCQ',
    questionText: 'In Python, which of the following is an immutable data type?',
    options: ['List', 'Dictionary', 'Set', 'Tuple'],
    correctAnswer: 'Tuple',
    difficulty: 'Beginner'
  },
  {
    id: 'prog-3',
    category: 'Programming',
    type: 'Theory',
    questionText: 'Briefly explain the difference between Method Overloading and Method Overriding, citing compilation vs runtime behavior.',
    difficulty: 'Intermediate'
  },

  // --- WEB DEVELOPMENT (MCQ + Theory, 10 minutes) ---
  {
    id: 'web-1',
    category: 'Web',
    type: 'MCQ',
    questionText: 'What is the purpose of React\'s "useEffect" cleanup function?',
    options: [
      'To prevent the component from rendering again',
      'To unsubscribe or cancel asynchronous tasks/timers before the component unmounts or re-runs',
      'To force React to re-fetch state from the server',
      'To reset initial props parameters'
    ],
    correctAnswer: 'To unsubscribe or cancel asynchronous tasks/timers before the component unmounts or re-runs',
    difficulty: 'Intermediate'
  },
  {
    id: 'web-2',
    category: 'Web',
    type: 'MCQ',
    questionText: 'Which CSS layout system is best suited for responsive, complex two-dimensional structures (rows and columns simultaneously)?',
    options: ['Floats', 'Flexbox', 'CSS Grid', 'Block Positioning'],
    correctAnswer: 'CSS Grid',
    difficulty: 'Beginner'
  },
  {
    id: 'web-3',
    category: 'Web',
    type: 'Theory',
    questionText: 'Explain virtual DOM reconciliation in React. How does setting a unique "key" prop help performance?',
    difficulty: 'Advanced'
  },

  // --- DSA (MCQ + Theory, 15 minutes) ---
  {
    id: 'dsa-1',
    category: 'DSA',
    type: 'MCQ',
    questionText: 'What is the worst-case time complexity of inserting an element into a balanced Binary Search Tree (such as an AVL tree) of size N?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctAnswer: 'O(log N)',
    difficulty: 'Intermediate'
  },
  {
    id: 'dsa-2',
    category: 'DSA',
    type: 'MCQ',
    questionText: 'Which data structure follows the Last-In-First-Out (LIFO) model and is ideal for reversing call stacks?',
    options: ['Queue', 'Linked List', 'Stack', 'Heap'],
    correctAnswer: 'Stack',
    difficulty: 'Beginner'
  },
  {
    id: 'dsa-3',
    category: 'DSA',
    type: 'Theory',
    questionText: 'Explain the Space and Time complexity tradeoffs of using a Hash Map vs a Sorted Array to find pairs that sum to a target value (Two Sum).',
    difficulty: 'Advanced'
  },

  // --- AI & GENERATIVE AI (MCQ + Theory, 5 minutes) ---
  {
    id: 'ai-1',
    category: 'AI',
    type: 'MCQ',
    questionText: 'In Generative AI, what does the "Temperature" parameter regulate during LLM sampling?',
    options: [
      'The speed at which tokens are processed',
      'The random variability vs predictable determination of next token selections',
      'The maximum length of the output prompt context',
      'The memory size required to deploy the modelWeights structure'
    ],
    correctAnswer: 'The random variability vs predictable determination of next token selections',
    difficulty: 'Intermediate'
  },
  {
    id: 'ai-2',
    category: 'AI',
    type: 'MCQ',
    questionText: 'What represents the core mechanism of RAG (Retrieval-Augmented Generation)?',
    options: [
      'Fine-tuning an LLM completely on massive specialized datasets',
      'Querying an external database/document corpus first, and appending relevant contexts straight into the prompt',
      'Merging multiple pretrained AI model nodes into a singular pipeline',
      'Using reinforcement learning from human feedback (RLHF)'
    ],
    correctAnswer: 'Querying an external database/document corpus first, and appending relevant contexts straight into the prompt',
    difficulty: 'Intermediate'
  },
  {
    id: 'ai-3',
    category: 'AI',
    type: 'Theory',
    questionText: 'What is "Prompt Injection"? Describe one strategy developers use to protect software applications invoking AI APIs.',
    difficulty: 'Advanced'
  },

  // --- CODING ROUND (Coding, 20 minutes) ---
  {
    id: 'code-1',
    category: 'Coding',
    type: 'Coding',
    questionText: 'Write a function/method to reverse an input string in-place or return a reversed string.',
    difficulty: 'Beginner'
  },
  {
    id: 'code-2',
    category: 'Coding',
    type: 'Coding',
    questionText: 'Write an algorithm to locate the second largest distinct element in an array of integers. If it does not exist, return -1.',
    difficulty: 'Intermediate'
  },

  // --- PROMPT ENGINEERING ---
  {
    id: 'prompt-1',
    category: 'Prompt',
    type: 'Prompt',
    questionText: 'Create a high-fidelity system prompt to instruct an AI assistant to generate a robust, fully validation-protected React Login Page component using Tailwind classes.',
    difficulty: 'Advanced'
  },
  {
    id: 'prompt-2',
    category: 'Prompt',
    type: 'Prompt',
    questionText: 'Create a prompt designed to explain "Binary Search" to a 10-year-old using a real-world library/book analogy.',
    difficulty: 'Intermediate'
  },
  {
    id: 'prompt-3',
    category: 'Prompt',
    type: 'Prompt',
    questionText: 'Create a highly clear prompt template for generating a command-line Python Expense Tracker featuring storage, categorizations, and monthly summaries.',
    difficulty: 'Intermediate'
  },

  // --- LEARNING MINDSET ---
  {
    id: 'mind-1',
    category: 'Mindset',
    type: 'Mindset',
    questionText: 'Why do you want to become a Software Engineer? What fuels your professional commitment?',
    difficulty: 'Beginner'
  },
  {
    id: 'mind-2',
    category: 'Mindset',
    type: 'Mindset',
    questionText: 'How do you learn new technologies? Describe your self-directed research workflow.',
    difficulty: 'Intermediate'
  },
  {
    id: 'mind-3',
    category: 'Mindset',
    type: 'Mindset',
    questionText: 'What do you do when you get stuck on a difficult code bug and there\'s no direct solution on StackOverflow or AI?',
    difficulty: 'Intermediate'
  },
  {
    id: 'mind-4',
    category: 'Mindset',
    type: 'Mindset',
    questionText: 'What project(s) have you built recently? Outline the structure, technology stacked, and what you discovered during development.',
    difficulty: 'Intermediate'
  },
  {
    id: 'mind-5',
    category: 'Mindset',
    type: 'Mindset',
    questionText: 'What are your career goals for the next 2-3 years, and how do you plan to manifest them?',
    difficulty: 'Intermediate'
  }
];

export const INITIAL_CANDIDATES: CandidateAssessmentSubmission[] = [
  {
    id: 'cand-1',
    info: {
      fullName: 'Siddharth Roy',
      email: 'siddharth.roy@vit.edu',
      phone: '+91 98765 43210',
      college: 'Vellore Institute of Technology',
      branch: 'Computer Science & Engineering',
      year: 'Fourth Year',
      cgpa: '9.2',
      githubUrl: 'https://github.com/sidroy-dev',
      linkedinUrl: 'https://linkedin.com/in/sidroy-dev',
      targetRole: 'Full Stack Engineer'
    },
    selfAssessment: {
      c: 7,
      python: 8,
      java: 6,
      dsa: 9,
      html: 9,
      css: 8,
      javascript: 9,
      react: 9,
      sql: 8,
      aiMl: 7,
      generativeAi: 8,
      communication: 9
    },
    responses: [
      { questionId: 'apt-1', selectedOption: '72 km/h', answerChangesCount: 1 },
      { questionId: 'apt-2', selectedOption: '16 men', answerChangesCount: 0 },
      { questionId: 'apt-3', selectedOption: '65', answerChangesCount: 1 },
      { questionId: 'prog-1', selectedOption: 'The ability of different classes to respond to the same message in unique ways', answerChangesCount: 0 },
      { questionId: 'prog-2', selectedOption: 'Tuple', answerChangesCount: 0 },
      { questionId: 'prog-3', textAnswer: 'Method Overloading happens at compile-time (static polymorphism) where multiple methods in the same class share the same name but have different parameter lists. Method Overriding happens at runtime (dynamic polymorphism) where a child class specifies a custom implementation of a method already declared in its parent class, matching the signature exactly.', answerChangesCount: 1 },
      { questionId: 'web-1', selectedOption: 'To unsubscribe or cancel asynchronous tasks/timers before the component unmounts or re-runs', answerChangesCount: 0 },
      { questionId: 'web-2', selectedOption: 'CSS Grid', answerChangesCount: 0 },
      { questionId: 'web-3', textAnswer: 'React builds an in-memory Virtual DOM. When updates occur, React generates a new Virtual DOM and performs a diffing process (Reconciliation). A unique "key" prop helps React track which items changed, were added, or were removed, bypassing complete list re-renders and executing direct, surgical DOM insertions.', answerChangesCount: 0 },
      { questionId: 'dsa-1', selectedOption: 'O(log N)', answerChangesCount: 0 },
      { questionId: 'dsa-2', selectedOption: 'Stack', answerChangesCount: 0 },
      { questionId: 'dsa-3', textAnswer: 'The Hash Map solution runs in O(N) time and O(N) space, saving elements in a table and finding targets immediately. The Sorted Array approach using two-pointers runs in O(N log N) time for sorting, but takes O(1) auxiliary space. This presents a classic Memory vs Computation speed tradeoff.', answerChangesCount: 0 },
      { questionId: 'ai-1', selectedOption: 'The random variability vs predictable determination of next token selections', answerChangesCount: 1 },
      { questionId: 'ai-2', selectedOption: 'Querying an external database/document corpus first, and appending relevant contexts straight into the prompt', answerChangesCount: 0 },
      { questionId: 'ai-3', textAnswer: 'Prompt injection occurs when user-supplied inputs manipulate an LLM into bypassing developer security settings. To protect applications, developers enclose system commands in explicit delimiters, run secondary query validation models, and strictly filter inputs using rigorous schema parsing.', answerChangesCount: 2 },
      { questionId: 'code-1', codeAnswer: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}', languageSelected: 'javascript', answerChangesCount: 1 },
      { questionId: 'code-2', codeAnswer: 'def second_largest(arr):\n    unique_arr = list(set(arr))\n    if len(unique_arr) < 2:\n        return -1\n    unique_arr.sort()\n    return unique_arr[-2]', languageSelected: 'python', answerChangesCount: 2 },
      { questionId: 'prompt-1', textAnswer: 'Act as a Senior UI Engineer. Output a valid React 18 component styled strictly in Tailwind CSS. Create a minimalist, dark themed landing card with custom layouts, email validation, pass toggle, and smooth motion animations of layout boxes.', answerChangesCount: 1 },
      { questionId: 'prompt-2', textAnswer: 'Read this: Search for a specific word in an alphabetical dictionary by opening it exactly in the middle. If your word starts with a letter farther in, split the right half and open it in the middle. Repeat this until you find the word. Explain this using book stacks.', answerChangesCount: 1 },
      { questionId: 'prompt-3', textAnswer: 'Build a Python CLI helper. Let a user trigger prompts with: --add [amount] [category] --list --summary. Auto-serialize objects on local disk using custom pickle libraries or simple JSON streams.', answerChangesCount: 0 },
      { questionId: 'mind-1', textAnswer: 'I enjoy translating intellectual algorithms into scalable utility. Engineering offers a tangible creative output for computational logic.', answerChangesCount: 0 },
      { questionId: 'mind-2', textAnswer: 'I start with standard reference docs, assemble lightweight sandbox programs to observe runtime traits, and then build small personal tools.', answerChangesCount: 0 },
      { questionId: 'mind-3', textAnswer: 'I isolate the core component, write basic unit tests, inspect runtime state structures using debug breakpoints, and research open issues in Github repositories.', answerChangesCount: 1 },
      { questionId: 'mind-4', textAnswer: 'I built a modern task coordination board using React, LocalStorage, and CSS. I learned about drag-and-drop state updates and coordinate tracking.', answerChangesCount: 0 },
      { questionId: 'mind-5', textAnswer: 'I aim to become a Core Front End Architect, leading modular team packages and mastering complex streaming rendering systems.', answerChangesCount: 0 }
    ],
    metrics: {
      tabSwitchCount: 0,
      copyCount: 1,
      pasteCount: 0,
      answerChanges: 11,
      timePerSection: {
        'Aptitude': 240,
        'Programming': 310,
        'Web': 280,
        'DSA': 410,
        'AI': 170,
        'Coding': 620,
        'Prompt': 180,
        'Mindset': 210
      },
      preAssessmentScorePrediction: '80-100'
    },
    status: 'Evaluated',
    submittedAt: '2026-06-10T14:32:00Z',
    score: 88,
    sectionScores: {
      'Aptitude': 100,
      'Programming': 85,
      'Web': 90,
      'DSA': 95,
      'AI': 90,
      'Coding': 80,
      'Prompt': 85,
      'Mindset': 80
    },
    evaluation: {
      technicalScore: {
        programming: 8.5,
        dsa: 9.5,
        webDevelopment: 9.0,
        ai: 9.0
      },
      behavioralScore: {
        communication: 9.0,
        learningAbility: 8.5,
        problemSolving: 9.5
      },
      overallRating: 9.1,
      level: 'Advanced',
      recommendation: 'Placement Ready',
      reviewerNotes: 'Strong analytical skills, solid conceptual grasp of both system performance dynamics and DSA optimizations. Highly self-driven learner.'
    }
  },
  {
    id: 'cand-2',
    info: {
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@bphc.ac.in',
      phone: '+91 91234 56789',
      college: 'BITS Pilani, Hyderabad Campus',
      branch: 'Electronics & Communication',
      year: 'Third Year',
      cgpa: '7.8',
      githubUrl: 'https://github.com/ananya-sh',
      linkedinUrl: 'https://linkedin.com/in/ananya-sh',
      targetRole: 'Software Engineer Intern'
    },
    selfAssessment: {
      c: 6,
      python: 7,
      java: 4,
      dsa: 5,
      html: 8,
      css: 7,
      javascript: 7,
      react: 6,
      sql: 6,
      aiMl: 5,
      generativeAi: 5,
      communication: 8
    },
    responses: [
      { questionId: 'apt-1', selectedOption: '72 km/h', answerChangesCount: 0 },
      { questionId: 'apt-2', selectedOption: '16 men', answerChangesCount: 1 },
      { questionId: 'apt-3', selectedOption: '45', answerChangesCount: 2 }, // incorrect
      { questionId: 'prog-1', selectedOption: 'Creating a child class from a parent class', answerChangesCount: 1 }, // incorrect
      { questionId: 'prog-2', selectedOption: 'Tuple', answerChangesCount: 0 },
      { questionId: 'prog-3', textAnswer: 'Method Overloading allows writing multiple functions with different variables. Overriding is when subclass changes runtime behavior.', answerChangesCount: 0 },
      { questionId: 'web-1', selectedOption: 'To unsubscribe or cancel asynchronous tasks/timers before the component unmounts or re-runs', answerChangesCount: 0 },
      { questionId: 'web-2', selectedOption: 'Flexbox', answerChangesCount: 1 }, // incorrect
      { questionId: 'web-3', textAnswer: 'React key identifies items to avoid full reload of elements.', answerChangesCount: 0 },
      { questionId: 'dsa-1', selectedOption: 'O(N)', answerChangesCount: 1 }, // incorrect
      { questionId: 'dsa-2', selectedOption: 'Stack', answerChangesCount: 0 },
      { questionId: 'dsa-3', textAnswer: 'Array uses index while hash maps use computed keys. Overlapping searches take more computational lookup ticks.', answerChangesCount: 0 },
      { questionId: 'ai-1', selectedOption: 'The random variability vs predictable determination of next token selections', answerChangesCount: 0 },
      { questionId: 'ai-2', selectedOption: 'Querying an external database/document corpus first, and appending relevant contexts straight into the prompt', answerChangesCount: 0 },
      { questionId: 'ai-3', textAnswer: 'Instructing safety boundaries explicitly inside standard wrappers.', answerChangesCount: 1 }
    ],
    metrics: {
      tabSwitchCount: 3,
      copyCount: 0,
      pasteCount: 1,
      answerChanges: 7,
      timePerSection: {
        'Aptitude': 360,
        'Programming': 420,
        'Web': 390,
        'DSA': 450,
        'AI': 240,
        'Coding': 700,
        'Prompt': 350,
        'Mindset': 310
      },
      preAssessmentScorePrediction: '60-80'
    },
    status: 'Evaluated',
    submittedAt: '2026-06-11T02:15:00Z',
    score: 58,
    sectionScores: {
      'Aptitude': 66,
      'Programming': 50,
      'Web': 50,
      'DSA': 45,
      'AI': 60,
      'Coding': 45,
      'Prompt': 55,
      'Mindset': 70
    },
    evaluation: {
      technicalScore: {
        programming: 5.5,
        dsa: 4.5,
        webDevelopment: 5.0,
        ai: 5.5
      },
      behavioralScore: {
        communication: 8.0,
        learningAbility: 7.0,
        problemSolving: 5.0
      },
      overallRating: 5.8,
      level: 'Intermediate',
      recommendation: '6 Month Training',
      reviewerNotes: 'Possesses standard foundational programming syntax awareness but shows gaps in Core DSA, complex React reconciliations, and algorithmic optimizations.'
    }
  },
  {
    id: 'cand-3',
    info: {
      fullName: 'Rahul Verma',
      email: 'rahul.v@iiitd.ac.in',
      phone: '+91 99887 76655',
      college: 'IIIT Delhi',
      branch: 'Information Technology',
      year: 'Third Year',
      cgpa: '6.9',
      githubUrl: 'https://github.com/rahulv-dev',
      linkedinUrl: 'https://linkedin.com/in/rahulv-dev',
      targetRole: 'Software Developer'
    },
    selfAssessment: {
      c: 5,
      python: 6,
      java: 4,
      dsa: 4,
      html: 6,
      css: 5,
      javascript: 6,
      react: 5,
      sql: 7,
      aiMl: 4,
      generativeAi: 4,
      communication: 7
    },
    responses: [],
    metrics: {
      tabSwitchCount: 1,
      copyCount: 0,
      pasteCount: 0,
      answerChanges: 0,
      timePerSection: {},
      preAssessmentScorePrediction: '40-60'
    },
    status: 'Started'
  }
];
