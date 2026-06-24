import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useRepoDetails } from '../hooks/useRepos.js';
import { useRepoImpact } from '../hooks/useRepoAnalysis.js';
import toast from 'react-hot-toast';
import { getStrokeDashOffset } from '../utils/chartUtils';
export default function ImpactPage() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { data: repo } = useRepoDetails(repoId);
  const impactMutation = useRepoImpact(repoId);

  const [featureDescription, setFeatureDescription] = useState('');
  const [impactResult, setImpactResult] = useState(null);
  
  // Loading status text rotation for progressive launch console simulation
  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);
  const loadingStatuses = [
    'Booting static graph scanner...',
    'Interpreting change intent...',
    'Mapping dependency cascades...',
    'Simulating blast radius boundaries...',
    'Compiling security and risk scores...'
  ];

  useEffect(() => {
    let interval;
    if (impactMutation.isPending) {
      interval = setInterval(() => {
        setLoadingStatusIdx(prev => (prev + 1) % loadingStatuses.length);
      }, 1500);
    } else {
      setLoadingStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [impactMutation.isPending]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!featureDescription.trim()) {
      toast.error('Please enter a feature description.');
      return;
    }

    toast.promise(
      impactMutation.mutateAsync({ feature: featureDescription }),
      {
        loading: 'Tracer launched...',
        success: (data) => {
          setImpactResult(data.impact);
          return 'Change propagation complete!';
        },
        error: (err) => err.message || 'Feature impact analysis failed.'
      }
    );
  };

  const getRiskColor = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'low') return 'text-secondary border-secondary/20 bg-secondary/5';
    if (r === 'medium') return 'text-primary border-primary/20 bg-primary/5';
    return 'text-error border-error/20 bg-error/5';
  };

  const getRiskColorRaw = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'low') return '#10b981'; // Emerald Green
    if (r === 'medium') return '#6366f1'; // Indigo Blue
    return '#f43f5e'; // Rose Red
  };

  const getRiskPercentage = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'low') return 30;
    if (r === 'medium') return 60;
    return 90;
  };

  return (
    <NavbarLayout>
      <div className="p-6 max-w-[1100px] mx-auto space-y-6 flex-grow select-none bg-slate-950/20">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-6 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Impact Analysis Command</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Analyze code changes, evaluate database collections mutations, and outline affected REST endpoints.
            </p>
          </div>
          <button 
            onClick={() => navigate(`/architecture/${repoId}`)}
            className="border border-white/10 text-white bg-slate-900/40 hover:border-primary text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-slate-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-sm text-primary animate-pulse">location_city</span>
            <span>View Software City</span>
          </button>
        </div>

        {/* Feature Input Panel */}
        <div className="bg-slate-900/40 border border-white/10 p-6 rounded-2xl glass-panel relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base animate-pulse">bolt</span> Propose Code Modifications
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Outline the feature additions or change parameters. The AI parser will trace cascading references across the repository graph.
          </p>
          
          <form onSubmit={handleAnalyze} className="space-y-4 relative z-10">
            <textarea 
              value={featureDescription}
              onChange={(e) => setFeatureDescription(e.target.value)}
              placeholder="e.g. Implement dynamic JWT token blacklist in middleware to support session logouts instantly."
              rows="4"
              className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-primary focus:outline-none placeholder:text-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
            />
            
            <button 
              type="submit"
              disabled={impactMutation.isPending}
              className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-lg shadow-primary/20"
            >
              {impactMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Tracing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  <span>Analyze blast radius</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Launch loader screen */}
        {impactMutation.isPending && (
          <div className="bg-slate-900/40 border border-white/10 p-10 rounded-2xl flex flex-col items-center justify-center text-center glass-panel animate-pulse shadow-xl">
            <span className="material-symbols-outlined text-4xl mb-3 text-primary animate-spin">sync</span>
            <p className="font-bold text-white text-xs">{loadingStatuses[loadingStatusIdx]}</p>
            <div className="w-48 h-1 bg-slate-950 border border-white/5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-primary animate-shimmer-bar" style={{ width: '40%' }} />
            </div>
          </div>
        )}

        {/* Impact Results */}
        {impactResult && !impactMutation.isPending && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Animated Change Propagation Timeline */}
            <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-4 font-label">Animated Change Propagation</span>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center font-bold text-[10px] select-none text-slate-400">
                <div className="flex-1 bg-slate-950 border border-white/5 p-3 rounded-xl hover:border-primary transition-all w-full">
                  <span className="material-symbols-outlined text-base block text-primary mb-1 animate-pulse">edit_note</span>
                  <p className="text-white">Proposed Change</p>
                  <p className="text-[8px] text-slate-500 font-normal mt-0.5">Feature description parsed</p>
                </div>
                <span className="material-symbols-outlined text-slate-700 hidden md:block animate-bounce-horizontal">arrow_forward</span>
                <div className="flex-1 bg-slate-950 border border-white/5 p-3 rounded-xl hover:border-primary transition-all w-full">
                  <span className="material-symbols-outlined text-base block text-secondary mb-1 animate-pulse">schema</span>
                  <p className="text-white">Dependency Graph</p>
                  <p className="text-[8px] text-slate-500 font-normal mt-0.5">Reference paths scanned</p>
                </div>
                <span className="material-symbols-outlined text-slate-700 hidden md:block animate-bounce-horizontal">arrow_forward</span>
                <div className="flex-1 bg-slate-950 border border-white/5 p-3 rounded-xl hover:border-primary transition-all w-full">
                  <span className="material-symbols-outlined text-base block text-tertiary mb-1 animate-pulse">description</span>
                  <p className="text-white">Affected Files</p>
                  <p className="text-[8px] text-slate-500 font-normal mt-0.5">{impactResult.filesAffected?.length || 0} structures isolated</p>
                </div>
                <span className="material-symbols-outlined text-slate-700 hidden md:block animate-bounce-horizontal">arrow_forward</span>
                <div className="flex-1 bg-slate-950 border border-white/5 p-3 rounded-xl hover:border-primary transition-all w-full">
                  <span className="material-symbols-outlined text-base block text-error mb-1 animate-pulse">api</span>
                  <p className="text-white">Impact Assessment</p>
                  <p className="text-[8px] text-slate-500 font-normal mt-0.5">{impactResult.riskLevel} risk evaluated</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Risk gauge speedometer */}
              <div className="md:col-span-4 bg-slate-900/40 border border-white/10 p-6 rounded-2xl flex flex-col justify-between items-center text-center glass-panel shadow-xl">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-label">Blast Radius Gauge</span>
                
                <div className="relative w-36 h-36 flex items-center justify-center mt-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-950" cx="72" cy="72" fill="transparent" r="64" stroke="currentColor" strokeWidth="8" />
                    <circle 
                      className="transition-all duration-1000" 
                      cx="72" 
                      cy="72" 
                      fill="transparent" 
                      r="64" 
                      stroke={getRiskColorRaw(impactResult.riskLevel)} 
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={getStrokeDashOffset(getRiskPercentage(impactResult.riskLevel), 64)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span 
                      className="text-2xl font-black font-code uppercase"
                      style={{ color: getRiskColorRaw(impactResult.riskLevel) }}
                    >
                      {impactResult.riskLevel}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Impact Score</span>
                  </div>
                </div>

                <div className="w-full pt-4 mt-5 border-t border-white/5 text-left text-xs text-slate-400">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-label">Diagnostics Summary</p>
                  <div className="flex justify-between py-1 border-b border-white/5 pb-1">
                    <span>Files affected:</span>
                    <span className="font-bold text-white font-code">{impactResult.filesAffected?.length || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 pb-1">
                    <span>APIs affected:</span>
                    <span className="font-bold text-white font-code">{impactResult.apisAffected?.length || 0}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>DB mutations:</span>
                    <span className="font-bold text-white font-code">{impactResult.databaseChanges?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Affected Items lists */}
              <div className="md:col-span-8 space-y-6">
                
                {/* Affected Files detailed list */}
                <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">description</span> Isolated Affected Files
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {impactResult.filesAffected && impactResult.filesAffected.length > 0 ? (
                      impactResult.filesAffected.map((file, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => navigate(`/repository/${repoId}?file=${encodeURIComponent(file.path)}`)}
                          className="bg-slate-950 border border-white/5 p-3 rounded-xl flex flex-col gap-1 hover:border-primary transition-colors cursor-pointer"
                        >
                          <span className="font-code-sm text-[11px] text-white font-bold truncate">{file.path}</span>
                          <span className="text-[10px] text-slate-400 leading-normal">{file.reason}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 italic px-1">No files identified as affected.</p>
                    )}
                  </div>
                </div>

                {/* API and DB details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Affected APIs */}
                  <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-secondary animate-pulse">api</span> API Endpoints Gateway
                    </h4>
                    <div className="space-y-2 max-h-[190px] overflow-y-auto custom-scrollbar">
                      {impactResult.apisAffected && impactResult.apisAffected.length > 0 ? (
                        impactResult.apisAffected.map((api, idx) => (
                          <div key={idx} className="bg-slate-950 border border-white/5 p-2.5 rounded-xl flex flex-col gap-1">
                            <div className="flex gap-2 items-center">
                              <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-[8px] font-bold text-primary font-code">{api.method}</span>
                              <span className="text-white font-code-sm text-[10px] truncate">{api.route}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 leading-tight">{api.change}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 italic px-1">No API routes impacted.</p>
                      )}
                    </div>
                  </div>

                  {/* Database changes */}
                  <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-tertiary">database</span> Database Schema Mutations
                    </h4>
                    <div className="space-y-2 max-h-[190px] overflow-y-auto custom-scrollbar">
                      {impactResult.databaseChanges && impactResult.databaseChanges.length > 0 ? (
                        impactResult.databaseChanges.map((db, idx) => (
                          <div key={idx} className="bg-slate-950 border border-white/5 p-2.5 rounded-xl flex flex-col gap-1">
                            <span className="font-bold text-white truncate font-code-sm text-[11px]">{db.collection || db.table}</span>
                            <span className="text-[9px] text-slate-400 leading-tight">{db.change}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 italic px-1">No database schema changes detected.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}
      </div>
      
      <style>{`
        .animate-shimmer-bar {
          animation: shimmer-bar-anim 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes shimmer-bar-anim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </NavbarLayout>
  );
}
