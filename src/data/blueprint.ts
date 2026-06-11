export interface BlueprintSection {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  details?: Record<string, any>;
}

export const ARCHITECTURE_BLUEPRINTS: BlueprintSection[] = [
  {
    id: 'folder-structure',
    title: '1. Complete Frontend Folder Structure',
    subtitle: 'Modular SaaS directory layout optimized for code splitting and clean imports.',
    content: `A scalable, modular directory tree aligned with industry-standard production React patterns:

\`\`\`yaml
/root
  ├── /public                # Static production-ready assets (logos, fallback images)
  ├── /src
  │    ├── /components       # Reusable Atomic UI Component Core
  │    │    ├── /ui          # Headless primitive elements (Buttons, Sliders, Dialogs)
  │    │    └── /layout      # Structure shells (NavBar, Sidebar, Container, DashboardGrid)
  │    ├── /data             # Static metadata, assessments, schemas & blueprint files
  │    │    ├── questions.ts # Test categories, prompt templates & initial profiles
  │    │    └── blueprint.ts # Technical guidelines & product architecture files
  │    ├── /features         # Feature-focused modules (Candidate flow, Admin dashboard)
  │    │    ├── /candidate   # Multi-screen assessment wizard and telemetry hook trackers
  │    │    ├── /admin       # List, analytics charts, grading modules & question editor
  │    │    └── /architect   # Interactive blueprint designer & design systems guide
  │    ├── /hooks            # Global react hooks (useStateWithStorage, useTelemetryTracker)
  │    ├── /styles           # Global CSS variables & layout modifiers
  │    │    └── index.css    # Tailwind CSS directive imports & font definitions
  │    ├── App.tsx           # Global state manager, flow router, and portal layout
  │    ├── main.tsx          # Client-side bootstrap and DOM mount initiator
  │    ├── types.ts          # Strongly typed type system declaring Candidate, Metrics, Question
  │    └── tsconfig.json     # Compiler preferences and absolute route aliases (@/*)
\`\`\``
  },
  {
    id: 'routing',
    title: '2. Complete Routing & Page Hierarchy',
    subtitle: 'Decoupled virtual paths for tokenized assessments and analytics controls.',
    content: `Since this is a client-side assessment runner, the routing architecture features dynamic routing matching unique hash links or route descriptors to protect security logs and avoid refresh states:

### 🌐 Virtual Route Mapping
- \`/\` : Platform Entryway or Assessment Portal Selection Dashboard
- \`/assessment/{token}\` : Candidacy Entrypoint. Resolves direct validation against token hashes.
- \`/admin/dashboard\` : Consolidated analytical view of candidate queues, active logs, and statistics.
- \`/admin/candidates\` : Interactive applicant registry with filtration, status trackers, and actions.
- \`/admin/questions\` : Question modification toolkit supporting category-level operations.
- \`/admin/report/{candidateId}\` : Multi-dimensional technical-behavioral scorecard & mentor diagnostics.

### 📊 Page Hierarchy
- **Candidate View Portal**: Dashboard Entry → Score Prediction (Screen 0) → Welcome Hub (Screen 1) → Guarded Instructions (Screen 2) → Information Onboarding (Screen 3) → Subjective Rating Slider (Screen 4) → Section Assessments (Aptitude, Core Programming, Web Frameworks, DSA, AI/GenAI - Screens 5-9) → Integrated Coding Console (Screen 10) → Prompt Engineering Playground (Screen 11) → Behavioral Mindset Console (Screen 12) → Comprehensive Review Frame (Screen 13) → Confirmation Success (Screen 14).
- **Admin View Portal**: Dashboard → Candidates Datatable → Candidate Profiles Review & Evaluation Reporting → Real-time Cheating Telemetry Inspector (Tab changes, Copy/Pasting counts) → Assessment Question Manager (CRUD).`
  },
  {
    id: 'state-mgmt',
    title: '3. State Management & Component Hierarchy',
    subtitle: 'Single source of truth tracking application flow, timers, and assessment states.',
    content: `### 🧠 Unified State Management Architecture

To preserve candidates' tests against refresh bugs while remaining backend-independent, the platform uses a **guarded persistent context**:

1. **Storage Broker (localStorage)**: Serializes live candidate state, answers, and telemetry logs continuously to disk.
2. **Interactive Reducer**: Coordinates changes across answers, countdown timers, tab context violations, and viewport dimensions.
3. **Telemetry Sentinel Hooks**: Runs global event listeners monitoring user behaviors:
   - \`visibilitychange\`: Registers when the candidate navigates away or checks search tabs.
   - \`copy\` & \`paste\`: Captures hotkey actions inside questions to counter plagiarism.
   - \`answerChanges\`: Tracks how often candidates replace answers to analyze confidence vs guess metrics.

\`\`\`ts
// Telemetry hook architecture declaration example:
export function useAssessmentTelemetry(active: boolean) {
  const [metrics, setMetrics] = useState<TrackingMetrics>({...});

  useEffect(() => {
    if (!active) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setMetrics(m => ({ ...m, tabSwitchCount: m.tabSwitchCount + 1 }));
      }
    };
    const handleCopy = () => setMetrics(m => ({ ...m, copyCount: m.copyCount + 1 }));
    const handlePaste = () => setMetrics(m => ({ ...m, pasteCount: m.pasteCount + 1 }));

    // Bind listeners
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
    };
  }, [active]);

  return metrics;
}
\`\`\`

### 🧱 Component Hierarchy
- **App Shell Wrapper (App.tsx)**: Monitors active platform mode (Candidate, Admin, Architect Blueprints).
  - **Header / Admin Portal Selector**: Compact control bar to swap user flows.
  - **Candidate Wizard Shell (CandidateFlow.tsx)**: Houses progression states and sub-renders:
    - \`PredictionPortal\`: Handles expectation prediction data.
    - \`WelcomePane\` / \`InstructionsCard\`: Handles onboarding and consent criteria.
    - \`CandidateDetailsForm\`: Secure text inputs validating branch, emails, CGPA.
    - \`SelfAssessmentMatrix\`: Multi-slider grid.
    - \`TimedSectionContainer\`: Progress bars, section timers, question maps.
      - \`MCQQuestionCard\` or \`TheoryTextEditor\`
    - \`CodingStudio\`: Dropdowns for languages (C, Python, JS, Java), code textarea.
    - \`PromptRoundDesk\` / \`MindsetRoundDesk\`: Rich multi-text fields.
    - \`ReviewFrame\`: Displays answered vs unanswered queries, time spent.
  - **Admin Panel Shell (AdminFlow.tsx)**: Displays metrics and controls:
    - \`MetricsSummaryGrid\`: Active candidates, evaluations pending lists.
    - \`CandidatesDataTable\`: Filterable grid listing key status & scores.
    - \`ScoresReportDrawer\`: Features analytical charts showing tech vs behavioral progress.
    - \`QuestionsCrudPanel\`: Forms to add or alter assessment categories.`
  },
  {
    id: 'design-system',
    title: '4. UI Design System & Tailwind Tokens',
    subtitle: 'Tailwind design system optimized for high-end SaaS software.',
    content: `The interface implements a high-contrast, professional, Swiss-Modern design structure focusing on typography, generous white spaces, and subtle borders:

### 🎨 Color Palette & Contrast Tokens
- **Background Slate**: \`#0F172A\` (Deep Charcoal - base canvas)
- **Container Indigo Base**: \`#1E293B\` (Sophisticated layout support)
- **Primary Cobalt**: \`#2563EB\` (Accent elements, call-to-actions, buttons)
- **Border Neutral**: \`#334155\` / \`#E2E8F0\` (High-definition micro dividers)
- **Teal Success**: \`#10B981\` (Submitted badges, passing score highlights)
- **Coral Warning**: \`#EF4444\` (Tab switch alert logs, negative time thresholds)

### ✍️ Typography Scale
- **Display Headings**: \`Space Grotesk\` (Tech-focused, geometric, tracking-tight)
  - Layout usage: \`font-sans font-semibold tracking-tight text-slate-900\`
- **Body & Controls**: \`Inter\` (Neutral, highly legible text-slate-700)
- **Code, Numbers & Metrics**: \`JetBrains Mono\` (Data tables, syntax editors)

### 🔳 Component Tokens
- **Elevation Shadows**: \`shadow-sm\` for interface panels, avoiding heavy borders.
- **Card Radius**: \`rounded-xl\` (12px) for cards, \`rounded-lg\` for input forms.
- **Micro-animations**: \`transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)\`.`
  },
  {
    id: 'flow-diagram',
    title: '5. Dynamic Navigation Flow Diagram',
    subtitle: 'Sequential candidate assessment pipeline to success callback.',
    content: `The candidate state flow is modeled as a linear wizard. Telemetry listeners start recording automatically when instructions are accepted:

\`\`\`yaml
[CANDIDATE START]
       │
       ▼
Screen 0: Score Prediction
       │
       ▼
Screen 1: Welcome Hub (Title & Structure)
       │
       ▼
Screen 2: Instructions & Rules Confirm (Checkbox lock)
       │
       ▼
Screen 3: Profile Information (Validated input forms)
       │
       ▼
Screen 4: Self Rating Sliders (Subjective skill matrix)
       │
       ▼ [ACTIVATE TIMER & TELEMETRY CHEATS WATCHDOG]
Screen 5: Aptitude Section (10 Min - MCQ)
       │
       ▼
Screen 6: Programming fundamentals (10 Min - MCQ/Theory)
       │
       ▼
Screen 7: Web Development Section (10 Min - MCQ/Theory)
       │
       ▼
Screen 8: DSA Concepts (15 Min - MCQ/Theory)
       │
       ▼
Screen 9: AI & Generative AI basics (5 Min - MCQ/Theory)
       │
       ▼
Screen 10: Code Editor Rounds (20 Min - Reverse String, etc)
       │
       ▼
Screen 11: Prompt engineering tasks (Large inputs)
       │
       ▼
Screen 12: Mindset / Vision review (Large inputs)
       │
       ▼ [DEACTIVATE TIMER]
Screen 13: Summary Check & Review Panel
       │
       ├────► [Trigger Confirmation Dialog]
       ▼
Screen 14: Completed Screen (Score processed -> Save state to Admin)
\`\`\``
  },
  {
    id: 'future-scalability',
    title: '6. Future Scalability Recommendations',
    subtitle: 'Strategic recommendations for deploying AI-driven diagnostics in production.',
    content: `To scale this platform for enterprise usage with volume testing (100,000+ examinees per cohort):

1. **AI-driven Automated Grading**:
   - Integrate server-side LLMs (such as Gemini 2.5 Flash) with custom instruction templates to grade theory answers, prompt rounds, and behavioral essays autonomously.
   - Run secure unit-test execution containers (gVisor or lightweight Docker sandboxes) to validate candidate submissions against edge test cases.

2. **Guarded Security and Cheating Protections**:
   - Integrate secure browser lock APIs to restrict external window focus during active testing.
   - Capture copy-paste attempt sequences to identify pre-scripted answer input trends.

3. **Optimized Infrastructure Integration**:
   - Migrate state structures to high-performance operational storage models (e.g., Firebase Firestore for document trees, or PostgreSQL with transaction partitions).
   - Bundle large diagnostic files using fast CJS/ESM compilation protocols (esbuild + Vite caching assets) to streamline load times on weak cellular networks.`
  }
];
