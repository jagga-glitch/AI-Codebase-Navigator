import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useRepoDetails } from '../hooks/useRepos.js';
import { useRepoFile } from '../hooks/useRepoAnalysis.js';
import { apiClient } from '../services/apiClient.ts';
import toast from 'react-hot-toast';
import Prism from 'prismjs';

// Import Prism Tomorrow Theme for premium dark syntax highlighting
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';

export default function RepositoryPage() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFilePath = searchParams.get('file') || '';

  const { data: repo } = useRepoDetails(repoId);
  const { data: fileData, isLoading: isFileLoading, error: fileError } = useRepoFile(repoId, selectedFilePath);

  const [expandedFolders, setExpandedFolders] = useState({ 'root': true });
  const [aiExplanation, setAiExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  // Trigger Prism highlighting on file data load
  useEffect(() => {
    if (fileData?.content) {
      Prism.highlightAll();
    }
  }, [fileData, selectedFilePath]);

  // Helper to safely highlight code using Prism (React-compatible)
  const getHighlightedCode = () => {
    if (!fileData || !fileData.content) return '';
    const ext = selectedFilePath.split('.').pop().toLowerCase();
    
    let lang = 'javascript';
    if (ext === 'ts') lang = 'typescript';
    else if (ext === 'tsx') lang = 'tsx';
    else if (ext === 'jsx') lang = 'jsx';
    else if (ext === 'json') lang = 'json';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'html') lang = 'html';
    else if (ext === 'sh' || ext === 'bash') lang = 'bash';

    const grammar = Prism.languages[lang] || Prism.languages.javascript;
    try {
      return Prism.highlight(fileData.content, grammar, lang);
    } catch (e) {
      return fileData.content;
    }
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Find metadata for the selected file from the repo graph
  const fileNode = repo?.graph?.nodes?.find(n => n.file === selectedFilePath);

  // Find imports/dependencies from the graph edges
  const incomingDependencies = repo?.graph?.edges?.filter(e => e.target === selectedFilePath) || [];
  const outgoingDependencies = repo?.graph?.edges?.filter(e => e.source === selectedFilePath) || [];

  // Request AI Explanation using real backend API
  const handleRequestExplanation = async () => {
    if (!selectedFilePath) return;
    setIsExplaining(true);
    setAiExplanation('');

    try {
      const prompt = `Can you provide a comprehensive explanation of the file "${selectedFilePath}"? Include its purpose, key functions, and role in the architecture.`;
      const res = await apiClient.post(`/api/chat/${repoId}`, { message: prompt });
      if (res.data && res.data.message) {
        setAiExplanation(res.data.message);
      } else {
        setAiExplanation('Unable to generate explanation.');
      }
    } catch (err) {
      toast.error('AI explanation failed to load.');
      setAiExplanation('Error generating AI explanation. Make sure server is running and configured.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCopyCode = () => {
    if (fileData && fileData.content) {
      navigator.clipboard.writeText(fileData.content);
      toast.success('Code copied to clipboard!');
    }
  };

  // Build local file tree
  const buildFileTree = () => {
    if (!repo) return [];
    
    const filesList = repo.files && repo.files.length > 0
      ? repo.files
      : (repo.graph?.nodes?.map(n => n.file || n.id).filter(Boolean) || []);

    const root = { name: 'root', isFolder: true, children: {} };

    filesList.forEach(filePath => {
      if (!filePath) return;

      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: filePath,
            isFolder: !isLast,
            children: isLast ? null : {}
          };
        }
        current = current.children[part];
      });
    });

    return root;
  };

  const renderTree = (node, depth = 0) => {
    if (!node) return null;
    const childrenList = node.children ? Object.values(node.children) : [];

    // Sort folders first
    childrenList.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    const isSelected = selectedFilePath === node.path;

    return (
      <div key={node.name} className={`${depth > 0 ? 'ml-3 pl-1 border-l border-white/5' : ''}`}>
        {node.name !== 'root' && (
          <div 
            onClick={() => node.isFolder ? toggleFolder(node.name) : setSearchParams({ file: node.path })}
            className={`flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 ${
              isSelected 
                ? 'bg-primary/15 text-white font-bold border-l-2 border-primary' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {node.isFolder ? (
              <>
                <span className="material-symbols-outlined text-[14px] mr-1 text-slate-500">
                  {expandedFolders[node.name] ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[14px] mr-1.5 text-secondary">folder</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px] mr-2 text-primary">description</span>
              </>
            )}
            <span className="text-[11px] font-code-sm truncate font-code">{node.name}</span>
          </div>
        )}
        
        {(!node.name || node.name === 'root' || expandedFolders[node.name]) && childrenList.map(child => renderTree(child, depth + 1))}
      </div>
    );
  };

  const fileTreeRoot = buildFileTree();

  // Detect code language for Prism highlighting
  const getLanguageClass = (filename) => {
    if (!filename) return 'language-javascript';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'ts') return 'language-typescript';
    if (ext === 'tsx') return 'language-tsx';
    if (ext === 'jsx') return 'language-jsx';
    if (ext === 'json') return 'language-json';
    if (ext === 'css') return 'language-css';
    return 'language-javascript';
  };

  return (
    <NavbarLayout>
      <div className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
        
        {/* Left Pane: VS Code style File Tree */}
        <aside className="w-64 bg-slate-900/60 border-r border-white/10 flex flex-col p-4 overflow-y-auto custom-scrollbar shrink-0 backdrop-blur-md z-10 shadow-lg">
          <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 text-[9px] font-label select-none">
            <span className="material-symbols-outlined text-xs text-primary animate-pulse">folder_open</span> Code Explorer
          </h3>
          <div className="space-y-0.5 select-none">
            {renderTree(fileTreeRoot)}
          </div>
        </aside>

        {/* Center Pane: High-Tech Code Viewer */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/20 border-r border-white/10 relative">
          <div className="bg-slate-950/80 px-5 py-3.5 border-b border-white/10 flex items-center justify-between shadow-sm select-none">
            <span className="font-code text-xs text-white font-bold truncate">
              {selectedFilePath || 'Workspace Overview'}
            </span>
            {selectedFilePath && (
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyCode}
                  className="bg-slate-900 border border-white/5 hover:border-primary text-slate-300 font-bold px-3 py-1.5 rounded-xl text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>Copy</span>
                </button>
                <button 
                  onClick={handleRequestExplanation}
                  disabled={isExplaining}
                  className="bg-primary text-on-primary font-bold px-3 py-1.5 rounded-xl text-[10px] hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Explain Code</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-grow overflow-y-auto p-5 font-code text-xs custom-scrollbar select-text leading-relaxed bg-[#0c101b]/30">
            {selectedFilePath ? (
              isFileLoading ? (
                <div className="flex flex-col justify-center items-center h-full gap-3 select-none">
                  <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-xs text-slate-500 font-label">Fetching raw codebase...</span>
                </div>
              ) : fileError ? (
                <div className="text-error p-4 text-center mt-12 select-none bg-error/5 border border-error/20 rounded-2xl max-w-sm mx-auto">
                  <span className="material-symbols-outlined text-3xl mb-1 text-error">warning</span>
                  <p className="font-bold">Failed to load file</p>
                  <p className="text-[10px] mt-1 text-slate-400">{fileError.message || 'File contents missing.'}</p>
                </div>
              ) : fileData && fileData.content ? (
                <pre className="rounded-xl overflow-auto m-0 p-4 bg-slate-950/80 border border-white/5 shadow-inner">
                  <code 
                    className={`${getLanguageClass(selectedFilePath)}`}
                    dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
                  />
                </pre>
              ) : (
                <p className="text-slate-500 text-center mt-12 select-none italic">File content empty.</p>
              )
            ) : (
              <div className="p-8 space-y-6 max-w-2xl mx-auto mt-6 select-none">
                <div className="bg-slate-900/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden shadow-2xl glass-panel">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                  <span className="bg-primary/15 text-primary border border-primary/20 px-2.5 py-0.5 rounded-lg font-bold text-[8px] tracking-widest uppercase">WORKSPACE COMMAND</span>
                  <h2 className="font-headline-md text-headline-lg text-white mt-2 mb-1">
                    {repo?.name || 'Explorer Console'}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {repo?.description || 'Select a file in the folder hierarchy to review static complexity rates, connection maps, and interactive AI walkthroughs.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-white/10 p-4 rounded-2xl shadow glass-panel">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-label">Analyzed Code Files</p>
                    <p className="text-2xl font-bold text-white mt-1 font-code">{repo?.stats?.totalFiles || repo?.stats?.fileCount || 0}</p>
                  </div>
                  <div className="bg-slate-900/40 border border-white/10 p-4 rounded-2xl shadow glass-panel">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-label">Dynamic Folders</p>
                    <p className="text-2xl font-bold text-white mt-1 font-code">{repo?.stats?.folderCount || 0}</p>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-white/10 p-4 rounded-2xl space-y-3 shadow glass-panel">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label">Explore Codebase Areas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                    <button 
                      onClick={() => navigate(`/architecture/${repoId}`)}
                      className="flex items-center gap-3 p-3 bg-slate-950 border border-white/5 hover:border-primary rounded-xl text-white font-bold text-left transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-primary animate-pulse">location_city</span>
                      <div>
                        <p className="text-xs">Software City Map</p>
                        <p className="text-[8px] text-slate-500 font-normal mt-0.5">Visualize dependency layout</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => navigate(`/chat/${repoId}`)}
                      className="flex items-center gap-3 p-3 bg-slate-950 border border-white/5 hover:border-primary rounded-xl text-white font-bold text-left transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-secondary animate-pulse">smart_toy</span>
                      <div>
                        <p className="text-xs">AI Workspace Chat</p>
                        <p className="text-[8px] text-slate-500 font-normal mt-0.5">Ask AI architecture queries</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Pane: AI Workspace Copilot Panel */}
        <aside className="w-80 bg-slate-900/60 border-l border-white/10 flex flex-col overflow-y-auto custom-scrollbar shrink-0 backdrop-blur-md z-10 shadow-lg">
          <div className="p-4 border-b border-white/10 bg-slate-950/80 select-none">
            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[9px] mb-1 font-label">
              {selectedFilePath ? 'File Metrics & Analytics' : 'Quick Tips'}
            </h3>
            <h4 className="font-headline-sm text-headline-sm font-bold text-white truncate" title={selectedFilePath ? selectedFilePath.split('/').pop() : 'Quick Start'}>
              {selectedFilePath ? selectedFilePath.split('/').pop() : 'Quick Start'}
            </h4>
          </div>

          <div className="p-4 space-y-5 text-xs select-none">
            {selectedFilePath && fileNode ? (
              <>
                {/* Visual Dials/Gauges */}
                <div className="space-y-2">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-label">Complexity Radar</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex flex-col justify-between shadow">
                      <p className="text-[8px] uppercase text-slate-500 font-bold">Complexity</p>
                      <p className="font-bold text-white text-lg mt-1 font-code">{fileNode.complexity || 'N/A'}/10</p>
                    </div>
                    <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex flex-col justify-between shadow">
                      <p className="text-[8px] uppercase text-slate-500 font-bold">Type Class</p>
                      <p className="font-bold text-primary text-[10px] mt-1.5 uppercase font-code-sm truncate">{fileNode.type || 'other'}</p>
                    </div>
                  </div>
                </div>

                {/* Dependency Traversal Links */}
                <div className="space-y-2">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-label">Local Edge Connections</p>
                  <div className="space-y-2 max-h-[170px] overflow-y-auto custom-scrollbar pr-1">
                    {incomingDependencies.length === 0 && outgoingDependencies.length === 0 ? (
                      <p className="text-slate-500 italic text-[10px] px-1">No local dependency imports mapped.</p>
                    ) : (
                      <>
                        {incomingDependencies.map((e, idx) => (
                          <div 
                            key={`in-${idx}`} 
                            onClick={() => setSearchParams({ file: e.source })}
                            className="flex items-center gap-2 bg-slate-950/80 border border-white/5 p-2 rounded-xl hover:border-primary cursor-pointer transition-all"
                          >
                            <span className="material-symbols-outlined text-xs text-secondary animate-pulse">arrow_back</span>
                            <span className="truncate text-white font-code-sm text-[10px]" title={e.source}>{e.source.split('/').pop()}</span>
                          </div>
                        ))}
                        {outgoingDependencies.map((e, idx) => (
                          <div 
                            key={`out-${idx}`} 
                            onClick={() => setSearchParams({ file: e.target })}
                            className="flex items-center gap-2 bg-slate-950/80 border border-white/5 p-2 rounded-xl hover:border-primary cursor-pointer transition-all"
                          >
                            <span className="material-symbols-outlined text-xs text-primary">arrow_forward</span>
                            <span className="truncate text-white font-code-sm text-[10px]" title={e.target}>{e.target.split('/').pop()}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* AI Explanation Text */}
                <div className="space-y-2.5 pt-3.5 border-t border-white/5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-label">AI Explanation Walkthrough</p>
                  {isExplaining ? (
                    <div className="space-y-2 py-2 select-none">
                      <div className="h-2 bg-slate-950 rounded max-w-[200px] animate-pulse" />
                      <div className="h-2 bg-slate-950 rounded animate-pulse" />
                      <div className="h-2 bg-slate-950 rounded animate-pulse" />
                    </div>
                  ) : aiExplanation ? (
                    <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl leading-relaxed select-text text-white text-[10px] whitespace-pre-wrap max-h-[220px] overflow-y-auto custom-scrollbar shadow">
                      {aiExplanation}
                    </div>
                  ) : (
                    <button 
                      onClick={handleRequestExplanation}
                      className="w-full border border-primary/30 hover:border-primary text-white font-bold py-2.5 rounded-xl text-[10px] hover:bg-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span className="material-symbols-outlined text-xs text-primary animate-pulse">auto_awesome</span>
                      <span>Ask AI for Walkthrough</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 shadow">
                  <h5 className="font-bold text-white mb-2 flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-xs text-secondary animate-pulse">tips_and_updates</span>
                    <span>Quick Start</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Select a source file in the left directory tree. Navigator will parse its complexity metrics, call imports, and activate the AI sandbox walkthrough.
                  </p>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 shadow">
                  <h5 className="font-bold text-white mb-2 flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-xs text-primary">help_outline</span>
                    <span>AI Workspace Tips</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Query the AI Chat Assistant regarding specific logic: "Where is auth middleware declared?" or "What fields exist in User schema?".
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </NavbarLayout>
  );
}
