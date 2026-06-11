# 03-Frontend.md

## 1. Technical Stack
The candidate dashboard client matches modern industry requirements:
* **UI Engine**: React 18+ (Functional hooks architecture, strict separation of visual states and computational code).
* **Language**: TypeScript (Defines strict type models across candidate responses, questions, timers, and telemetry metrics).
* **Styling Framework**: Tailwind CSS (Leverages micro-layout utilities and fluid responsive tokens).
* **Component Primitives**: ShadCN UI (Provides accessible form widgets, modal drawers, and data-table components).

---

## 2. Design System & Brand Guidelines

### 2.1. Color Palette (Swiss Minimalist Dark Slate)
The color design is built around off-whites, neutral slates, and vivid secondary status highlights:

| Token Name | Hex Value | Primary UI Application |
| :--- | :--- | :--- |
| **Canvas Slate** | `#0B0F19` | Main viewport backdrop |
| **Panel Navy** | `#151E2E` | Card layouts, floating control bars |
| **Active Blue** | `#3B82F6` | Primary action buttons, timeline navigation |
| **Border Neutral**| `#1F2937` | Micro headers, borders, input borders |
| **Teal Positive** | `#10B981` | Correct answers, complete checks |
| **Crimson Alarm** | `#EF4444` | Live alerts, countdown violations |

### 2.2. Typography Pairing
* **Display Fonts**: **Space Grotesk** (Tech-forward geometric styles, light tracking offsets for page headers).
* **Body Font**: **Inter** (Neutral, sans-serif, maximized readability inside paragraphs).
* **Data Monospace**: **JetBrains Mono** (Technical metrics tables, runtime editors, and status tags).

### 2.3. Responsive Strategy
* Fluid grids use standard Tailwind container modifiers (`sm:`, `md:`, `lg:`, `xl:`).
* All interactive touch points enforce a minimum footprint size of **44px × 44px** to guarantee fluid touch tracking on mobile screens.

---

## 3. Router Mapping & Flow Architecture

### 3.1. Route Structure
The app manages navigation dynamically, supporting single-page sessions that prevent page refresh state loss:
* `/assessment/:token`: Main candidate wizard pipeline.
* `/admin`: Admin console containing sub-routes.
  * `/admin/dashboard`: Analytical cohort metrics overview.
  * `/admin/results`: Core candidate table matching filters.
  * `/admin/reports/:submissionId`: Modular scorecard views.

### 3.2. Detailed Screen-by-Screen Flow Reference

#### 1. Welcome Screen
* **Layout**: Large, spacious typography framed on an ambient dark card.
* **Details**: Outlines the evaluation syllabus, structural timings, and expectations. Displays a dynamic starting confidence estimator slider.

#### 2. Instructions Screen
* **Layout**: Multi-panel cards grouping regulations.
* **Details**: Details system rules (e.g., prohibition of copy/paste functions, tracking tab focus loss indicators). Features a mandatory checkbox: `"I consent to monitoring protocols."` to proceed.

#### 3. Candidate Information Form Screen
* **Layout**: Centered multi-column validated profile form.
* **Details**: Interactive inputs logging Name, Valid Academic Email, College Department, Phone, CGPA, and personal Portfolio links.

#### 4. Self Assessment Score Screen
* **Layout**: Matrix grid of vertical rating sliders.
* **Details**: Candidate self-rates proficiency from 1 (Novice) to 10 (Expert) across disciplines (e.g., CSS Layouts, AI Prompts).

#### 5. Aptitude Section Screen (Timed)
* **Layout**: Top header showing a 10-minute countdown bar alongside progress trackers.
* **Details**: Interactive multiple-choice questions assessing pattern recognition, logical reasoning, and general computing concepts.

#### 6. Programming Fundamentals Screen
* **Layout**: Two-panel design (Question on left, choices on right).
* **Details**: Examines loop calculations, variable scoping, and function evaluation sequences.

#### 7. Web Development Screen
* **Layout**: Clean grid with code blocks.
* **Details**: Questions covering DOM configurations, CSS Flexbox behaviors, and React component lifecycle patterns.

#### 8. Data Structures & Algorithms Screen (Timed)
* **Layout**: Split horizontal view.
* **Details**: Reviews structural design metrics (e.g., Binary Trees, HashTable hashes).

#### 9. AI & Generative AI Screen
* **Layout**: Modern, card-based interface.
* **Details**: Questions evaluating deep models configuration parameters (e.g., temperature variables, embedding indices).

#### 10. Integrated Coding Console Screen
* **Layout**: Monospace IDE with programming language selector on left, question prompt on right.
* **Details**: Candidates write real code blocks to solve specific requirements (e.g., list filtering, string reversing) in JS, Python, C, or Java.

#### 11. Prompt Engineering Space Screen
* **Layout**: Interactive textareas with scenario cards.
* **Details**: Evaluates prompt composition skills. Candidates are prompted: `"Design an optimal AI system prompt to secure database interfaces."`

#### 12. Mindset & Growth Review Screen
* **Layout**: Rich textual question fields.
* **Details**: Written essays highlighting candidate resilience (e.g., `"Explain how you systematically debugging a complex block of code."`).

#### 13. Summary & Review Sheet Screen
* **Layout**: Analytical layout of progress items.
* **Details**: Shows status indicators (Answered vs Unanswered) across all sections. Highlights any incomplete requirements prior to submission.

#### 14. Submission Success Screen
* **Layout**: Visual green success checkmark with subtle fade animations.
* **Details**: Renders completion timestamps along with instructions on next steps.

#### 15. Admin Dashboard Portal
* **Layout**: Four grid statistic cards (Completed, Average, Violations Flagged).
* **Details**: Real-time admin workspace monitoring active sessions in progress and processing cohorts.

#### 16. Results Queue Screen
* **Layout**: Interactive spreadsheet with sorting and filtering capabilities.
* **Details**: Filters candidate listings by academic scores, email addresses, or plagiarism risk indexes.

#### 17. Modular Evaluation Reports
* **Layout**: Side-by-side dashboard structure: left panel displays telemetry logs, right panel displays candidate diagnostics charts.
* **Details**: Showcases visual charts tracking scores against benchmarks, written essay reviews, and telemetry analysis (plagiarism flags).

---

## 4. Key Design Strategies

### 4.1. Global State Management Strategy
Because assessments are highly structured, the client leverages a unified state broker (`React Context` with optimized state dispatchers) to guarantee consistency:
* **Continuous Auto-saving**: Integrates a file serialization controller mapping to local browser caches on every input change.
* **Telemetry Watchdog**: Subscribes to global window events (`visibilitychange` for tab switches, keyboard interactions for copy/paste checks).

### 4.2. Error Handling & Validation Rules
* **Form Guarding**: RegEx validation ensures email compliance, phone formats, and valid decimal CGPA entries.
* **Input Validation**: Submit controls remain disabled until all required fields are validated.
* **Network Recovery**: If network drops occur, the client displays a banner alert notifying the user of offline mode, storing inputs locally until connections resume.
