import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useRepoDetails } from '../hooks/useRepos.js';
import { useRepoGraph } from '../hooks/useRepoAnalysis.js';
import { apiClient } from '../services/apiClient.ts';
import toast from 'react-hot-toast';

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import CityBuildingNode from '../components/CityBuildingNode.jsx';
import TrafficEdge from '../components/TrafficEdge.jsx';
import DistrictGroupNode from '../components/DistrictGroupNode.jsx';

// Custom Node and Edge Types
const nodeTypes = { 
  custom: CityBuildingNode,
  district: DistrictGroupNode
};
const edgeTypes = { traffic: TrafficEdge };

// District Mapping and Color Helpers
const getNormalizedDistrict = (origDistrict, nodeId) => {
  const path = (nodeId || '').toLowerCase();
  
  if (path.includes('auth') || path.includes('jwt') || path.includes('session') || path.includes('login') || path.includes('register') || path.includes('passport') || path.includes('token') || path.includes('user')) {
    return 'auth';
  }
  if (path.includes('ai') || path.includes('groq') || path.includes('openai') || path.includes('gemini') || path.includes('llm') || path.includes('model_ai') || path.includes('prompt') || path.includes('knowledge') || path.includes('gap') || path.includes('assistant') || path.includes('chat')) {
    return 'ai';
  }
  if (path.includes('external') || path.includes('github') || path.includes('octokit') || path.includes('fetch') || path.includes('axios') || path.includes('http') || path.includes('apiclient') || path.includes('stripe') || path.includes('sendgrid') || path.includes('aws') || nodeId.startsWith('ext_')) {
    return 'external';
  }
  if (path.includes('model') || path.includes('schema') || path.includes('database') || path.includes('mongodb') || path.includes('db') || origDistrict === 'infrastructure') {
    return 'database';
  }
  if (path.includes('component') || path.includes('page') || path.includes('view') || path.includes('hook') || path.includes('context') || path.includes('layout') || path.includes('assets') || path.includes('css') || path.includes('html') || path.endsWith('.jsx') || path.endsWith('.tsx') || path.endsWith('.css') || origDistrict.includes('frontend')) {
    return 'frontend';
  }
  return 'backend';
};

const getDistrictColor = (dName) => {
  switch (dName) {
    case 'frontend': return '#a855f7'; // Neon Purple
    case 'backend': return '#3b82f6'; // Electric Blue
    case 'database': return '#10b981'; // Emerald Green
    case 'auth': return '#f59e0b'; // Golden Yellow
    case 'ai': return '#f97316'; // Neon Orange
    case 'external': return '#ec4899'; // Hot Pink
    default: return '#64748b'; // Slate Grey
  }
};

const getDistrictLabel = (dName) => {
  switch (dName) {
    case 'frontend': return 'Frontend';
    case 'backend': return 'Backend Core';
    case 'database': return 'Database Access';
    case 'auth': return 'Authentication';
    case 'ai': return 'AI Services';
    case 'external': return 'External Services';
    default: return 'Core Infrastructure';
  }
};

function ArchitecturePageContent() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSelectedFile = searchParams.get('file') || '';

  const { data: repo } = useRepoDetails(repoId);
  const { data: graphData, isLoading: isGraphLoading } = useRepoGraph(repoId);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { setCenter, fitView } = useReactFlow();

  // Navigation tabs in Left Sidebar: 'overview' | 'flows' | 'insights'
  const [leftTab, setLeftTab] = useState('overview');
  // Right Inspector Panel tabs: 'overview' | 'dependencies' | 'ai' | 'role'
  const [inspectorTab, setInspectorTab] = useState('overview');

  // Search, hover, and selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [nodeExplanation, setNodeExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [isAltTracing, setIsAltTracing] = useState(false);

  // Business logic flow states
  const [activeFlow, setActiveFlow] = useState('');
  const [flowStep, setFlowStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Preset Business Flow Walkthroughs mapping nodes dynamically
  const businessFlows = useMemo(() => {
    return {
      auth: {
        title: 'Authentication Flow',
        description: 'Traces request verification from auth routes, checks JWT verification, queries user database models, and returns session response.',
        steps: [
          { pattern: 'login', type: 'route', desc: 'Login: Client credentials submission' },
          { pattern: 'auth', type: 'route', desc: 'Route: Auth routing gateway' },
          { pattern: 'controller', type: 'controller', desc: 'Controller: Auth controller payload parsing' },
          { pattern: 'service', type: 'service', desc: 'Service: Authentication service validation' },
          { pattern: 'user', type: 'model', desc: 'Model: User schema query' },
          { pattern: 'mongodb', type: 'database', desc: 'Database: MongoDB record retrieval' },
          { pattern: 'jwt', type: 'middleware', desc: 'JWT: Token generation & session response' }
        ]
      },
      repo: {
        title: 'Repository Analysis Flow',
        description: 'Traces repository submission, stores metadata status, triggers analysis service, parses files, and constructs node graphs.',
        steps: [
          { pattern: 'repos', type: 'route', desc: 'Repository: GitHub repository URL registration' },
          { pattern: 'github', type: 'service', desc: 'GitHub Fetch: API fetches codebase structure' },
          { pattern: 'parser', type: 'service', desc: 'Parser: Code parser extracts files & stats' },
          { pattern: 'analyze', type: 'service', desc: 'Analyzer: Assesses complexities & tech debt' },
          { pattern: 'graph', type: 'service', desc: 'Graph Builder: Connects call relations' },
          { pattern: 'knowledge', type: 'service', desc: 'Knowledge Engine: AI engine builds gap map' },
          { pattern: 'mongodb', type: 'database', desc: 'Database: Stores analysis records' }
        ]
      },
      impact: {
        title: 'Impact Analysis Flow',
        description: 'Traces feature request, performs full graph traversal to locate dependent modules, and assesses code modification risk.',
        steps: [
          { pattern: 'impact', type: 'route', desc: 'Feature: Feature input request received' },
          { pattern: 'graph', type: 'service', desc: 'Dependency Graph: Mapping codebase relations' },
          { pattern: 'file', type: 'controller', desc: 'Affected Files: Locating dependent modules' },
          { pattern: 'api', type: 'service', desc: 'Affected APIs: Finding impacted routing gateways' },
          { pattern: 'ai', type: 'service', desc: 'Risk Assessment: AI evaluates modification risk' }
        ]
      }
    };
  }, []);

  // Compute Layout Positions - Software City Districts
  const layoutGraph = useCallback((nodesData, edgesData, highlightedIds = [], selectedId = '', hoveredDistrictName = '') => {
    if (!nodesData || nodesData.length === 0) return [];

    // Group nodes by district
    const districtGroups = {
      frontend: [],
      backend: [],
      database: [],
      auth: [],
      ai: [],
      external: []
    };

    nodesData.forEach(node => {
      const origDist = node.district || 'core';
      const dist = getNormalizedDistrict(origDist, node.id);
      if (districtGroups[dist]) {
        districtGroups[dist].push(node);
      } else {
        districtGroups['backend'].push(node);
      }
    });

    const districtNames = Object.keys(districtGroups);
    const numDistricts = districtNames.length;
    const districtRadius = 800; // Spacing between city blocks to prevent overlaps

    const buildingPositions = {};
    const districtBounds = {};

    // 1. Calculate boundaries and grid coordinates for each district block
    districtNames.forEach((dName, idx) => {
      districtBounds[dName] = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      
      const districtNodes = districtGroups[dName];
      const count = districtNodes.length;
      if (count === 0) return;

      const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(count))));
      const spacingX = 220; // wider margins for 3D building nodes
      const spacingY = 260; // taller spacing for isometric skew

      // Hexagon / Radial layout of district blocks
      const angle = idx * (2 * Math.PI / numDistricts);
      const startX = Math.cos(angle) * districtRadius;
      const startY = Math.sin(angle) * districtRadius;

      districtNodes.forEach((node, nodeIdx) => {
        const col = nodeIdx % cols;
        const row = Math.floor(nodeIdx / cols);

        const offsetX = (cols - 1) * spacingX / 2;
        const x = startX + (col * spacingX) - offsetX;
        const y = startY + (row * spacingY);

        const nodeId = node.id || node.file;
        buildingPositions[nodeId] = { x, y };

        // Expand bounds representing district sizes
        const nodeW = 90;
        const nodeH = 150;
        if (x < districtBounds[dName].minX) districtBounds[dName].minX = x;
        if (x + nodeW > districtBounds[dName].maxX) districtBounds[dName].maxX = x + nodeW;
        if (y < districtBounds[dName].minY) districtBounds[dName].minY = y;
        if (y + nodeH > districtBounds[dName].maxY) districtBounds[dName].maxY = y + nodeH;
      });
    });

    const positionedNodes = [];

    // Calculate edge counts for building heights
    const edgeCounts = {};
    nodesData.forEach(n => {
      edgeCounts[n.id] = { in: 0, out: 0 };
    });
    edgesData.forEach(e => {
      if (edgeCounts[e.source]) edgeCounts[e.source].out += 1;
      if (edgeCounts[e.target]) edgeCounts[e.target].in += 1;
    });

    // 2. Render District Backdrop Group Nodes first (zIndex -1)
    districtNames.forEach(dName => {
      const bounds = districtBounds[dName];
      const districtNodes = districtGroups[dName];
      if (!districtNodes || districtNodes.length === 0) return;

      const paddingX = 70;
      const paddingY = 90;
      
      const width = (bounds.maxX - bounds.minX) + paddingX * 2;
      const height = (bounds.maxY - bounds.minY) + paddingY * 2;
      const x = bounds.minX - paddingX;
      const y = bounds.minY - paddingY;

      const color = getDistrictColor(dName);

      // District average complexity for health indicator
      const avgComplexity = districtNodes.reduce((sum, n) => sum + (n.complexity || 5), 0) / districtNodes.length;
      const health = Math.max(50, Math.min(100, Math.round(100 - (avgComplexity * 6))));

      // Hover glow if hovered
      const isDistrictHighlighted = (hoveredDistrictName === dName) || highlightedIds.some(hId => {
        const matchNode = districtNodes.find(dn => dn.id === hId || dn.file === hId);
        return !!matchNode;
      });

      positionedNodes.push({
        id: `dist-bg-${dName}`,
        type: 'district',
        position: { x, y },
        style: {
          width,
          height,
          zIndex: -1,
          pointerEvents: 'none'
        },
        data: {
          label: getDistrictLabel(dName),
          color,
          health,
          stats: `${districtNodes.length} Files`,
          isHighlighted: isDistrictHighlighted
        }
      });
    });

    // 3. Render Building Nodes on top
    nodesData.forEach(node => {
      const origDist = node.district || 'core';
      const dist = getNormalizedDistrict(origDist, node.id);

      const pos = buildingPositions[node.id || node.file];
      if (!pos) return;

      const nodeId = node.id || node.file;
      const isHighlighted = highlightedIds.includes(nodeId);
      const isSelected = selectedId === nodeId;

      positionedNodes.push({
        id: nodeId,
        type: 'custom',
        position: { x: pos.x, y: pos.y },
        data: {
          ...node,
          incomingCount: edgeCounts[nodeId]?.in || 0,
          outgoingCount: edgeCounts[nodeId]?.out || 0,
          isHighlighted,
          isSelected,
          district: dist
        }
      });
    });

    return positionedNodes;
  }, []);

  // Match flow step queries dynamically from graph nodes
  const getFlowNodes = useCallback((flowKey) => {
    if (!graphData || !graphData.nodes) return [];
    const flow = businessFlows[flowKey];
    if (!flow) return [];

    const mapped = [];
    const usedNodeIds = new Set();

    flow.steps.forEach(step => {
      // 1. Try to find an exact pattern match
      let match = graphData.nodes.find(n => {
        const filePath = (n.file || n.id).toLowerCase();
        const fitsPattern = filePath.includes(step.pattern.toLowerCase());
        const fitsType = step.type ? n.type === step.type : true;
        return fitsPattern && fitsType && !usedNodeIds.has(n.id);
      });

      // 2. If no exact pattern match, find any node matching the required type
      if (!match && step.type) {
        match = graphData.nodes.find(n => n.type === step.type && !usedNodeIds.has(n.id));
      }

      // 3. Fallback: find any node that contains the pattern
      if (!match) {
        match = graphData.nodes.find(n => (n.file || n.id).toLowerCase().includes(step.pattern.toLowerCase()) && !usedNodeIds.has(n.id));
      }

      if (match) {
        mapped.push({ nodeId: match.id, desc: step.desc });
        usedNodeIds.add(match.id);
      }
    });

    // If still empty or too short, synthesize a flow path dynamically for demonstration
    if (mapped.length < 3 && graphData.nodes.length > 0) {
      const types = ['route', 'controller', 'service', 'model', 'database'];
      types.forEach((t, idx) => {
        const found = graphData.nodes.find(n => n.type === t && !usedNodeIds.has(n.id));
        if (found) {
          mapped.push({ 
            nodeId: found.id, 
            desc: `Step ${idx + 1}: Executing logical operations in ${found.label}` 
          });
          usedNodeIds.add(found.id);
        }
      });
    }

    return mapped;
  }, [graphData, businessFlows]);

  // Compute Codebase AI Insights
  const aiInsights = useMemo(() => {
    if (!graphData || !graphData.nodes) {
      return { hubs: [], bottlenecks: [], cycles: [], orphans: [], refactors: [], largest: [], riskHotspots: [], techDebt: 0, healthScore: 100 };
    }

    const nodes = graphData.nodes;
    const edges = graphData.edges || [];

    const edgeCounts = {};
    const adjList = {};
    nodes.forEach(n => {
      edgeCounts[n.id] = { in: 0, out: 0, total: 0 };
      adjList[n.id] = [];
    });

    edges.forEach(e => {
      if (edgeCounts[e.source]) {
        edgeCounts[e.source].out += 1;
        edgeCounts[e.source].total += 1;
        adjList[e.source].push(e.target);
      }
      if (edgeCounts[e.target]) {
        edgeCounts[e.target].in += 1;
        edgeCounts[e.target].total += 1;
      }
    });

    // 1. Most Connected Files (hubs)
    const hubs = [...nodes]
      .map(n => ({ ...n, connections: edgeCounts[n.id]?.total || 0 }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // 2. Bottleneck Services (services with high connections)
    const bottlenecks = [...nodes]
      .filter(n => n.type === 'service')
      .map(n => ({ ...n, connections: edgeCounts[n.id]?.total || 0 }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // 3. Circular Dependencies (Cycles detected using DFS)
    const cycles = [];
    const visited = {};
    const recStack = {};

    const dfs = (nodeId, path = []) => {
      visited[nodeId] = true;
      recStack[nodeId] = true;
      path.push(nodeId);

      const neighbors = adjList[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited[neighbor]) {
          dfs(neighbor, [...path]);
        } else if (recStack[neighbor]) {
          const loopStartIdx = path.indexOf(neighbor);
          if (loopStartIdx !== -1) {
            cycles.push([...path.slice(loopStartIdx), neighbor]);
          }
        }
      }

      recStack[nodeId] = false;
    };

    nodes.forEach(n => {
      if (!visited[n.id]) {
        dfs(n.id);
      }
    });

    // 4. Orphaned Files (orphans)
    const orphans = nodes.filter(n => (edgeCounts[n.id]?.total || 0) === 0).slice(0, 5);

    // 5. Refactor Candidates (complexity >= 7 & connections >= 3)
    const refactors = [...nodes]
      .filter(n => (n.complexity || 5) >= 7 && (edgeCounts[n.id]?.total || 0) >= 3)
      .map(n => ({ ...n, connections: edgeCounts[n.id]?.total || 0 }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // 6. Largest Components (by size / LOC)
    const largest = [...nodes]
      .sort((a, b) => (b.size || 3) - (a.size || 3))
      .slice(0, 5);

    // 7. Risk Hotspots (complexity >= 8, not test)
    const riskHotspots = [...nodes]
      .filter(n => (n.complexity || 5) >= 8 && n.type !== 'test')
      .sort((a, b) => (b.complexity || 5) - (a.complexity || 5))
      .slice(0, 5);

    // Health Score calculation
    const healthScore = Math.max(35, Math.min(100, Math.round(
      100 - (bottlenecks.length * 5) - (cycles.length * 15) - (orphans.length * 2) - (riskHotspots.length * 4)
    )));

    // Tech Debt calculation
    const techDebt = Math.max(5, Math.min(100, Math.round(
      (bottlenecks.length * 10 + cycles.length * 25 + riskHotspots.length * 20) / 10
    )));

    return { hubs, bottlenecks, cycles: cycles.slice(0, 5), orphans, refactors, largest, riskHotspots, techDebt, healthScore };
  }, [graphData]);

  // Transitive Upstream & Downstream Dependencies Traversal for Node Hovers
  const getTransitiveDependencies = useCallback((startNodeId) => {
    if (!graphData || !graphData.edges) return { upstream: [], downstream: [] };
    
    const edges = graphData.edges;
    const upstream = new Set();
    const downstream = new Set();

    // Traverse downstream (dependencies: what I call)
    const findDownstream = (currId, depth = 0) => {
      if (depth > 3) return; // Prevent endless loops or deep traversal slowdowns
      edges.forEach(e => {
        if (e.source === currId && !downstream.has(e.target)) {
          downstream.add(e.target);
          findDownstream(e.target, depth + 1);
        }
      });
    };

    // Traverse upstream (dependents: who calls me)
    const findUpstream = (currId, depth = 0) => {
      if (depth > 3) return;
      edges.forEach(e => {
        if (e.target === currId && !upstream.has(e.source)) {
          upstream.add(e.source);
          findUpstream(e.source, depth + 1);
        }
      });
    };

    findDownstream(startNodeId);
    findUpstream(startNodeId);

    return {
      upstream: Array.from(upstream),
      downstream: Array.from(downstream)
    };
  }, [graphData]);

  // Handle Search, Hover, and Selection Visuals
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    const mappedEdges = (graphData.edges || []).map((edge, idx) => ({
      id: `e-${idx}`,
      source: edge.source,
      target: edge.target,
      type: 'traffic',
      data: {
        isHighlighted: false,
        highlightColor: '#3b82f6',
        edgeWidth: 1.5
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#334155' }
    }));

    let highlightedNodeIds = [];
    let highlightedEdgeIds = [];
    let highlightColor = '#3b82f6';
    let edgeWidth = 2.0;
    const virtualEdges = [];

    if (activeFlow && flowStep >= 0) {
      // 1. Flow Simulation playback highlights
      const flowNodes = getFlowNodes(activeFlow);
      highlightedNodeIds = flowNodes.slice(0, flowStep + 1).map(item => item.nodeId);
      highlightColor = '#10b981'; // Emerald Green
      edgeWidth = 3.5;

      // Highlight matching real edges
      for (let i = 0; i < flowStep; i++) {
        const sourceId = flowNodes[i].nodeId;
        const targetId = flowNodes[i + 1].nodeId;
        const edgeIdx = (graphData.edges || []).findIndex(e => e.source === sourceId && e.target === targetId);
        if (edgeIdx !== -1) {
          highlightedEdgeIds.push(`e-${edgeIdx}`);
        }
      }

      // Generate simulation virtual roads if no direct static edges connect sequential flow stages
      for (let i = 0; i < flowNodes.length - 1; i++) {
        const sourceId = flowNodes[i].nodeId;
        const targetId = flowNodes[i + 1].nodeId;
        const realEdgeExists = (graphData.edges || []).some(e => e.source === sourceId && e.target === targetId);
        if (!realEdgeExists) {
          virtualEdges.push({
            id: `e-virtual-${activeFlow}-${i}`,
            source: sourceId,
            target: targetId,
            type: 'traffic',
            data: {
              isHighlighted: i < flowStep,
              highlightColor: '#10b981',
              edgeWidth: 3.5,
              isVirtual: true
            },
            style: {
              stroke: i < flowStep ? '#10b981' : '#1e293b',
              strokeWidth: i < flowStep ? 3.5 : 1,
              strokeDasharray: '4, 8', // dashed for virtual/indirect paths
              opacity: i < flowStep ? 0.95 : 0.2
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: i < flowStep ? '#10b981' : '#1e293b' }
          });
        }
      }
    } else if (hoveredNodeId) {
      // 2. Dependency Pulse: Highlights hovered node + ALL transitive upstream and downstream files
      const { upstream, downstream } = getTransitiveDependencies(hoveredNodeId);
      highlightedNodeIds = [hoveredNodeId, ...upstream, ...downstream];
      highlightColor = '#f59e0b'; // Amber Gold
      edgeWidth = 3.5;

      (graphData.edges || []).forEach((edge, idx) => {
        // Highlight active connections in the dependency tree
        const connectsHover = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
        const connectsTransitive = (downstream.includes(edge.source) && downstream.includes(edge.target)) || 
                                   (upstream.includes(edge.source) && upstream.includes(edge.target));
        
        if (connectsHover || connectsTransitive) {
          highlightedEdgeIds.push(`e-${idx}`);
        }
      });
    } else if (hoveredDistrict) {
      // 3. District Illumination: All related buildings glow when hovering district backdrops
      highlightedNodeIds = graphData.nodes
        .filter(n => getNormalizedDistrict(n.district, n.id) === hoveredDistrict)
        .map(n => n.id);
      highlightColor = getDistrictColor(hoveredDistrict);
      edgeWidth = 2.0;
    } else if (searchQuery.trim()) {
      // 4. Search matching highlights
      const query = searchQuery.toLowerCase().trim();
      highlightedNodeIds = graphData.nodes
        .filter(n => {
          const label = (n.label || '').toLowerCase();
          const file = (n.file || '').toLowerCase();
          const type = (n.type || '').toLowerCase();
          return label.includes(query) || 
                 file.includes(query) || 
                 type.includes(query) ||
                 (query === 'controllers' && type === 'controller') ||
                 (query === 'services' && type === 'service') ||
                 (query === 'routes' && type === 'route') ||
                 (query === 'models' && type === 'model');
        })
        .map(n => n.id);
      highlightColor = '#06b6d4'; // Cyan
      edgeWidth = 2.5;
    } else if (selectedNode) {
      // 5. Selection highlighting
      highlightedNodeIds = [selectedNode.id];
      highlightColor = '#a855f7'; // Purple
      edgeWidth = 2.5;

      (graphData.edges || []).forEach((edge, idx) => {
        if (edge.source === selectedNode.id) {
          highlightedNodeIds.push(edge.target);
          highlightedEdgeIds.push(`e-${idx}`);
        } else if (edge.target === selectedNode.id) {
          highlightedNodeIds.push(edge.source);
          highlightedEdgeIds.push(`e-${idx}`);
        }
      });
    } else if (initialSelectedFile) {
      const found = graphData.nodes.find(n => n.id === initialSelectedFile || n.file === initialSelectedFile);
      if (found) {
        setSelectedNode(found);
        highlightedNodeIds = [found.id];
      }
    }

    const positionedNodes = layoutGraph(graphData.nodes, graphData.edges, highlightedNodeIds, selectedNode?.id, hoveredDistrict);
    
    // Dim out non-active buildings to create high visual depth focus
    const finalNodes = positionedNodes.map(n => {
      if (n.type === 'district') return n; // Keep backdrop opacity at base
      
      const hasFocus = highlightedNodeIds.length === 0 || highlightedNodeIds.includes(n.id);
      return {
        ...n,
        style: {
          opacity: hasFocus ? 1.0 : 0.15,
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: hasFocus ? 'auto' : 'none'
        }
      };
    });

    setNodes(finalNodes);

    const updatedEdges = [...mappedEdges, ...virtualEdges].map(edge => {
      const isHighlighted = highlightedEdgeIds.includes(edge.id) || 
        (!activeFlow && !searchQuery && selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)) ||
        (edge.data && edge.data.isHighlighted);

      const activeColor = edge.data?.highlightColor || highlightColor;

      return {
        ...edge,
        data: {
          ...edge.data,
          isHighlighted,
          highlightColor: activeColor,
          edgeWidth: isHighlighted ? edgeWidth : 1.2
        },
        style: {
          stroke: isHighlighted ? activeColor : '#334155',
          strokeWidth: isHighlighted ? edgeWidth : 1.2,
          opacity: isHighlighted ? 1.0 : (selectedNode || searchQuery || activeFlow || hoveredNodeId || hoveredDistrict ? 0.05 : 0.25)
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? activeColor : '#334155'
        }
      };
    });
    setEdges(updatedEdges);
  }, [graphData, selectedNode, searchQuery, activeFlow, flowStep, hoveredNodeId, hoveredDistrict, layoutGraph, getFlowNodes, getTransitiveDependencies, setNodes, setEdges, initialSelectedFile]);

  // Double-Click Zoom Neighborhood
  const onNodeDoubleClick = useCallback((event, node) => {
    if (node.type !== 'custom') return;
    setSelectedNode(node.data);
    setCenter(node.position.x + 40, node.position.y + 40, { zoom: 1.6, duration: 800 });
  }, [setCenter]);

  // Click Handler
  const onNodeClick = useCallback((event, node) => {
    if (node.type !== 'custom') return;
    setSelectedNode(node.data);
    setNodeExplanation('');
    setCenter(node.position.x + 40, node.position.y + 40, { zoom: 1.25, duration: 800 });
  }, [setCenter]);

  // Hover bindings
  const onNodeMouseEnter = useCallback((event, node) => {
    if (node.type === 'custom') {
      setHoveredNodeId(node.id);
    } else if (node.type === 'district') {
      // Extract district name to illuminate all related structures
      const dName = node.id.replace('dist-bg-', '');
      setHoveredDistrict(dName);
    }
  }, []);

  const onNodeMouseLeave = useCallback((event, node) => {
    if (node.type === 'custom') {
      setHoveredNodeId(null);
    } else if (node.type === 'district') {
      setHoveredDistrict(null);
    }
  }, []);

  // Auto zoom search matches
  useEffect(() => {
    if (!searchQuery.trim() || !nodes.length) return;

    const query = searchQuery.toLowerCase().trim();
    const matches = nodes.filter(n => {
      if (n.type !== 'custom') return false;
      const label = (n.data?.label || '').toLowerCase();
      const file = (n.data?.file || '').toLowerCase();
      const type = (n.data?.type || '').toLowerCase();
      return label.includes(query) || 
             file.includes(query) || 
             type.includes(query) ||
             (query === 'controllers' && type === 'controller') ||
             (query === 'services' && type === 'service') ||
             (query === 'routes' && type === 'route') ||
             (query === 'models' && type === 'model');
    });

    if (matches.length === 1) {
      const match = matches[0];
      setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.45, duration: 800 });
    } else if (matches.length > 1) {
      const xs = matches.map(m => m.position.x);
      const ys = matches.map(m => m.position.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const centerX = (minX + maxX) / 2 + 45;
      const centerY = (minY + maxY) / 2 + 45;
      
      const dx = maxX - minX + 240;
      const dy = maxY - minY + 240;
      const zoom = Math.max(0.35, Math.min(1.1, 900 / Math.max(dx, dy)));
      
      setCenter(centerX, centerY, { zoom, duration: 800 });
    }
  }, [searchQuery, nodes, setCenter]);

  // Fetch AI code summary from Server
  const handleFetchNodeExplanation = async () => {
    if (!selectedNode) return;
    setIsExplaining(true);
    setNodeExplanation('');

    try {
      const prompt = `Provide a detailed code summary and responsibility explanation for the module path "${selectedNode.file || selectedNode.id}".`;
      const res = await apiClient.post(`/api/chat/${repoId}`, { message: prompt });
      if (res.data && res.data.message) {
        setNodeExplanation(res.data.message);
      } else {
        setNodeExplanation('Could not generate explanation.');
      }
    } catch (err) {
      setNodeExplanation('Error connecting to backend API.');
    } finally {
      setIsExplaining(false);
    }
  };

  // Playback loop for logic simulations
  useEffect(() => {
    let interval;
    if (isPlaying && activeFlow) {
      const flowNodes = getFlowNodes(activeFlow);
      interval = setInterval(() => {
        setFlowStep(prev => {
          const next = prev + 1;
          if (next >= flowNodes.length) {
            setIsPlaying(false);
            return -1;
          }
          
          // Auto-select and inspect building dynamically
          const match = nodes.find(n => n.id === flowNodes[next].nodeId);
          if (match) {
            setSelectedNode(match.data);
            setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.35, duration: 600 });
          }
          
          return next;
        });
      }, 2800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeFlow, getFlowNodes, nodes, setCenter]);

  const handleStartFlow = (flowKey) => {
    setActiveFlow(flowKey);
    setFlowStep(0);
    setIsPlaying(true);

    const flowNodes = getFlowNodes(flowKey);
    if (flowNodes.length > 0) {
      const match = nodes.find(n => n.id === flowNodes[0].nodeId);
      if (match) {
        setSelectedNode(match.data);
        setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.35, duration: 600 });
      }
    }
  };

  const handleStopFlow = () => {
    setIsPlaying(false);
    setActiveFlow('');
    setFlowStep(-1);
    fitView({ duration: 800 });
  };

  const handleSelectInsightNode = (nodeId) => {
    const match = nodes.find(n => n.id === nodeId);
    if (match) {
      setSelectedNode(match.data);
      setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.55, duration: 800 });
    }
  };

  const incomingLinks = repo?.graph?.edges?.filter(e => e.target === selectedNode?.id) || [];
  const outgoingLinks = repo?.graph?.edges?.filter(e => e.source === selectedNode?.id) || [];

  // Smart Client-Side Instant AI Architecture Summary
  const localAiSummary = useMemo(() => {
    if (!selectedNode) return null;
    
    const file = selectedNode.file || '';
    const type = selectedNode.type || '';
    const complexity = selectedNode.complexity || 5;
    const incomingCount = incomingLinks.length;
    const outgoingCount = outgoingLinks.length;
    const depCount = incomingCount + outgoingCount;

    let role = 'Business Logic Helper';
    let tier = 'Application Core';
    let purpose = 'Provides helper structures, computations, or configurations for standard services.';
    let responsibilities = [
      'Executes modular helper tasks and data formatting operations',
      'Minimizes code duplication across larger service classes'
    ];
    let risks = [];

    const normDist = getNormalizedDistrict(selectedNode.district, selectedNode.id);

    if (normDist === 'auth') {
      role = 'Authentication Gateway';
      tier = 'Authentication Layer';
      purpose = 'Secures API routes, verifies user session tokens, and validates credential parameters.';
      responsibilities = [
        'Intercepts incoming request headers to parse JWT bearer tokens',
        'Validates user session credentials and active permissions',
        'Implements secure routing guards for protected system modules'
      ];
    } else if (normDist === 'ai') {
      role = 'AI Engine Module';
      tier = 'AI Layer';
      purpose = 'Interfaces with Large Language Models (LLMs) to perform codebase analysis, query processing, and gap calculations.';
      responsibilities = [
        'Maintains prompt structures and contextual codebase payload builders',
        'Executes asynchronous requests to Groq / LLM providers',
        'Parses natural language outputs into structured UI-friendly JSON representations'
      ];
    } else if (normDist === 'database') {
      role = 'Database Access Schema';
      tier = 'Data Layer';
      purpose = 'Maps application records to MongoDB collections and handles query access logic.';
      responsibilities = [
        'Defines strict field schemas, data validation patterns, and indices',
        'Executes database create, read, update, and delete actions',
        'Ensures query sanitization and index speed optimization'
      ];
    } else if (type === 'route') {
      role = 'API Endpoint Router';
      tier = 'API Layer';
      purpose = 'Exposes client-facing REST API points and maps URL triggers to core execution handlers.';
      responsibilities = [
        'Registers API URL paths, HTTP verbs, and request validation parameters',
        'Binds security filters and auth check middleware to endpoint chains',
        'Delegates parameters to corresponding controllers'
      ];
    } else if (type === 'controller') {
      role = 'Request Orchestrator';
      tier = 'API Layer';
      purpose = 'Parses incoming payloads, checks variables, and coordinates backend service responses.';
      responsibilities = [
        'Extracts request parameters, query string details, and body payloads',
        'Orchestrates service method calls to resolve business logic requests',
        'Formulate standardized JSON response wrappers'
      ];
    } else if (type === 'service') {
      role = 'Core Business Service';
      tier = 'Application Core';
      purpose = 'Executes core application operations, updates db states, and runs validation constraints.';
      responsibilities = [
        'Coordinates multiple database transactions and reads',
        'Performs business validation checks and transforms models data',
        'Integrates with external third-party APIs and libraries'
      ];
    } else if (normDist === 'frontend') {
      role = 'User Interface Component';
      tier = 'Presentation Layer';
      purpose = 'Renders interactive user interface pages, charts, dashboards, and client states.';
      responsibilities = [
        'Manages client-side visual states, forms, and navigation buttons',
        'Fetches backend data via React Query hooks and parses visual graphs',
        'Implements responsive, accessible modern CSS styling components'
      ];
    }

    if (complexity >= 8) {
      risks.push('High code complexity (complexity rating >= 8) increases refactoring friction.');
    }
    if (depCount >= 6) {
      risks.push('High coupling (connected to multiple files) increases the blast radius of changes.');
    }
    if (incomingCount >= 4 && complexity >= 7) {
      risks.push('Critical dependency hub: changes here might break multiple dependent modules.');
    }
    if (risks.length === 0) {
      risks.push('Low coupling and stable complexity indicate low refactoring risk.');
    }

    return { role, tier, purpose, responsibilities, risks };
  }, [selectedNode, incomingLinks, outgoingLinks]);

  return (
    <NavbarLayout>
      <div className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden relative select-none bg-slate-950 text-white">
        
        {/* Left Side Drawer: Overview, Flows & Insights Tabbed Dashboard */}
        <aside className="w-80 bg-slate-900/60 border-r border-white/10 flex flex-col p-4 overflow-y-auto custom-scrollbar shrink-0 backdrop-blur-md z-10 shadow-2xl">
          
          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl mb-4 text-[10px] font-bold border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            <button 
              onClick={() => setLeftTab('overview')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                leftTab === 'overview' ? 'bg-primary text-on-primary shadow-lg font-extrabold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xs">location_city</span>
              <span>Overview</span>
            </button>
            <button 
              onClick={() => setLeftTab('flows')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                leftTab === 'flows' ? 'bg-primary text-on-primary shadow-lg font-extrabold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xs">route</span>
              <span>Flows</span>
            </button>
            <button 
              onClick={() => setLeftTab('insights')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                leftTab === 'insights' ? 'bg-primary text-on-primary shadow-lg font-extrabold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xs">analytics</span>
              <span>Insights</span>
            </button>
          </div>

          {/* TAB 1: CITY OVERVIEW PANEL */}
          {leftTab === 'overview' && (
            <div className="space-y-4 flex-grow flex flex-col">
              <div className="mb-1">
                <h3 className="font-label-caps text-label-caps text-outline uppercase text-[10px] flex items-center gap-1.5 font-bold tracking-widest text-slate-300">
                  <span className="material-symbols-outlined text-xs text-primary animate-pulse">location_city</span> Code City Dashboard
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  High-level visual metrics compiled from codebase static analysis structures.
                </p>
              </div>

              {/* Architecture Health Ring Gauge */}
              <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                {/* Subtle tech background circle lines */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-900" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="6"></circle>
                    <circle 
                      className="text-primary transition-all duration-1000" 
                      cx="56" 
                      cy="56" 
                      fill="transparent" 
                      r="48" 
                      stroke="currentColor" 
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 - (aiInsights.healthScore / 100) * (2 * Math.PI * 48)}
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-2xl font-black text-white font-code">
                      {aiInsights.healthScore}
                    </span>
                    <span className="text-[7px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Health</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-left w-full text-[10px] border-t border-white/5 pt-3">
                  <div className="flex justify-between pb-1 text-slate-400">
                    <span>Tech Debt:</span>
                    <span className="font-bold text-white font-code">{aiInsights.techDebt}%</span>
                  </div>
                  <div className="flex justify-between pb-1 text-slate-400">
                    <span>Debt Level:</span>
                    <span className={`font-bold ${aiInsights.techDebt >= 40 ? 'text-error' : 'text-secondary'}`}>
                      {aiInsights.techDebt >= 50 ? 'High' : aiInsights.techDebt >= 25 ? 'Moderate' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-xl flex flex-col shadow">
                  <p className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">Total Files</p>
                  <p className="font-bold text-white mt-1 text-lg font-code">{graphData?.nodes?.length || 0}</p>
                </div>
                <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-xl flex flex-col shadow">
                  <p className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">District Count</p>
                  <p className="font-bold text-white mt-1 text-lg font-code">6</p>
                </div>
                <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-xl flex flex-col shadow">
                  <p className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">Dependencies</p>
                  <p className="font-bold text-white mt-1 text-lg font-code">{graphData?.edges?.length || 0}</p>
                </div>
                <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-xl flex flex-col shadow">
                  <p className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">Circular Loops</p>
                  <p className={`font-bold mt-1 text-lg font-code ${aiInsights.cycles.length > 0 ? 'text-error animate-pulse' : 'text-slate-500'}`}>
                    {aiInsights.cycles.length}
                  </p>
                </div>
                <div className="bg-slate-950/40 border border-white/5 p-2.5 rounded-xl flex flex-col shadow col-span-2">
                  <p className="text-slate-400 text-[8px] uppercase tracking-wider font-bold">Dead (Orphan) Files</p>
                  <p className={`font-bold mt-1 text-lg font-code ${aiInsights.orphans.length > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                    {aiInsights.orphans.length}
                  </p>
                </div>
              </div>

              {/* Largest Skyscrapers Module List */}
              <div className="bg-slate-950/40 border border-white/5 p-3 rounded-2xl flex-grow flex flex-col justify-between shadow">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Largest Skyscrapers</span>
                <div className="space-y-1.5 flex-grow overflow-y-auto max-h-[140px] custom-scrollbar pr-1">
                  {aiInsights.largest.map((lNode, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectInsightNode(lNode.id)}
                      className="flex justify-between items-center p-1.5 bg-slate-950 border border-white/5 rounded-lg hover:border-primary cursor-pointer transition-all"
                    >
                      <span className="text-[10px] text-white truncate max-w-[120px] font-bold font-code-sm">{lNode.label}</span>
                      <span className="text-[9px] text-slate-400 font-code-sm">{(lNode.size || 3) * 125} LOC</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLOW SIMULATIONS */}
          {leftTab === 'flows' && (
            <div className="space-y-4 flex-grow flex flex-col">
              <div className="mb-1">
                <h3 className="font-label-caps text-label-caps text-outline uppercase text-[10px] flex items-center gap-1 font-bold tracking-widest text-slate-300">
                  <span className="material-symbols-outlined text-xs text-primary animate-pulse">route</span> Traffic Simulations
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Play execution paths traversing through building nodes to verify integrations.
                </p>
              </div>

              <div className="space-y-3 flex-grow overflow-y-auto pr-1 custom-scrollbar">
                {Object.entries(businessFlows).map(([key, flow]) => {
                  const isActive = activeFlow === key;
                  const flowNodes = getFlowNodes(key);

                  return (
                    <div 
                      key={key} 
                      className={`border rounded-2xl p-3.5 space-y-3 transition-all ${
                        isActive 
                          ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(59,130,246,0.25)]' 
                          : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white flex justify-between items-center">
                          <span>{flow.title}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />}
                        </h4>
                        <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{flow.description}</p>
                      </div>

                      {flowNodes.length === 0 ? (
                        <div className="text-[8px] text-error font-bold uppercase tracking-wider bg-error/5 p-2 rounded">
                          No matching modules in repository
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-1.5 justify-between">
                            {isActive ? (
                              <>
                                <button 
                                  onClick={() => {
                                    const prev = Math.max(0, flowStep - 1);
                                    setFlowStep(prev);
                                    const match = nodes.find(n => n.id === flowNodes[prev].nodeId);
                                    if (match) {
                                      setSelectedNode(match.data);
                                      setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.35, duration: 600 });
                                    }
                                  }}
                                  className="bg-slate-900 border border-white/15 p-1 rounded-lg text-white disabled:opacity-40 cursor-pointer"
                                  disabled={flowStep <= 0}
                                  title="Previous Step"
                                >
                                  <span className="material-symbols-outlined text-[14px]">skip_previous</span>
                                </button>
                                <button 
                                  onClick={() => setIsPlaying(!isPlaying)}
                                  className="flex-grow bg-slate-900 border border-white/15 text-[10px] font-bold p-1 rounded-lg flex items-center justify-center gap-1 text-white cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xs">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    const next = Math.min(flowNodes.length - 1, flowStep + 1);
                                    setFlowStep(next);
                                    const match = nodes.find(n => n.id === flowNodes[next].nodeId);
                                    if (match) {
                                      setSelectedNode(match.data);
                                      setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.35, duration: 600 });
                                    }
                                  }}
                                  className="bg-slate-900 border border-white/15 p-1 rounded-lg text-white disabled:opacity-40 cursor-pointer"
                                  disabled={flowStep >= flowNodes.length - 1}
                                  title="Next Step"
                                >
                                  <span className="material-symbols-outlined text-[14px]">skip_next</span>
                                </button>
                                <button 
                                  onClick={handleStopFlow}
                                  className="bg-error/10 hover:bg-error/20 border border-error/20 text-error p-1 rounded-lg cursor-pointer"
                                  title="Stop Simulation"
                                >
                                  <span className="material-symbols-outlined text-xs">stop</span>
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleStartFlow(key)}
                                className="w-full bg-primary text-on-primary text-[10px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1 hover:opacity-95 transition-all cursor-pointer shadow-md"
                              >
                                <span className="material-symbols-outlined text-xs">play_arrow</span>
                                <span>Simulate flow</span>
                              </button>
                            )}
                          </div>

                          {/* logic timeline step list */}
                          {isActive && (
                            <div className="pt-2 border-t border-white/5 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                              {flowNodes.map((step, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => {
                                    setFlowStep(idx);
                                    const match = nodes.find(n => n.id === step.nodeId);
                                    if (match) {
                                      setSelectedNode(match.data);
                                      setCenter(match.position.x + 40, match.position.y + 40, { zoom: 1.35, duration: 600 });
                                    }
                                  }}
                                  className={`flex gap-2 items-start text-[10px] cursor-pointer p-1.5 rounded-lg transition-colors ${
                                    flowStep === idx ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 ${
                                    flowStep >= idx 
                                      ? 'bg-secondary text-on-secondary shadow-md' 
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 leading-normal overflow-hidden">
                                    <span className={`font-bold block truncate font-code-sm ${flowStep === idx ? 'text-secondary' : 'text-white'}`}>
                                      {step.nodeId.split('/').pop()}
                                    </span>
                                    <span className="text-[8px] text-slate-400 leading-tight block">{step.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AI INSIGHTS DIAGNOSIS */}
          {leftTab === 'insights' && (
            <div className="space-y-4 flex-grow flex flex-col text-xs leading-normal">
              <div className="mb-1">
                <h3 className="font-label-caps text-label-caps text-outline uppercase text-[10px] flex items-center gap-1 font-bold tracking-widest text-slate-300">
                  <span className="material-symbols-outlined text-xs text-primary animate-pulse">analytics</span> AI Architecture Insights
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Evaluated hotspots and quality statistics scanned from file connection weights.
                </p>
              </div>

              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 max-h-[calc(100vh-190px)]">
                {/* 1. Most Connected Files */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-primary">hub</span>
                    <span>Most Connected Files</span>
                  </h4>
                  <div className="space-y-1 text-[10px]">
                    {aiInsights.hubs.map((hub, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectInsightNode(hub.id)}
                        className="flex justify-between items-center p-1.5 hover:bg-white/5 border border-white/5 rounded-lg cursor-pointer font-code-sm"
                      >
                        <span className="text-white truncate font-bold">{hub.label}</span>
                        <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/20">{hub.connections} links</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Bottleneck Services */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-warning animate-pulse">warning</span>
                    <span>Bottleneck Services</span>
                  </h4>
                  {aiInsights.bottlenecks.length === 0 ? (
                    <p className="text-[9px] text-slate-500 italic px-1">No bottleneck components found.</p>
                  ) : (
                    <div className="space-y-1 text-[10px]">
                      {aiInsights.bottlenecks.map((b, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectInsightNode(b.id)}
                          className="flex justify-between items-center p-1.5 hover:bg-white/5 border border-white/5 rounded-lg cursor-pointer font-code-sm"
                        >
                          <span className="text-white truncate font-bold">{b.label}</span>
                          <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold border border-orange-500/20">{b.connections} links</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Circular Dependencies */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-error">sync_problem</span>
                    <span>Circular Dependencies</span>
                  </h4>
                  {aiInsights.cycles.length === 0 ? (
                    <p className="text-[9px] text-secondary italic px-1">No circular loops detected. Clean tree!</p>
                  ) : (
                    <div className="space-y-2 text-[10px]">
                      {aiInsights.cycles.map((cycle, idx) => (
                        <div key={idx} className="bg-error/5 border border-error/20 p-2 rounded-xl space-y-1">
                          <p className="font-bold text-error text-[9px]">Loop #{idx + 1}:</p>
                          <div className="flex flex-wrap gap-1 font-code-sm text-[8px] items-center">
                            {cycle.map((nodeId, nIdx) => (
                              <React.Fragment key={nIdx}>
                                {nIdx > 0 && <span className="text-slate-600">→</span>}
                                <span 
                                  onClick={() => handleSelectInsightNode(nodeId)}
                                  className="text-white hover:underline cursor-pointer font-bold truncate max-w-[85px]"
                                  title={nodeId}
                                >
                                  {nodeId.split('/').pop()}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Orphaned Files */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-slate-400">link_off</span>
                    <span>Orphaned (Dead) Files</span>
                  </h4>
                  {aiInsights.orphans.length === 0 ? (
                    <p className="text-[9px] text-slate-500 italic px-1">No dead files index detected.</p>
                  ) : (
                    <div className="space-y-1 text-[10px]">
                      {aiInsights.orphans.map((orph, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectInsightNode(orph.id)}
                          className="p-1.5 hover:bg-white/5 border border-white/5 rounded-lg cursor-pointer truncate font-code-sm text-slate-300"
                        >
                          {orph.file || orph.id}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Refactor Candidates */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-secondary animate-pulse">gavel</span>
                    <span>Refactor Candidates</span>
                  </h4>
                  {aiInsights.refactors.length === 0 ? (
                    <p className="text-[9px] text-slate-500 italic px-1">No high risk refactor files found.</p>
                  ) : (
                    <div className="space-y-1 text-[10px]">
                      {aiInsights.refactors.map((ref, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectInsightNode(ref.id)}
                          className="flex justify-between items-center p-1.5 hover:bg-white/5 border border-white/5 rounded-lg cursor-pointer font-code-sm"
                        >
                          <span className="text-white truncate font-bold">{ref.label}</span>
                          <span className="text-[8px] bg-secondary/20 text-secondary border border-secondary/20 px-1.5 py-0.5 rounded font-bold">
                            Comp: {ref.complexity}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Largest Components */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-primary">view_quilt</span>
                    <span>Largest Components</span>
                  </h4>
                  <div className="space-y-1 text-[10px]">
                    {aiInsights.largest.map((lg, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectInsightNode(lg.id)}
                        className="flex justify-between items-center p-1.5 hover:bg-white/5 border border-white/5 rounded-lg cursor-pointer font-code-sm"
                      >
                        <span className="text-white truncate font-bold">{lg.label}</span>
                        <span className="text-[8px] text-slate-400 font-bold">Size: {lg.size} units</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Risk Hotspots */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 space-y-2 shadow">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-slate-300">
                    <span className="material-symbols-outlined text-xs text-error">priority_high</span>
                    <span>Risk Hotspots</span>
                  </h4>
                  {aiInsights.riskHotspots.length === 0 ? (
                    <p className="text-[9px] text-slate-500 italic px-1">No extreme risk files found.</p>
                  ) : (
                    <div className="space-y-1 text-[10px]">
                      {aiInsights.riskHotspots.map((rk, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectInsightNode(rk.id)}
                          className="flex justify-between items-center p-1.5 hover:bg-white/5 border border-white/5 rounded-lg cursor-pointer font-code-sm"
                        >
                          <span className="text-white truncate font-bold">{rk.label}</span>
                          <span className="text-[8px] bg-error/20 text-error border border-error/20 px-1.5 py-0.5 rounded font-bold">
                            Complexity: {rk.complexity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center Canvas: React Flow Map */}
        <main className="flex-1 min-w-0 bg-slate-950 relative flex flex-col">
          {/* Search Box Overlay */}
          <div className="absolute top-4 left-4 z-10 w-72 bg-slate-900/90 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-2xl space-y-2">
            <div className="flex bg-slate-950 border border-white/5 px-3 py-1.5 rounded-xl focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline text-sm self-center mr-2">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skyscraper name/type..."
                className="bg-transparent border-none text-xs focus:ring-0 text-white placeholder:text-slate-500 w-full p-0 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
                  <span className="material-symbols-outlined text-sm self-center">close</span>
                </button>
              )}
            </div>
            
            <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider font-code">
              <span>Scroll: Zoom</span>
              <span>Drag: Pan</span>
              <span>Double-Click: Isolate</span>
            </div>
          </div>

          {/* District Color Guide Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-white/10 rounded-2xl p-3 backdrop-blur-md text-[10px] space-y-1.5 text-slate-400 shadow-2xl border-white/5 select-none">
            <p className="font-bold text-white uppercase text-[8px] tracking-widest border-b border-white/5 pb-1.5 mb-1.5">District Guide</p>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDistrictColor('frontend') }} /><span>Frontend (Purple)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDistrictColor('backend') }} /><span>Backend Core (Blue)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDistrictColor('database') }} /><span>Database (Green)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDistrictColor('auth') }} /><span>Authentication (Yellow)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDistrictColor('ai') }} /><span>AI Core (Orange)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDistrictColor('external') }} /><span>External APIs (Pink)</span></div>
          </div>

          {isGraphLoading ? (
            <div className="flex flex-col justify-center items-center h-full gap-3">
              <span className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span className="text-xs text-slate-400 font-label">Mapping city districts...</span>
            </div>
          ) : nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              style={{ width: '100%', height: '100%' }}
              className="flex-grow"
            >
              <Controls className="bg-slate-900 border border-white/10 text-white fill-current rounded-xl shadow-2xl" />
              <MiniMap 
                nodeStrokeColor={() => '#111'}
                nodeColor={(n) => {
                  if (n.type === 'district') return 'transparent';
                  if (n.data?.isHighlighted) return '#3b82f6';
                  return '#0f172a';
                }}
                maskColor="rgba(15,23,42,0.85)"
                nodeBorderRadius={4}
                className="bg-slate-900 border border-white/10 shadow-2xl rounded-xl overflow-hidden" 
              />
              <Background color="#1e293b" gap={24} size={1.2} variant="dots" />
            </ReactFlow>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6 bg-slate-950">
              <span className="material-symbols-outlined text-5xl mb-2 text-primary animate-pulse">location_city</span>
              <p className="font-bold text-lg text-white">No City Layout Available</p>
              <p className="text-xs mt-1 max-w-sm">
                Submit a repository for indexing to construct the software city map.
              </p>
            </div>
          )}
        </main>

        {/* Right Side Drawer: Smart Node Inspector */}
        <aside className="w-80 bg-slate-900/60 border-l border-white/10 flex flex-col overflow-y-auto custom-scrollbar shrink-0 backdrop-blur-md z-10 shadow-2xl">
          <div className="p-4 border-b border-white/10 bg-slate-900/90 flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-secondary uppercase text-[8px] tracking-widest block font-bold">Skyscraper Inspector</span>
            <h4 className="font-headline-sm text-headline-sm font-bold text-white truncate" title={selectedNode ? selectedNode.label : 'Select Building'}>
              {selectedNode ? selectedNode.label : 'Select Building'}
            </h4>
          </div>

          <div className="p-4 flex-grow flex flex-col text-xs leading-normal">
            {selectedNode ? (
              <div className="space-y-4 flex-grow flex flex-col justify-between">
                
                {/* Tab selector inside inspector */}
                <div className="flex border-b border-white/5 text-[9px] font-bold uppercase tracking-wider pb-1.5 gap-3 shrink-0 select-none">
                  <button 
                    onClick={() => setInspectorTab('overview')}
                    className={`pb-1 transition-all cursor-pointer ${inspectorTab === 'overview' ? 'text-primary border-b-2 border-primary font-extrabold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setInspectorTab('dependencies')}
                    className={`pb-1 transition-all cursor-pointer ${inspectorTab === 'dependencies' ? 'text-primary border-b-2 border-primary font-extrabold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Dependencies
                  </button>
                  <button 
                    onClick={() => setInspectorTab('ai')}
                    className={`pb-1 transition-all cursor-pointer ${inspectorTab === 'ai' ? 'text-primary border-b-2 border-primary font-extrabold' : 'text-slate-400 hover:text-white'}`}
                  >
                    AI Summary
                  </button>
                  <button 
                    onClick={() => setInspectorTab('role')}
                    className={`pb-1 transition-all cursor-pointer ${inspectorTab === 'role' ? 'text-primary border-b-2 border-primary font-extrabold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Role
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-grow pt-1">
                  
                  {/* TAB 1: OVERVIEW */}
                  {inspectorTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400 font-bold">Building Type:</span>
                          <span className="font-bold text-primary uppercase font-code-sm text-[9px]">{selectedNode.type}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400 font-bold">Complexity:</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                            (selectedNode.complexity || 5) >= 7 ? 'text-error bg-error/10 border border-error/20' : 'text-secondary bg-secondary/10 border border-secondary/20'
                          }`}>{selectedNode.complexity || 5}/10</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400 font-bold">Estimated LOC:</span>
                          <span className="font-bold text-white font-code-sm">{(selectedNode.size || 3) * 125} lines</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400 font-bold">Size Scale:</span>
                          <span className="font-bold text-white">{selectedNode.size || 3} units</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400 font-bold">Total Links:</span>
                          <span className="font-bold text-white font-code-sm">{(selectedNode.incomingCount || 0) + (selectedNode.outgoingCount || 0)} edges</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-slate-400 font-bold">File Location:</span>
                        <span className="font-code-sm text-[9px] text-white bg-slate-950 border border-white/5 p-2 rounded-xl break-all leading-normal select-text">
                          {selectedNode.file || selectedNode.id}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DEPENDENCIES */}
                  {inspectorTab === 'dependencies' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] text-slate-400 block mb-1.5 font-bold uppercase tracking-widest">Dependents (Called By) ({incomingLinks.length})</span>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                          {incomingLinks.length === 0 ? (
                            <span className="text-[9px] text-slate-500 italic block">No local incoming connections found.</span>
                          ) : (
                            incomingLinks.map((e, i) => (
                              <div 
                                key={i} 
                                onClick={() => handleSelectInsightNode(e.source)}
                                className="bg-slate-950 border border-white/5 p-1.5 rounded-lg truncate text-[9px] text-white hover:border-primary cursor-pointer font-code-sm transition-all"
                              >
                                {e.source.split('/').pop()}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[9px] text-slate-400 block mb-1.5 font-bold uppercase tracking-widest">Dependencies (Calls To) ({outgoingLinks.length})</span>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                          {outgoingLinks.length === 0 ? (
                            <span className="text-[9px] text-slate-500 italic block">No outbound imports detected.</span>
                          ) : (
                            outgoingLinks.map((e, i) => (
                              <div 
                                key={i} 
                                onClick={() => handleSelectInsightNode(e.target)}
                                className="bg-slate-950 border border-white/5 p-1.5 rounded-lg truncate text-[9px] text-white hover:border-primary cursor-pointer font-code-sm transition-all"
                              >
                                {e.target.split('/').pop()}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: AI ARCHITECTURE SUMMARY */}
                  {inspectorTab === 'ai' && (
                    <div className="space-y-3 flex-grow flex flex-col text-[11px] leading-relaxed">
                      
                      {/* Local Instant AI Description */}
                      {localAiSummary && (
                        <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl space-y-2 shadow">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Role Purpose</span>
                            <p className="text-[10px] text-white leading-normal mt-0.5">{localAiSummary.purpose}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Core Responsibilities</span>
                            <ul className="list-disc list-inside text-[9px] text-slate-300 space-y-0.5 mt-1 pl-1">
                              {localAiSummary.responsibilities.map((r, i) => <li key={i} className="leading-tight">{r}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Blast Risks</span>
                            <div className="space-y-0.5 mt-1">
                              {localAiSummary.risks.map((risk, i) => (
                                <div key={i} className="flex gap-1.5 items-start text-[9px] text-orange-400 leading-tight">
                                  <span className="material-symbols-outlined text-[10px] text-orange-500 pt-0.5">warning</span>
                                  <span>{risk}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[9px] border-b border-white/5 pb-2 pt-1 font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">Interactive Risk</span>
                        <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wide ${
                          (selectedNode.complexity || 5) >= 8 
                            ? 'bg-error/15 text-error border border-error/30 animate-pulse'
                            : (selectedNode.complexity || 5) >= 5
                              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                              : 'bg-green-500/15 text-green-400 border border-green-500/30'
                        }`}>
                          {(selectedNode.complexity || 5) >= 8 ? 'High Risk' : (selectedNode.complexity || 5) >= 5 ? 'Medium Risk' : 'Low Risk'}
                        </span>
                      </div>

                      {isExplaining ? (
                        <div className="space-y-2 py-2">
                          <div className="h-2 bg-slate-950 rounded max-w-[200px] animate-pulse"></div>
                          <div className="h-2 bg-slate-950 rounded animate-pulse"></div>
                          <div className="h-2 bg-slate-950 rounded animate-pulse"></div>
                        </div>
                      ) : nodeExplanation ? (
                        <div className="bg-slate-955 border border-white/5 p-3 rounded-lg select-text text-white text-[10px] max-h-[160px] overflow-y-auto custom-scrollbar shadow leading-normal">
                          {nodeExplanation}
                        </div>
                      ) : (
                        <button 
                          onClick={handleFetchNodeExplanation}
                          className="w-full border border-primary/30 hover:border-primary text-white font-bold py-2 rounded-xl text-[10px] hover:bg-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <span className="material-symbols-outlined text-xs text-primary">auto_awesome</span>
                          <span>Generate Deep AI Analysis</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* TAB 4: BUSINESS ROLE */}
                  {inspectorTab === 'role' && (
                    <div className="space-y-4">
                      {localAiSummary && (
                        <div className="bg-slate-950/60 border border-white/5 p-3.5 rounded-2xl space-y-3 shadow">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Dynamic Tier</span>
                            <span className="text-white font-bold font-code-sm uppercase bg-slate-950 px-2 py-0.5 border border-white/10 rounded-md">
                              {localAiSummary.tier}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest block">System Role</span>
                            <span className="text-primary font-bold text-[10px] block">{localAiSummary.role}</span>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-normal">
                            This building is clustered in the <strong>{getDistrictLabel(getNormalizedDistrict(selectedNode.district, selectedNode.id))} District</strong>, rendering its runtime classification as:
                            {selectedNode.type === 'route' ? ' API endpoint gateway handler routing requests.' : 
                             selectedNode.type === 'controller' ? ' Payload router parsing payload variables and coordinator.' :
                             selectedNode.type === 'model' ? ' Data Store mapper mapping MongoDB schemas and indices.' :
                             selectedNode.type === 'middleware' ? ' Middleware request filter.' :
                             ' Core business helper helper executing server calculations.'}
                          </p>
                        </div>
                      )}

                      <div className="bg-slate-955 border border-white/5 p-3 rounded-xl space-y-2 text-[10px]">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest block border-b border-white/5 pb-1 mb-1">Architecture Hotspots</span>
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="material-symbols-outlined text-sm text-secondary">insights</span>
                          <span>Coupled to {(selectedNode.incomingCount || 0) + (selectedNode.outgoingCount || 0)} local modules</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 mt-1">
                          <span className="material-symbols-outlined text-sm text-primary">settings_backup_restore</span>
                          <span>Refactor blast risk: {(selectedNode.complexity || 5) * 10}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Open in Code Explorer button */}
                {selectedNode.file && (
                  <button 
                    onClick={() => navigate(`/repository/${repoId}?file=${encodeURIComponent(selectedNode.file)}`)}
                    className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl text-xs hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0 font-label"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>Open in Code Explorer</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 italic opacity-85 flex flex-col items-center justify-center gap-2.5">
                <span className="material-symbols-outlined text-4xl text-slate-600 animate-bounce">location_city</span>
                <p className="text-[10px]">Click on any building skyscraper to inspect its architectural details.</p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </NavbarLayout>
  );
}

export default function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitecturePageContent />
    </ReactFlowProvider>
  );
}
