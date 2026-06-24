import React, { useState } from 'react';
import NavbarLayout from '../components/NavbarLayout.jsx';

export default function ApiDocumentationPage() {
  const [activeIdx, setActiveIdx] = useState(null);

  const endpoints = [
    {
      category: 'AUTHENTICATION',
      method: 'POST',
      path: '/api/auth/register',
      desc: 'Register a new user account and receive a JWT session token.',
      params: [
        { name: 'name', type: 'STRING', required: true, desc: 'Full name' },
        { name: 'email', type: 'STRING', required: true, desc: 'Unique email address' },
        { name: 'password', type: 'STRING', required: true, desc: 'Min 6 characters' }
      ],
      response: {
        success: true,
        token: "eyJhbGciOiJIUzI1NiIsIn...",
        user: {
          id: "6516f9479b422a5928d3...",
          name: "John Doe",
          email: "john@example.com",
          createdAt: "2026-06-24T10:04:03Z"
        }
      }
    },
    {
      category: 'AUTHENTICATION',
      method: 'POST',
      path: '/api/auth/login',
      desc: 'Authenticate user credentials to obtain a JWT session token.',
      params: [
        { name: 'email', type: 'STRING', required: true, desc: 'Email address' },
        { name: 'password', type: 'STRING', required: true, desc: 'Account password' }
      ],
      response: {
        success: true,
        token: "eyJhbGciOiJIUzI1NiIsIn...",
        user: {
          id: "6516f9479b422a5928d3...",
          name: "John Doe",
          email: "john@example.com",
          createdAt: "2026-06-24T10:04:03Z"
        }
      }
    },
    {
      category: 'AUTHENTICATION',
      method: 'GET',
      path: '/api/auth/me',
      desc: 'Retrieve profile details of the currently authenticated user.',
      params: [
        { name: 'Authorization', type: 'HEADER', required: true, desc: 'Bearer <JWT_TOKEN>' }
      ],
      response: {
        success: true,
        user: {
          id: "6516f9479b422a5928d3...",
          name: "John Doe",
          email: "john@example.com",
          createdAt: "2026-06-24T10:04:03Z"
        }
      }
    },
    {
      category: 'REPOSITORY MANAGEMENT',
      method: 'POST',
      path: '/api/repos',
      desc: 'Submit a public GitHub repository link to queue for structure parsing.',
      params: [
        { name: 'githubUrl', type: 'BODY (STRING)', required: true, desc: 'Valid public GitHub link' }
      ],
      response: {
        userId: "6516f9479b422a5928d3...",
        githubUrl: "https://github.com/facebook/react",
        defaultBranch: "main",
        status: "pending",
        createdAt: "2026-06-24T10:20:00Z",
        _id: "65e23652f1025a1768bc...",
        __v: 0
      }
    },
    {
      category: 'REPOSITORY MANAGEMENT',
      method: 'GET',
      path: '/api/repos',
      desc: 'List all repository registers associated with the authenticated user.',
      params: [
        { name: 'Authorization', type: 'HEADER', required: true, desc: 'Bearer <JWT_TOKEN>' }
      ],
      response: {
        success: true,
        count: 1,
        repos: [
          {
            _id: "65e23652f1025a1768bc...",
            userId: "6516f9479b422a5928d3...",
            githubUrl: "https://github.com/facebook/react",
            status: "done",
            stats: { fileCount: 204, totalFiles: 204, hasTests: true, hasDocumentation: true },
            healthScore: { overall: 85, maintainability: 80, testCoverage: 90 },
            summary: "AI repository summary goes here..."
          }
        ]
      }
    },
    {
      category: 'REPOSITORY ANALYSIS',
      method: 'GET',
      path: '/api/repos/:id/graph',
      desc: 'Fetch the architectural dependency graph nodes and edges for rendering.',
      params: [
        { name: 'id', type: 'PATH (OBJECTID)', required: true, desc: 'Repository database ID' }
      ],
      response: {
        success: true,
        nodes: [
          { id: "src/main.js", label: "main.js", type: "entry", file: "src/main.js", complexity: 3 }
        ],
        edges: [
          { source: "src/main.js", target: "src/utils.js", type: "import" }
        ]
      }
    },
    {
      category: 'REPOSITORY ANALYSIS',
      method: 'POST',
      path: '/api/repos/:id/impact',
      desc: 'Perform AI-assisted code impact analysis for adding a new feature.',
      params: [
        { name: 'id', type: 'PATH (OBJECTID)', required: true, desc: 'Repository database ID' },
        { name: 'feature', type: 'BODY (STRING)', required: true, desc: 'Feature description text' }
      ],
      response: {
        success: true,
        impact: {
          riskLevel: "Medium",
          riskRationale: "Requires changes in controllers and utility modules.",
          filesAffected: [{ path: "src/controllers/auth.js", reason: "Integrate logic" }],
          apisAffected: [{ method: "POST", route: "/api/auth/logout", change: "Add token invalidation" }],
          databaseChanges: [],
          componentsAffected: [{ name: "AuthController", reason: "Validate payload" }],
          affectedNodeIds: ["src/controllers/auth.js"]
        }
      }
    },
    {
      category: 'CONTEXTUAL CHAT',
      method: 'POST',
      path: '/api/chat/:repoId',
      desc: 'Send a prompt query to the grounded AI agent and receive references.',
      params: [
        { name: 'repoId', type: 'PATH (OBJECTID)', required: true, desc: 'Repository database ID' },
        { name: 'message', type: 'BODY (STRING)', required: true, desc: 'Grounded query' }
      ],
      response: {
        success: true,
        message: "The application uses jsonwebtoken for authentication in [src/middleware/auth.js]...",
        citations: ["src/middleware/auth.js"]
      }
    }
  ];

  const getMethodColor = (method) => {
    if (method === 'GET') return 'bg-secondary-container/10 border-secondary text-secondary';
    if (method === 'POST') return 'bg-primary-container/10 border-primary text-primary';
    return 'bg-error-container/10 border-error text-error';
  };

  return (
    <NavbarLayout>
      <div className="p-container-padding max-w-5xl mx-auto space-y-gutter flex-grow">
        
        {/* Header */}
        <section className="border-b border-outline-variant/30 pb-6">
          <h2 className="font-headline-lg text-headline-lg font-black text-on-surface">API Reference</h2>
          <p className="text-on-surface-variant font-body-lg mt-1">
            Examine the backend REST endpoint schemas, parameters, and query shapes.
          </p>
        </section>

        {/* System Stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-md">
          <div className="bg-surface-container border border-outline-variant p-stack-md rounded-xl">
            <span className="text-on-surface-variant text-[10px] uppercase font-label-caps">Status</span>
            <div className="flex items-center gap-2 text-secondary mt-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-bold text-sm">Operational</span>
            </div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-stack-md rounded-xl">
            <span className="text-on-surface-variant text-[10px] uppercase font-label-caps">Environment</span>
            <p className="text-on-surface font-bold text-sm mt-1">development</p>
          </div>
          <div className="bg-surface-container border border-outline-variant p-stack-md rounded-xl">
            <span className="text-on-surface-variant text-[10px] uppercase font-label-caps">Port Configuration</span>
            <p className="text-on-surface font-bold text-sm mt-1">5000</p>
          </div>
          <div className="bg-surface-container border border-outline-variant p-stack-md rounded-xl">
            <span className="text-on-surface-variant text-[10px] uppercase font-label-caps">Base Path</span>
            <p className="text-on-surface font-bold text-sm mt-1">/api</p>
          </div>
        </div>

        {/* Documentation list */}
        <div className="space-y-6">
          {endpoints.map((ep, idx) => (
            <div 
              key={idx}
              className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden hover:border-outline transition-colors cursor-pointer"
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
            >
              {/* Card Header row */}
              <div className="p-stack-md flex items-center gap-stack-md">
                <div className={`px-3 py-1 rounded border font-bold text-code-sm min-w-[70px] text-center ${getMethodColor(ep.method)}`}>
                  {ep.method}
                </div>
                <div className="flex-grow overflow-hidden">
                  <code className="font-code-md text-primary text-sm truncate block">{ep.path}</code>
                  <p className="text-on-surface-variant text-xs mt-0.5">{ep.desc}</p>
                </div>
                <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${activeIdx === idx ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>

              {/* Expanding detailed content */}
              {activeIdx === idx && (
                <div className="px-stack-md pb-stack-md bg-surface-container-lowest border-t border-outline-variant/30 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
                    {/* Parameters list */}
                    <div>
                      <h4 className="text-[10px] font-label-caps text-on-surface uppercase mb-2">Parameters Schema</h4>
                      <div className="space-y-2">
                        {ep.params.map((p, pidx) => (
                          <div key={pidx} className="flex justify-between items-center p-2.5 bg-surface rounded border border-outline-variant text-xs">
                            <div className="flex flex-col">
                              <span className="font-code-sm text-primary font-bold">{p.name} {p.required && <span className="text-error">*</span>}</span>
                              <span className="text-[10px] text-on-surface-variant mt-0.5">{p.desc}</span>
                            </div>
                            <span className="text-[9px] bg-surface-container-highest border border-outline-variant px-1.5 py-0.5 rounded font-code-md text-outline">
                              {p.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response Sample */}
                    <div>
                      <h4 className="text-[10px] font-label-caps text-on-surface uppercase mb-2">Response JSON Body</h4>
                      <pre className="bg-surface-dim p-4 rounded border border-outline-variant font-code-sm text-on-surface-variant text-xs select-all overflow-x-auto max-h-[250px] custom-scrollbar whitespace-pre">
                        {JSON.stringify(ep.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </NavbarLayout>
  );
}
