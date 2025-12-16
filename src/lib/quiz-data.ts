// lib/quiz-data.ts
export type QuizQuestion = {
    id: number;
    concept: string;
    positiveImages: string[];
    negativeImages: string[];
    queryImage: string;
  };
  
  export const QUIZ: QuizQuestion[] = [
    {
      id: 1,
      concept: "square dagger2 AND exist_triangle_three_lines9",
      positiveImages: [
        "/quiz/q1/pos/1.png",
        "/quiz/q1/pos/2.png",
        "/quiz/q1/pos/3.png",
        "/quiz/q1/pos/4.png",
        "/quiz/q1/pos/5.png",
        "/quiz/q1/pos/6.png",
      ],
      negativeImages: [
        "/quiz/q1/neg/1.png",
        "/quiz/q1/neg/2.png",
        "/quiz/q1/neg/3.png",
        "/quiz/q1/neg/4.png",
        "/quiz/q1/neg/5.png",
        "/quiz/q1/neg/6.png",
      ],
      queryImage: "/quiz/q1/query/query.png",
    },
  ];
  