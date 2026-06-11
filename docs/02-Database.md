# 02-Database.md

## 1. Database Overview
The PostgreSQL database represents the reliable persistence engine behind the **Skill Assessment & Mentorship Platform**. The system uses a highly structured, fully normalized relational schema built on top of high performance PostgreSQL primitives. It provides granular tracking of candidates, active test templates, telemetry metrics, source code files, natural language written responses, and resulting diagnostic reports.

---

## 2. Entity Relationship Overview
The database operates on a highly consistent hierarchical structure. Below is the relational context of the schema:

* An **Assessment** consists of multiple **Sections** of varied subjects, and each section houses multiple **Questions**.
* A **Question** can have multiple defined **Options** (for MCQs) and points mapping.
* A **Candidate** launches an authorized **Submission** link (matching high-entropy tokens mapping to an assessment setup).
* During a submission, a candidate creates a **Self Assessment** score matrix, multiple **Answers** (linked to standard MCQs/Theory questions), **Coding Submissions** (with compiler details), **Prompt Responses**, and a **Mindset Response**.
* Continuous telemetry metadata (including copy/paste volumes, screen blur counts) maps to **Analytics** records.
* After submission, the engine compiles a structured **Report** outlining candidate ratings, learning track options, and detailed technical graphs.

```
[assessments]──1:N───[sections]──1:N───[questions]──1:N───[options]
      │                                       │
     1:N                                     1:N
      │                                       │
[submissions]──1:1───[candidates]             │
      │                                       │
     1:N ─────────────────────────────────────┘
      ├───[answers]
      ├───[coding_submissions]
      ├───[prompt_responses]
      ├───[mindset_responses]
      ├───[analytics]
      └───[reports]
```

---

## 3. Comprehensive Schema Structure & Tables

### 3.1. `candidates`
* **Purpose**: Registers background demographic data of the examinee.
* **Fields**:
  * `id`: `UUID` (Primary Key, Defaults to `gen_random_uuid()`)
  * `first_name`: `VARCHAR(100)` (Required)
  * `last_name`: `VARCHAR(100)` (Required)
  * `email`: `VARCHAR(255)` (Required, Unique)
  * `phone`: `VARCHAR(30)` (Optional)
  * `education_institution`: `VARCHAR(255)` (Optional)
  * `current_year_or_degree`: `VARCHAR(100)` (Optional)
  * `cgpa`: `NUMERIC(4, 2)` (Optional)
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `CURRENT_TIMESTAMP`)
  * `updated_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `CURRENT_TIMESTAMP`)
* **Relationships**:
  * One-to-Many with `submissions` (`candidate_id`)
* **Index Recommendations**:
  * `idx_candidates_email` (B-Tree structure, for email authentication/queries)

---

### 3.2. `assessments`
* **Purpose**: Represents full test profiles containing configured sections, timings, and weights.
* **Fields**:
  * `id`: `UUID` (Primary Key, Defaults to `gen_random_uuid()`)
  * `title`: `VARCHAR(200)` (Required, e.g., "Full-Stack Cohort 2026 Test")
  * `description`: `TEXT` (Optional)
  * `total_limit_minutes`: `INTEGER` (Required, default 90)
  * `is_active`: `BOOLEAN` (Default true)
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `CURRENT_TIMESTAMP`)
* **Relationships**:
  * One-to-Many with `sections`
  * One-to-Many with `submissions`
* **Index Recommendations**:
  * `idx_assessments_active` (Partial, where `is_active = true`)

---

### 3.3. `sections`
* **Purpose**: Logical sections of the test (e.g., "Aptitude", "DSA").
* **Fields**:
  * `id`: `UUID` (Primary Key, Defaults to `gen_random_uuid()`)
  * `assessment_id`: `UUID` (Foreign Key -> `assessments.id` on ON DELETE CASCADE)
  * `name`: `VARCHAR(100)` (Required, e.g., "Programming Fundamentals")
  * `order_sequence`: `INTEGER` (Required, index sequence indicator)
  * `duration_limit_minutes`: `INTEGER` (Required)
  * `minimum_pass_score`: `NUMERIC(5, 2)` (Required)
* **Index Recommendations**:
  * `idx_sections_assessment_order` (Composite B-Tree on `assessment_id`, `order_sequence`)

---

### 3.4. `questions`
* **Purpose**: Unique multi-subject items evaluated during tests.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `section_id`: `UUID` (Foreign Key -> `sections.id` on ON DELETE CASCADE)
  * `type`: `VARCHAR(30)` (Required, values: `'MCQ'`, `'THEORY_EXPLANATION'`)
  * `prompt_text`: `TEXT` (Required)
  * `code_snippet_template`: `TEXT` (Optional, markdown code context)
  * `points_value`: `NUMERIC(5, 2)` (Default 10.0)
  * `order_sequence`: `INTEGER` (Required)
  * `correct_explanation`: `TEXT` (Optional reference for admins)
* **Index Recommendations**:
  * `idx_questions_section` (B-Tree on `section_id`)

---

### 3.5. `options`
* **Purpose**: Holds alternative answers for multiple-choice questions.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `question_id`: `UUID` (Foreign Key -> `questions.id` on ON DELETE CASCADE)
  * `option_text`: `TEXT` (Required)
  * `is_correct`: `BOOLEAN` (Required, true/false)
  * `order_tag`: `VARCHAR(10)` (Required, e.g., "A", "B", "C")
* **Index Recommendations**:
  * `idx_options_question` (B-Tree on `question_id`)

---

### 3.6. `self_assessment`
* **Purpose**: Stores candidates' subjective self-ratings across key stack areas.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign Key -> `submissions.id` on ON DELETE CASCADE)
  * `stack_concept`: `VARCHAR(100)` (Required, e.g., `'WebFrameworks'`, `'AI_Tools'`)
  * `rated_score_value`: `INTEGER` (Required, scale 1-10)
* **Index Recommendations**:
  * `idx_self_assessment_submission` (B-Tree on `submission_id`)

---

### 3.7. `submissions`
* **Purpose**: Links a candidate, an active assessment setup, and a high-entropy validation token.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `candidate_id`: `UUID` (Foreign Key -> `candidates.id` on ON DELETE RESTRICT)
  * `assessment_id`: `UUID` (Foreign Key -> `assessments.id` on ON DELETE RESTRICT)
  * `token_sha256`: `VARCHAR(64)` (Required, Unique high-entropy string)
  * `is_completed`: `BOOLEAN` (Default false)
  * `current_screen_locked`: `INTEGER` (Default 0)
  * `is_flagged_for_cheating`: `BOOLEAN` (Default false)
  * `started_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `CURRENT_TIMESTAMP`)
  * `submitted_at`: `TIMESTAMP WITH TIME ZONE` (Null until completed)
* **Index Recommendations**:
  * `idx_submissions_token` (Hash Index, exact lookup search index on `token_sha256`)
  * `idx_submissions_pending` (Partial, where `is_completed = false`)

---

### 3.8. `answers`
* **Purpose**: Logs selections representing candidates' attempts on MCQs or open essay files.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign Key -> `submissions.id` on ON DELETE CASCADE)
  * `question_id`: `UUID` (Foreign Key -> `questions.id` on ON DELETE RESTRICT)
  * `selected_option_id`: `UUID` (Optional, Foreign Key -> `options.id`)
  * `custom_explanation_text`: `TEXT` (Optional, essay inputs)
  * `raw_points_earned`: `NUMERIC(5, 2)` (Calculated automatically, default 0.0)
  * `time_taken_seconds`: `INTEGER` (Required)
* **Index Recommendations**:
  * `idx_answers_submission_question` (Composite Unique B-Tree to prevent duplicate submissions)

---

### 3.9. `coding_submissions`
* **Purpose**: Specialized coding assignments saved per programming section.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign key -> `submissions.id` on ON DELETE CASCADE)
  * `programming_language`: `VARCHAR(30)` (Required, e.g., `'Python'`, `'JavaScript'`)
  * `source_code_content`: `TEXT` (Required)
  * `compilation_status`: `VARCHAR(30)` (e.g., `'COMPILE_SUCCESS'`, `'RUNTIME_ERROR'`)
  * `test_case_success_percent`: `NUMERIC(5, 2)` (For automation check-ups)
* **Index Recommendations**:
  * `idx_coding_submission_parent` (B-Tree on `submission_id`)

---

### 3.10. `prompt_responses`
* **Purpose**: Records the input prompts designed by candidates to resolve LLM requirements.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign key -> `submissions.id` on ON DELETE CASCADE)
  * `assigned_ai_scenario`: `TEXT` (Scenario parameter details)
  * `candidate_prompt_template`: `TEXT` (The candidate's engineered prompt string)
  * `estimated_prompt_efficiency`: `INTEGER` (Auto qualitative value)
* **Index Recommendations**:
  * `idx_prompt_response_parent` (B-Tree on `submission_id`)

---

### 3.11. `mindset_responses`
* **Purpose**: Captures growth mindset qualitative metrics from text fields.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign Key -> `submissions.id` on ON DELETE CASCADE)
  * `prompt_scenario_key`: `VARCHAR(100)` (Scenario descriptor)
  * `essay_text_content`: `TEXT` (Full candidate essay)
* **Index Recommendations**:
  * `idx_mindset_submission` (B-Tree on `submission_id`)

---

### 3.12. `analytics`
* **Purpose**: Live trackers monitoring client telemetry data points.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign Key -> `submissions.id` on ON DELETE CASCADE, Unique representation)
  * `tab_focus_loss_count`: `INTEGER` (Required, default 0)
  * `mouse_leave_screen_count`: `INTEGER` (Required, default 0)
  * `clipboard_copy_count`: `INTEGER` (Required, default 0)
  * `clipboard_paste_count`: `INTEGER` (Required, default 0)
  * `keyboard_keystrokes_sum`: `INTEGER` (For telemetry analysis)
  * `browser_user_agent`: `TEXT` (Agent tracking details)
  * `viewport_resolution`: `VARCHAR(50)` (Resolution indicators)
* **Index Recommendations**:
  * `idx_analytics_violations` (B-Tree for high switch counts: where `tab_focus_loss_count > 5`)

---

### 3.13. `reports`
* **Purpose**: Evaluated diagnostics saved, linking candidate results to appropriate pathways.
* **Fields**:
  * `id`: `UUID` (Primary Key)
  * `submission_id`: `UUID` (Foreign Key -> `submissions.id` on ON DELETE CASCADE)
  * `overall_score`: `NUMERIC(5, 2)` (Calculated, e.g., 85.50)
  * `category_scores_json`: `JSONB` (Stores metrics breakdown: `{ "DSA": 80, "Aptitude": 90 }`)
  * `recommended_mentorship_track`: `VARCHAR(100)` (Track assignments, e.g., `'FAST_TRACK_WEB'`)
  * `mentor_diagnostic_notes`: `TEXT` (Custom input from assessment leads)
  * `compiled_at`: `TIMESTAMP WITH TIME ZONE` (Defaults to `CURRENT_TIMESTAMP`)
* **Index Recommendations**:
  * `idx_reports_recommendation` (B-Tree on `recommended_mentorship_track`)

---

## 4. Operational Strategies

### 4.1. Data Retention Strategy
* **Pre-Assessment / Incomplete Submissions**: Purge links that remained inactive for >14 days using scheduled PostgreSQL cron sweeps.
* **Completed Submissions & Candidates Information**: retrain securely for 24 months mapping cohort history results, then transfer archive records into cold S3 buckets to reduce database costs.

### 4.2. Backup Strategy
* **Automated Daily Backups**: Create full snapshots using AWS Backup mapping RDS structures, maintaining 30-day recovery spans.
* **Transaction Logs (WAL)**: Ship continuously to secure S3 storage setups enabling Point-In-Time recovery (PITR) configurations up to the millisecond.

### 4.3. High-Velocity Scaling Considerations
* **JSONB Schema Adaptation**: Use indices like `GIN` on `reports.category_scores_json` to support multi-dimensional analytical queries without requiring schema alterations.
* **Write Buffer / Redis integration**: Read-heavy queries like retrieving diagnostic question sheets from options databases should resolve through distributed low latency Redis caches during active examination events.
