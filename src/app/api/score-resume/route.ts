import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
// @ts-ignore
import pdfParse from '@bingsjs/pdf-parse';

export const runtime = 'nodejs';

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

function extractJson(text: string | undefined): any {
  if (!text) return null;
  // Remove code block markers if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  // Try to find the first {...} block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to fix common issues
    try {
      cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    return '';
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to retry Gemini JSON extraction
async function getGeminiJsonResponse(ai: any, prompt: string, maxRetries = 5): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const feedback = extractJson(response.text);
      if (feedback) return feedback;
    } catch (err: any) {
      // If 503, wait and retry
      if (err?.error?.code === 503 && attempt < maxRetries) {
        await sleep(1500); // wait 1.5 seconds before retry
        continue;
      }
      // For other errors, break or handle as needed
      break;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('resume') as File;
  const jobDescription = formData.get('jobDescription') as string;
  const category = formData.get('category') as string;
  const experience = formData.get('experience') as string;

  // 1. Extract resume text
  let resumeText = '';
  if (file && file.name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      resumeText = await extractTextFromPDF(buffer);
    } catch (err) {
      resumeText = '';
    }
  } else if (file && file.name.endsWith('.docx')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value } = await mammoth.extractRawText({ buffer });
    resumeText = value;
  } else if (file) {
    resumeText = await file.text();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // 2. Semantic similarity using Gemini embeddings
  let normalizedSimilarity = 0.5; // default
  try {
    const [resumeEmbed, jdEmbed] = await Promise.all([
      ai.models.embedContent({
        model: 'gemini-embedding-exp-03-07',
        contents: resumeText,
        config: { taskType: "SEMANTIC_SIMILARITY" }
      }),
      ai.models.embedContent({
        model: 'gemini-embedding-exp-03-07',
        contents: jobDescription,
        config: { taskType: "SEMANTIC_SIMILARITY" }
      })
    ]);
    // Each .embeddings is an array; use the first embedding vector
    const resumeVec = resumeEmbed.embeddings?.[0]?.values;
    const jdVec = jdEmbed.embeddings?.[0]?.values;
    if (resumeVec && jdVec) {
      const sim = cosineSimilarity(resumeVec, jdVec);
      normalizedSimilarity = (sim + 1) / 2;
    }
  } catch {
    // fallback to default
  }

  // 3. NER using Gemini
  let roles: string[] = [], orgs: string[] = [], degrees: string[] = [];
  try {
    const nerPrompt = `
      Extract all job titles, organizations, and degrees from the following resume.
      Respond in JSON with keys: roles, orgs, degrees.
      Resume:
      ${resumeText}
    `;
    const nerResp = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: nerPrompt,
    });
    const nerJson = JSON.parse(nerResp.text ?? '{}');
    roles = nerJson.roles || [];
    orgs = nerJson.orgs || [];
    degrees = nerJson.degrees || [];
  } catch {
    // fallback to empty arrays
  }

  // 4. Gemini LLM feedback with retry
  const feedbackPrompt = `
    Resume:
    ${resumeText}
    Job Description:
    ${jobDescription}
    Analyze the resume for this job. List strengths, weaknesses, and recommendations for improvement.
    Respond ONLY in valid JSON with keys: strengths, weaknesses, recommendations. Do not include any explanation or text outside the JSON. Do not use markdown or code blocks. Only output the JSON object.
  `;
  let feedback = await getGeminiJsonResponse(ai, feedbackPrompt, 5);
  if (!feedback) {
    feedback = {
      strengths: ['The AI service is temporarily overloaded. Please try again in a few minutes.'],
      weaknesses: [],
      recommendations: [],
    };
  }

  // 5. Scoring logic (adapted from your Python code)
  const categoryMatch = roles.filter(r => category && r.toLowerCase().includes(category.toLowerCase())).length;
  const degreePoints = Math.min(degrees.length * 5, 15);
  const orgPoints = Math.min(orgs.length * 2, 10);
  const gptStrengths = feedback.strengths || [];
  const gptWeaknesses = feedback.weaknesses || [];
  const feedbackPoints = gptStrengths.length * 5 - gptWeaknesses.length * 3;

  const score = Math.max(0, Math.min(100, Math.round(
    normalizedSimilarity * 50 +
    categoryMatch * 10 +
    degreePoints +
    orgPoints +
    feedbackPoints
  )));

  return new Response(JSON.stringify({
    score,
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    recommendations: feedback.recommendations,
  }), { status: 200 });
} 