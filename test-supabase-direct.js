#!/usr/bin/env node

/**
 * Direct Supabase Database Test
 * Tests database connection and operations without requiring dev server
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Direct Supabase Database Test\n');
console.log('=' .repeat(60));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('   Check .env.local file has:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Supabase URL:', SUPABASE_URL);
console.log('✅ Using Key:', SUPABASE_KEY ? 'Configured' : 'Missing');
console.log('=' .repeat(60) + '\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDatabase() {
  const testId = `test_${Date.now()}`;
  let sessionId = null;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Check tables exist
    console.log('1️⃣  Checking if tables exist...');
    const tables = ['participants', 'sessions', 'responses', 'invites'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log(`   ❌ Table '${table}' error:`, error.message);
        testsFailed++;
      } else {
        console.log(`   ✅ Table '${table}' exists`);
        testsPassed++;
      }
    }
    console.log('');

    // Test 2: Insert Participant
    console.log('2️⃣  Testing Participant Creation...');
    const { data: participant, error: partError } = await supabase
      .from('participants')
      .insert({
        participant_id: testId,
        assigned_group: 1,
        consent: true,
        email: 'test@example.com',
        n_per_category: 10
      })
      .select()
      .single();

    if (partError) {
      console.log('   ❌ Failed:', partError.message);
      testsFailed++;
    } else {
      console.log('   ✅ Participant created:', participant.participant_id);
      testsPassed++;
    }
    console.log('');

    // Test 3: Create Session
    console.log('3️⃣  Testing Session Creation...');
    const { data: session, error: sessError } = await supabase
      .from('sessions')
      .insert({
        participant_id: testId,
        total_questions: 40,
        assignment_json: ['ff_001_pos', 'bd_002_neg'],
        category_map: { 'ff_001_pos': 'ff', 'bd_002_neg': 'bd' },
        current_index: 0,
        completed: false
      })
      .select()
      .single();

    if (sessError) {
      console.log('   ❌ Failed:', sessError.message);
      testsFailed++;
    } else {
      sessionId = session.id;
      console.log('   ✅ Session created:', sessionId);
      testsPassed++;
    }
    console.log('');

    // Test 4: Insert Response
    if (sessionId) {
      console.log('4️⃣  Testing Response Insertion...');
      const { data: response, error: respError } = await supabase
        .from('responses')
        .insert({
          participant_id: testId,
          session_id: sessionId,
          question_id: 'ff_001_pos',
          category: 'ff',
          answer: 'positive',
          is_correct: true,
          reaction_time: 2.5,
          question_number: 1
        })
        .select()
        .single();

      if (respError) {
        console.log('   ❌ Failed:', respError.message);
        testsFailed++;
      } else {
        console.log('   ✅ Response saved:', response.question_id);
        console.log('      Answer:', response.answer);
        console.log('      Correct:', response.is_correct);
        console.log('      Time:', response.reaction_time, 's');
        testsPassed++;
      }
      console.log('');
    }

    // Test 5: Query Responses
    console.log('5️⃣  Testing Response Retrieval...');
    const { data: responses, error: queryError } = await supabase
      .from('responses')
      .select('*')
      .eq('participant_id', testId);

    if (queryError) {
      console.log('   ❌ Failed:', queryError.message);
      testsFailed++;
    } else {
      console.log(`   ✅ Retrieved ${responses.length} response(s)`);
      testsPassed++;
    }
    console.log('');

    // Test 6: Check RLS Policies
    console.log('6️⃣  Testing Row Level Security...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('responses')
      .select('*')
      .limit(5);

    if (rlsError) {
      console.log('   ⚠️  RLS might be blocking access:', rlsError.message);
      console.log('   💡 Consider disabling RLS or adding policies for public access');
    } else {
      console.log(`   ✅ Can read responses (found ${rlsTest.length})`);
    }
    console.log('');

    // Cleanup
    console.log('7️⃣  Cleaning up test data...');
    await supabase.from('responses').delete().eq('participant_id', testId);
    await supabase.from('sessions').delete().eq('participant_id', testId);
    await supabase.from('participants').delete().eq('participant_id', testId);
    console.log('   ✅ Test data removed\n');

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED!\n');
      console.log('✨ Supabase Integration Status:');
      console.log('   ✅ Database connection working');
      console.log('   ✅ All tables accessible');
      console.log('   ✅ Insert operations working');
      console.log('   ✅ Query operations working');
      console.log('   ✅ Response submission functional\n');
      console.log('📋 Next Steps:');
      console.log('   1. Start dev server: npm run dev');
      console.log('   2. Test UI: http://localhost:3000/test_user?group=1');
      console.log('   3. Check responses in Supabase dashboard\n');
    } else {
      console.log('⚠️  SOME TESTS FAILED\n');
      console.log('🔍 Common Issues:');
      console.log('   - Tables not created in Supabase');
      console.log('   - RLS policies blocking access');
      console.log('   - Incorrect environment variables');
      console.log('   - Network connectivity issues\n');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify .env.local has correct Supabase credentials');
    console.error('   2. Check if tables exist in Supabase dashboard');
    console.error('   3. Review RLS policies');
    console.error('   4. Check network connection\n');
  }
}

testDatabase().catch(console.error);
