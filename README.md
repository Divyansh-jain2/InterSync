# InterSync

## Overview

**InterSync** is a modern, full-stack interview platform designed for technical interviews between interviewers and candidates. It features real-time video calls, collaborative code editing, a digital whiteboard, screen sharing, interview scheduling, question management, and an advanced AI-powered resume scorer. The platform is built entirely with Next.js (TypeScript) and leverages best-in-class third-party services for video, authentication, and AI.

---

## ✨ Main Features

- **Live Video Calls:** Real-time, high-quality video calls between interviewer and candidate using [Stream](https://getstream.io/).
- **Collaborative Code Editor:** In-browser code editor for live coding interviews, supporting multiple languages and real-time collaboration.
- **Whiteboard:** Digital whiteboard for drawing diagrams and explaining solutions visually.
- **Screen Sharing:** Candidates can share their screen with the interviewer for transparency and demonstration.
- **Question Management:** Interviewers can add, edit, and select questions before and during the interview.
- **Interview Scheduling:** Schedule interviews with calendar integration and notifications.
- **AI-Powered Resume Scorer:** Candidates can upload their resume and a job description to receive an AI-generated score and actionable feedback, powered by Google Gemini.
- **Recordings:** Interviews can be recorded for later review.
- **Comments & Feedback:** Interviewers can leave comments and feedback on interviews.
- **Admin Dashboard:** Manage users, interviews, and platform settings.
- **Authentication:** Secure, modern authentication and user management with [Clerk](https://clerk.dev/).

---

## 🧠 Resume Scoring Logic (In-Depth)

The resume scorer uses a multi-step, AI-powered process to generate a comprehensive score and actionable feedback:

### 1. Semantic Similarity (Resume vs. Job Description)
- **How:**
  - The resume text and job description are both sent to Google Gemini to generate embeddings (vector representations).
  - The **cosine similarity** between these two vectors is calculated.
  - The similarity score is normalized to a 0–1 range.
- **Why:**
  - Rewards resumes that are semantically aligned with the job requirements.

### 2. Named Entity Recognition (NER)
- **How:**
  - Gemini is prompted to extract:
    - **Roles:** Job titles found in the resume.
    - **Organizations:** Company names.
    - **Degrees:** Educational qualifications.
  - The response is parsed as JSON.
- **Why:**
  - Identifies and rewards relevant experience and education.

### 3. Gemini LLM Feedback
- **How:**
  - The resume and job description are sent to Gemini with a prompt asking for:
    - **Strengths**
    - **Weaknesses**
    - **Recommendations**
  - The response is parsed as JSON (with robust extraction and retry logic).
- **Why:**
  - Provides advanced, AI-powered, context-aware feedback on the resume.

### 4. Scoring Formula
The final score is a **weighted sum** of several components:

| Component                | Calculation/Weighting                                 | Max Points |
|--------------------------|------------------------------------------------------|------------|
| **Semantic Similarity**  | `normalizedSimilarity * 50`                          | 50         |
| **Category Match**       | `categoryMatch * 10` (number of times the selected category appears in roles) | 10 per match |
| **Degrees**              | `Math.min(degrees.length * 5, 15)`                   | 15         |
| **Organizations**        | `Math.min(orgs.length * 2, 10)`                      | 10         |
| **Gemini Feedback**      | `strengths.length * 5 - weaknesses.length * 3`       | variable   |

- **All components are summed.**
- The final score is **clamped to the 0–100 range**.

#### Example Calculation
Suppose:
- Semantic similarity = 0.8 → 0.8 * 50 = 40
- Category appears 1 time in roles → 1 * 10 = 10
- 2 degrees → 2 * 5 = 10
- 3 organizations → 3 * 2 = 6
- 2 strengths, 1 weakness → 2 * 5 - 1 * 3 = 7

**Total score:** 40 + 10 + 10 + 6 + 7 = 73

### 5. Error Handling & Robustness
- If any step fails (e.g., Gemini returns invalid JSON, or is overloaded), the system retries up to 5 times.
- If all retries fail, a user-friendly error message is returned.
- All parsing and AI calls are wrapped in try/catch blocks.

### Why This Approach?
- **Holistic:** Combines semantic matching, entity extraction, and LLM feedback.
- **Context-aware:** Goes beyond keyword matching to understand the actual fit.
- **Actionable:** Provides not just a score, but also strengths, weaknesses, and recommendations.

---

## 🛠️ Technologies Used

- **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Video Calls & Real-Time:** [Stream](https://getstream.io/) (video, audio, chat, screen share)
- **Authentication:** [Clerk](https://clerk.dev/) (user auth, roles, session management)
- **AI & NLP:** [Google Gemini](https://ai.google.dev/) (semantic similarity, LLM feedback, NER)
- **Resume Parsing:** [`@bingsjs/pdf-parse`](https://www.npmjs.com/package/@bingsjs/pdf-parse) (PDF), [`mammoth`](https://www.npmjs.com/package/mammoth) (DOCX), plain text
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **State Management:** React Context, hooks
- **Other:**
  - [Convex](https://convex.dev/) (realtime database, if used)
  - [Lucide Icons](https://lucide.dev/)
  - [Mermaid](https://mermaid.js.org/) (for diagrams)

---

## 🏗️ Architecture

- **Monorepo:** All logic (frontend, backend API, AI, parsing) is in a single Next.js project.
- **API Routes:** All backend logic (resume scoring, interview management, etc.) is implemented as Next.js API routes in `/src/app/api/`.
- **Third-Party Services:**
  - **Stream:** Handles all video, audio, chat, and screen sharing.
  - **Clerk:** Handles authentication, user management, and roles.
  - **Google Gemini:** Powers AI features (resume scoring, feedback, NER, semantic similarity).

---

## 🚀 Feature Details

### 1. **Live Video Interview Room**
- Powered by Stream.
- Supports video, audio, chat, and screen sharing.
- Real-time, low-latency, and secure.

### 2. **Collaborative Code Editor**
- Syntax highlighting for multiple languages (Python, Java, C++, JavaScript, etc.).
- Real-time updates for both interviewer and candidate.
- Integrated into the interview room.

### 3. **Whiteboard**
- Draw, annotate, and explain visually.
- Useful for system design, flowcharts, and algorithm explanation.

### 4. **Screen Sharing**
- Candidate can share their screen with the interviewer.
- Useful for debugging, walkthroughs, or showing local projects.

### 5. **Question Management**
- Interviewers can add, edit, and select questions before and during the interview.
- Questions can be categorized by role, difficulty, etc.

### 6. **Interview Scheduling**
- Schedule interviews with calendar UI.
- Send notifications/reminders to participants.

### 7. **AI-Powered Resume Scorer**
- Candidates can upload their resume (PDF, DOCX, TXT) and a job description.
- The system parses the resume, compares it semantically to the job description, extracts entities (roles, orgs, degrees), and gets LLM-powered feedback from Gemini.
- Returns a score (0–100), strengths, weaknesses, and actionable recommendations.
- Retries and robust error handling for LLM/API issues.

### 8. **Recordings**
- Interviews can be recorded and stored for later review.

### 9. **Comments & Feedback**
- Interviewers can leave comments and feedback on interviews.
- Candidates can view feedback post-interview.

### 10. **Admin Dashboard**
- Manage users, interviews, questions, and platform settings.

### 11. **Authentication**
- Secure sign-up, login, and role-based access using Clerk.
- Supports interviewer, candidate, and admin roles.

---

## 📁 Project Structure

- `/src/app/` — Main app directory (pages, layouts, API routes)
- `/src/components/` — UI components (CodeEditor, WhiteBoard, MeetingRoom, etc.)
- `/src/constants/` — App-wide constants
- `/src/hooks/` — Custom React hooks
- `/src/actions/` — Server actions
- `/src/lib/` — Utility functions
- `/public/` — Static assets (images, icons)
- `/convex/` — (If using Convex for realtime DB)

---

## ⚙️ Setup Instructions

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd InterSync
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - `GEMINI_API_KEY` — Your Google Gemini API key
   - (Other keys for Stream, Clerk, etc. as needed)
4. **Run the development server:**
   ```bash
   npm run dev
   ```
5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## 🧩 API Routes

- `/api/score-resume` — Resume scoring (file upload, JD, category, experience)
- `/api/other-routes` — (Add more as needed for interviews, scheduling, etc.)

---

## 🤝 Contributing

1. Fork the repo and create your branch from `main`.
2. Make your changes and add tests if relevant.
3. Run `npm run lint` and `npm run build` to check for errors.
4. Open a pull request with a clear description.

---

## 📄 License

MIT
