"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import LoaderUI from "@/components/LoaderUI";
import { Id } from "../../../../convex/_generated/dataModel";

// Shadcn UI Components
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Trash2, XCircle } from 'lucide-react'; // Added XCircle for removing examples
import { Textarea } from "@/components/ui/textarea"; // For multiline input


// Define the type for a question object received from Convex
interface Question {
  _id: Id<"questions">;
  title: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
}

export default function QuestionsPage() {
  const questions = useQuery(api.questions.getQuestions) as Question[] | undefined;
  const addQuestion = useMutation(api.questions.addQuestion);
  const deleteQuestion = useMutation(api.questions.deleteQuestion);

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // States for the new question form within the dialog
  const [newQuestionTitle, setNewQuestionTitle] = useState<string>('');
  const [newQuestionDescription, setNewQuestionDescription] = useState<string>('');
  const [newQuestionExamples, setNewQuestionExamples] = useState<Array<{ input: string; output: string; explanation?: string }>>([{ input: '', output: '', explanation: '' }]);
  const [newQuestionConstraints, setNewQuestionConstraints] = useState<string[]>([]);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState<boolean>(false);

  const handleAddQuestion = async (newQuestion: {
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
  }) => {
    await addQuestion(newQuestion);
  };

  const handleDeleteQuestion = async (questionId: Id<"questions">) => {
    if (confirm("Are you sure you want to delete this question?")) {
      await deleteQuestion({ questionId });
    }
  };

  // --- Functions for managing examples within the dialog ---
  const handleAddExample = () => {
    setNewQuestionExamples([...newQuestionExamples, { input: '', output: '', explanation: '' }]);
  };

  const handleRemoveExample = (index: number) => {
    const updatedExamples = newQuestionExamples.filter((_, i) => i !== index);
    setNewQuestionExamples(updatedExamples);
  };

  const handleExampleChange = (index: number, field: 'input' | 'output' | 'explanation', value: string) => {
    const updatedExamples = newQuestionExamples.map((example, i) =>
      i === index ? { ...example, [field]: value } : example
    );
    setNewQuestionExamples(updatedExamples);
  };

  // --- Functions for managing constraints within the dialog ---
  const handleAddConstraint = () => {
    setNewQuestionConstraints([...newQuestionConstraints, '']);
  };

  const handleRemoveConstraint = (index: number) => {
    const updatedConstraints = newQuestionConstraints.filter((_, i) => i !== index);
    setNewQuestionConstraints(updatedConstraints);
  };

  const handleConstraintChange = (index: number, value: string) => {
    const updatedConstraints = newQuestionConstraints.map((constraint, i) =>
      i === index ? value : constraint
    );
    setNewQuestionConstraints(updatedConstraints);
  };

  // Function to handle adding the new question from the dialog form
  const handleAddQuestionFromDialog = async () => {
    if (newQuestionTitle.trim() && newQuestionDescription.trim()) {
      await handleAddQuestion({
        title: newQuestionTitle,
        description: newQuestionDescription,
        examples: newQuestionExamples.filter(ex => ex.input.trim() || ex.output.trim()), // Filter out empty examples
        constraints: newQuestionConstraints.filter(c => c.trim()), // Filter out empty constraints
      });
      // Reset form fields and close dialog
      setNewQuestionTitle('');
      setNewQuestionDescription('');
      setNewQuestionExamples([{ input: '', output: '', explanation: '' }]); // Reset to one empty example
      setNewQuestionConstraints([]); // Reset constraints
      setIsAddQuestionDialogOpen(false);
    }
  };

  if (!questions) return <LoaderUI />;

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Manage Questions Section */}
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
        Manage Questions
      </h1>
      <p className="text-muted-foreground mt-2">
        Add new questions or select questions for your coding platform.
      </p>

      {/* Add New Question Dialog Trigger */}
      <div className="mt-8">
        <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]"> {/* Increased width and added scroll */}
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
              <DialogDescription>
                Enter the details for your new question here.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Title Input */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              {/* Description Input */}
              <div className="grid grid-cols-4 items-start gap-4"> {/* Use items-start for multiline label */}
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newQuestionDescription}
                  onChange={(e) => setNewQuestionDescription(e.target.value)}
                  className="col-span-3 min-h-[100px]" // Min-height for textarea
                  required
                />
              </div>

              {/* Examples Section */}
              <div className="col-span-full mt-4">
                <h3 className="font-semibold text-lg mb-2">Examples</h3>
                {newQuestionExamples.map((example, index) => (
                  <Card key={index} className="p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveExample(index)}
                      aria-label="Remove example"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <div className="grid gap-2">
                      <Label htmlFor={`input-${index}`}>Input</Label>
                      <Textarea
                        id={`input-${index}`}
                        value={example.input}
                        onChange={(e) => handleExampleChange(index, 'input', e.target.value)}
                        placeholder="e.g., [1,2,3], 5"
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`output-${index}`}>Output</Label>
                      <Textarea
                        id={`output-${index}`}
                        value={example.output}
                        onChange={(e) => handleExampleChange(index, 'output', e.target.value)}
                        placeholder="e.g., 8"
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="col-span-full grid gap-2">
                      <Label htmlFor={`explanation-${index}`}>Explanation (Optional)</Label>
                      <Textarea
                        id={`explanation-${index}`}
                        value={example.explanation || ''}
                        onChange={(e) => handleExampleChange(index, 'explanation', e.target.value)}
                        placeholder="Explanation for this example."
                        className="min-h-[60px]"
                      />
                    </div>
                  </Card>
                ))}
                <Button variant="outline" onClick={handleAddExample} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Example
                </Button>
              </div>

              {/* Constraints Section */}
              <div className="col-span-full mt-4">
                <h3 className="font-semibold text-lg mb-2">Constraints</h3>
                {newQuestionConstraints.map((constraint, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                      value={constraint}
                      onChange={(e) => handleConstraintChange(index, e.target.value)}
                      placeholder="e.g., 1 <= N <= 10^5"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveConstraint(index)}
                      aria-label="Remove constraint"
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={handleAddConstraint} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Constraint
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddQuestionFromDialog}>Save Question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- */}

      {/* Display Available Questions with Delete Button */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          Available Questions
        </h2>
        <p className="text-muted-foreground mt-2">
          Review and manage your existing questions.
        </p>
        <div className="grid gap-4 mt-4">
          {questions.length > 0 ? (
            questions.map((question) => (
              <Card key={question._id} className="p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <CardTitle className="text-lg font-semibold">{question.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    {question.description}
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteQuestion(question._id)}
                  aria-label={`Delete ${question.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              No questions found. Start by adding a new question above!
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}