// Test script to verify Supabase connection
// Run in browser console after setting up .env.local

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  const participantId = 'test_' + Date.now();
  let sessionId = null;

  try {
    // Test 1: Create Participant
    console.log('1️⃣ Creating participant...');
    const participantRes = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: participantId,
        assigned_group: 1,
        consent: true,
        email: 'test@example.com',
      })
    });
    const participantData = await participantRes.json();
    console.log('✅ Participant created:', participantData.data);

    // Test 2: Create Session
    console.log('\n2️⃣ Creating session...');
    const sessionRes = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: participantId,
        total_questions: 40,
        assignment_json: ['ff_001_pos', 'bd_002_neg'],
        category_map: { 'ff_001_pos': 'ff', 'bd_002_neg': 'bd' }
      })
    });
    const sessionData = await sessionRes.json();
    sessionId = sessionData.data.id;
    console.log('✅ Session created:', sessionData.data);

    // Test 3: Save Response
    console.log('\n3️⃣ Saving response...');
    const responseRes = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: participantId,
        session_id: sessionId,
        question_id: 'ff_001_pos',
        category: 'ff',
        answer: 'positive',
        is_correct: true,
        reaction_time: 2.5,
        question_number: 1,
      })
    });
    const responseData = await responseRes.json();
    console.log('✅ Response saved:', responseData.data);

    // Test 4: Retrieve Participant
    console.log('\n4️⃣ Retrieving participant...');
    const getParticipantRes = await fetch(`/api/participants?participant_id=${participantId}`);
    const getParticipantData = await getParticipantRes.json();
    console.log('✅ Participant retrieved:', getParticipantData.data);

    // Test 5: Retrieve Session
    console.log('\n5️⃣ Retrieving session...');
    const getSessionRes = await fetch(`/api/sessions?participant_id=${participantId}`);
    const getSessionData = await getSessionRes.json();
    console.log('✅ Session retrieved:', getSessionData.data);

    console.log('\n✨ All tests passed! Supabase is connected and working!\n');
    console.log('📊 Summary:');
    console.log(`   Participant ID: ${participantId}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log('\n💡 Check Supabase Dashboard → Table Editor to see your data!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check .env.local has correct Supabase credentials');
    console.log('   2. Verify all tables are created in Supabase');
    console.log('   3. Check browser console for detailed errors');
    console.log('   4. Restart dev server after creating .env.local');
  }
}

// Run the test
testSupabaseConnection();
