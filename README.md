This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# InterSync

## Architecture Overview

This project is now a **fully unified Next.js (TypeScript) application**. All advanced resume scoring logic is implemented in a Next.js API route, with no separate Python/Flask backend. The backend logic leverages Google Gemini for AI-powered feedback and semantic analysis, and robustly handles PDF/DOCX/TXT parsing and scoring.

---

## Resume Scorer: In-Depth Workflow & Logic

### 1. API Endpoint
- The resume scorer is implemented as a Next.js API route: `src/app/api/score-resume/route.ts`.
- The frontend sends a `multipart/form-data` POST request containing:
  - The resume file (PDF, DOCX, or TXT)
  - The job description (text)
  - The category (e.g., Software Engineer)
  - The experience level (e.g., Fresher, Intermediate, Experienced)

### 2. File Parsing
- **PDF:** Uses [`@bingsjs/pdf-parse`](https://www.npmjs.com/package/@bingsjs/pdf-parse) to extract text from all pages. Only the uploaded file buffer is used—no file paths or test files are referenced.
- **DOCX:** Uses [`mammoth`](https://www.npmjs.com/package/mammoth`) to extract raw text.
- **TXT:** Reads the file as plain text.
- **Robustness:** All parsing is wrapped in try/catch blocks to prevent crashes on malformed files.

### 3. Semantic Similarity (Resume vs. Job Description)
- Uses the Gemini API to generate embeddings for both the resume text and the job description.
- Calculates the **cosine similarity** between these embeddings.
- **Normalization:** The similarity score is normalized to a 0–1 range for scoring.

### 4. Named Entity Recognition (NER)
- Prompts Gemini to extract job titles, organizations, and degrees from the resume text.
- The response is parsed as JSON.
- If parsing fails, empty arrays are used as fallback.

### 5. Gemini LLM Feedback (Strengths, Weaknesses, Recommendations)
- Sends the resume text and job description to Gemini with a strict prompt to return only valid JSON.
- **Robust JSON Extraction:**
  - The response is cleaned of code blocks and extra text.
  - Attempts to parse the first JSON object found.
  - If parsing fails, tries to repair common issues (e.g., trailing commas).
- **Retry Mechanism:**
  - If Gemini does not return valid JSON, the API will retry up to 5 times.
  - If Gemini is overloaded (503 error), it waits and retries.
  - If all retries fail, a user-friendly error message is returned.

### 6. Scoring Logic
- **Category Match:** Counts how many times the selected category appears in the extracted roles.
- **Degrees & Organizations:** Adds points for each degree and organization found (with caps).
- **Gemini Feedback:**
  - Adds points for each strength.
  - Subtracts points for each weakness.
- **Weighted Sum:**
  - Similarity (up to 50 points)
  - Category match (10 points per match)
  - Degrees (up to 15 points)
  - Organizations (up to 10 points)
  - Gemini feedback (5 points per strength, -3 per weakness)
- **Final Score:** Clamped to the 0–100 range.

### 7. Error Handling
- All parsing and AI calls are wrapped in try/catch blocks.
- If Gemini is overloaded, the user is informed to try again later.
- If JSON extraction fails, the system retries and only falls back to an error message after all attempts.

### 8. Response
- The API returns a JSON object with:
  - `score`: The final resume score (0–100)
  - `strengths`: List of strengths (from Gemini)
  - `weaknesses`: List of weaknesses (from Gemini)
  - `recommendations`: List of suggestions (from Gemini)

---

## Example API Call (from Next.js frontend)

```typescript
const formData = new FormData();
formData.append('resume', file);
formData.append('jobDescription', jobDescription);
formData.append('category', category);
formData.append('experience', experience);

const response = await fetch('/api/score-resume', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
```

---

## Summary Diagram

```mermaid
graph TD
A[Frontend Form] -->|POST resume, JD, etc.| B[Next.js API Route]
B --> C[Extract Resume Text]
C --> D[Semantic Similarity (Gemini)]
C --> E[NER Extraction (Gemini)]
C --> F[Gemini LLM Feedback]
D --> G[Scoring Logic]
E --> G
F --> G
G --> H[Return Score, Feedback, Suggestions]
```

---

## Why This Workflow?
- **Unified stack:** All logic is in TypeScript/Next.js for easier deployment and maintenance.
- **AI-powered:** Combines traditional NLP (NER, similarity) with advanced LLM feedback.
- **Robust:** Handles a wide range of file types, errors, and LLM quirks.
- **User-friendly:** Retries on AI errors and provides actionable feedback.

---

## Setup Instructions

- Usual setup: `npm install && npm run dev`
- The API route for resume scoring is in `src/app/api/score-resume/route.ts`.
- Make sure to set your Gemini API key in your environment variables as `GEMINI_API_KEY`.

---

## Legacy Note

- The previous Python/Flask backend is no longer required. All logic is now in the Next.js API route.
