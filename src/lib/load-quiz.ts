import { BongardRawItem, QuizQuestion, AppConfig } from "./types";
import { loadConfig, shuffleArray, createSeededRandom } from "./config";

/**
 * Load quiz questions based on config and participant settings
 * @param humanId - Participant ID for deterministic shuffling
 * @param group - Experimental group (1 or 4 for visual mode)
 */
export async function loadQuiz(humanId: string, group: number = 1): Promise<QuizQuestion[]> {
  const config = await loadConfig();
  
  // Validate group
  if (!config.supported_groups.includes(group)) {
    throw new Error(`Group ${group} is not supported. Supported groups: ${config.supported_groups.join(', ')}`);
  }
  
  // Load all categories based on config order
  const allQuestions: QuizQuestion[] = [];
  
  for (const category of config.category_order) {
    const categoryPath = config.metadata_files[category as keyof typeof config.metadata_files];
    
    if (!categoryPath) {
      console.warn(`No metadata file configured for category: ${category}`);
      continue;
    }
    
    try {
      const questions = await loadCategoryQuestions(categoryPath, category, config);
      
      // Sample n questions per category
      const sampled = sampleQuestions(questions, config.n_per_category, humanId, config.randomize_assignment);
      
      allQuestions.push(...sampled);
    } catch (error) {
      console.error(`Failed to load category ${category}:`, error);
    }
  }
  
  // Shuffle between categories if configured
  if (config.shuffle_categories) {
    if (config.randomize_assignment) {
      // True random shuffle
      return shuffleArray(allQuestions);
    } else {
      // Deterministic shuffle based on humanId
      const rng = createSeededRandom(humanId);
      return shuffleArray(allQuestions, rng);
    }
  }
  
  return allQuestions;
}

/**
 * Load questions from a single category metadata file
 */
async function loadCategoryQuestions(
  metadataPath: string,
  category: string,
  config: AppConfig
): Promise<QuizQuestion[]> {
  const res = await fetch(metadataPath, { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error(`Failed to load metadata from ${metadataPath}`);
  }
  
  const raw: BongardRawItem[] = await res.json();
  
  return raw.map(item => bongardToQuizQuestion(item, category, config));
}

/**
 * Sample n questions from a category
 * If randomize_assignment is false, use deterministic sampling based on humanId
 */
function sampleQuestions(
  questions: QuizQuestion[],
  n: number,
  humanId: string,
  randomize: boolean
): QuizQuestion[] {
  const sampleSize = Math.min(n, questions.length);
  
  if (randomize) {
    // True random sampling
    const shuffled = shuffleArray(questions);
    return shuffled.slice(0, sampleSize);
  } else {
    // Deterministic sampling based on humanId
    const rng = createSeededRandom(humanId);
    const shuffled = shuffleArray(questions, rng);
    return shuffled.slice(0, sampleSize);
  }
}

/**
 * Convert raw Bongard item to QuizQuestion format
 */
function bongardToQuizQuestion(
  item: BongardRawItem,
  category: string,
  config: AppConfig
): QuizQuestion {
  const queryImage = toQueryImage(item.test_id, item.images.pos[0]);
  
  return {
    id: item.test_id,
    concept: item.concept_ui || item.concept,
    category: category,
    positiveImages: item.images.pos.map(path => toPublicImagePath(path, config.image_base_path, category)),
    negativeImages: item.images.neg.map(path => toPublicImagePath(path, config.image_base_path, category)),
    queryImage: toPublicImagePath(queryImage, config.image_base_path, category),
  };
}

/**
 * Convert relative path to public URL path
 */
function toPublicImagePath(path: string, basePath: string, category?: string): string {
  // Metadata paths may reference a generic 'hd' category (e.g. "hd/images/...")
  // while in the public folder we have more specific folders like `hd_novel` or `hd_comb`.
  // If a category override is provided and the path starts with 'hd/', rewrite it.
  let adjustedPath = path;

  if (category && (/^\/?hd\//.test(path))) {
    // Replace leading 'hd/' or '/hd/' with the configured category name (e.g. 'hd_novel/')
    adjustedPath = path.replace(/^\/?hd\//, `${category}/`);
  }

  return `${basePath}/${adjustedPath}`;
}

/**
 * Generate query image path based on test_id
 * Query images are always the 7th image (index 6) in the appropriate class folder
 */
const toQueryImage = (test_id: string, positiveImage: string): string => {
  // Determine if this is a negative test (answer is 'neg')
  const isNeg = test_id.includes("_neg");
  const classFolder = isNeg ? "0" : "1";

  // Remove everything after the class folder
  // Example: bd/images/..._0000/1/0.png  →  bd/images/..._0000
  const basePath = positiveImage.split("/").slice(0, -2).join("/");

  // Query image is always the 7th image (6.png)
  const queryImage = `${basePath}/${classFolder}/6.png`;

  return queryImage;
};
