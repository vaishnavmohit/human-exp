// components/quiz/QueryCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QueryCard({ src }: { src: string }) {
  return (
    <Card className="gap-2 flex-1 w-full">
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
        <div className="relative w-64 h-64 border rounded bg-white flex items-center justify-center">
          <img 
            src={src} 
            alt="query" 
            className="object-contain p-4 max-w-full max-h-full" 
            onError={(e) => {
              console.error(`Failed to load query image: ${src}`);
              (e.target as HTMLImageElement).src = '/file.svg';
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
