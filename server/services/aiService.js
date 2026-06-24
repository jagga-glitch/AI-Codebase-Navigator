import Groq from "groq-sdk";

let groqInstance = null;

function getGroqClient() {
  if (groqInstance) return groqInstance;
  const apiKey = process.env.GROQ_API_KEY || "";
  if (apiKey && apiKey !== "your_api_key_here") {
    try {
      groqInstance = new Groq({
        apiKey: apiKey,
      });
      console.log("Groq Client initialized successfully in aiService.");
    } catch (err) {
      console.warn("Failed to initialize Groq client:", err.message);
    }
  }
  return groqInstance;
}

const extMap = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (React)',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.html': 'HTML',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.cpp': 'C++',
  '.c': 'C',
  '.sh': 'Shell',
  '.yml': 'YAML',
  '.yaml': 'YAML'
};

function formatLanguages(langs) {
  if (!langs || !Array.isArray(langs) || langs.length === 0) return 'None detected';
  return langs.map(l => {
    let name = l.name;
    if (name && name.startsWith('.')) {
      const mapped = extMap[name.toLowerCase()];
      if (mapped) {
        name = mapped;
      } else {
        name = name.substring(1).toUpperCase();
      }
    }
    return `${name} (${l.percentage}%)`;
  }).join(', ');
}

function buildRepoContext(repo) {
  const name = repo.name || 'Unknown';
  const owner = repo.owner || 'Unknown';
  const description = repo.description || 'Not provided';
  const defaultBranch = repo.defaultBranch || 'main';
  const fileCount = repo.stats?.fileCount || 0;
  
  const languagesStr = formatLanguages(repo.stats?.languages);
  const frameworksStr = repo.stats?.frameworks?.join(', ') || 'None detected';
  
  const deps = repo.stats?.dependencies || [];
  const devDeps = repo.stats?.devDependencies || [];
  
  const depsCount = deps.length;
  const devDepsCount = devDeps.length;
  
  const firstDeps = deps.slice(0, 25).join(', ') || 'None';
  const firstDevDeps = devDeps.slice(0, 15).join(', ') || 'None';
  
  const hasTests = repo.stats?.hasTests ? 'Yes' : 'No';
  const hasDocumentation = repo.stats?.hasDocumentation ? 'Yes' : 'No';
  
  const health = repo.healthScore || { overall: 0, maintainability: 0, documentation: 0, testCoverage: 0, dependencyHealth: 0 };
  
  const nodes = repo.graph?.nodes || [];
  const nodeCount = nodes.length;
  
  const districts = new Set();
  const typeCounts = {};
  
  for (const node of nodes) {
    if (node.district) {
      districts.add(node.district);
    }
    if (node.type) {
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
    }
  }
  
  const districtCount = districts.size;
  
  const typeStrings = Object.entries(typeCounts).map(([type, count]) => {
    const typeLabel = count === 1 ? type : (type.endsWith('s') ? type : `${type}s`);
    return `${count} ${typeLabel}`;
  });
  const componentTypesStr = typeStrings.join(', ') || 'None detected';
  
  const componentsList = nodes
    .map(n => `- [${n.file || n.id}] (Type: ${n.type || 'other'}, Complexity: ${n.complexity || 5}/10, Feature Area: ${n.district || 'core'})`)
    .join('\n');

  const edges = repo.graph?.edges || [];
  const relationshipsStr = edges
    .map(e => `- [${e.source}] calls [${e.target}]`)
    .join('\n');

  return `Repository: ${name} (Owner: ${owner})
Description: ${description}
Default branch: ${defaultBranch}
Total files analyzed: ${fileCount}
Languages detected: ${languagesStr}
Frameworks detected: ${frameworksStr}
Dependencies (${depsCount}): ${firstDeps}
Dev dependencies (${devDepsCount}): ${firstDevDeps}
Has automated tests: ${hasTests}
Has documentation: ${hasDocumentation}
Health score: ${health.overall}/100
  - Maintainability: ${health.maintainability}/100
  - Documentation: ${health.documentation}/100
  - Test coverage: ${health.testCoverage}/100
  - Dependency health: ${health.dependencyHealth}/100
Architecture: ${nodeCount} components detected across ${districtCount} feature areas
Component types: ${componentTypesStr}

List of Files / Components in Codebase:
${componentsList || 'No components mapped.'}

Dependencies / Internal Call Graph Relationships:
${relationshipsStr || 'No relationships mapped.'}`;
}

export async function generateRepoSummary(repo) {
  const groq = getGroqClient();
  if (!groq) {
    const name = repo.name || 'this repository';
    const frameworks = repo.stats?.frameworks || [];
    const primaryLangs = (repo.stats?.languages || []).slice(0, 3).map(l => {
      let n = l.name;
      if (n && n.startsWith('.')) {
        const mapped = extMap[n.toLowerCase()];
        n = mapped || n.substring(1).toUpperCase();
      }
      return `${n} (${l.percentage}%)`;
    });
    
    let summary = `This codebase (${name}) is primarily built using ${primaryLangs.join(', ') || 'various programming languages'}.`;
    
    if (frameworks.length > 0) {
      summary += ` It integrates key frameworks and libraries such as ${frameworks.join(', ')}.`;
    }
    
    if (repo.stats?.hasTests) {
      summary += ` It includes an automated test setup, promoting code reliability and testing practices.`;
    } else {
      summary += ` Currently, no automated tests were detected, suggesting an area for future improvement.`;
    }

    if (repo.stats?.hasDocumentation) {
      summary += ` The repository contains structured documentation (such as a README or docs folder) explaining the project setup and architecture.`;
    }

    const fileCount = repo.stats?.fileCount || 0;
    summary += ` With a total of ${fileCount} files, the overall structure exhibits a modular architecture, organized into distinct logical directories.`;

    return summary;
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a senior software architect. Analyze codebases based ONLY on the structured data provided — never guess or speculate beyond what the data shows. Be concise and technically precise."
        },
        {
          role: "user",
          content: buildRepoContext(repo) + '\n\n' +
            'Generate a 3-paragraph developer summary:\n' +
            'Paragraph 1: What this project does and its primary purpose.\n' +
            'Paragraph 2: The technology stack and architectural patterns.\n' +
            'Paragraph 3: One specific strength and one area for improvement based strictly on the health scores above.\n' +
            'Be direct and factual. Do not invent features or capabilities not evidenced by the data.'
        }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content || "";
    return content;
  } catch (error) {
    console.error("generateRepoSummary Groq error:", error.message);
    const name = repo.name || 'this repository';
    const frameworks = repo.stats?.frameworks || [];
    const primaryLangs = (repo.stats?.languages || []).slice(0, 3).map(l => {
      let n = l.name;
      if (n && n.startsWith('.')) {
        const mapped = extMap[n.toLowerCase()];
        n = mapped || n.substring(1).toUpperCase();
      }
      return `${n} (${l.percentage}%)`;
    });
    
    let summary = `This codebase (${name}) is primarily built using ${primaryLangs.join(', ') || 'various programming languages'}.`;
    
    if (frameworks.length > 0) {
      summary += ` It integrates key frameworks and libraries such as ${frameworks.join(', ')}.`;
    }
    
    summary += ` With a total of ${repo.stats?.fileCount || 0} files, the overall structure exhibits a modular architecture, organized into distinct logical directories.`;

    return summary;
  }
}

export async function generateChatResponse(repo, conversationHistory, newMessage) {
  const groq = getGroqClient();
  if (!groq) {
    const nodes = repo.graph?.nodes || [];
    const query = newMessage.toLowerCase();

    if (query.includes('auth') || query.includes('login') || query.includes('register') || query.includes('jwt') || query.includes('token')) {
      const authFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('auth') || n.file.toLowerCase().includes('middleware') || n.type === 'middleware'));
      let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
      text += `Authentication and request validation in this repository are managed by the following structures:\n\n`;
      const citations = [];
      if (authFiles.length > 0) {
        authFiles.forEach(f => {
          text += `- **[${f.file}]** (Type: *${f.type}*, Complexity: *${f.complexity}/10*): Implements verification logic and handler routes.\n`;
          citations.push(f.file);
        });
      } else {
        text += `No dedicated authentication controllers or middleware files were detected in the active graph nodes.\n`;
      }
      return { text, citations };
    }

    if (query.includes('database') || query.includes('model') || query.includes('schema') || query.includes('mongo') || query.includes('db')) {
      const modelFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('model') || n.file.toLowerCase().includes('schema') || n.type === 'model' || n.type === 'database'));
      let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
      text += `The database integrations and data schemas are defined in these files:\n\n`;
      const citations = [];
      if (modelFiles.length > 0) {
        modelFiles.forEach(f => {
          text += `- **[${f.file}]** (Type: *${f.type}*, District: *${f.district}*): Structures collection fields and storage interfaces.\n`;
          citations.push(f.file);
        });
      } else {
        text += `No database models or storage files were found in the parsed codebase.\n`;
      }
      return { text, citations };
    }

    if (query.includes('route') || query.includes('api') || query.includes('endpoint')) {
      const routeFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('route') || n.type === 'route'));
      let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
      text += `The project exposes its API endpoints through these routes files:\n\n`;
      const citations = [];
      if (routeFiles.length > 0) {
        routeFiles.forEach(f => {
          text += `- **[${f.file}]** (Type: *${f.type}*): Connects HTTP entry paths to controllers.\n`;
          citations.push(f.file);
        });
      } else {
        text += `No route files were detected in the parsed codebase.\n`;
      }
      return { text, citations };
    }

    if (query.includes('controller') || query.includes('handler')) {
      const controllerFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('controller') || n.type === 'controller'));
      let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
      text += `The business logic controllers for handling server queries are:\n\n`;
      const citations = [];
      if (controllerFiles.length > 0) {
        controllerFiles.forEach(f => {
          text += `- **[${f.file}]** (Type: *${f.type}*, Complexity: *${f.complexity}/10*): Decouples request parsing from data storage operations.\n`;
          citations.push(f.file);
        });
      } else {
        text += `No controllers were detected in the parsed codebase.\n`;
      }
      return { text, citations };
    }

    if (query.includes('service')) {
      const serviceFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('service') || n.type === 'service'));
      let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
      text += `The service layer files in this repository are:\n\n`;
      const citations = [];
      if (serviceFiles.length > 0) {
        serviceFiles.forEach(f => {
          text += `- **[${f.file}]** (Type: *${f.type}*): Contains business logic and external integrations.\n`;
          citations.push(f.file);
        });
      } else {
        text += `No service files were detected in the parsed codebase.\n`;
      }
      return { text, citations };
    }

    if (query.includes('node') || query.includes('graph') || query.includes('structure') || query.includes('file')) {
      let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
      text += `This repository contains **${nodes.length}** analyzed components across the following files:\n\n`;
      const citations = [];
      const shown = nodes.slice(0, 20);
      if (shown.length > 0) {
        shown.forEach(f => {
          text += `- **[${f.file}]** (Type: *${f.type}*, Complexity: *${f.complexity}/10*)\n`;
          citations.push(f.file);
        });
      } else {
        text += `No files have been analyzed in the repository graph yet.\n`;
      }
      if (nodes.length > 20) {
        text += `\nShowing first 20 of ${nodes.length} files. Ask about a specific category for more details.\n`;
      }
      return { text, citations };
    }

    let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
    text += `### Codebase Summary\n${repo.summary || 'No summary generated.'}\n\n`;
    text += `* **Tech Stack:** ${repo.stats?.frameworks?.join(', ') || 'Various JS libraries'}\n`;
    text += `* **Health Score:** ${repo.healthScore?.overall || 80}/100\n`;
    text += `* **Total Files:** ${repo.stats?.fileCount || 0}\n\n`;
    text += `Ask me about specific modules such as **authentication**, **database schemas**, **routes**, **controllers**, **services**, or **graph nodes** to examine file listings.`;
    const citations = nodes.slice(0, 3).map(n => n.file).filter(Boolean) || [];
    return { text, citations };
  }

  try {
    const messages = [...conversationHistory, { role: 'user', content: newMessage }];
    
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: 
            'You are an expert code assistant for the repository: ' + repo.name + '.\n' +
            buildRepoContext(repo) + '\n\n' +
            'RULES:\n' +
            '1. Answer questions based ONLY on the repository data above.\n' +
            '2. When referencing a specific file, format it as [filename.js] — the UI renders these as clickable citation chips.\n' +
            '3. If a question cannot be answered from the available data, say clearly: "This cannot be determined from the analyzed data."\n' +
            '4. Never invent file names, functions, or behavior not evidenced above.\n' +
            '5. Be concise and technically precise.'
        },
        ...messages
      ],
      temperature: 0.2
    });
    
    const responseText = response.choices?.[0]?.message?.content || "";
    const matches = [...responseText.matchAll(/\[([^\]]+\.[a-z]{1,5})\]/g)];
    const extractedFilenames = [...new Set(matches.map(m => m[1]))];
    
    return {
      text: responseText,
      citations: extractedFilenames
    };
  } catch (error) {
    console.error("generateChatResponse Groq error:", error.message);
    const nodes = repo.graph?.nodes || [];
    const query = newMessage.toLowerCase();
    let text = `[Local Codebase Assistant] Analyzing query for repository: **${repo.name}**\n\n`;
    const citations = [];

    if (query.includes('auth') || query.includes('login') || query.includes('register') || query.includes('jwt') || query.includes('token')) {
      const authFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('auth') || n.file.toLowerCase().includes('middleware') || n.type === 'middleware'));
      text += `Authentication and request validation in this repository are managed by the following structures:\n\n`;
      authFiles.forEach(f => {
        text += `- **[${f.file}]** (Type: *${f.type}*, Complexity: *${f.complexity}/10*): Implements verification logic and handler routes.\n`;
        citations.push(f.file);
      });
      if (authFiles.length === 0) text += `No dedicated authentication controllers or middleware files were detected in the active graph nodes.\n`;
    } else if (query.includes('database') || query.includes('model') || query.includes('schema') || query.includes('mongo') || query.includes('db')) {
      const modelFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('model') || n.file.toLowerCase().includes('schema') || n.type === 'model' || n.type === 'database'));
      text += `The database integrations and data schemas are defined in these files:\n\n`;
      modelFiles.forEach(f => {
        text += `- **[${f.file}]** (Type: *${f.type}*, District: *${f.district}*): Structures collection fields and storage interfaces.\n`;
        citations.push(f.file);
      });
      if (modelFiles.length === 0) text += `No database models or storage files were found in the parsed codebase.\n`;
    } else if (query.includes('route') || query.includes('api') || query.includes('endpoint')) {
      const routeFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('route') || n.type === 'route'));
      text += `The project exposes its API endpoints through these routes files:\n\n`;
      routeFiles.forEach(f => {
        text += `- **[${f.file}]** (Type: *${f.type}*): Connects HTTP entry paths to controllers.\n`;
        citations.push(f.file);
      });
      if (routeFiles.length === 0) text += `No route files were detected in the parsed codebase.\n`;
    } else if (query.includes('controller') || query.includes('handler')) {
      const controllerFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('controller') || n.type === 'controller'));
      text += `The business logic controllers for handling server queries are:\n\n`;
      controllerFiles.forEach(f => {
        text += `- **[${f.file}]** (Type: *${f.type}*, Complexity: *${f.complexity}/10*): Decouples request parsing from data storage operations.\n`;
        citations.push(f.file);
      });
      if (controllerFiles.length === 0) text += `No controllers were detected in the parsed codebase.\n`;
    } else if (query.includes('service')) {
      const serviceFiles = nodes.filter(n => n.file && (n.file.toLowerCase().includes('service') || n.type === 'service'));
      text += `The service layer files in this repository are:\n\n`;
      serviceFiles.forEach(f => {
        text += `- **[${f.file}]** (Type: *${f.type}*): Contains business logic and external integrations.\n`;
        citations.push(f.file);
      });
      if (serviceFiles.length === 0) text += `No service files were detected in the parsed codebase.\n`;
    } else {
      text += `### Codebase Summary\n${repo.summary || 'No summary generated.'}\n\n`;
      text += `* **Tech Stack:** ${repo.stats?.frameworks?.join(', ') || 'Various JS libraries'}\n`;
      text += `* **Health Score:** ${repo.healthScore?.overall || 80}/100\n`;
      text += `* **Total Files:** ${repo.stats?.fileCount || 0}\n\n`;
      text += `Ask me about specific modules such as **authentication**, **database schemas**, **routes**, **controllers**, or **services** to examine file listings.`;
      const files = nodes.slice(0, 3).map(n => n.file).filter(Boolean) || [];
      citations.push(...files);
    }

    return { text, citations };
  }
}

export async function analyzeFeatureImpact(repo, featureDescription) {
  const groq = getGroqClient();
  if (!groq) {
    return {
      riskLevel: 'Medium',
      riskRationale: 'The proposed feature requires modifications to existing components and routes.',
      summary: `Implementing "${featureDescription}" will introduce changes to repository components and add corresponding routes.`,
      filesAffected: repo.graph?.nodes?.slice(0, 2).map(n => ({ path: n.id, reason: 'Needs integration of feature logic' })) || [],
      apisAffected: [
        { method: 'POST', route: '/api/features', change: 'Register endpoint for the new feature' }
      ],
      databaseChanges: [
        { collection: 'repositories', change: 'Store additional metadata if necessary' }
      ],
      componentsAffected: repo.graph?.nodes?.slice(0, 2).map(n => ({ name: n.label, reason: 'Logic changes' })) || [],
      affectedNodeIds: repo.graph?.nodes?.slice(0, 2).map(n => n.id) || []
    };
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            buildRepoContext(repo) + '\n\n' +
            'You analyze the impact of adding new features to software repositories.\n' +
            'Respond ONLY with valid JSON — no preamble, no markdown, no code fences.\n' +
            'Base all analysis strictly on the repository structure data provided.'
        },
        {
          role: 'user',
          content:
            'Feature to add: "' + featureDescription + '"\n\n' +
            'Repository graph nodes (first 60):\n' +
            JSON.stringify(repo.graph.nodes.slice(0, 60), null, 2) + '\n\n' +
            'Return JSON with EXACTLY these keys:\n' +
            '{\n' +
            '  "riskLevel": "Low" | "Medium" | "High",\n' +
            '  "riskRationale": "one sentence explaining the risk rating",\n' +
            '  "summary": "2-sentence overview of the impact",\n' +
            '  "filesAffected": [{ "path": "string", "reason": "string" }],\n' +
            '  "apisAffected": [{ "method": "GET|POST|PUT|DELETE", "route": "string", "change": "string" }],\n' +
            '  "databaseChanges": [{ "collection": "string", "change": "string" }],\n' +
            '  "componentsAffected": [{ "name": "string", "reason": "string" }],\n' +
            '  "affectedNodeIds": ["exact id strings from the graph nodes above"]\n' +
            '}'
        }
      ],
      temperature: 0.2
    });

    const responseText = response.choices?.[0]?.message?.content || "";
    try {
      return JSON.parse(responseText);
    } catch (e) {
      try {
        const cleanedText = responseText
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/, '')
          .trim();
        return JSON.parse(cleanedText);
      } catch (err) {
        return {
          riskLevel: 'Unknown',
          riskRationale: 'Could not parse AI response',
          filesAffected: [],
          apisAffected: [],
          databaseChanges: [],
          componentsAffected: [],
          affectedNodeIds: []
        };
      }
    }
  } catch (error) {
    console.error("analyzeFeatureImpact Groq error:", error.message);
    return {
      riskLevel: 'Unknown',
      riskRationale: 'Groq request failed; fallback data unavailable.',
      summary: `Impact analysis for "${featureDescription}" could not be completed due to an AI service error.`,
      filesAffected: repo.graph?.nodes?.slice(0, 2).map(n => ({ path: n.id, reason: 'Needs review' })) || [],
      apisAffected: [],
      databaseChanges: [],
      componentsAffected: repo.graph?.nodes?.slice(0, 2).map(n => ({ name: n.label, reason: 'Needs review' })) || [],
      affectedNodeIds: repo.graph?.nodes?.slice(0, 2).map(n => n.id) || []
    };
  }
}
