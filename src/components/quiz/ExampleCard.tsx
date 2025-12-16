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
            <Image
              src={src}
              alt={title}
              fill
              className="object-contain p-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
