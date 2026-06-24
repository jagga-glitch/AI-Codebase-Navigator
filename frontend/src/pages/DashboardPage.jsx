import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useRepos, useRepoActions } from '../hooks/useRepos.js';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { repos, isLoading, error } = useRepos();
  const { createRepoMutation, deleteRepoMutation } = useRepoActions();
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState(null);

  const selectedRepo = repos.find(r => r._id === selectedRepoId) || repos[0];

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newRepoUrl) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    if (!githubRegex.test(newRepoUrl)) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }

    toast.promise(
      createRepoMutation.mutateAsync({ githubUrl: newRepoUrl }),
      {
        loading: 'Registering repository...',
        success: (data) => {
          setNewRepoUrl('');
          setSelectedRepoId(data._id);
          return 'Repository registered! Static and dependency analysis initiated.';
        },
        error: (err) => err.message || 'Failed to register repository.'
      }
    );
  };

  const handleDelete = (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the repository "${name}"? This will clear all associated analysis and chat history.`)) {
      return;
    }

    toast.promise(
      deleteRepoMutation.mutateAsync(id),
      {
        loading: 'Deleting repository...',
        success: () => {
          if (selectedRepoId === id) {
            setSelectedRepoId(null);
          }
          return 'Repository deleted successfully';
        },
        error: (err) => err.message || 'Failed to delete repository'
      }
    );
  };

  // Compute stats details on selection
  const computedMetrics = useMemo(() => {
    if (!selectedRepo || selectedRepo.status !== 'done') return null;

    const nodes = selectedRepo.graph?.nodes || [];
    const edges = selectedRepo.graph?.edges || [];

    const edgeCounts = {};
    nodes.forEach(n => {
      edgeCounts[n.id] = { in: 0, out: 0, total: 0 };
    });

    edges.forEach(e => {
      if (edgeCounts[e.source]) {
        edgeCounts[e.source].out += 1;
        edgeCounts[e.source].total += 1;
      }
      if (edgeCounts[e.target]) {
        edgeCounts[e.target].in += 1;
        edgeCounts[e.target].total += 1;
      }
    });

    // Sort by complexity for heatmap
    const complexFiles = [...nodes]
      .sort((a, b) => (b.complexity || 5) - (a.complexity || 5))
      .slice(0, 5);

    // Sort by connection count for risks
    const riskyFiles = [...nodes]
      .map(n => ({ ...n, connections: edgeCounts[n.id]?.total || 0 }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // Count loops
    const loopsCount = selectedRepo.insights?.filter(i => i.type?.includes('cycle') || i.title?.toLowerCase().includes('circular'))?.length || 0;

    const baseHealth = selectedRepo.healthScore?.overall || 80;
    const archScore = Math.max(40, Math.min(100, 100 - (loopsCount * 15) - (riskyFiles.filter(f => f.connections >= 5).length * 4)));
    const techDebt = Math.max(5, Math.min(100, Math.round(100 - (selectedRepo.healthScore?.maintainability || 75))));

    return { complexFiles, riskyFiles, loopsCount, archScore, techDebt };
  }, [selectedRepo]);

  // Helper to calculate health gauge offset
  const getStrokeDashOffset = (score, radius = 58) => {
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  return (
    <NavbarLayout>
      <div className="p-6 max-w-[1450px] mx-auto space-y-6 flex-1 flex flex-col bg-slate-950/20 select-none">
        
        {/* Top Section: Register Repository */}
        <div className="bg-slate-900/40 border border-white/10 p-6 rounded-2xl glass-panel relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg animate-pulse">add_circle</span>
              <span>Register New Codebase</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Paste a public GitHub link. Navigator will index file trees, map calling dependencies, and boot the static analysis engine.
            </p>
            <form onSubmit={handleRegister} className="flex gap-2">
              <input 
                type="text" 
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="flex-grow bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-xs font-code text-white focus:border-primary focus:outline-none placeholder:text-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
              />
              <button 
                type="submit" 
                disabled={createRepoMutation.isPending}
                className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20 cursor-pointer"
              >
                {createRepoMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xs">add</span>
                    <span>Add Repo</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Repositories List Grid */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-label">Your Monitored Codebases</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-900/20 border border-white/5 p-5 rounded-2xl space-y-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-800 rounded w-16" />
                    <div className="h-4 bg-slate-800 rounded w-4" />
                  </div>
                  <div className="h-5 bg-slate-800 rounded w-40" />
                  <div className="h-3 bg-slate-800 rounded w-48" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-7 bg-slate-800 rounded flex-1" />
                    <div className="h-7 bg-slate-800 rounded flex-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-xs font-bold uppercase tracking-wider">
              {error.message || 'Failed to load repositories'}
            </div>
          ) : repos.length === 0 ? (
            <div className="bg-slate-900/30 border border-white/10 p-12 rounded-2xl text-center text-slate-400 glass-card flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl mb-2 text-primary animate-bounce">location_city</span>
              <p className="font-bold text-white text-sm">No Monitored Codebases Mapped</p>
              <p className="text-xs mt-1 max-w-xs leading-relaxed">Paste a GitHub link in the console above to run static graph analyses and boot the interactive visualizer!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => {
                const isSelected = selectedRepoId === repo._id || (!selectedRepoId && selectedRepo?._id === repo._id);
                const repoInitials = repo.name ? repo.name.slice(0, 2).toUpperCase() : 'RP';

                return (
                  <div 
                    key={repo._id} 
                    onClick={() => setSelectedRepoId(repo._id)}
                    className={`bg-slate-900/40 border p-5 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-slate-900/60 shadow-[0_15px_30px_-10px_rgba(99,102,241,0.25)]' 
                        : 'border-white/5 hover:border-white/10 hover:bg-slate-900/30'
                    }`}
                  >
                    {/* Hover preview metrics popup decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold border tracking-wider uppercase ${
                          repo.status === 'done' 
                            ? 'bg-secondary/15 text-secondary border-secondary/20' 
                            : repo.status === 'error'
                              ? 'bg-error/15 text-error border-error/20'
                              : 'bg-primary/15 text-primary border-primary/20 animate-pulse'
                        }`}>
                          {repo.status}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(repo._id, repo.name || repo.githubUrl, e)}
                        className="text-slate-500 hover:text-error transition-colors p-1 cursor-pointer"
                        title="Delete repository"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3.5 mb-4">
                      {/* Avatar initial gradient */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/5 flex items-center justify-center text-white font-extrabold text-xs shadow group-hover:border-primary/50 transition-colors">
                        {repoInitials}
                      </div>
                      <div className="truncate flex-1">
                        <h4 className="font-bold text-white truncate text-sm">
                          {repo.name || repo.githubUrl.split('/').slice(-1)[0]}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate leading-none mt-1">{repo.githubUrl}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/architecture/${repo._id}`);
                        }}
                        className="flex-1 bg-slate-950 border border-white/5 hover:border-primary text-[10px] font-bold py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 text-slate-300 disabled:opacity-30 cursor-pointer"
                        disabled={repo.status !== 'done'}
                      >
                        <span className="material-symbols-outlined text-xs">location_city</span>
                        <span>Map</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chat/${repo._id}`);
                        }}
                        className="flex-1 bg-slate-950 border border-white/5 hover:border-primary text-[10px] font-bold py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 text-slate-300 disabled:opacity-30 cursor-pointer"
                        disabled={repo.status !== 'done'}
                      >
                        <span className="material-symbols-outlined text-xs">smart_toy</span>
                        <span>Chat</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/learning/${repo._id}`);
                        }}
                        className="flex-1 bg-slate-950 border border-white/5 hover:border-primary text-[10px] font-bold py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 text-slate-300 disabled:opacity-30 cursor-pointer"
                        disabled={repo.status !== 'done'}
                      >
                        <span className="material-symbols-outlined text-xs">school</span>
                        <span>Roadmap</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Repository Health Command Center Dashboard */}
        {selectedRepo && selectedRepo.status === 'done' && computedMetrics && (
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label">HEALTH COMMAND CENTER</h3>
                <h2 className="text-xl font-bold text-white mt-1">Codebase Diagnostics: <span className="text-primary">{selectedRepo.name}</span></h2>
              </div>
              
              <div className="flex gap-2.5 mt-3 md:mt-0">
                <button 
                  onClick={() => navigate(`/architecture/${selectedRepo._id}`)}
                  className="bg-primary text-on-primary font-bold px-4 py-2 rounded-xl text-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">explore</span>
                  <span>Explore Architecture</span>
                </button>
                <button 
                  onClick={() => navigate(`/chat/${selectedRepo._id}`)}
                  className="border border-white/10 text-white bg-slate-900/40 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-sm text-secondary animate-pulse">smart_toy</span>
                  <span>Ask Assistant</span>
                </button>
              </div>
            </div>
            
            {/* 6 requested Health widgets */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* WIDGET 1: Health Radar (SVGs overall health gauge) */}
              <div className="col-span-12 lg:col-span-4 bg-slate-900/40 border border-white/10 p-6 rounded-2xl glass-panel flex flex-col items-center justify-center text-center shadow-xl">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4 font-label">Health Radar</span>
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-950" cx="72" cy="72" fill="transparent" r="64" stroke="currentColor" strokeWidth="8" />
                    <circle 
                      className="text-secondary transition-all duration-1000" 
                      cx="72" 
                      cy="72" 
                      fill="transparent" 
                      r="64" 
                      stroke="currentColor" 
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={getStrokeDashOffset(selectedRepo.healthScore?.overall || 80, 64)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white font-code">
                      {selectedRepo.healthScore?.overall || 80}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Overall Rating</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5 text-left w-full text-xs text-slate-400 border-t border-white/5 pt-4">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span>Maintainability:</span>
                    <span className="font-bold text-white font-code">{selectedRepo.healthScore?.maintainability || 0}%</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span>Documentation:</span>
                    <span className="font-bold text-white font-code">{selectedRepo.healthScore?.documentation || 0}%</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Test Coverage:</span>
                    <span className="font-bold text-white font-code">{selectedRepo.healthScore?.testCoverage || 0}%</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Dependencies:</span>
                    <span className="font-bold text-white font-code">{selectedRepo.healthScore?.dependencyHealth || 0}%</span>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN MODULE DETAILS */}
              <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
                
                {/* WIDGET 2: Technical Debt Meter */}
                <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-label">Technical Debt Meter</span>
                    <h4 className="text-white font-bold text-lg font-code">{computedMetrics.techDebt}% Debt</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Calculated from complexity hotspots and package coupling densities.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-4">
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          computedMetrics.techDebt >= 40 ? 'bg-error' : computedMetrics.techDebt >= 20 ? 'bg-tertiary' : 'bg-secondary'
                        }`}
                        style={{ width: `${computedMetrics.techDebt}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 font-bold font-code">
                      <span>STABLE</span>
                      <span>MODERATE</span>
                      <span>REFACTOR REQUIRED</span>
                    </div>
                  </div>
                </div>

                {/* WIDGET 3: Architecture Score */}
                <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-label">Architecture Index</span>
                    <h4 className="text-white font-bold text-lg font-code">{computedMetrics.archScore}/100</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Stability based on DFS cycle paths and dependency loop weights.
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-400">
                    <span>Loops Detected:</span>
                    <span className={`font-bold font-code ${computedMetrics.loopsCount > 0 ? 'text-error animate-pulse' : 'text-secondary'}`}>
                      {computedMetrics.loopsCount} loops
                    </span>
                  </div>
                </div>

                {/* WIDGET 4: Complexity Heatmap */}
                <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl flex flex-col justify-between col-span-2">
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-3 font-label">Complexity Heatmap (Top Skyscrapers)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {computedMetrics.complexFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          onClick={() => navigate(`/repository/${selectedRepo._id}?file=${encodeURIComponent(file.file)}`)}
                          className="bg-slate-950 border border-white/5 hover:border-primary p-3 rounded-xl cursor-pointer text-center transition-all"
                        >
                          <span className="material-symbols-outlined text-lg block mb-1 text-primary animate-pulse">location_city</span>
                          <span className="text-[9px] text-slate-400 font-bold block truncate font-code-sm" title={file.label}>{file.label}</span>
                          <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-lg mt-1 border ${
                            file.complexity >= 8 ? 'bg-error/15 text-error border-error/20' : 'bg-tertiary/15 text-tertiary border-tertiary/20'
                          }`}>C:{file.complexity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* WIDGET 5: Dependency Risk */}
              <div className="col-span-12 lg:col-span-8 bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-3 font-label">Dependency Risk Bottlenecks</span>
                <div className="space-y-2">
                  {computedMetrics.riskyFiles.slice(0, 4).map((f, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => navigate(`/repository/${selectedRepo._id}?file=${encodeURIComponent(f.file)}`)}
                      className="flex justify-between items-center bg-slate-950/60 border border-white/5 p-3 rounded-xl hover:border-primary cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <div className="flex flex-col truncate">
                          <span className="text-xs text-white truncate font-bold font-code-sm">{f.label}</span>
                          <span className="text-[9px] text-slate-500 truncate leading-none mt-1">{f.file}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg font-bold font-code">
                          {f.connections} connections
                        </span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-lg border font-bold ${
                          f.connections >= 6 ? 'bg-error/10 text-error border-error/20' : 'bg-secondary/10 text-secondary border-secondary/20'
                        }`}>
                          {f.connections >= 6 ? 'Critical' : 'Moderate'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WIDGET 6: Learning Progress & Detected Languages */}
              <div className="col-span-12 lg:col-span-4 bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5 font-label">Learning Roadmap Journey</span>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 font-bold">Onboarding Progress</span>
                    <span className="text-xs text-secondary font-bold font-code">65% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 border border-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[65%]" />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3.5 mt-4">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-label">Detected Languages</span>
                  <div className="space-y-2">
                    {selectedRepo.stats?.languages?.slice(0, 3).map((lang, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-950/40 p-2 border border-white/5 rounded-lg">
                        <span className="font-bold text-white font-code-sm">{lang.name}</span>
                        <span className="font-bold text-primary font-code-sm">{lang.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </NavbarLayout>
  );
}
