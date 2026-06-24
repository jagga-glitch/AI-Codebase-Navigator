import { AppError } from '../middleware/errorHandler.js';
import Repository from '../models/Repository.js';
import Chat from '../models/Chat.js';
import { analyzeRepositoryBackground } from '../services/analyzeRepo.js';
import { analyzeFeatureImpact } from '../services/aiService.js';
import { generateKnowledgeGap } from '../services/knowledgeGap.js';
import { fetchFileContent } from '../services/githubApi.js';

/**
 * Submits a new repository.
 */
export const createRepo = async (req, res) => {
  const { githubUrl } = req.body;

  if (!githubUrl) {
    throw new AppError('GitHub URL is required', 400);
  }

  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
  if (!githubRegex.test(githubUrl)) {
    throw new AppError('Please provide a valid GitHub repository URL', 400);
  }

  // Check if this user already submitted this exact URL
  const existingRepo = await Repository.findOne({
    userId: req.user._id,
    githubUrl
  });

  if (existingRepo) {
    throw new AppError('You have already submitted this repository', 409);
  }

  const repo = await Repository.create({
    userId: req.user._id,
    githubUrl,
    status: 'pending'
  });

  // Return 201 with the created repo
  res.status(201).json(repo);

  // Non-blocking background analysis call
  analyzeRepositoryBackground(repo._id).catch(err => {
    console.error('Background analysis failed:', err);
  });
};

/**
 * Gets all repositories for the logged in user.
 */
export const getRepos = async (req, res) => {
  const repos = await Repository.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('-graph -insights');

  res.status(200).json({
    success: true,
    count: repos.length,
    repos
  });
};

/**
 * Gets a single repository by ID.
 */
export const getRepo = async (req, res) => {
  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  res.status(200).json(repo);
};

/**
 * Deletes a repository and all its associated chats.
 */
export const deleteRepo = async (req, res) => {
  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  await repo.deleteOne();
  await Chat.deleteMany({ repoId: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Repository deleted'
  });
};

/**
 * Gets the graph nodes and edges for a repository.
 */
export const getGraph = async (req, res) => {
  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  if (repo.status !== 'done') {
    throw new AppError('Graph not yet available — repository is still being analyzed', 400);
  }

  res.status(200).json({
    success: true,
    nodes: repo.graph.nodes,
    edges: repo.graph.edges
  });
};

/**
 * Analyzes the potential impact of implementing a new feature in the repository.
 */
export const analyzeImpact = async (req, res) => {
  const { feature } = req.body;
  if (!feature || typeof feature !== 'string' || feature.trim() === '') {
    throw new AppError('Feature description is required', 400);
  }

  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  if (repo.status !== 'done') {
    throw new AppError('Repository is still being analyzed', 400);
  }

  const result = await analyzeFeatureImpact(repo, feature);

  res.status(200).json({
    success: true,
    impact: result
  });
};

/**
 * Generates the knowledge gap report for a repository.
 */
export const getKnowledgeGap = async (req, res) => {
  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  if (repo.status !== 'done') {
    throw new AppError('Repository is still being analyzed', 400);
  }

  if (repo.knowledgeGap) {
    return res.status(200).json({
      success: true,
      knowledgeGap: repo.knowledgeGap
    });
  }

  const result = await generateKnowledgeGap(repo);
  repo.knowledgeGap = result;
  await repo.save();

  res.status(200).json({
    success: true,
    knowledgeGap: result
  });
};

/**
 * Proxies file content retrieval from GitHub for the active repository.
 */
export const getFileContent = async (req, res) => {
  const repo = await Repository.findById(req.params.id);

  if (!repo) {
    throw new AppError('Repository not found', 404);
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this repository', 403);
  }

  const { path: filePath } = req.query;
  if (!filePath || typeof filePath !== 'string') {
    throw new AppError('File path parameter is required', 400);
  }

  const content = await fetchFileContent(repo.owner, repo.name.split('/')[1] || repo.name, filePath, repo.defaultBranch);
  
  if (content === null) {
    throw new AppError('File not found in repository', 404);
  }

  res.status(200).json({
    success: true,
    content
  });
};

export default {
  createRepo,
  getRepos,
  getRepo,
  deleteRepo,
  getGraph,
  analyzeImpact,
  getKnowledgeGap,
  getFileContent
};
