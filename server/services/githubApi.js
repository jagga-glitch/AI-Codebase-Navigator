import { AppError } from '../middleware/errorHandler.js';

/**
 * Base fetch wrapper for GitHub API requests.
 * Adds User-Agent and optional Authorization header, and maps HTTP error status codes.
 * 
 * @param {string} url 
 * @returns {Promise<any>} Parsed JSON response
 */
async function githubFetch(url) {
  const headers = {
    'User-Agent': 'codebase-navigator/1.0'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
      throw new AppError('GitHub API rate limit reached. Try again in 60 seconds.', 429);
    }
    if (res.status === 404) {
      throw new AppError('Repository not found or is private', 404);
    }
    throw new AppError('GitHub API error: ' + res.status, 502);
  }

  return await res.json();
}

/**
 * Extracts the owner and repository name from a GitHub repository URL.
 * Supports trailing slash, trailing .git, and standard formats.
 * 
 * @param {string} url 
 * @returns {{ owner: string, repo: string }}
 */
export function parseGithubUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new AppError('Could not parse GitHub URL — please use format: https://github.com/owner/repo', 400);
  }

  const cleaned = url.trim().replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)$/i);

  if (!match) {
    throw new AppError('Could not parse GitHub URL — please use format: https://github.com/owner/repo', 400);
  }

  return {
    owner: match[1],
    repo: match[2]
  };
}

/**
 * Fetches high-level repository metadata from GitHub.
 * 
 * @param {string} owner 
 * @param {string} repo 
 * @returns {Promise<{ description: string|null, defaultBranch: string, stars: number, language: string|null }>}
 */
export async function fetchRepoMeta(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const data = await githubFetch(url);

  return {
    description: data.description,
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    language: data.language
  };
}

/**
 * Fetches the recursive file tree of a repository for a given branch.
 * Retries with 'master' if 'main' fails with a 404.
 * 
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} branch 
 * @returns {Promise<{ tree: Array<any>, branch: string }>}
 */
export async function fetchFileTree(owner, repo, branch = 'main') {
  let data;
  let actualBranch = branch;

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    data = await githubFetch(url);
  } catch (err) {
    if (branch === 'main' && err instanceof AppError && err.statusCode === 404) {
      try {
        actualBranch = 'master';
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
        data = await githubFetch(url);
      } catch (retryErr) {
        throw new AppError('Repository not found or is private', 404);
      }
    } else {
      throw err;
    }
  }
  const tree = data.tree || [];
  const filteredTree = tree
    .filter(item => item.type === 'blob' && 
      !item.path.includes('node_modules/') &&
      !item.path.includes('.git/') &&
      !item.path.includes('dist/') &&
      !item.path.includes('build/') &&
      !item.path.includes('.next/') &&
      !item.path.includes('coverage/')
    );
  
  return {
    fullTree: filteredTree,
    tree: filteredTree.slice(0, 2000),
    branch: actualBranch
  };
}

/**
 * Fetches the contents of a single file from a repository.
 * 
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} path 
 * @param {string} branch 
 * @returns {Promise<string|null>} Decoded content, or null if file is 404 not found
 */
export async function fetchFileContent(owner, repo, path, branch) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const headers = {
      'User-Agent': 'codebase-navigator/1.0',
      'Accept': 'application/vnd.github.v3.raw'
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new AppError('GitHub API error while fetching file: ' + res.status, 502);
    }

    return await res.text();
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      return null;
    }
    throw err;
  }
}
