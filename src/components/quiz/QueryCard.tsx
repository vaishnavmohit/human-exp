// components/quiz/QueryCard.tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QueryCard({ src }: { src: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Query</CardTitle>
      </CardHeader>

      <CardContent className="flex justify-center">
        <div className="relative w-64 h-64 border rounded bg-white">
          <Image src={src} alt="query" fill className="object-contain p-4" />
        </div>
      </CardContent>
    </Card>
  );
}
