// lib/types/bongard.ts
export type BongardRawItem = {
    test_id: string;
    uid: string;
    concept: string;
    concept_ui: string;
    images: {
      neg: string[];
      pos: string[];
      testfiles: string;
    };
  };
  

  // lib/types/quiz.ts
export type QuizQuestion = {
    id: string;
    concept: string;
    positiveImages: string[];
    negativeImages: string[];
    queryImage: string;
  };
  