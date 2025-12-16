// lib/types/bongard.ts
export type BongardRawItem = {
    test_id: string;
    uid: string;
    concept: string;
    concept_ui: string;
    category?: string;
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
    category: string;
    positiveImages: string[];
    negativeImages: string[];
    queryImage: string;
  };

  // lib/types/config.ts
export type AppConfig = {
    n_per_category: number;
    randomize_assignment: boolean;
    shuffle_categories: boolean;
    metadata_files: {
      ff: string;
      bd: string;
      hd_novel: string;
      hd_comb: string;
    };
    category_order: string[];
    supported_groups: number[];
    image_base_path: string;
  };
  