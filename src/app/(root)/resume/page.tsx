"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";

const CATEGORIES = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "Designer",
  // Add more as needed
];

const EXPERIENCE_LEVELS = ["Fresher", "Intermediate", "Experienced"];

export default function ResumeScorerPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { score: number; feedback: string; suggestions: string[] }>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!resumeFile || !category || !experience || !jobDescription) {
      setError("Please fill all fields, upload your resume, and add the job description.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("category", category);
      formData.append("experience", experience);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/score-resume", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to score resume.");
        setLoading(false);
        return;
      }
      setResult({
        score: data.score,
        feedback: data.strengths?.join("; ") || "",
        suggestions: data.recommendations || [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to score resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="mb-8 shadow-lg border bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Resume Scorer
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-base">
            Upload your resume and job description to get an AI-powered score and actionable feedback.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block font-medium">Upload Resume (PDF/DOCX/TXT)</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="file:bg-emerald-600 file:text-white file:rounded file:px-2 file:py-1 "
              />
              {resumeFile && <span className="text-sm text-muted-foreground">Selected: {resumeFile.name}</span>}
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Experience Level</label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Job Description</label>
              <Textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                className="min-h-[120px]"
                placeholder="Paste the job description here..."
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2Icon className="h-5 w-5 animate-spin" /> Scoring...
                </span>
              ) : (
                "Score Resume"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      {result && (
        <Card className="shadow-lg border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-emerald-700">Score: {result.score}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="font-semibold">Feedback:</span>
              <p className="text-muted-foreground mt-1">{result.feedback}</p>
            </div>
            <div>
              <span className="font-semibold">Suggestions to Improve:</span>
              <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function extractJson(text: string | undefined): any {
  if (!text) return null;
  let cleaned = text.trim();
  // Remove code block markers
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  // Find first {...} and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
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
