# 01-Requirements.md

## 1. Executive Summary
The **Skill Assessment & Mentorship Platform** is a secure, lightweight, and high-performance technical screening system designed to evaluate candidates before admission to training cohorts, bootcamp pathways, or enterprise mentorship programs. 

By mapping competencies across modular technical disciplines (core coding, algorithmic computer science, modern web engineering, AI/Generative system integrations) and behavioral mindsets (problem-solving approach, written technical communication, self-directed learning velocity), the platform replaces expensive generic tools with highly contextual, cheat-resistant, automated grading matrices and mentor diagnostic recommendations.

---

## 2. Project Vision & Goals
* **Objective Assessment**: Establish an automated system that objectively scores coding skills, analytical aptitude, prompt engineering capacity, and growth indicators.
* **Database-Free Readiness**: Maintain immediate local survivability for candidates (local-cache preservation models resisting hardware disconnects or tab timeouts).
* **Frictionless Entry**: Bypass cumbersome signup credentials by deploying highly secure, single-use, tokenized URL matching protocols that restrict access to unique assessment sessions.
* **Pre-training Diagnostics**: Map candidate outputs directly to targeted learning paths (e.g., 3-Month Fast-Track, 6-Month Immersive Core, or Immediate Placement readiness).

---

## 3. Business Objectives
* **Lower Evaluation Overhead**: Minimize human involvement in screening candidates by employing structured auto-graded criteria.
* **Increase Talent Density**: Highlight exceptional learners from diverse cohorts who demonstrate outstanding self-taught technical capabilities.
* **Highlight Plagiarism**: Flag candidates seeking unfair assistance using active front-end cheating/interaction-telemetry logs (tracking tab focus losses and keyboard interactions).

---

## 4. User Roles & Personas

### 4.1. Candidate
* **Description**: Tech applicants, bootcamp aspirants, or developer cohorts testing skills before training tracks.
* **Needs**: Highly clear timers, robust coding sandboxes, save-states protecting progress, and structured onboarding screens.
* **Security Scope**: Authorized strictly through matching high-entropy UUID links. Zero view permission into admin telemetry files or general questions databases.

### 4.2. Platform Administrator
* **Description**: Mentorship coordinators, recruiters, or senior technical advisors.
* **Needs**: Central dashboards displaying submission lists, cheating alert telemetry reviews, detailed report card breakdowns, and quiz management modules (CRUD).
* **Security Scope**: Complete visibility of all candidate data, plagiarism risks, and questions repository.

---

## 5. User Journeys & Target Flows

### 5.1. Candidate Journey
```
[Tokenized Link Clicked]
        │
        ▼
Screen 0: Pre-Assessment Prediction (Establish confidence base)
        │
        ▼
Screen 1: Welcome Hub (Review syllabus mapping & duration guides)
        │
        ▼
Screen 2: Instructions Sheet (Accept secure anti-cheating policy ticks)
        │
        ▼
Screen 3: Candidate Information Form (Enter academy & target profile details)
        │
        ▼
Screen 4: Self-Assessment Matrix (Rate individual tech stack fluencies)
        │
        ▼ [TIMER RECKONING BOOTS]
Screens 5-9: Structured Sections (10-15 Min timed MCQ & explanation tiles)
        │
        ▼
Screen 10: Coding Labs (Complete code sandbox tasks in choice syntax)
        │
        ▼
Screen 11: Prompt Workspace (Type generative prompt scripts to generate/explain programs)
        │
        ▼
Screen 12: Behavioral Mindset Essays (Provide written explanations of goals/bugs resolution)
        │
        ▼ [STOP EXTRANEOUS TIMER TRACKING]
Screen 13: Summary Evaluation Sheet (Validate outstanding pending checks)
        │
        ▼
Screen 14: Success Portal (Display confirmations & telemetry verification badges)
```

### 5.2. Admin Journey
1. **Access control**: Authorized admins enter the workspace directly.
2. **Review Cohort metrics**: Analyze stats (registered counts, active testing queues, completed scorecards).
3. **Plagiarism review**: Check security flags listing counts of candidates who toggled away, pasted files, or over-modified states.
4. **Target Profile Audit**: Deep dive into individual report scorecards, inspecting code answers, prompt selections, and behavioral responses.
5. **Mentorship Decisions**: Submit grading configurations mapping to appropriate training tracks.
6. **Curriculum Control**: Add or delete assessment questions across different modules.

---

## 6. Functional Requirements (FR)

### 6.1. Candidate Modules
* **FR-1.1**: Token security checks must match path parameters `/assessment/{token}` accurately to activate session states.
* **FR-1.2**: Prediction screens must log user answers to contrast confidence variables with objective results.
* **FR-1.3**: The profile onboarding card must validate forms for names, correctly structured emails, phone formats, and CGPAs.
* **FR-1.4**: Active sections must execute separate segment count down timers. Upon reaching zero seconds, states must auto-save and advance the screen index.
* **FR-1.5**: Question navigators must render interactive jump nodes indicating completed or pending items.
* **FR-1.6**: Coding rounds must provide a monospace coding interface with select language options (C, Python, JS, Java).
* **FR-1.7**: Form modules must run text character counters showing live length statistics.
* **FR-1.8**: Evaluation reviews must pop full screen warning alerts before submissions are finalized.

### 6.2. Admin Modules
* **FR-2.1**: Dashboards must showcase dynamic candidate state boards (Total, Active, Submitted, Evaluated).
* **FR-2.2**: Plagiarism monitors must list candidate names with detailed telemetry logs (tab switch count, copy/paste volumes).
* **FR-2.3**: Candidate results spreadsheets must sort profiles by total scored marks or specific technical categories.
* **FR-2.4**: Report sheets must evaluate technical matrices (Programming, DSA, Web Dev, AI) and behavioral values to recommend learning tracks.
* **FR-2.5**: Question desks must support CRUD operations matching categories with designated difficulty tags.

---

## 7. Non-Functional Requirements (NFR)
* **Performance**: Screening panels must load on weak cellular networks in under 2.5 seconds.
* **Offline Resiliency**: In the event of temporary client networks disconnects, state logs must persist local data securely inside local caches.
* **Mobile Responsiveness**: UI blocks must adapt fluidly across high resolution desktop setups and narrow touch mobile phone screens.
* **Code Security**: Candidate screening clients must hide evaluation validation answers, admin metrics, and other candidate reports.

---

## 8. Security Requirements
* **Data Scoping**: Disable browser DevTools inspectors where possible to prevent assessment content leakages.
* **Path Protection**: Route assessment paths exclusively through high entropy session strings, blocking external ID indexing tricks (such as guessing sequential sequences `/assessment/1`, `/assessment/2`).
* **Safe Storage**: Do not save admin parameters, grading criteria, or alternative candidate score files in publicly exposure pools.

---

## 9. Product Development Roadmap

### Phase 1: MVP Release (Core)
* Modular 15-screen diagnostic runner sequence.
* Adaptive state managers (saving files inside standard LocalStorage structures).
* Basic admin views listing active candidates with basic filter configurations.
* Integration of code playground blocks and text counters.

### Phase 2: AI Enhancements (Post-MVP)
* Webhook configurations with LLMs (e.g., Gemini 2.5) to auto-grade written essays, prompt modules, and mock code files.
* Integration of automated compiler setups executing real-time tests on active coding prompts.

---

## 10. Success Metrics & KPIs
* **Candidate Completion index**: Maintain rates above 92% (ensuring low friction drop offs).
* **Plagiarism Catching Probability**: Capture up to 99% of window blurring and copy-paste cheat indicators.
* **System Load Speeds**: Render active assets under 3 seconds globally.
* **Grade Processing SLA**: Display autocompiled candidate score files inside the admin dashboard in under 1 second post-submission.
