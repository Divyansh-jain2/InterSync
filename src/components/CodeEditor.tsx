import { useState, useEffect } from "react"; // Import useEffect
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BookIcon, LightbulbIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Button } from "./ui/button";
import { Paintbrush } from "lucide-react";
import WhiteBoard from "./WhiteBoard"; // Import the new WhiteBoard component

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: "/javascript.png" },
  { id: "python", name: "Python", icon: "/python.png" },
  { id: "java", name: "Java", icon: "/java.png" },
  { id: "cpp", name: "C++", icon: "/cpp.png" },
] as const;

type LanguageId = typeof LANGUAGES[number]["id"];

function CodeEditor() {
  const questions = useQuery(api.questions.getQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState(questions?.[0] || null);
  const [language, setLanguage] = useState<LanguageId>(LANGUAGES[0].id);
  const [code, setCode] = useState("// Start coding here...");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  // New state to store whiteboard data
  const [whiteboardData, setWhiteboardData] = useState<string | null>(null);

  useEffect(() => {
    // Set the initial selected question once questions are loaded
    if (questions && !selectedQuestion) {
      setSelectedQuestion(questions[0]);
    }
  }, [questions, selectedQuestion]); // Depend on questions and selectedQuestion

  const handleQuestionChange = (questionId: string) => {
    const question = questions?.find((q) => q._id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setCode("// Start coding here...");
      // Optionally clear whiteboard data when question changes, or keep it.
      // setWhiteboardData(null);
    }
  };

  const handleLanguageChange = (newLanguage: LanguageId) => {
    setLanguage(newLanguage);
    setCode("// Start coding here...");
    // Optionally clear whiteboard data when language changes, or keep it.
    // setWhiteboardData(null);
  };

  if (!questions) {
    return <div>Loading questions...</div>;
  }

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[calc(100vh-4rem-1px)]">
      {/* QUESTION SECTION */}
      <ResizablePanel>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {selectedQuestion?.title || "Select a Question"}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your language and solve the problem
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedQuestion?._id || ""}
                    onValueChange={handleQuestionChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((q) => (
                        <SelectItem key={q._id} value={q._id}>
                          {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <img
                            src={LANGUAGES.find((l) => l.id === language)?.icon}
                            alt={language}
                            className="w-5 h-5 object-contain"
                          />
                          {LANGUAGES.find((l) => l.id === language)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={lang.icon}
                              alt={lang.name}
                              className="w-5 h-5 object-contain"
                            />
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Toggle Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowWhiteboard(!showWhiteboard)}
                    aria-label={showWhiteboard ? "Switch to Code Editor" : "Switch to Whiteboard"}
                  >
                    {showWhiteboard ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> : <Paintbrush className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              {/* PROBLEM DESCRIPTION */}
              {selectedQuestion && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <BookIcon className="h-5 w-5 text-primary/80" />
                    <CardTitle>Problem Description</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-line">{selectedQuestion.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PROBLEM EXAMPLES */}
              {selectedQuestion?.examples && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <LightbulbIcon className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Examples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-full w-full rounded-md border">
                      <div className="p-4 space-y-4">
                        {selectedQuestion.examples.map((example, index) => (
                          <div key={index} className="space-y-2">
                            <p className="font-medium text-sm">Example {index + 1}:</p>
                            <ScrollArea className="h-full w-full rounded-md">
                              <pre className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                                <div>Input: {example.input}</div>
                                <div>Output: {example.output}</div>
                                {example.explanation && (
                                  <div className="pt-2 text-muted-foreground">
                                    Explanation: {example.explanation}
                                  </div>
                                )}
                              </pre>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          </div>
                        ))}
                      </div>
                      <ScrollBar />
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <ScrollBar />
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* CODE EDITOR / WHITEBOARD SECTION */}
      <ResizablePanel defaultSize={60} maxSize={100}>
        <div className="h-full relative">
          {showWhiteboard ? (
            <WhiteBoard
              initialData={whiteboardData}
              onSaveData={setWhiteboardData}
            />
          ) : (
            <Editor
              height={"100%"}
              defaultLanguage={language}
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 18,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                wordWrap: "on",
                wrappingIndent: "indent",
              }}
            />
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default CodeEditor;