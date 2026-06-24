import path from 'path';

// Known packages mapped to friendly framework names
const packageToFrameworkMap = {
  'react': 'React',
  'next': 'Next.js',
  'vue': 'Vue',
  'nuxt': 'Nuxt',
  '@angular/core': 'Angular',
  'svelte': 'Svelte',
  'express': 'Express',
  '@nestjs/core': 'NestJS',
  'fastify': 'Fastify',
  'prisma': 'Prisma',
  '@prisma/client': 'Prisma',
  'mongoose': 'Mongoose',
  'typeorm': 'TypeORM',
  'sequelize': 'Sequelize',
  'tailwindcss': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'cypress': 'Cypress',
  'stripe': 'Stripe',
  '@stripe/stripe-js': 'Stripe',
  'socket.io': 'Socket.io',
  'socket.io-client': 'Socket.io',
  'redis': 'Redis (ioredis)',
  'ioredis': 'Redis (ioredis)',
  'bull': 'Bull/BullMQ',
  'bullmq': 'Bull/BullMQ'
};

/**
 * Groups files in the tree by their lowercase extension.
 * Files with no extension are grouped as 'no-extension'.
 * Returns an array of objects sorted by file count descending.
 * 
 * @param {Array<any>} tree 
 * @returns {Array<{ name: string, count: number, percentage: number }>}
 */
export function countByExtension(tree) {
  if (!tree || !Array.isArray(tree) || tree.length === 0) {
    return [];
  }

  const counts = {};
  let total = 0;

  for (const file of tree) {
    if (!file || !file.path) continue;
    let ext = path.extname(file.path).toLowerCase();
    if (!ext) {
      ext = 'no-extension';
    }
    counts[ext] = (counts[ext] || 0) + 1;
    total++;
  }

  const result = Object.entries(counts).map(([name, count]) => {
    const percentage = total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;
    return { name, count, percentage };
  });

  // Sort descending by count, and sub-sort alphabetically by name
  result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return result;
}

/**
 * Safely parses package.json and returns a list of matched frameworks/libraries.
 * 
 * @param {string} packageJsonContent 
 * @returns {Array<string>} List of detected frameworks
 */
export function detectFrameworks(packageJsonContent) {
  if (!packageJsonContent) return [];

  try {
    const parsed = JSON.parse(packageJsonContent);
    const deps = {
      ...(parsed.dependencies || {}),
      ...(parsed.devDependencies || {})
    };

    const matchedFrameworks = new Set();
    for (const pkgName of Object.keys(deps)) {
      if (packageToFrameworkMap[pkgName]) {
        matchedFrameworks.add(packageToFrameworkMap[pkgName]);
      }
    }

    return Array.from(matchedFrameworks);
  } catch (err) {
    return [];
  }
}

/**
 * Checks if the repository tree contains any test files.
 * 
 * @param {Array<any>} tree 
 * @returns {boolean} True if tests are detected
 */
export function detectTestSetup(tree) {
  if (!tree || !Array.isArray(tree)) return false;

  return tree.some(file => {
    if (!file || !file.path) return false;
    const p = file.path;
    return p.includes('.test.') || p.includes('.spec.') || p.includes('__tests__');
  });
}

/**
 * Checks if the repository tree has documentation files or folder.
 * 
 * @param {Array<any>} tree 
 * @returns {boolean} True if documentation is detected
 */
export function detectDocumentation(tree) {
  if (!tree || !Array.isArray(tree)) return false;

  return tree.some(file => {
    if (!file || !file.path) return false;
    const p = file.path.toLowerCase();
    const parts = p.split('/');

    if (parts.includes('readme.md')) return true;
    if (parts.includes('docs')) return true;
    if (parts.includes('contributing.md')) return true;
    if (p.includes('wiki')) return true;

    return false;
  });
}

/**
 * Calculates scores for documentation, testCoverage, dependencyHealth,
 * maintainability, and calculates a rounded overall average score.
 * 
 * @param {object} stats 
 * @returns {{ overall: number, documentation: number, testCoverage: number, dependencyHealth: number, maintainability: number }}
 */
export function calculateHealthScore(stats) {
  const s = stats || {};

  // 1. Documentation Score (0-100)
  let documentation = 30;
  if (s.hasDocumentation) {
    const hasMarkdown = s.languages && s.languages.some(lang => {
      if (typeof lang === 'string') return lang.toLowerCase() === '.md';
      if (lang && typeof lang.name === 'string') return lang.name.toLowerCase() === '.md';
      return false;
    });
    documentation = hasMarkdown ? 100 : 70;
  }

  // 2. Test Coverage Score (0-100)
  let testCoverage = 0;
  if (s.hasTests) {
    const testFileCount = s.testFileCount || 0;
    const totalFiles = s.totalFiles || 0;
    if (totalFiles > 0 && (testFileCount / totalFiles) > 0.05) {
      testCoverage = 100;
    } else {
      testCoverage = 60;
    }
  }

  // 3. Dependency Health Score (20-100)
  const depCount = (s.dependencies?.length || 0) + (s.devDependencies?.length || 0);
  let dependencyHealth = 100;
  if (depCount > 20) {
    dependencyHealth -= (depCount - 20) * 3;
  }
  dependencyHealth = Math.max(20, Math.min(100, dependencyHealth));

  // 4. Maintainability Score (30-100)
  const avgComplexity = s.avgFileComplexity || 3;
  let maintainability = 100 - Math.round(avgComplexity * 10);
  maintainability = Math.max(30, Math.min(100, maintainability));

  // 5. Overall Score (average of all 4)
  const overall = Math.round((documentation + testCoverage + dependencyHealth + maintainability) / 4);

  return {
    overall,
    documentation,
    testCoverage,
    dependencyHealth,
    maintainability
  };
}

/**
 * Estimates complexity score (1-10) with small random variation based on file types.
 * Fallbacks to path-based inference if fileType is not explicitly supplied.
 * 
 * @param {string} filePath 
 * @param {string} [fileType] 
 * @returns {number} Complexity score
 */
export function estimateComplexity(filePath, fileType) {
  let resolvedType = (fileType || '').toLowerCase().trim();

  if (!resolvedType && filePath) {
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('controller') || lowerPath.includes('handler')) {
      resolvedType = 'controller';
    } else if (lowerPath.includes('service')) {
      resolvedType = 'service';
    } else if (lowerPath.includes('model') || lowerPath.includes('schema')) {
      resolvedType = 'model';
    } else if (lowerPath.endsWith('.jsx') || lowerPath.endsWith('.tsx') || lowerPath.includes('components/')) {
      resolvedType = 'component';
    } else if (lowerPath.includes('route')) {
      resolvedType = 'route';
    } else if (lowerPath.includes('util') || lowerPath.includes('helper')) {
      resolvedType = 'util';
    } else if (lowerPath.includes('config') || lowerPath.endsWith('.json') || lowerPath.startsWith('.')) {
      resolvedType = 'config';
    } else if (lowerPath.includes('.test.') || lowerPath.includes('.spec.') || lowerPath.includes('__tests__')) {
      resolvedType = 'test';
    } else {
      resolvedType = 'other';
    }
  }

  const ranges = {
    'controller': { base: 7, max: 9 },
    'handler': { base: 7, max: 9 },
    'service': { base: 6, max: 8 },
    'model': { base: 4, max: 6 },
    'schema': { base: 4, max: 6 },
    'component': { base: 4, max: 7 },
    'route': { base: 3, max: 5 },
    'util': { base: 2, max: 4 },
    'helper': { base: 2, max: 4 },
    'config': { base: 2, max: 3 },
    'test': { base: 3, max: 5 },
    'other': { base: 3, max: 3 }
  };

  const range = ranges[resolvedType] || ranges['other'];
  const base = range.base;

  // Add 0-2 random variation: Math.floor(base + Math.random() * 2)
  // To span the full range range.base -> range.max:
  const limit = range.max - base + 1;
  const score = Math.floor(base + Math.random() * limit);

  return score;
}
