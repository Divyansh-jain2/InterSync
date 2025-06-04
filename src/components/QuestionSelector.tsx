import { useState } from "react";

export default function QuestionSelector({
  questions,
  selectedQuestions,
  setSelectedQuestions,
  onAddQuestion,
}: {
  questions: Array<{
    _id: string;
    title: string;
    description: string;
  }>;
  selectedQuestions: string[];
  setSelectedQuestions: (ids: string[]) => void;
  onAddQuestion?: (newQuestion: {
    title: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
  }) => void;
}) {
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    examples: [{ input: "", output: "", explanation: "" }],
    constraints: [""],
  });

  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!newQuestion.title || !newQuestion.description) {
      setError("Title and description are required.");
      return;
    }

    if (onAddQuestion) {
      onAddQuestion(newQuestion);
      setNewQuestion({
        title: "",
        description: "",
        examples: [{ input: "", output: "", explanation: "" }],
        constraints: [""],
      });
      setError(""); // Clear error after successful addition
    }
  };

  const handleExampleChange = (index: number, field: string, value: string) => {
    const updatedExamples = [...newQuestion.examples];
    updatedExamples[index] = { ...updatedExamples[index], [field]: value };
    setNewQuestion({ ...newQuestion, examples: updatedExamples });
  };

  const addExample = () => {
    setNewQuestion({
      ...newQuestion,
      examples: [...newQuestion.examples, { input: "", output: "", explanation: "" }],
    });
  };

  const removeExample = (index: number) => {
    const updatedExamples = newQuestion.examples.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, examples: updatedExamples });
  };

  const handleConstraintChange = (index: number, value: string) => {
    const updatedConstraints = [...newQuestion.constraints];
    updatedConstraints[index] = value;
    setNewQuestion({ ...newQuestion, constraints: updatedConstraints });
  };

  const addConstraint = () => {
    setNewQuestion({
      ...newQuestion,
      constraints: [...newQuestion.constraints, ""],
    });
  };

  const removeConstraint = (index: number) => {
    const updatedConstraints = newQuestion.constraints.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, constraints: updatedConstraints });
  };

  return (
    <div className="mt-8">
      {/* <h2 className="text-2xl font-bold">Select Questions</h2>
      <div className="grid gap-4 mt-4">
        {questions.map((q) => (
          <div
            key={q._id}
            className={`p-4 border rounded-lg ${
              selectedQuestions.includes(q._id) ? "bg-emerald-100" : "bg-white"
            }`}
            onClick={() =>
              setSelectedQuestions(
                selectedQuestions.includes(q._id)
                  ? selectedQuestions.filter((id) => id !== q._id)
                  : [...selectedQuestions, q._id]
              )
            }
          >
            <h3 className="font-semibold">{q.title}</h3>
            <p className="text-sm text-muted-foreground">{q.description}</p>
          </div>
        ))}
      </div> */}

      {onAddQuestion && (
        <div className="mt-6">
          <h3 className="text-xl font-bold">Add New Question</h3>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            type="text"
            placeholder="Title"
            value={newQuestion.title}
            onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
            className="w-full p-2 border rounded mt-2"
          />
          <textarea
            placeholder="Description"
            value={newQuestion.description}
            onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
            className="w-full p-2 border rounded mt-2"
          />

          {/* Examples Section */}
          <h4 className="text-lg font-semibold mt-4">Examples</h4>
          {newQuestion.examples.map((example, index) => (
            <div key={index} className="mt-2 border p-2 rounded">
              <input
                type="text"
                placeholder="Input"
                value={example.input}
                onChange={(e) => handleExampleChange(index, "input", e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
              <input
                type="text"
                placeholder="Output"
                value={example.output}
                onChange={(e) => handleExampleChange(index, "output", e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
              <textarea
                placeholder="Explanation (optional)"
                value={example.explanation}
                onChange={(e) => handleExampleChange(index, "explanation", e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
              <button
                onClick={() => removeExample(index)}
                className="mt-2 text-red-500 text-sm"
              >
                Remove Example
              </button>
            </div>
          ))}
          <button
            onClick={addExample}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Example
          </button>

          {/* Constraints Section */}
          <h4 className="text-lg font-semibold mt-4">Constraints</h4>
          {newQuestion.constraints.map((constraint, index) => (
            <div key={index} className="mt-2 flex items-center">
              <input
                type="text"
                placeholder="Constraint"
                value={constraint}
                onChange={(e) => handleConstraintChange(index, e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={() => removeConstraint(index)}
                className="ml-2 text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addConstraint}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Constraint
          </button>

          <button
            onClick={handleAdd}
            className="mt-4 bg-emerald-500 text-white px-4 py-2 rounded"
          >
            Add Question
          </button>
        </div>
      )}
    </div>
  );
}