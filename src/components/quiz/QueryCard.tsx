// components/quiz/QueryCard.tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QueryCard({ src }: { src: string }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="flex gap-1 items-center">
         <span className="text-lg">Query Image - </span>

        <div className="text-sm text-muted-foreground">
          Based on the positive and negative examples above, decide which class
          the query belongs to.
        </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex justify-center">
        <div className="relative w-64 h-64 border rounded bg-white">
          <Image src={src} alt="query" fill className="object-contain p-4" />
        </div>
      </CardContent>
    </Card>
  );
}
