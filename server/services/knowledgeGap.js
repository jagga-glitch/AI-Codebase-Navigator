import Groq from 'groq-sdk';

let groqInstance = null;

function getGroqClient() {
  if (groqInstance) return groqInstance;
  const apiKey = process.env.GROQ_API_KEY || '';
  if (apiKey && apiKey !== 'your_api_key_here') {
    try {
      groqInstance = new Groq({ apiKey });
      console.log('Groq Client initialized successfully in knowledgeGap.');
    } catch (err) {
      console.warn('Failed to initialize Groq client in knowledgeGap:', err.message);
    }
  }
  return groqInstance;
}

export const TECHNOLOGY_MAP = {
  'react':              { label: 'React', level: 'beginner', category: 'frontend', icon: '⚛️' },
  'vue':                { label: 'Vue.js', level: 'beginner', category: 'frontend', icon: '💚' },
  'next':               { label: 'Next.js', level: 'intermediate', category: 'frontend', icon: '▲' },
  'express':            { label: 'Express.js', level: 'beginner', category: 'backend', icon: '🚂' },
  '@nestjs/core':       { label: 'NestJS', level: 'advanced', category: 'backend', icon: '🐈' },
  'fastify':            { label: 'Fastify', level: 'intermediate', category: 'backend', icon: '⚡' },
  'mongoose':           { label: 'Mongoose + MongoDB', level: 'beginner', category: 'database', icon: '🍃' },
  '@prisma/client':     { label: 'Prisma ORM', level: 'intermediate', category: 'database', icon: '△' },
  'typeorm':            { label: 'TypeORM', level: 'intermediate', category: 'database', icon: '🗄️' },
  'jsonwebtoken':       { label: 'JWT Authentication', level: 'intermediate', category: 'security', icon: '🔐' },
  'passport':           { label: 'Passport.js OAuth', level: 'intermediate', category: 'security', icon: '🛂' },
  'bcrypt':             { label: 'Password Hashing', level: 'beginner', category: 'security', icon: '🔒' },
  'ioredis':            { label: 'Redis Caching', level: 'intermediate', category: 'infrastructure', icon: '🔴' },
  'redis':              { label: 'Redis', level: 'intermediate', category: 'infrastructure', icon: '🔴' },
  'bull':               { label: 'Bull Job Queues', level: 'advanced', category: 'infrastructure', icon: '🐂' },
  'bullmq':             { label: 'BullMQ Queues', level: 'advanced', category: 'infrastructure', icon: '🐂' },
  'socket.io':          { label: 'WebSockets (Socket.io)', level: 'intermediate', category: 'realtime', icon: '🔌' },
  'graphql':            { label: 'GraphQL', level: 'advanced', category: 'api', icon: '◈' },
  '@apollo/server':     { label: 'Apollo GraphQL Server', level: 'advanced', category: 'api', icon: '🚀' },
  'stripe':             { label: 'Stripe Payments', level: 'intermediate', category: 'payments', icon: '💳' },
  'aws-sdk':            { label: 'AWS SDK (S3/Lambda)', level: 'advanced', category: 'cloud', icon: '☁️' },
  'jest':               { label: 'Jest Testing', level: 'intermediate', category: 'testing', icon: '🃏' },
  'vitest':             { label: 'Vitest', level: 'intermediate', category: 'testing', icon: '⚡' },
  'cypress':            { label: 'Cypress E2E Testing', level: 'advanced', category: 'testing', icon: '🌲' },
  'typescript':         { label: 'TypeScript', level: 'intermediate', category: 'language', icon: '🔷' },
  'three':              { label: 'Three.js 3D', level: 'advanced', category: 'frontend', icon: '🎲' },
  '@react-three/fiber': { label: 'React Three Fiber', level: 'advanced', category: 'frontend', icon: '🎲' },
};

/**
 * Classifies package dependencies/devDependencies based on TECHNOLOGY_MAP
 * @param {Array<string>} dependencies
 * @param {Array<string>} devDependencies
 * @returns {Object} { confident, gaps, allDetected }
 */
export function classifyTechnologies(dependencies = [], devDependencies = []) {
  const combined = [...(dependencies || []), ...(devDependencies || [])];
  const detectedKeys = new Set();

  for (const dep of combined) {
    if (typeof dep !== 'string') continue;
    const normalizedDep = dep.toLowerCase();
    for (const [key, tech] of Object.entries(TECHNOLOGY_MAP)) {
      const lowerKey = key.toLowerCase();
      const cleanKey = lowerKey.replace(/^@/, '').split('/')[0];
      if (normalizedDep.includes(lowerKey) || normalizedDep.includes(cleanKey)) {
        detectedKeys.add(key);
      }
    }
  }

  const confident = [];
  const gaps = [];
  const allDetected = [];

  for (const key of detectedKeys) {
    const tech = TECHNOLOGY_MAP[key];
    allDetected.push(tech);
    if (tech.level === 'beginner') {
      confident.push(tech);
    } else if (tech.level === 'intermediate' || tech.level === 'advanced') {
      gaps.push(tech);
    }
  }

  return { confident, gaps, allDetected };
}

/**
 * Generates a knowledge gap analysis and learning roadmap for a given repository.
 * @param {Object} repo - The Repository document.
 * @returns {Promise<Object>} The knowledge gap analysis results.
 */
export const generateKnowledgeGap = async (repo) => {
  const { confident, gaps } = classifyTechnologies(
    repo.stats?.dependencies || [],
    repo.stats?.devDependencies || []
  );

  if (gaps.length === 0) {
    return {
      confident,
      gaps: [],
      roadmap: { title: 'Strong foundation', estimatedWeeks: 0, modules: [] },
      message: 'Great news! All detected technologies are beginner-friendly.'
    };
  }

  const groq = getGroqClient();
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You generate precise developer learning roadmaps. Respond ONLY with valid JSON, no markdown, no preamble.'
          },
          {
            role: 'user',
            content:
              'Repository: ' + repo.name + '\n' +
              'Description: ' + (repo.description || 'N/A') + '\n\n' +
              'The developer is CONFIDENT with: ' +
                confident.map(t => t.label).join(', ') + '\n' +
              'They need to learn: ' +
                gaps.map(t => t.label + ' (' + t.level + ', ' + t.category + ')').join(', ') + '\n\n' +
              'Related files in this repo (for context):\n' +
                (repo.graph?.nodes || []).slice(0, 40).map(n => n.file).filter(Boolean).join('\n') + '\n\n' +
              'Return JSON:\n' +
              '{\n' +
              '  "roadmapTitle": "string",\n' +
              '  "estimatedWeeks": number,\n' +
              '  "modules": [{\n' +
              '    "order": number,\n' +
              '    "title": "string",\n' +
              '    "technology": "string (match a gap label exactly)",\n' +
              '    "level": "intermediate" | "advanced",\n' +
              '    "whyItMatters": "one sentence about WHY this repo uses it",\n' +
              '    "estimatedHours": number,\n' +
              '    "relatedFiles": ["up to 3 actual file paths from the repo above"],\n' +
              '    "keyTopics": ["3-5 specific things to learn"]\n' +
              '  }]\n' +
              '}\n' +
              'Order modules from most foundational to most advanced.'
          }
        ],
        temperature: 0.2
      });

      const responseText = response.choices?.[0]?.message?.content || '';
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const cleanedText = responseText
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/, '')
          .trim();
        parsed = JSON.parse(cleanedText);
      }
      return { confident, gaps, roadmap: parsed };
    } catch (err) {
      console.warn('AI learning roadmap generation failed, falling back to programmatic generation:', err.message);
    }
  }

  // Programmatic fallback
  const modules = gaps.map((gap, index) => {
    const relatedFiles = (repo.graph?.nodes || [])
      .filter(n => n.file && (
        n.file.toLowerCase().includes(gap.label.toLowerCase()) ||
        n.file.toLowerCase().includes(gap.category.toLowerCase())
      ))
      .slice(0, 3)
      .map(n => n.file);

    if (relatedFiles.length === 0 && repo.graph?.nodes?.length > 0) {
      relatedFiles.push(...repo.graph.nodes.slice(0, 3).map(n => n.file).filter(Boolean));
    }

    return {
      order: index + 1,
      title: `Mastering ${gap.label}`,
      technology: gap.label,
      level: gap.level,
      whyItMatters: `This repository uses ${gap.label} for ${gap.category} implementation.`,
      estimatedHours: gap.level === 'advanced' ? 16 : 8,
      relatedFiles,
      keyTopics: [
        `Core principles of ${gap.label}`,
        `Best practices for ${gap.category} applications`,
        `Integration and configuration in ${repo.name}`
      ]
    };
  });

  const fallbackRoadmap = {
    roadmapTitle: `Learning Roadmap for ${repo.name}`,
    estimatedWeeks: Math.ceil(modules.length * 1.5),
    modules
  };

  return { confident, gaps, roadmap: fallbackRoadmap };
};
