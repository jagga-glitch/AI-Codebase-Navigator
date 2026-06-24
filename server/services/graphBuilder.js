import path from 'path';

/**
 * Classifies a file path into one of the designated architecture types.
 * @param {string} filePath - Path to the file
 * @returns {string} One of: 'route', 'controller', 'service', 'model', 'component', 'page', 'middleware', 'config', 'test', 'util', 'style', 'other'
 */
export function classifyFileType(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const name = path.basename(normalizedPath);
  const ext = path.extname(normalizedPath);

  // Helper to check for directory segments
  const hasSegment = (segment) => {
    return normalizedPath.includes(`/${segment}/`) || normalizedPath.startsWith(`${segment}/`);
  };

  // 1. test: if path includes .test. or .spec. or __tests__
  if (normalizedPath.includes('.test.') || normalizedPath.includes('.spec.') || normalizedPath.includes('__tests__')) {
    return 'test';
  }

  // 2. style: if extension is .css, .scss, .sass
  if (ext === '.css' || ext === '.scss' || ext === '.sass') {
    return 'style';
  }

  // 3. route: if path includes /routes/ or /api/
  if (hasSegment('routes') || hasSegment('api') || normalizedPath.includes('/routes/') || normalizedPath.includes('/api/')) {
    return 'route';
  }

  // 4. controller: if path includes /controllers/ or Controller in name
  if (hasSegment('controllers') || normalizedPath.includes('/controllers/') || name.includes('Controller')) {
    return 'controller';
  }

  // 5. service: if path includes /services/ or Service in name
  if (hasSegment('services') || normalizedPath.includes('/services/') || name.includes('Service')) {
    return 'service';
  }

  // 6. model: if path includes /models/ or Model in name
  if (hasSegment('models') || normalizedPath.includes('/models/') || name.includes('Model')) {
    return 'model';
  }

  // 7. page: if path includes /pages/ or /views/
  if (hasSegment('pages') || hasSegment('views') || normalizedPath.includes('/pages/') || normalizedPath.includes('/views/')) {
    return 'page';
  }

  // 8. component: if extension is .jsx or .tsx, or path includes /components/
  if (ext === '.jsx' || ext === '.tsx' || hasSegment('components') || normalizedPath.includes('/components/')) {
    return 'component';
  }

  // 9. middleware: if path includes /middleware/
  if (hasSegment('middleware') || normalizedPath.includes('/middleware/')) {
    return 'middleware';
  }

  // 10. config: if path includes /config/ or name is .env, package.json
  if (hasSegment('config') || normalizedPath.includes('/config/') || name === '.env' || name === 'package.json') {
    return 'config';
  }

  // 11. util: if path includes /utils/ or /helpers/ or /lib/
  if (hasSegment('utils') || hasSegment('helpers') || hasSegment('lib') || 
      normalizedPath.includes('/utils/') || normalizedPath.includes('/helpers/') || normalizedPath.includes('/lib/')) {
    return 'util';
  }

  // 12. other
  return 'other';
}

/**
 * Estimates complexity for a file based on type, path depth, and length.
 * Returns a number between 1 and 10.
 * @param {string} filePath - Path to the file
 * @param {string} type - Classified file type
 * @returns {number} Estimated complexity score
 */
export function estimateComplexity(filePath, type) {
  let base = 5;
  switch (type) {
    case 'controller': base = 7; break;
    case 'service': base = 8; break;
    case 'model': base = 6; break;
    case 'route': base = 5; break;
    case 'middleware': base = 5; break;
    case 'page': base = 6; break;
    case 'component': base = 6; break;
    case 'util': base = 4; break;
    case 'config': base = 3; break;
    case 'test': base = 4; break;
    case 'style': base = 2; break;
    default: base = 3;
  }

  const pathDepth = filePath.split('/').length;
  const lengthModifier = Math.min(2, Math.floor(filePath.length / 30));
  const complexity = base + (pathDepth - 2) + lengthModifier;
  return Math.min(10, Math.max(1, complexity));
}

/**
 * Establishes building footprint size for the city view based on file type.
 * @param {string} type - Classified file type
 * @returns {number} Footprint size
 */
export function estimateSize(type) {
  const sizes = {
    controller: 8,
    service: 9,
    model: 7,
    component: 6,
    route: 5,
    middleware: 5,
    page: 6,
    util: 4,
    config: 3,
    test: 4,
    style: 3,
    other: 3
  };
  return sizes[type] || 3;
}

/**
 * Extracts logical district from file path.
 * Returns the folder immediately after src/, app/, server/, or top-level.
 * Defaults to 'core' if no clear district folder is found.
 * @param {string} filePath - Path to the file
 * @returns {string} District folder name
 */
export function extractDistrict(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/').filter(Boolean);

  if (parts.length === 0) {
    return 'core';
  }

  const prefixes = ['src', 'app', 'server'];
  for (const prefix of prefixes) {
    const idx = parts.indexOf(prefix);
    if (idx !== -1 && idx < parts.length - 1) {
      const nextPart = parts[idx + 1];
      // If the next part contains a dot, it's a file, not a directory
      if (nextPart.includes('.')) {
        return 'core';
      }
      return nextPart;
    }
  }

  // If no prefix found, check top level directory
  if (parts.length > 1) {
    const firstPart = parts[0];
    if (!firstPart.includes('.')) {
      return firstPart;
    }
  }

  return 'core';
}

/**
 * Builds nodes and edges from a file tree and package dependencies.
 * @param {Array} tree - List of file tree entries (each with a path and optional type)
 * @param {string|Object} packageJsonContent - Content of package.json to identify external deps
 * @param {string} owner - Repository owner (optional, for reference)
 * @param {string} repo - Repository name (optional, for reference)
 * @returns {Object} Graph payload: { nodes: [], edges: [] }
 */
export function buildGraph(tree, packageJsonContent, owner, repo) {
  if (!Array.isArray(tree)) {
    return { nodes: [], edges: [] };
  }

  // 1. Filter out directory entries and files without paths
  const filesOnly = tree.filter(file => file && typeof file.path === 'string' && file.type !== 'tree');

  // Helper to assign a significance score for limiting/prioritizing
  const getPriorityScore = (file) => {
    const filePath = file.path;
    const lowerPath = filePath.toLowerCase();

    // Exclude node_modules and version control files entirely or deprioritize to bottom
    if (lowerPath.includes('node_modules') || lowerPath.includes('.git/')) {
      return 0;
    }

    // Deprioritize lock files
    if (
      filePath.endsWith('package-lock.json') ||
      filePath.endsWith('yarn.lock') ||
      filePath.endsWith('pnpm-lock.yaml') ||
      filePath.endsWith('bun.lockb')
    ) {
      return 5;
    }

    // Deprioritize generated files
    if (
      lowerPath.includes('/dist/') || lowerPath.startsWith('dist/') ||
      lowerPath.includes('/build/') || lowerPath.startsWith('build/') ||
      lowerPath.includes('/out/') || lowerPath.startsWith('out/') ||
      lowerPath.includes('/.next/') || lowerPath.startsWith('.next/') ||
      lowerPath.includes('/coverage/') || lowerPath.startsWith('coverage/')
    ) {
      return 5;
    }

    const type = classifyFileType(filePath);

    // Prioritize controllers, services, models, routes
    switch (type) {
      case 'controller':
      case 'service':
      case 'model':
      case 'route':
        return 100;
      case 'middleware':
      case 'page':
      case 'component':
      case 'util':
        return 80;
      case 'test':
        return 60;
      case 'style':
        return 40;
      case 'other':
        return 30;
      case 'config':
        return 20;
      default:
        return 30;
    }
  };

  // 2. Sort files by priority descending, using path alphabetically as fallback for determinism
  const sortedFiles = filesOnly.sort((a, b) => {
    const scoreA = getPriorityScore(a);
    const scoreB = getPriorityScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return a.path.localeCompare(b.path);
  });

  // Limit to the 150 most significant files
  const selectedFiles = sortedFiles.slice(0, 150);

  // 3. Map selected files to node objects
  const nodes = selectedFiles.map(file => {
    const type = classifyFileType(file.path);
    return {
      id: file.path,
      label: path.basename(file.path, path.extname(file.path)),
      type,
      file: file.path,
      complexity: estimateComplexity(file.path, type),
      size: estimateSize(type),
      district: extractDistrict(file.path)
    };
  });

  // 4. Detect and add external service nodes from package.json dependencies
  let packageJson = {};
  if (packageJsonContent) {
    if (typeof packageJsonContent === 'string') {
      try {
        packageJson = JSON.parse(packageJsonContent);
      } catch (e) {
        // Safe fallback on JSON parsing failure
      }
    } else if (typeof packageJsonContent === 'object') {
      packageJson = packageJsonContent;
    }
  }

  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };

  let hasMongodb = false;
  let hasRedis = false;
  let hasStripe = false;

  const extNodes = [];

  // MongoDB detection
  if (dependencies['mongoose']) {
    extNodes.push({
      id: 'ext_mongodb',
      label: 'MongoDB',
      type: 'database',
      file: '',
      complexity: 9,
      size: 10,
      district: 'infrastructure'
    });
    hasMongodb = true;
  }

  // Redis detection
  if (dependencies['ioredis'] || dependencies['redis']) {
    extNodes.push({
      id: 'ext_redis',
      label: 'Redis',
      type: 'database',
      file: '',
      complexity: 9,
      size: 10,
      district: 'infrastructure'
    });
    hasRedis = true;
  }

  // Stripe detection
  if (dependencies['stripe']) {
    extNodes.push({
      id: 'ext_stripe',
      label: 'Stripe',
      type: 'external_api',
      file: '',
      complexity: 9,
      size: 10,
      district: 'infrastructure'
    });
    hasStripe = true;
  }

  // SendGrid detection
  const hasSendgrid = Object.keys(dependencies).some(dep => dep.includes('@sendgrid') || dep.includes('sendgrid'));
  if (hasSendgrid) {
    extNodes.push({
      id: 'ext_sendgrid',
      label: 'SendGrid',
      type: 'external_api',
      file: '',
      complexity: 9,
      size: 10,
      district: 'infrastructure'
    });
  }

  // AWS SDK detection
  const hasAws = Object.keys(dependencies).some(dep => dep === 'aws-sdk' || dep.startsWith('@aws-sdk/'));
  if (hasAws) {
    extNodes.push({
      id: 'ext_aws',
      label: 'AWS S3',
      type: 'external_api',
      file: '',
      complexity: 9,
      size: 10,
      district: 'infrastructure'
    });
  }

  // Append external nodes to graph nodes list
  nodes.push(...extNodes);

  // 5. Establish edges based on naming convention proximity and external relationships
  const edges = [];

  const routeNodes = nodes.filter(n => n.type === 'route');
  const controllerNodes = nodes.filter(n => n.type === 'controller');
  const serviceNodes = nodes.filter(n => n.type === 'service');
  const modelNodes = nodes.filter(n => n.type === 'model');

  // Rule 5.1: route -> controller (if in same district folder, excluding fallback 'core')
  for (const routeNode of routeNodes) {
    for (const controllerNode of controllerNodes) {
      if (routeNode.district === controllerNode.district && routeNode.district !== 'core') {
        edges.push({
          source: routeNode.id,
          target: controllerNode.id,
          type: 'calls'
        });
      }
    }
  }

  // Rule 5.2: controller -> service (if in same district folder, excluding fallback 'core')
  for (const controllerNode of controllerNodes) {
    for (const serviceNode of serviceNodes) {
      if (controllerNode.district === serviceNode.district && controllerNode.district !== 'core') {
        edges.push({
          source: controllerNode.id,
          target: serviceNode.id,
          type: 'calls'
        });
      }
    }
  }

  // Rule 5.3: service -> model (if in same district folder, excluding fallback 'core')
  for (const serviceNode of serviceNodes) {
    for (const modelNode of modelNodes) {
      if (serviceNode.district === modelNode.district && serviceNode.district !== 'core') {
        edges.push({
          source: serviceNode.id,
          target: modelNode.id,
          type: 'calls'
        });
      }
    }
  }

  // Rule 5.4: model -> ext_mongodb (all models connect to MongoDB if it exists)
  if (hasMongodb) {
    for (const modelNode of modelNodes) {
      edges.push({
        source: modelNode.id,
        target: 'ext_mongodb',
        type: 'calls'
      });
    }
  }

  // Rule 5.5: service -> ext_redis (services with 'cache' or 'session' in district or name connect to Redis if it exists)
  if (hasRedis) {
    for (const serviceNode of serviceNodes) {
      const distLower = serviceNode.district.toLowerCase();
      const labelLower = serviceNode.label.toLowerCase();
      if (
        distLower.includes('cache') || distLower.includes('session') ||
        labelLower.includes('cache') || labelLower.includes('session')
      ) {
        edges.push({
          source: serviceNode.id,
          target: 'ext_redis',
          type: 'calls'
        });
      }
    }
  }

  // Rule 5.6: controller -> ext_stripe (controllers in 'payment' or 'checkout' districts connect to Stripe if it exists)
  if (hasStripe) {
    for (const controllerNode of controllerNodes) {
      const distLower = controllerNode.district.toLowerCase();
      if (distLower.includes('payment') || distLower.includes('checkout')) {
        edges.push({
          source: controllerNode.id,
          target: 'ext_stripe',
          type: 'calls'
        });
      }
    }
  }

  // 6. Deduplicate edges (ensure no duplicate source + target + type combinations)
  const uniqueEdges = [];
  const seenEdges = new Set();

  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}->${edge.type}`;
    if (!seenEdges.has(key)) {
      seenEdges.add(key);
      uniqueEdges.push(edge);
    }
  }

  return {
    nodes,
    edges: uniqueEdges
  };
}

export default buildGraph;
