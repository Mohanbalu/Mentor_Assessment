# AI-Powered Assessment & Recruitment Platform REST API Docs

## 1. Authentication Endpoints

### 1.1 POST `/api/v1/auth/register`
* **Description**: Register a new Organization Administrator or Recruiter.
* **Request Body**:
```json
{
  "email": "lead@company.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Innovate Technologies",
  "subdomain": "innovate"
}
```
* **Response (201 Created)**:
```json
{
  "status": "success",
  "message": "User and organization registered successfully",
  "data": {
    "user": {
      "id": "c1a9386c-4861-460d-88b9-fb75c2e5cf62",
      "email": "lead@company.com",
      "role": "ORG_ADMIN",
      "firstName": "John",
      "lastName": "Doe",
      "organizationId": "50e200ba-065a-45c1-901d-7201bc3d043c"
    }
  }
}
```

### 1.2 POST `/api/v1/auth/login`
* **Description**: Authenticate user and issue JWT token pairs.
* **Request Body**:
```json
{
  "email": "lead@company.com",
  "password": "SecurePassword123!"
}
```
* **Response (200 OK)**:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "720c78a0-efce-4929-ab99-d4642fbde09f",
  "user": {
    "id": "c1a9386c-4861-460d-88b9-fb75c2e5cf62",
    "email": "lead@company.com",
    "role": "ORG_ADMIN",
    "organizationId": "50e200ba-065a-45c1-901d-7201bc3d043c"
  }
}
```

### 1.3 POST `/api/v1/auth/refresh`
* **Description**: Issue a new active JWT holding a valid refresh token.
* **Request Body**:
```json
{
  "refreshToken": "720c78a0-efce-4929-ab99-d4642fbde09f"
}
```

---

## 2. Assessment Management Endpoints

### 2.1 GET `/api/v1/assessments`
* **Description**: Fetch all active assessments for the recruiter's organization. Supports query filters (`status`, `search`).
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "7dcfafe8-b631-4122-83ef-d2495d464b97",
      "title": "Senior React Developer Screening",
      "durationMinutes": 90,
      "status": "PUBLISHED",
      "passPercentage": 70.00,
      "questionsCount": 15,
      "createdAt": "2026-06-11T04:22:00Z"
    }
  ]
}
```

### 2.2 POST `/api/v1/assessments`
* **Description**: Create a new recruitment assessment.

### 2.3 DELETE `/api/v1/assessments/:id`
* **Description**: Remove an assessment model.

---

## 3. Question Bank CRUD Endpoints

### 3.1 GET `/api/v1/questions`
* **Description**: Retrieve all questions inside the shared organizational bank.
* **Response (200 OK)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "a4fe378d-dbfa-4a6c-9c92-d6fc2cfc4083",
      "title": "Reverse String Challenge",
      "content": "Write a recursive algorithm returning a reversed copy of the input string.",
      "type": "CODING",
      "difficulty": "INTERMEDIATE",
      "points": 15
    }
  ]
}
```

### 3.2 POST `/api/v1/questions`
* **Description**: Insert a new evaluation question. Supports MCQs with options array.

---

## 4. Candidate & Engine Execution Routes

### 4.1 POST `/api/v1/engine/start`
* **Description**: Initiates an assessment attempt matching unique high-entropy tokens.
* **Request Body**:
```json
{
  "token": "ABC123XYZ"
}
```
* **Response (200 OK)**:
```json
{
  "status": "success",
  "attemptId": "a79493f2-efef-4cb3-be72-a1b9423b9d01",
  "assessment": {
    "title": "Full-Stack Internship Exam",
    "durationMinutes": 90
  }
}
```

### 4.2 POST `/api/v1/engine/submit-code`
* **Description**: Compile and execute candidate submission code block against internal test cases.
* **Request Body**:
```json
{
  "attemptId": "a79493f2-efef-4cb3-be72-a1b9423b9d01",
  "questionId": "a4fe378d-dbfa-4a6c-9c92-d6fc2cfc4083",
  "language": "javascript",
  "sourceCode": "function reverseString(str) { return str.split('').reverse().join(''); }"
}
```
* **Response (200 OK)**:
```json
{
  "status": "success",
  "info": {
    "compilationStatus": "COMPILE_SUCCESS",
    "testCasesPassed": 5,
    "testCasesTotal": 5,
    "executionTimeMs": 12,
    "memoryUsedBytes": 102400
  }
}
```

---

## 5. AI Service Abstraction

### 5.1 POST `/api/v1/ai/generate-questions`
* **Description**: Prompt the AI engine to generate unique question blocks by tech stacks and difficulty parameters.
* **Request Body**:
```json
{
  "techStack": "React & TypeScript",
  "difficulty": "ADVANCED",
  "type": "CODING",
  "count": 1
}
```
* **Response (200 OK)**:
```json
{
  "status": "success",
  "generatedQuestion": {
    "title": "Asynchronous State Reducer",
    "content": "Create a Hook 'useAsyncReducer' logging Redux-like dispatch sequences through asynchronous pipelines.",
    "difficulty": "ADVANCED",
    "points": 25,
    "testCases": [
      { "input": "...", "expected": "..." }
    ]
  }
}
```
