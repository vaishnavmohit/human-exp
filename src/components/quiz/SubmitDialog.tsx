// components/quiz/SubmitDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SubmitDialog({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (value: "positive" | "negative") => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose classification</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <Button onClick={() => onSelect("positive")} className="flex-1">
            Positive
          </Button>
          <Button
            onClick={() => onSelect("negative")}
            variant="outline"
            className="flex-1"
          >
            Negative
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
