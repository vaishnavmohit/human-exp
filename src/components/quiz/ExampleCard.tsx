// components/quiz/ExampleCard.tsx
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ExampleCard({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  return (
    <Card className="flex-1 gap-2">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-3 gap-4">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square border rounded bg-white"
          >
            {/* Using img tag for better compatibility with local files */}
            <img
              src={src}
              alt={`${title} ${i + 1}`}
              className="object-contain p-2 w-full h-full"
              onError={(e) => {
                console.error(`Failed to load image: ${src}`);
                (e.target as HTMLImageElement).src = '/file.svg'; // fallback
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
