"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { QUIZ } from "@/lib/quiz-data";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { ExampleCard } from "@/components/quiz/ExampleCard";
import { QueryCard } from "@/components/quiz/QueryCard";
import { SubmitDialog } from "@/components/quiz/SubmitDialog";
import { ProgressFooter } from "@/components/quiz/ProgressFooter";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
  const { humanId } = useParams();
  const [index, setIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  const question = QUIZ[index];

  const handleSubmit = async (answer: "positive" | "negative") => {
    setShowDialog(false);

    await fetch("/api/responses", {
      method: "POST",
      body: JSON.stringify({
        human_id: humanId,
        question_id: question.id,
        answer,
      }),
    });

    setIndex((i) => i + 1);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-50">
      <QuizHeader concept={question.concept} pid={humanId as string} />

      <main className="flex-1 overflow-auto p-6 space-y-6">
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

        <div className="text-sm text-muted-foreground">
          Based on the positive and negative examples above, decide which class
          the query belongs to.
        </div>

        <Button onClick={() => setShowDialog(true)}>
          Submit Response
        </Button>
      </main>

      <ProgressFooter current={index + 1} total={QUIZ.length} />

      <SubmitDialog open={showDialog} onSelect={handleSubmit} />
    </div>
  );
}
