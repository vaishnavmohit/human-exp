import { BongardRawItem, QuizQuestion } from "../types";

export async function loadQuiz(): Promise<QuizQuestion[]> {
  const res = await fetch(
    "/metadata/test_bd_balanced_500_with_desc.json",
    { cache: "no-store" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to load quiz metadata");
  }
  
  const raw: BongardRawItem[] = await res.json();
  console.log("json response from loadQuiz, file name is test_bd_balanced_500_with_desc.json", raw)

  return raw.map(bongardToQuizQuestion);
}


export function bongardToQuizQuestion(
  item: BongardRawItem
): QuizQuestion {
  // console.log("item from for test files images", (item.images.testfiles))
  // console.log("other files that are okay", item.images.pos)
  return {
    id: item.test_id,
    concept: item.concept_ui,
    positiveImages: item.images.pos.map(toPublicImagePath),
    negativeImages: item.images.neg.map(toPublicImagePath),
    queryImage: toPublicImagePath(item.images.testfiles),
  };
}


// lib/utils/paths.ts
export function toPublicImagePath(path: string) {
    return `/ShapeBongard/${path}`;
  }
  