# 04-Architecture.md

## 1. Modular System Architecture
The platform operates on a decoupled full-stack model:
* **Frontend**: Responsive Single-Page Application (SPA) deployed via AWS S3 and AWS Amplify.
* **Backend Application Service**: FastAPI REST API deploying structured models, and handling computational calculations (e.g., scoring indices, prompt evaluations).
* **Database Engine**: Relational PostgreSQL database managed within AWS RDS.

---

## 2. High-Level Architectural Layouts

### 2.1. System Context Diagram
Below is the system context mapping user roles to runtime components:

```
                  ┌──────────────────────────────────────────────┐
                  │          SYSTEM CONTEXT BOUNDARY             │
                  └──────────────────────────────────────────────┘
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      ▼                                                       ▼
┌───────────┐                                           ┌───────────┐
│ CANDIDATE │                                           │   ADMIN   │
└─────┬─────┘                                           └─────┬─────┘
      │                                                       │
      │ Matches high-entropy UUID                             │ Direct Admin Portal
      ▼                                                       ▼
 ┌──────────┐                                            ┌──────────┐
 │  https  │                                            │  https  │
 └────┬─────┘                                            └────┬─────┘
      │                                                       │
      ▼                                                       ▼
┌───────────────────────────────────────────────────────────────────┐
│                      AMPLIFY FRONTEND SERVER                      │
│                                                                   │
│                 [React Router / Client Cache Engine]              │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ Direct AJAX requests via JWT
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICE                            │
│                                                                   │
│             [FastAPI Application Instance on AWS EC2]             │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ SQLAlchemy / DB Pooler
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                     PERSISTENCY STORAGE BASE                      │
│                                                                   │
│                    [AWS RDS PostgreSQL Instance]                  │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2. Component Diagram
```
┌────────────────────────────────────────────────────────┐
│                        FASTAPI                         │
│                                                        │
│  ┌───────────────────┐          ┌───────────────────┐  │
│  │   Router Layer    │◄────────►│ Middleware Shield │  │
│  │ (/api/v1/auth...) │          │  (Cors, JWT Auth) │  │
│  └─────────┬─────────┘          └───────────────────┘  │
│            │                                           │
│            ▼                                           │
│  ┌───────────────────┐                                 │
│  │   Service Layer   │                                 │
│  │ (ScoreService...) │                                 │
│  └─────────┬─────────┘                                 │
│            │                                           │
│            ▼                                           │
│  ┌───────────────────┐                                 │
│  │ Repository Layer  │                                 │
│  │ (SQLAlchemy ORM)  │                                 │
│  └─────────┬─────────┘                                 │
└────────────┼───────────────────────────────────────────┘
             │ Connection pooling (pgPool / RDS)
             ▼
┌────────────────────────────────────────────────────────┐
│                      POSTGRESQL                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Core Software Modules Explanation

### 3.1. Candidate Module
* **Responsibility**: Manages demographic profiles, academic credentials, and session token resolution.
* **Logic**: Validates single-use access tokens, returning localized session keys to authenticate candidates.

### 3.2. Assessment Module
* **Responsibility**: Manages test specifications, durations, thresholds, and question hierarchies.
* **Logic**: Assembles full assessment models containing specific sections, multiple-choice options, and coding prompts.

### 3.3. Question Module
* **Responsibility**: Handles backend configurations for screening materials.
* **Logic**: Governs relational associations between questions, difficulty levels, and response options.

### 3.4. Submission Module
* **Responsibility**: Tracks candidate responses, self-assessments, and code entries.
* **Logic**: Handles continuous auto-saves during candidate typing sequences.

### 3.5. Analytics Module
* **Responsibility**: Logs real-time interaction metrics (e.g., copy-paste, focus loss count).
* **Logic**: Calculates confidence indices and flagging parameters based on candidate behaviors.

### 3.6. Reporting Module
* **Responsibility**: Compiles results data and matches scores to performance benchmarks.
* **Logic**: Maps category ratings to defined educational learning paths.

### 3.7. Admin Module
* **Responsibility**: Handles secure administration tasks.
* **Logic**: Manages credentials, report audits, and question configurations.

---

## 4. Software Design Patterns

### 4.1. Repository Pattern
By implementing the **Repository Pattern** decoupled via SQLAlchemy, data retrieval operations are separated from business logic. Modules communicate through clean interfaces, making it easier to integrate caching layers (e.g., Redis) or migrate query engines:

```python
# Backend abstraction interface design example:
class CandidateRepository(BaseRepository[Candidate]):
    def __init__(self, db_session: AsyncSession):
        super().__init__(model=Candidate, session=db_session)

    async def get_by_email(self, email: str) -> Optional[Candidate]:
        result = await self.session.execute(
            select(Candidate).where(Candidate.email == email)
        )
        return result.scalars().first()
```

### 4.2. Service Layer Design
All business calculations are routed through dedicated services:
* `ScoreCalculationService`: Compares user answers with stored parameters to determine scores.
* `ReportTemplateService`: Formats evaluation sheets and diagnostic graphs.

---

## 5. Operations & Performance Plans

### 5.1. Error Handling Strategy
* All routes are wrapper-protected using standard HTTP handlers, translating server exceptions into user-friendly JSON payloads:
  ```json
  {
    "status": 403,
    "error": "SESSION_EXPIRED",
    "message": "Token duration has lapsed. Contact mentorship support."
  }
  ```

### 5.2. Monitoring & Logging Setup
* **Structured Logs**: Application events use Python's Native Logger formatted in structured JSON.
* **APM Integration**: Middleware captures route execution latencies and logs metrics to AWS CloudWatch.

### 5.3. Scalability & Availability Target
* **Database Pool Sizing**: Implements asynchronous execution models with optimized connection pools (e.g., `pool_size=20`, `max_overflow=10`).
* **Micro-Caching**: Caches constant parameters (like static questions and multi-choice indices) in memory to minimize database traffic.
