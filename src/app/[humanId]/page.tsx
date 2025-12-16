"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadQuiz } from "@/lib/load-quiz";
import { QuizQuestion } from "@/lib/types"

import { QuizHeader } from "@/components/quiz/QuizHeader";
import { ExampleCard } from "@/components/quiz/ExampleCard";
import { QueryCard } from "@/components/quiz/QueryCard";
import { SubmitDialog } from "@/components/quiz/SubmitDialog";
import { ProgressFooter } from "@/components/quiz/ProgressFooter";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
  const { humanId } = useParams();

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    loadQuiz().then(setQuiz).catch(console.error);
  }, []);

  if (!quiz.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading quiz…
      </div>
    );
  }

  const question = quiz[index];

  const handleSubmit = async (answer: "positive" | "negative") => {
    setShowDialog(false);

    setIndex((i) => i + 1);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-50">
      <QuizHeader concept={question.concept} pid={humanId as string} />

      <main className="flex-1 overflow-auto p-6 space-y-6 h-full">
        <div className="grid grid-cols-2 gap-6">
          <ExampleCard
            title="Positive Examples"
            images={question.positiveImages}
          />
          <ExampleCard
            title="Negative Examples"
            images={question.negativeImages}
          />
        </div>

        <QueryCard src={question.queryImage} />

        <Button onClick={() => setShowDialog(true)}>
          Submit Response
        </Button>
      </main>


      <SubmitDialog open={showDialog} onSelect={handleSubmit} />
      <ProgressFooter current={index + 1} total={quiz.length} />
    </div>
  );
}
