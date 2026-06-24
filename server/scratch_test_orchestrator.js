import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3001';
const REPO_URL = 'https://github.com/octocat/Spoon-Knife';

async function testOrchestrator() {
  console.log('=== STARTING ORCHESTRATOR ANALYSIS TEST ===');
  
  const email = `orchestrator_test_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Orchestrator Tester';
  let token = '';
  let repoId = '';

  // 1. Register User
  try {
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, { name, email, password });
    token = registerRes.data.token;
    console.log('✅ User registered successfully. Token obtained.');
  } catch (err) {
    console.error('❌ User registration failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // 2. Submit Repository
  try {
    console.log(`Submitting repository: ${REPO_URL}`);
    const submitRes = await client.post('/api/repos', { githubUrl: REPO_URL });
    repoId = submitRes.data._id;
    console.log(`✅ Repository submitted. ID: ${repoId}, Status: ${submitRes.data.status}`);
  } catch (err) {
    console.error('❌ Repository submission failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Poll GET /api/repos/:id every 5 seconds
  let completed = false;
  let attempts = 0;
  const maxAttempts = 24; // 2 minutes total

  while (!completed && attempts < maxAttempts) {
    attempts++;
    console.log(`Polling attempt ${attempts}/24...`);
    try {
      const getRes = await client.get(`/api/repos/${repoId}`);
      const repo = getRes.data;
      console.log(`Current status: ${repo.status}`);
      
      if (repo.status === 'done') {
        completed = true;
        console.log('✅ Analysis complete!');
        console.log('Final Repository Document (JSON):');
        console.log(JSON.stringify(repo, null, 2));
        break;
      } else if (repo.status === 'error') {
        completed = true;
        console.error('❌ Analysis failed with error:', repo.errorMessage);
        break;
      }
    } catch (err) {
      console.error('Error polling status:', err.response?.data || err.message);
    }
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  if (!completed) {
    console.error('❌ Test timed out before analysis completed.');
  }
  
  console.log('=== TEST SEQUENCE COMPLETED ===');
}

testOrchestrator();
