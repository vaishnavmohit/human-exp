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
  
  // Group will be auto-detected from participant record or use URL param as fallback
  const urlGroup = searchParams.get('group') ? parseInt(searchParams.get('group')!, 10) : null;

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResumed, setIsResumed] = useState(false);
  const [assignedGroup, setAssignedGroup] = useState<number | null>(null); // Actual group from DB
  const [participantId, setParticipantId] = useState<string | null>(null); // exact DB participant_id

  // Utility: find next index in `questions` whose question.id is not in answeredSet,
  // starting at startIndex (inclusive). Returns questions.length if none found.
  const getNextUnansweredIndex = (
    questions: QuizQuestion[],
    answeredSet: Set<string>,
    startIndex: number
  ) => {
    for (let i = startIndex; i < questions.length; i++) {
      if (!answeredSet.has(questions[i].id)) return i;
    }
    return questions.length;
  };

  useEffect(() => {
    const initializeQuiz = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // STEP 1: Check if participant exists and get their assigned group
        console.log('🔍 Checking participant registration...');
        const participantCheckRes = await fetch(`/api/participants?participant_id=${encodeURIComponent(humanId as string)}`);
        
        let detectedGroup: number | null = null;
        let participantExists = false;
        let dbParticipantId: string | null = null; // Use exact participant_id from DB
        
        if (participantCheckRes.ok) {
          const participantData = await participantCheckRes.json();
          if (participantData.data) {
            participantExists = true;
            detectedGroup = participantData.data.assigned_group;
            dbParticipantId = participantData.data.participant_id; // Store exact DB value
            console.log(`✅ Participant found with group ${detectedGroup}, id: ${dbParticipantId}`);
            setAssignedGroup(detectedGroup);
            setParticipantId(dbParticipantId);
          }
        }
        
        // If participant doesn't exist, show registration error
        if (!participantExists || !dbParticipantId) {
          setError(
            `Participant "${humanId}" is not registered. Please register first or contact the administrator.`
          );
          setLoading(false);
          return;
        }
        
  // STEP 2: Determine which group to use
  // Priority: Database group > URL group
  const finalGroup = detectedGroup!;
  const effectiveParticipantId = dbParticipantId; // Use exact DB participant_id for all subsequent calls
  // persist effective participant id in state (already set above), but keep local var for clarity
  const pidForApi = effectiveParticipantId;
        
        // If URL has group param and it doesn't match, redirect
        if (urlGroup !== null && urlGroup !== finalGroup) {
          console.warn(
            `⚠️ URL group (${urlGroup}) doesn't match assigned group (${finalGroup}). Redirecting...`
          );
          setError(`Redirecting to your assigned group ${finalGroup}...`);
          setTimeout(() => {
            window.location.href = `/${encodeURIComponent(pidForApi)}?group=${finalGroup}`;
          }, 1500);
          return;
        }
        
        // STEP 3: Load quiz questions for the correct group
  console.log(`📚 Loading quiz for group ${finalGroup}...`);
  const questions = await loadQuiz(pidForApi, finalGroup);
        setQuiz(questions);

        // STEP 4: Check for existing incomplete session (RESUME FUNCTIONALITY)
  console.log('🔍 Checking for incomplete session...');
  const checkSessionRes = await fetch(`/api/sessions/resume?participant_id=${encodeURIComponent(pidForApi)}`);
        
        let resumedSession = null;
        if (checkSessionRes.ok) {
          const checkData = await checkSessionRes.json();
          if (checkData.data && !checkData.data.completed) {
            resumedSession = checkData.data;
            console.log('🔄 Found incomplete session - resuming...', resumedSession.id);
          }
        }

        let currentSessionId = null;

        if (resumedSession) {
          // Verify session's assigned_group matches
          if (resumedSession.assigned_group && resumedSession.assigned_group !== finalGroup) {
            console.error(
              `❌ Session group mismatch: Expected ${finalGroup}, ` +
              `but session has ${resumedSession.assigned_group}`
            );
            setError('Session group mismatch. Please contact administrator.');
            return;
          }
          
          // Resume existing session
          currentSessionId = resumedSession.id;
          setSessionId(currentSessionId);
          setIsResumed(true);
          
          // Get responses for this session to determine progress
          const responsesRes = await fetch(`/api/sessions/${currentSessionId}/responses`);
          if (responsesRes.ok) {
            const responsesData = await responsesRes.json();
            const responses = responsesData.data || [];
            // Build a set of answered question IDs
            const answeredSet = new Set<string>(responses.map((r: any) => r.question_id));

            // Find the next unanswered index in the randomized questions list
            const nextIndex = getNextUnansweredIndex(questions, answeredSet, 0);
            setIndex(nextIndex);
            console.log(`✅ Resuming from question ${nextIndex + 1}/${questions.length}`);

            // Update session's current_index to the computed nextIndex
            await fetch(`/api/sessions/${currentSessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ current_index: nextIndex })
            });
          }
        } else {
          // Create new session using exact participant_id from database
          const questionIds = questions.map(q => q.id);
          const categoryMap = questions.reduce((acc, q) => {
            acc[q.id] = q.category;
            return acc;
          }, {} as Record<string, string>);

          const sessionRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_id: pidForApi, // use local variable derived from DB
              assigned_group: finalGroup,
              total_questions: questions.length,
              assignment_json: questionIds,
              category_map: categoryMap,
            })
          });

          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            currentSessionId = sessionData.data.id;
            setSessionId(currentSessionId);
            console.log('✅ New session created:', currentSessionId);
          } else {
            const errorText = await sessionRes.text();
            console.error('Failed to create session:', errorText);
            throw new Error(`Failed to create session: ${errorText}`);
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize quiz:', err);
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [humanId, urlGroup]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg">Loading quiz…</div>
        <div className="text-sm text-gray-500">
          Participant: {humanId}
          {assignedGroup && ` | Group: ${assignedGroup}`}
        </div>
        {isResumed && (
          <div className="text-sm text-blue-600 font-medium">
            🔄 Resuming previous session...
          </div>
        )}
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
    if (sessionId && assignedGroup) {
      try {
        const response = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_id: participantId || humanId,
            session_id: sessionId,
            question_id: question.id,
            category: question.category,
            assigned_group: assignedGroup,
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

        // Update session progress.
        // Compute the next unanswered index using responses fetched from server.
        let finalIndex = index + 1; // default fallback
        try {
          const resList = await fetch(`/api/sessions/${sessionId}/responses`);
          let answeredSet = new Set<string>();
          if (resList.ok) {
            const resJson = await resList.json();
            const resData = resJson.data || [];
            answeredSet = new Set<string>(resData.map((r: any) => r.question_id));
          }

          // Find next unanswered question after the current index
          const nextIndex = getNextUnansweredIndex(quiz, answeredSet, index + 1);
          finalIndex = nextIndex;

          // Update session with new current_index and progress computed from finalIndex
          await fetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              current_index: finalIndex,
              progress: Math.round((finalIndex / quiz.length) * 100)
            })
          });

          // Move UI to the computed next index
          setIndex(finalIndex);
        } catch (e) {
          // Fallback: simple increment if something goes wrong
          finalIndex = index + 1;
          await fetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              current_index: finalIndex,
              progress: Math.round((finalIndex / quiz.length) * 100)
            })
          });
          setIndex(finalIndex);
        }

        // Check if this was the last question
        if (finalIndex >= quiz.length) {
          console.log('🎉 Quiz completed - marking session as complete');
          await fetch(`/api/sessions/${sessionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (err) {
        console.error('Error saving response:', err);
      }
    } else {
      console.warn('⚠️ No session ID - response not saved');
    }

    // For cases where there's no session to persist to, still advance UI by one
    if (!sessionId) {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-50">
      <QuizHeader 
        concept={question.concept} 
        pid={(participantId || humanId) as string} 
        group={assignedGroup || 1} 
      />

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
