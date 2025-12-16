import { BongardRawItem, QuizQuestion } from "./types";

export async function loadQuiz(): Promise<QuizQuestion[]> {
  const res = await fetch(
    "/metadata/test_bd_balanced_500_with_desc.json",
    { cache: "no-store" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to load quiz metadata");
  }
  
  const raw: BongardRawItem[] = await res.json();

  return raw.map(bongardToQuizQuestion);
}


 function bongardToQuizQuestion(
  item: BongardRawItem
): QuizQuestion {
  toQueryImage(item.test_id, item.images.pos[0])
  return {
    id: item.test_id,
    concept: item.concept_ui,
    positiveImages: item.images.pos.map(toPublicImagePath),
    negativeImages: item.images.neg.map(toPublicImagePath),
    queryImage: toPublicImagePath(toQueryImage(item.test_id, item.images.pos[0])),
  };
}

// lib/utils/paths.ts
function toPublicImagePath(path: string) {
  return `/ShapeBongard/${path}`;
}

const toQueryImage = (test_id: string, positiveImage: string) => {
  console.log("test_id from toQueryImage", test_id);
  console.log("positiveImage from toQueryImage", positiveImage);

  // Determine neg / pos
  const isNeg = test_id.includes("_neg");
  const classFolder = isNeg ? "0" : "1";

  // Remove everything after the class folder
  // bd/images/..._0000/1/0.png  →  bd/images/..._0000
  const basePath = positiveImage.split("/").slice(0, -2).join("/");

  // Final image
  const queryImage = `${basePath}/${classFolder}/6.png`;

  return queryImage;
};

  