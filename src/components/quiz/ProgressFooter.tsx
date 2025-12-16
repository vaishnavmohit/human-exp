// components/quiz/ProgressFooter.tsx
import { Slider } from "@/components/ui/slider";

export function ProgressFooter({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="border-t bg-white px-6 py-3">
      <Slider value={[(current / total) * 100]} max={100} step={1} disabled />
      <div className="text-xs text-muted-foreground mt-1">
        Progress: {current}/{total}
      </div>
    </div>
  );
}
