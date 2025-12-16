// components/quiz/QuizHeader.tsx
"use client";

export function QuizHeader({
  concept,
  pid,
}: {
  concept: string;
  pid: string;
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div className="font-semibold text-lg">Human Experiment</div>

      <div className="text-sm text-muted-foreground">
        Concept: <span className="font-medium text-black">{concept}</span>
      </div>

      <div className="text-sm font-mono bg-zinc-100 px-3 py-1 rounded">
        {pid}
      </div>
    </header>
  );
}
