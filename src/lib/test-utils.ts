/**
 * Configuration Testing Utility
 * 
 * This file helps test different configuration scenarios
 * Run in browser console or create test page
 */

import { loadQuiz } from './load-quiz';
import { loadConfig } from './config';

/**
 * Test function to verify question loading with different configs
 */
export async function testQuizLoading() {
  console.group('🧪 Quiz Loading Test');
  
  try {
    const config = await loadConfig();
    //console.log('📋 Config loaded:', config);
    
    // Test with a few different participant IDs
    const testIds = ['test_001', 'test_002', 'test_003'];
    
    for (const humanId of testIds) {
      console.group(`👤 Testing participant: ${humanId}`);
      
      // Test Group 1
      const quiz1 = await loadQuiz(humanId, 1);
      //console.log(`Group 1: ${quiz1.length} questions`);
      //console.log('First question:', quiz1[0]);
      
      // Test Group 4
      const quiz4 = await loadQuiz(humanId, 4);
      //console.log(`Group 4: ${quiz4.length} questions`);
      //console.log('Concept shown:', quiz4[0].concept ? 'Yes' : 'No');
      
      // Check category distribution
      const categoryCount = quiz1.reduce((acc, q) => {
        acc[q.category] = (acc[q.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      //console.log('Category distribution:', categoryCount);
      
      console.groupEnd();
    }
    
    // Test deterministic behavior
    if (!config.randomize_assignment) {
      console.group('🔒 Testing Deterministic Assignment');
      
      const quiz1a = await loadQuiz('same_id', 1);
      const quiz1b = await loadQuiz('same_id', 1);
      
      const areIdentical = quiz1a.every((q, i) => q.id === quiz1b[i].id);
      
      //console.log('Same humanId gets identical questions:', areIdentical ? '✅ YES' : '❌ NO');
      
      console.groupEnd();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Analyze question distribution across categories
 */
export async function analyzeDistribution(humanId: string, group: number = 1) {
  console.group(`📊 Distribution Analysis: ${humanId}`);
  
  const quiz = await loadQuiz(humanId, group);
  
  // Category counts
  const byCat = quiz.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.table(byCat);
  
  // Question order (first 10)
  //console.log('First 10 questions:');
  quiz.slice(0, 10).forEach((q, i) => {
    //console.log(`${i + 1}. [${q.category.toUpperCase()}] ${q.id}`);
  });
  
  console.groupEnd();
  
  return byCat;
}

/**
 * Compare two participants to check for overlap
 */
export async function compareParticipants(id1: string, id2: string, group: number = 1) {
  console.group(`🔍 Comparing ${id1} vs ${id2}`);
  
  const quiz1 = await loadQuiz(id1, group);
  const quiz2 = await loadQuiz(id2, group);
  
  const set1 = new Set(quiz1.map(q => q.id));
  const set2 = new Set(quiz2.map(q => q.id));
  
  const overlap = quiz1.filter(q => set2.has(q.id));
  const overlapPct = (overlap.length / quiz1.length) * 100;
  
  //console.log(`Total questions P1: ${quiz1.length}`);
  //console.log(`Total questions P2: ${quiz2.length}`);
  //console.log(`Overlap: ${overlap.length} questions (${overlapPct.toFixed(1)}%)`);
  
  // Check if order is identical
  const sameOrder = quiz1.every((q, i) => q.id === quiz2[i]?.id);
  //console.log(`Same order: ${sameOrder ? 'Yes' : 'No'}`);
  
  console.groupEnd();
  
  return {
    overlap: overlap.length,
    overlapPct,
    sameOrder
  };
}

/**
 * Validate configuration
 */
export async function validateConfig() {
  console.group('✅ Configuration Validation');
  
  try {
    const config = await loadConfig();
    
    // Check required fields
    const requiredFields = [
      'n_per_category',
      'randomize_assignment',
      'shuffle_categories',
      'metadata_files',
      'category_order',
      'supported_groups'
    ];
    
    const missing = requiredFields.filter(field => !(field in config));
    
    if (missing.length > 0) {
      console.error('❌ Missing fields:', missing);
    } else {
      //console.log('✅ All required fields present');
    }
    
    // Check metadata files exist
    console.group('Checking metadata files...');
    for (const [cat, path] of Object.entries(config.metadata_files)) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          const data = await res.json();
          //console.log(`✅ ${cat}: ${data.length} items`);
        } else {
          console.error(`❌ ${cat}: Failed to load (${res.status})`);
        }
      } catch (err) {
        console.error(`❌ ${cat}: ${err}`);
      }
    }
    console.groupEnd();
    
    // Validate ranges
    if (config.n_per_category < 1) {
      console.warn('⚠️  n_per_category should be >= 1');
    }
    
    if (config.supported_groups.length === 0) {
      console.warn('⚠️  No supported groups defined');
    }
    
    //console.log('✅ Configuration validation complete');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
  
  console.groupEnd();
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).quizTest = {
    testQuizLoading,
    analyzeDistribution,
    compareParticipants,
    validateConfig
  };
  
  //console.log('🧪 Quiz testing utilities loaded. Use:');
  //console.log('  quizTest.testQuizLoading()');
  //console.log('  quizTest.analyzeDistribution("participant_001")');
  //console.log('  quizTest.compareParticipants("p1", "p2")');
  //console.log('  quizTest.validateConfig()');
}
