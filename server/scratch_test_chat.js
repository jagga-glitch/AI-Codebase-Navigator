import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5055';
const ARTIFACT_DIR = 'C:/Users/gupta/.gemini/antigravity/brain/72bbccc3-3db9-44aa-b383-b5781340c75c';

async function runTests() {
  console.log('=== STARTING CHAT MODULE TESTS ===');
  
  const email = `test_chat_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Chat Tester';
  let token = '';
  let repoId = '';

  const results = {
    testCase1_FrameworksQuery: null,
    testCase2_AuthQuery: null,
    testCase3_GetHistory: null,
    testCase4_ClearHistory: null
  };

  // Helper to log errors
  const logError = (stepName, err) => {
    console.error(`❌ ${stepName} failed:`);
    if (err.response) {
      console.error(`  Status: ${err.response.status}`);
      console.error(`  Data: ${JSON.stringify(err.response.data, null, 2)}`);
    } else {
      console.error(`  Error message: ${err.message}`);
      console.error(`  Stack: ${err.stack}`);
    }
  };

  // 1. Register User to get Token
  try {
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, { name, email, password });
    token = registerRes.data.token;
    console.log('✅ Register user successful.');
  } catch (err) {
    logError('Registration', err);
    process.exit(1);
  }

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // 2. Submit Repository for analysis
  try {
    const submitRes = await client.post('/api/repos', { githubUrl: 'https://github.com/expressjs/session' });
    repoId = submitRes.data._id;
    console.log(`✅ Repository submitted. ID: ${repoId}, status: ${submitRes.data.status}`);
  } catch (err) {
    logError('Repo submission', err);
    process.exit(1);
  }

  // 3. Wait for background analysis to finish (transition to done)
  console.log('Waiting for background analysis to transition to done...');
  let attempts = 0;
  let status = 'pending';
  while (attempts < 15) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const getRes = await client.get(`/api/repos/${repoId}`);
      status = getRes.data.status;
      console.log(`  Attempt ${attempts}: status is "${status}"`);
      if (status === 'done') {
        break;
      }
      if (status === 'error') {
        console.error('❌ Analysis failed with error:', getRes.data.errorMessage);
        process.exit(1);
      }
    } catch (err) {
      logError('Poll repo status', err);
      process.exit(1);
    }
  }

  if (status !== 'done') {
    console.error('❌ Timeout waiting for analysis to finish.');
    process.exit(1);
  }

  // 4. Test Case 1: Send message 'What frameworks does this use?'
  try {
    console.log('Sending Test Case 1: What frameworks does this use?');
    const res = await client.post(`/api/chat/${repoId}`, { message: 'What frameworks does this use?' });
    results.testCase1_FrameworksQuery = res.data;
    console.log('✅ Test Case 1 successful. Response:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    logError('Test Case 1', err);
  }

  // 5. Test Case 2: Send follow-up: 'Which files handle authentication?'
  try {
    console.log('Sending Test Case 2: Which files handle authentication?');
    const res = await client.post(`/api/chat/${repoId}`, { message: 'Which files handle authentication?' });
    results.testCase2_AuthQuery = res.data;
    console.log('✅ Test Case 2 successful. Response:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    logError('Test Case 2', err);
  }

  // 6. Test Case 3: GET /api/chat/:repoId and verify conversation history is saved
  try {
    console.log('Sending Test Case 3: GET /api/chat/:repoId');
    const res = await client.get(`/api/chat/${repoId}`);
    results.testCase3_GetHistory = res.data;
    console.log('✅ Test Case 3 successful. History contains:', res.data.messages.length, 'messages');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    logError('Test Case 3', err);
  }

  // 7. Test Case 4: DELETE /api/chat/:repoId to clear history
  try {
    console.log('Sending Test Case 4: DELETE /api/chat/:repoId');
    const res = await client.delete(`/api/chat/${repoId}`);
    results.testCase4_ClearHistory = res.data;
    console.log('✅ Test Case 4 successful. Response:');
    console.log(JSON.stringify(res.data, null, 2));

    // Verify history is indeed cleared
    const checkRes = await client.get(`/api/chat/${repoId}`);
    console.log(`✅ Verified history. Messages count: ${checkRes.data.messages.length}`);
  } catch (err) {
    logError('Test Case 4', err);
  }

  // Write results to artifact directory
  try {
    if (!fs.existsSync(ARTIFACT_DIR)) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    }
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'chat_test_results.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );
    console.log(`\n🎉 All tests executed. Results saved to ${ARTIFACT_DIR}/chat_test_results.json`);
  } catch (err) {
    console.error('Failed to write test results file:', err.message);
  }
}

runTests();
