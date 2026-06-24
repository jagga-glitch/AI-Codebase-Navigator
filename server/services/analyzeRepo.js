import Repository from '../models/Repository.js';
import * as githubApi from './githubApi.js';
import * as fileParser from './fileParser.js';
import graphBuilder from './graphBuilder.js';
import * as aiService from './aiService.js';

const { parseGithubUrl, fetchRepoMeta, fetchFileTree, fetchFileContent } = githubApi;
const { countByExtension, detectFrameworks, detectTestSetup, detectDocumentation, calculateHealthScore } = fileParser;
const { generateRepoSummary } = aiService;

/**
 * Runs repository analysis in the background.
 * Must NEVER throw an uncaught error.
 * 
 * @param {string} repoId - The repository database identifier.
 */
export const analyzeRepositoryBackground = async (repoId) => {
  let repo = null;
  try {
    // 1. Find the repository
    repo = await Repository.findById(repoId);
    if (!repo) {
      console.error(`[Background Service] Repository not found for ID: ${repoId}`);
      return;
    }

    // 2. Set status to analyzing and save
    repo.status = 'analyzing';
    await repo.save();
    console.log('Starting analysis for: ' + repo.githubUrl);

    // 3. Parse GitHub URL
    const { owner, repo: repoName } = parseGithubUrl(repo.githubUrl);

    // 4. Fetch repo metadata
    const meta = await fetchRepoMeta(owner, repoName);
    repo.name = `${owner}/${repoName}`;
    repo.owner = owner;
    repo.description = meta.description;
    repo.defaultBranch = meta.defaultBranch;

    // 5. Fetch file tree
    const { fullTree, tree, branch } = await fetchFileTree(owner, repoName, meta.defaultBranch);
    repo.defaultBranch = branch;

    // 6. Fetch package.json content (gracefully returns null if not found)
    const packageJsonContent = await fetchFileContent(owner, repoName, 'package.json', branch);

    // Parse package.json dependencies and devDependencies
    let dependencies = [];
    let devDependencies = [];
    if (packageJsonContent) {
      try {
        const parsed = JSON.parse(packageJsonContent);
        dependencies = Object.keys(parsed.dependencies || {});
        devDependencies = Object.keys(parsed.devDependencies || {});
      } catch (err) {
        console.warn(`[Background Service] Failed to parse package.json for dependencies: ${err.message}`);
      }
    }

    // 7. Compute stats
    const languages = countByExtension(fullTree);
    const frameworks = detectFrameworks(packageJsonContent);
    const hasTests = detectTestSetup(fullTree);
    const hasDocumentation = detectDocumentation(fullTree);
    const fileCount = fullTree.length;

    const folders = new Set();
    fullTree.forEach(file => {
      if (file && file.path && file.path.includes('/')) {
        const parts = file.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          folders.add(parts.slice(0, i).join('/'));
        }
      }
    });
    const folderCount = folders.size;

    // Build graph first to calculate real average complexity
    const graph = graphBuilder(tree, packageJsonContent, owner, repoName);
    const nodeComplexities = (graph?.nodes || [])
      .map(n => n.complexity)
      .filter(c => typeof c === 'number');
    const avgFileComplexity = nodeComplexities.length > 0
      ? parseFloat((nodeComplexities.reduce((sum, val) => sum + val, 0) / nodeComplexities.length).toFixed(2))
      : 5.0;

    repo.stats = {
      fileCount,
      totalFiles: fileCount,
      folderCount,
      languages,
      frameworks,
      dependencies,
      devDependencies,
      hasTests,
      hasDocumentation,
      avgFileComplexity
    };

    // 8. Calculate health score
    repo.healthScore = calculateHealthScore(repo.stats);

    // 9. Assign graph
    repo.graph = graph;

    // Save full list of file paths (Phase 11: Remove limits on explorer view)
    // Capped at 10000 to prevent hitting MongoDB document size limit (16MB) on extremely large repositories
    repo.files = fullTree.slice(0, 10000).map(file => file.path);

    // 10. Generate AI summary
    const aiSummary = await generateRepoSummary(repo);
    repo.summary = aiSummary;

    // 11. Finalize status and save
    repo.status = 'done';
    repo.analyzedAt = new Date();
    await repo.save();
    console.log('Analysis complete for: ' + repo.name);

  } catch (err) {
    console.error('Analysis failed for', repo ? repo.githubUrl : repoId, ':', err.message);
    if (repo) {
      try {
        repo.status = 'error';
        repo.errorMessage = err.message;
        await repo.save();
      } catch (saveErr) {
        console.error('[Background Service] Failed to save repository error status:', saveErr.message);
      }
    }
  }
};
