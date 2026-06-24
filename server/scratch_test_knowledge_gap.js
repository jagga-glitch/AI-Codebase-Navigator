import { classifyTechnologies, generateKnowledgeGap } from './services/knowledgeGap.js';

// Setup mock repo
const mockRepo = {
  name: 'test-project',
  description: 'A test project containing various frontend and backend dependencies',
  stats: {
    dependencies: [
      'react',
      'next',
      'express',
      'mongoose',
      'jsonwebtoken',
      'bullmq',
      'socket.io',
      'three',
      'graphql'
    ],
    devDependencies: [
      'jest',
      'typescript',
      'vitest',
      'cypress'
    ]
  },
  graph: {
    nodes: [
      { id: '1', label: 'App', file: 'src/App.tsx' },
      { id: '2', label: 'Server', file: 'server/index.js' },
      { id: '3', label: 'Database', file: 'server/models/User.js' },
      { id: '4', label: 'SocketHandler', file: 'server/services/socket.js' },
      { id: '5', label: 'Queue', file: 'server/services/queue.js' }
    ],
    edges: []
  }
};

async function runTest() {
  console.log('=== STARTING KNOWLEDGE GAP TEST ===\n');

  // Test classifyTechnologies
  console.log('--- Testing classifyTechnologies ---');
  const classification = classifyTechnologies(mockRepo.stats.dependencies, mockRepo.stats.devDependencies);
  console.log('Confident (Beginner):', classification.confident.map(t => t.label));
  console.log('Gaps (Intermediate/Advanced):', classification.gaps.map(t => t.label));
  console.log('All Detected:', classification.allDetected.map(t => t.label));
  console.log('Classification test passed!\n');

  // Test generateKnowledgeGap (with actual or fallback roadmap)
  console.log('--- Testing generateKnowledgeGap ---');
  const result = await generateKnowledgeGap(mockRepo);
  console.log('Result Roadmap Title:', result.roadmap?.roadmapTitle || result.roadmap?.title);
  console.log('Estimated Weeks:', result.roadmap?.estimatedWeeks);
  console.log('Modules Count:', result.roadmap?.modules?.length);
  
  if (result.roadmap?.modules && result.roadmap.modules.length > 0) {
    console.log('\nFirst Module details:');
    console.log(JSON.stringify(result.roadmap.modules[0], null, 2));
  } else {
    console.log('\nNo modules found or all technologies are beginner-friendly.');
  }

  // Test with no gaps
  console.log('\n--- Testing with no gaps ---');
  const mockRepoNoGaps = {
    name: 'simple-project',
    stats: {
      dependencies: ['react', 'vue', 'express', 'mongoose', 'bcrypt']
    }
  };
  const resultNoGaps = await generateKnowledgeGap(mockRepoNoGaps);
  console.log('No Gaps message:', resultNoGaps.message);
  console.log('No Gaps roadmap:', JSON.stringify(resultNoGaps.roadmap, null, 2));

  console.log('\n=== KNOWLEDGE GAP TEST COMPLETED ===');
}

runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
