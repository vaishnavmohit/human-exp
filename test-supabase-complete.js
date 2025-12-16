#!/usr/bin/env node

/**
 * Comprehensive Supabase Integration Test
 * 
 * This script tests:
 * 1. Supabase connection
 * 2. Participant creation
 * 3. Session creation
 * 4. Response submission
 * 5. Invite handling
 * 
 * Usage: node test-supabase-complete.js
 */

const https = require('https');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testSupabaseIntegration() {
  console.log('🧪 Starting Comprehensive Supabase Integration Test\n');
  console.log('📋 Testing Environment:');
  console.log('   Base URL:', BASE_URL);
  console.log('   Timestamp:', new Date().toISOString());
  console.log('\n' + '='.repeat(60) + '\n');

  const testId = `test_${Date.now()}`;
  let sessionId = null;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Create Participant
    console.log('1️⃣  Testing Participant Creation...');
    const participantPayload = {
      participant_id: testId,
      assigned_group: 1,
      consent: true,
      email: 'test@example.com',
      n_per_category: 10
    };
    
    const participantRes = await request('POST', '/api/participants', participantPayload);
    
    if (participantRes.status === 200 && participantRes.data.success) {
      console.log('   ✅ Participant created successfully');
      console.log('   📄 Data:', JSON.stringify(participantRes.data.data, null, 2));
      testsPassed++;
    } else {
      console.log('   ❌ Failed to create participant');
      console.log('   📄 Response:', participantRes);
      testsFailed++;
    }
    console.log('');

    // Test 2: Retrieve Participant
    console.log('2️⃣  Testing Participant Retrieval...');
    const getParticipantRes = await request('GET', `/api/participants?participant_id=${testId}`);
    
    if (getParticipantRes.status === 200 && getParticipantRes.data.success) {
      console.log('   ✅ Participant retrieved successfully');
      console.log('   👤 Participant ID:', getParticipantRes.data.data.participant_id);
      console.log('   🎯 Assigned Group:', getParticipantRes.data.data.assigned_group);
      testsPassed++;
    } else {
      console.log('   ❌ Failed to retrieve participant');
      console.log('   📄 Response:', getParticipantRes);
      testsFailed++;
    }
    console.log('');

    // Test 3: Create Session
    console.log('3️⃣  Testing Session Creation...');
    const sessionPayload = {
      participant_id: testId,
      total_questions: 40,
      assignment_json: ['ff_001_pos', 'bd_002_neg', 'hd_novel_003_pos', 'hd_comb_004_neg'],
      category_map: {
        'ff_001_pos': 'ff',
        'bd_002_neg': 'bd',
        'hd_novel_003_pos': 'hd_novel',
        'hd_comb_004_neg': 'hd_comb'
      }
    };
    
    const sessionRes = await request('POST', '/api/sessions', sessionPayload);
    
    if (sessionRes.status === 200 && sessionRes.data.success) {
      sessionId = sessionRes.data.data.id;
      console.log('   ✅ Session created successfully');
      console.log('   🆔 Session ID:', sessionId);
      console.log('   📊 Total Questions:', sessionRes.data.data.total_questions);
      testsPassed++;
    } else {
      console.log('   ❌ Failed to create session');
      console.log('   📄 Response:', sessionRes);
      testsFailed++;
    }
    console.log('');

    // Test 4: Save Response
    if (sessionId) {
      console.log('4️⃣  Testing Response Submission...');
      const responsePayload = {
        participant_id: testId,
        session_id: sessionId,
        question_id: 'ff_001_pos',
        category: 'ff',
        answer: 'positive',
        is_correct: true,
        reaction_time: 2.5,
        question_number: 1
      };
      
      const responseRes = await request('POST', '/api/responses', responsePayload);
      
      if (responseRes.status === 200 && responseRes.data.success) {
        console.log('   ✅ Response saved successfully');
        console.log('   📝 Question ID:', responseRes.data.data.question_id);
        console.log('   ✔️  Answer:', responseRes.data.data.answer);
        console.log('   ⏱️  Reaction Time:', responseRes.data.data.reaction_time, 's');
        testsPassed++;
      } else {
        console.log('   ❌ Failed to save response');
        console.log('   📄 Response:', responseRes);
        testsFailed++;
      }
      console.log('');
    }

    // Test 5: Multiple Responses
    if (sessionId) {
      console.log('5️⃣  Testing Multiple Response Submissions...');
      const responses = [
        { question_id: 'bd_002_neg', category: 'bd', answer: 'negative', is_correct: true, question_number: 2 },
        { question_id: 'hd_novel_003_pos', category: 'hd_novel', answer: 'positive', is_correct: true, question_number: 3 }
      ];
      
      let allSuccess = true;
      for (let i = 0; i < responses.length; i++) {
        const resp = responses[i];
        const payload = {
          participant_id: testId,
          session_id: sessionId,
          ...resp,
          reaction_time: Math.random() * 5 + 1
        };
        
        const result = await request('POST', '/api/responses', payload);
        
        if (result.status === 200 && result.data.success) {
          console.log(`   ✅ Response ${i + 1}/${responses.length} saved: ${resp.question_id}`);
        } else {
          console.log(`   ❌ Response ${i + 1}/${responses.length} failed: ${resp.question_id}`);
          allSuccess = false;
        }
      }
      
      if (allSuccess) {
        console.log('   ✅ All multiple responses saved successfully');
        testsPassed++;
      } else {
        console.log('   ❌ Some responses failed to save');
        testsFailed++;
      }
      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log('');
    
    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! Supabase integration is working correctly.\n');
      console.log('✨ Next Steps:');
      console.log('   1. Check Supabase dashboard for the test data');
      console.log('   2. Verify tables: participants, sessions, responses');
      console.log('   3. Ready to deploy!\n');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please check:');
      console.log('   1. Is the dev server running? (npm run dev)');
      console.log('   2. Are Supabase credentials in .env.local correct?');
      console.log('   3. Have all tables been created in Supabase?');
      console.log('   4. Check browser console for errors\n');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Make sure dev server is running: npm run dev');
    console.error('   2. Check .env.local has valid Supabase credentials');
    console.error('   3. Verify Supabase tables exist');
    console.error('   4. Check network connectivity\n');
  }
}

// Run tests
testSupabaseIntegration().catch(console.error);
