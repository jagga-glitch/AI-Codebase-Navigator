import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  githubUrl: {
    type: String,
    required: [true, 'GitHub URL is required'],
    trim: true
  },
  name: String,
  owner: String,
  description: String,
  defaultBranch: {
    type: String,
    default: 'main'
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'done', 'error'],
    default: 'pending',
    index: true
  },
  errorMessage: String,
  stats: {
    fileCount: Number,
    totalFiles: Number,
    folderCount: Number,
    languages: [{
      name: String,
      count: Number,
      percentage: Number
    }],
    frameworks: [String],
    dependencies: [String],
    devDependencies: [String],
    hasTests: {
      type: Boolean,
      default: false
    },
    hasDocumentation: {
      type: Boolean,
      default: false
    },
    avgFileComplexity: Number
  },
  healthScore: {
    overall: Number,
    maintainability: Number,
    documentation: Number,
    testCoverage: Number,
    dependencyHealth: Number
  },
  graph: {
    nodes: [{
      id: String,
      label: String,
      type: {
        type: String
      },
      file: String,
      complexity: Number,
      size: Number,
      district: String,
      _id: false
    }],
    edges: [{
      source: String,
      target: String,
      type: {
        type: String
      },
      _id: false
    }]
  },
  insights: [{
    type: {
      type: String
    },
    severity: {
      type: { type: String },
      enum: ['low', 'medium', 'high', 'critical']
    },
    title: String,
    description: String,
    file: String,
    _id: false
  }],
  summary: String,
  knowledgeGap: mongoose.Schema.Types.Mixed,
  files: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: Date
});

// Compound unique index per user
repositorySchema.index({ userId: 1, githubUrl: 1 }, { unique: true });

const Repository = mongoose.model('Repository', repositorySchema);
export default Repository;
