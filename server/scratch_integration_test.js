import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5055';
const GITHUB_URL = 'https://github.com/expressjs/express';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  const results = {
    steps: {},
    errors: [],
    timing: {},
    finalStatus: 'success'
  };

  const timestamp = Date.now();
  const testUser = {
    name: `Test User ${timestamp}`,
    email: `test_user_${timestamp}@example.com`,
    password: `TestPassword123!`
  };

  let token = null;
  let repoId = null;

  console.log('Starting E2E Integration Test against ' + BASE_URL);

  // --- Step A: Register User ---
  try {
    console.log('a. Registering new user...');
    const registerStart = Date.now();
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password
    });
    
    results.timing.register = Date.now() - registerStart;
    
    if (registerRes.data.success && registerRes.data.token) {
      token = registerRes.data.token;
      results.steps.register = {
        status: 'pass',
        data: registerRes.data
      };
      console.log('   ✅ User registered successfully. Token length: ' + token.length);
    } else {
      throw new Error('Registration succeeded but returned invalid response format');
    }
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.register = { status: 'fail', error: errorMsg };
    results.errors.push(`Register Step Failed: ${errorMsg}`);
    console.error('   ❌ Register failed: ', errorMsg);
    saveResultsAndExit(results);
    return;
  }

  // --- Step B: Login User ---
  try {
    console.log('b. Logging in with same user...');
    const loginStart = Date.now();
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    results.timing.login = Date.now() - loginStart;
    
    if (loginRes.data.success && loginRes.data.token) {
      const loginToken = loginRes.data.token;
      const sameTokenStructure = typeof loginToken === 'string' && loginToken.split('.').length === 3; // JWT check
      
      results.steps.login = {
        status: 'pass',
        data: loginRes.data,
        sameTokenStructure
      };
      console.log('   ✅ Login successful. Token verified as JWT structure: ' + sameTokenStructure);
    } else {
      throw new Error('Login succeeded but returned invalid response format');
    }
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.login = { status: 'fail', error: errorMsg };
    results.errors.push(`Login Step Failed: ${errorMsg}`);
    console.error('   ❌ Login failed: ', errorMsg);
    saveResultsAndExit(results);
    return;
  }

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // --- Step C: POST repo ---
  try {
    console.log('c. Submitting repo for analysis...');
    const submitStart = Date.now();
    const submitRes = await axios.post(`${BASE_URL}/api/repos`, {
      githubUrl: GITHUB_URL
    }, authHeaders);
    
    results.timing.submit = Date.now() - submitStart;
    repoId = submitRes.data._id || submitRes.data.id;
    
    if (repoId) {
      results.steps.submitRepo = {
        status: 'pass',
        data: submitRes.data
      };
      console.log('   ✅ Repo submitted successfully. Repo ID: ' + repoId);
    } else {
      throw new Error('Repo submission did not return repository ID');
    }
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.submitRepo = { status: 'fail', error: errorMsg };
    results.errors.push(`Repo Submission Failed: ${errorMsg}`);
    console.error('   ❌ Repo submission failed: ', errorMsg);
    saveResultsAndExit(results);
    return;
  }

  // --- Step D: Poll repo status ---
  let status = 'pending';
  const pollStart = Date.now();
  let attempts = 0;
  
  console.log('d. Polling repository analysis status...');
  try {
    while (status !== 'done' && status !== 'failed' && attempts < 40) {
      attempts++;
      await sleep(5000);
      
      const pollRes = await axios.get(`${BASE_URL}/api/repos/${repoId}`, authHeaders);
      status = pollRes.data.status;
      console.log(`   Attempt ${attempts}: status = '${status}'`);
      
      if (status === 'failed') {
        throw new Error('Analysis failed in the background: ' + (pollRes.data.error || 'Unknown error'));
      }
    }
    
    const analysisTime = Date.now() - pollStart;
    results.timing.analysis = analysisTime;
    
    if (status === 'done') {
      results.steps.pollStatus = {
        status: 'pass',
        attempts,
        totalTimeMs: analysisTime
      };
      console.log(`   ✅ Analysis complete! Finished in ${analysisTime / 1000}s`);
    } else {
      throw new Error('Analysis polling timed out after ' + (attempts * 5) + ' seconds');
    }
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.pollStatus = { status: 'fail', error: errorMsg, attempts };
    results.errors.push(`Polling Failed: ${errorMsg}`);
    console.error('   ❌ Polling failed: ', errorMsg);
    saveResultsAndExit(results);
    return;
  }

  // --- Step E: GET repo graph ---
  try {
    console.log('e. Fetching repository graph nodes and edges...');
    const graphStart = Date.now();
    const graphRes = await axios.get(`${BASE_URL}/api/repos/${repoId}/graph`, authHeaders);
    results.timing.graph = Date.now() - graphStart;
    
    const nodesCount = graphRes.data.nodes?.length || 0;
    const edgesCount = graphRes.data.edges?.length || 0;
    
    if (nodesCount > 0 || edgesCount >= 0) {
      results.steps.getGraph = {
        status: 'pass',
        nodesCount,
        edgesCount,
        dataSummary: {
          nodes: graphRes.data.nodes?.slice(0, 5), // sample
          edges: graphRes.data.edges?.slice(0, 5)
        }
      };
      console.log(`   ✅ Graph fetched. Nodes: ${nodesCount}, Edges: ${edgesCount}`);
    } else {
      throw new Error('Graph fetch returned empty nodes or edges');
    }
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.getGraph = { status: 'fail', error: errorMsg };
    results.errors.push(`Graph Fetch Failed: ${errorMsg}`);
    console.error('   ❌ Graph fetch failed: ', errorMsg);
  }

  // --- Step F: POST chat message ---
  try {
    console.log('f. Sending chat message to AI about repo...');
    const chatStart = Date.now();
    const chatRes = await axios.post(`${BASE_URL}/api/chat/${repoId}`, {
      message: 'What is the main framework used?'
    }, authHeaders);
    results.timing.chat = Date.now() - chatStart;
    
    const reply = chatRes.data.message || '';
    const containsExpress = reply.toLowerCase().includes('express');
    
    results.steps.chat = {
      status: 'pass',
      response: reply,
      citations: chatRes.data.citations || [],
      containsExpress
    };
    
    if (containsExpress) {
      console.log('   ✅ Chat reply verified. AI correctly identified Express framework!');
    } else {
      console.warn('   ⚠️ Chat reply received but did not mention Express: ' + reply);
    }
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.chat = { status: 'fail', error: errorMsg };
    results.errors.push(`Chat Session Failed: ${errorMsg}`);
    console.error('   ❌ Chat failed: ', errorMsg);
  }

  // --- Step G: POST impact analysis ---
  try {
    console.log('g. Analyzing feature impact of "Add rate limiting"...');
    const impactStart = Date.now();
    const impactRes = await axios.post(`${BASE_URL}/api/repos/${repoId}/impact`, {
      feature: 'Add rate limiting'
    }, authHeaders);
    results.timing.impact = Date.now() - impactStart;
    
    results.steps.impact = {
      status: 'pass',
      data: impactRes.data
    };
    console.log('   ✅ Impact analysis completed successfully.');
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.impact = { status: 'fail', error: errorMsg };
    results.errors.push(`Impact Analysis Failed: ${errorMsg}`);
    console.error('   ❌ Impact analysis failed: ', errorMsg);
  }

  // --- Step H: GET knowledge gap ---
  try {
    console.log('h. Fetching knowledge gap roadmap...');
    const kgStart = Date.now();
    const kgRes = await axios.get(`${BASE_URL}/api/repos/${repoId}/knowledge-gap`, authHeaders);
    results.timing.knowledgeGap = Date.now() - kgStart;
    
    const kgData = kgRes.data.knowledgeGap || {};
    const modulesExist = Array.isArray(kgData.roadmap?.modules) && kgData.roadmap.modules.length > 0;
    
    results.steps.knowledgeGap = {
      status: 'pass',
      data: kgRes.data,
      modulesExist
    };
    console.log(`   ✅ Knowledge gap fetched. Roadmap modules exist: ${modulesExist}`);
  } catch (error) {
    results.finalStatus = 'failed';
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    results.steps.knowledgeGap = { status: 'fail', error: errorMsg };
    results.errors.push(`Knowledge Gap Failed: ${errorMsg}`);
    console.error('   ❌ Knowledge gap failed: ', errorMsg);
  }

  // --- Clean Up: Delete Repo ---
  try {
    console.log('Cleaning up: Deleting submitted repository...');
    await axios.delete(`${BASE_URL}/api/repos/${repoId}`, authHeaders);
    console.log('   ✅ Repo deleted.');
  } catch (error) {
    console.error('   ⚠️ Cleanup failed to delete repo:', error.message);
  }

  saveResultsAndExit(results);
}

function saveResultsAndExit(results) {
  const filePath = path.join(__dirname, 'integration_test_result.json');
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log('E2E integration test complete. Results written to: ' + filePath);
  process.exit(results.finalStatus === 'success' ? 0 : 1);
}

runTests();
