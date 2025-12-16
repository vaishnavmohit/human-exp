"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  
  // Get group from URL params (default to 1 if not specified)
  const group = parseInt(searchParams.get('group') || '1', 10);

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeQuiz = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load quiz questions
        const questions = await loadQuiz(humanId as string, group);
        setQuiz(questions);

        // Create participant and session in Supabase
        try {
          // 1. Create/update participant
          const participantRes = await fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_id: humanId,
              assigned_group: group,
              consent: true,
            })
          });

          if (!participantRes.ok) {
            console.warn('Failed to create participant:', await participantRes.text());
          }

          // 2. Create session with question assignment
          const questionIds = questions.map(q => q.id);
          const categoryMap = questions.reduce((acc, q) => {
            acc[q.id] = q.category;
            return acc;
          }, {} as Record<string, string>);

          const sessionRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_id: humanId,
              total_questions: questions.length,
              assignment_json: questionIds,
              category_map: categoryMap,
            })
          });

          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            setSessionId(sessionData.data.id);
            console.log('✅ Session created:', sessionData.data.id);
          } else {
            console.warn('Failed to create session:', await sessionRes.text());
          }
        } catch (dbError) {
          console.warn('Supabase setup incomplete - responses will not be saved:', dbError);
        }
      } catch (err: any) {
        console.error('Failed to load quiz:', err);
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [humanId, group]);

  // Reset question start time when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [index]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg">Loading quiz…</div>
        <div className="text-sm text-gray-500">
          Participant: {humanId} | Group: {group}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-red-600">Error loading quiz</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  if (!quiz.length) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg">No questions available</div>
        <div className="text-sm text-gray-500">
          Please check your configuration
        </div>
      </div>
    );
  }

  // Check if quiz completed
  if (index >= quiz.length) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-2xl font-bold">Quiz Completed! 🎉</div>
        <div className="text-lg text-gray-600">
          You answered {quiz.length} questions
        </div>
        <div className="text-sm text-gray-500">
          Thank you for participating!
        </div>
      </div>
    );
  }

  const question = quiz[index];

  const handleSubmit = async (answer: "positive" | "negative") => {
    setShowDialog(false);

    // Calculate reaction time in seconds
    const reactionTime = (Date.now() - questionStartTime) / 1000;

    // Determine if answer is correct
    const isCorrect = 
      (answer === "positive" && question.id.endsWith("_pos")) ||
      (answer === "negative" && question.id.endsWith("_neg"));

    // Save response to Supabase (only if session exists)
    if (sessionId) {
      try {
        const response = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_id: humanId,
            session_id: sessionId,
            question_id: question.id,
            category: question.category,
            answer,
            is_correct: isCorrect,
            reaction_time: reactionTime,
            question_number: index + 1,
          })
        });

        if (!response.ok) {
          console.error('Failed to save response:', await response.text());
        } else {
          console.log('✅ Response saved:', question.id);
        }
      } catch (err) {
        console.error('Error saving response:', err);
      }
    } else {
      console.warn('⚠️ No session ID - response not saved');
    }

    // Move to next question
    setIndex((i) => i + 1);
  };

  // Debug: Log image paths in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Question:', question.id);
    console.log('Query Image:', question.queryImage);
    console.log('Positive Images:', question.positiveImages.slice(0, 2));
    console.log('Negative Images:', question.negativeImages.slice(0, 2));
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-50">
      <QuizHeader concept={question.concept} pid={humanId as string} group={group} />

      <main className="flex-1 overflow-auto p-6 space-y-6 h-full">
        {/* Debug info - remove in production */}
        {/* <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
          Question: {question.id} | Category: {question.category} | Query: {question.queryImage.slice(-40)}
        </div> */}
        
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
        <div className="flex flex-row gap-4 w-full items-center">

        <QueryCard src={question.queryImage} />

        <Button onClick={() => setShowDialog(true)} className="h-10">
          Submit Response
        </Button>
        </div>

      </main>


      <SubmitDialog open={showDialog} onSelect={handleSubmit} onClose={() => setShowDialog(false)} />
      <ProgressFooter current={index + 1} total={quiz.length} />
    </div>
  );
}
