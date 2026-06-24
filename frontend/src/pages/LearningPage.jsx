import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useKnowledgeGap } from '../hooks/useRepoAnalysis.js';
import { useRepoDetails } from '../hooks/useRepos.js';

export default function LearningPage() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { data: repo } = useRepoDetails(repoId);
  const { data: gapData, isLoading: isGapLoading, error: gapError } = useKnowledgeGap(repoId);

  // Load completed milestones from LocalStorage for interactive progress tracking
  const [completedModules, setCompletedModules] = useState([]);

  useEffect(() => {
    if (repoId) {
      const stored = localStorage.getItem(`roadmap-${repoId}`);
      if (stored) {
        try {
          setCompletedModules(JSON.parse(stored));
        } catch (e) {
          setCompletedModules([]);
        }
      }
    }
  }, [repoId]);

  const toggleModuleCompleted = (order) => {
    setCompletedModules(prev => {
      const next = prev.includes(order) 
        ? prev.filter(o => o !== order) 
        : [...prev, order];
      localStorage.setItem(`roadmap-${repoId}`, JSON.stringify(next));
      return next;
    });
  };

  const handleFileClick = (filePath) => {
    navigate(`/repository/${repoId}?file=${encodeURIComponent(filePath)}`);
  };

  const getCategoryColor = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat === 'frontend') return 'text-primary border-primary/20 bg-primary/5';
    if (cat === 'backend') return 'text-secondary border-secondary/20 bg-secondary/5';
    if (cat === 'database') return 'text-tertiary border-tertiary/20 bg-tertiary/5';
    return 'text-slate-400 border-white/5 bg-white/5';
  };

  // Group modules into Beginner, Intermediate, and Advanced journey stages
  const journeyStages = React.useMemo(() => {
    if (!gapData?.roadmap?.modules) return { beginner: [], intermediate: [], advanced: [] };

    const sorted = [...gapData.roadmap.modules].sort((a, b) => a.order - b.order);
    const beginner = [];
    const intermediate = [];
    const advanced = [];

    sorted.forEach((mod, idx) => {
      if (idx < 2) {
        beginner.push({ ...mod, tier: 'Beginner' });
      } else if (idx < 4) {
        intermediate.push({ ...mod, tier: 'Intermediate' });
      } else {
        advanced.push({ ...mod, tier: 'Advanced' });
      }
    });

    return { beginner, intermediate, advanced };
  }, [gapData]);

  // Calculate dynamic achievement badges based on progress
  const badges = React.useMemo(() => {
    const total = gapData?.roadmap?.modules?.length || 0;
    const completedCount = completedModules.length;

    return [
      {
        id: 'explorer',
        title: 'Explorer Initiate',
        desc: 'Complete at least 1 milestone step.',
        unlocked: completedCount >= 1,
        colorClass: 'from-amber-700 to-amber-900 border-amber-500/50',
        icon: 'explore'
      },
      {
        id: 'architect',
        title: 'Core Architect',
        desc: 'Complete at least 3 milestone steps.',
        unlocked: completedCount >= 3,
        colorClass: 'from-slate-500 to-slate-700 border-slate-400/50',
        icon: 'architecture'
      },
      {
        id: 'guru',
        title: 'Codebase Guru',
        desc: 'Complete all learning roadmaps.',
        unlocked: total > 0 && completedCount === total,
        colorClass: 'from-yellow-500 to-yellow-600 border-yellow-400/50',
        icon: 'workspace_premium'
      }
    ];
  }, [completedModules, gapData]);

  return (
    <NavbarLayout>
      <div className="p-6 max-w-[1100px] mx-auto space-y-6 flex-grow select-none bg-slate-950/20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">
              Learning Roadmaps & Journey Map
            </h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Complete onboarding milestones, trace sandbox module files, and unlock training achievement badges.
            </p>
          </div>
          {gapData && gapData.roadmap && (
            <div className="mt-4 md:mt-0 flex gap-3 text-xs">
              <div className="bg-slate-900/40 border border-white/10 px-3 py-2 rounded-xl text-center shadow glass-panel">
                <p className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Est. Duration</p>
                <p className="font-bold text-white text-lg mt-0.5 font-code">{gapData.roadmap.estimatedWeeks || 0} wks</p>
              </div>
              <div className="bg-slate-900/40 border border-white/10 px-3 py-2 rounded-xl text-center shadow glass-panel">
                <p className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Milestones</p>
                <p className="font-bold text-white text-lg mt-0.5 font-code">
                  {completedModules.length}/{gapData.roadmap.modules?.length || 0}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Canvas */}
        {isGapLoading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : gapError ? (
          <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-xs font-bold uppercase tracking-wider">
            {gapError.message || 'Failed to load knowledge gaps'}
          </div>
        ) : gapData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Journey Timeline */}
            <div className="lg:col-span-8 space-y-6 relative">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-label">Interactive Journey map</h3>
              
              {gapData.roadmap?.modules?.length > 0 ? (
                <div className="relative pl-1">
                  
                  {/* Stages Timeline vertical connector line */}
                  <div className="absolute top-8 left-6 bottom-8 w-[2px] bg-white/5 hidden md:block"></div>
                  
                  <div className="space-y-6">
                    {/* Render helper for stages */}
                    {Object.entries(journeyStages).map(([stageKey, modules]) => {
                      if (modules.length === 0) return null;
                      return (
                        <div key={stageKey} className="space-y-4">
                          <div className="text-[9px] font-bold text-primary uppercase tracking-widest pl-3 md:pl-16 select-none border-b border-white/5 pb-1">
                            {stageKey} Stage
                          </div>
                          
                          {modules.map((module) => {
                            const isCompleted = completedModules.includes(module.order);
                            return (
                              <div key={module.order} className="flex flex-col md:flex-row gap-4 relative group">
                                
                                {/* Stage order selector indicator */}
                                <div 
                                  onClick={() => toggleModuleCompleted(module.order)}
                                  className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm z-10 shrink-0 shadow-lg cursor-pointer transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-secondary border-secondary text-slate-950 shadow-secondary/15 scale-105' 
                                      : 'bg-slate-900 border-white/5 text-slate-400 group-hover:border-primary/50'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <span className="material-symbols-outlined text-lg">check</span>
                                  ) : (
                                    <span>{module.order}</span>
                                  )}
                                </div>
                                
                                {/* Stage module details */}
                                <div className={`flex-1 bg-slate-900/40 border p-5 rounded-2xl space-y-3 glass-panel relative overflow-hidden transition-all duration-300 ${
                                  isCompleted ? 'border-secondary/30 bg-slate-900/60' : 'border-white/10 hover:border-white/15'
                                }`}>
                                  <div className="flex justify-between items-start gap-4 flex-wrap">
                                    <div>
                                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <span>{module.title}</span>
                                        {isCompleted && (
                                          <span className="text-[8px] bg-secondary/15 text-secondary border border-secondary/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider leading-none">
                                            Completed
                                          </span>
                                        )}
                                      </h4>
                                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                                        Tech: <span className="text-primary">{module.technology}</span> • Level: <span className="text-secondary">{module.level}</span>
                                      </span>
                                    </div>
                                    <span className="bg-slate-950 border border-white/10 px-2 py-0.5 rounded-lg text-[9px] font-code text-slate-400 font-bold">
                                      {module.estimatedHours || 8} hrs
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                    {module.whyItMatters}
                                  </p>

                                  {/* Related Sandbox Files click triggers */}
                                  {module.relatedFiles && module.relatedFiles.length > 0 && (
                                    <div>
                                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-label">Interactive sandbox files</p>
                                      <div className="flex flex-wrap gap-2">
                                        {module.relatedFiles.map((file, fidx) => (
                                          <button 
                                            key={fidx}
                                            onClick={() => handleFileClick(file)}
                                            className="bg-slate-950 border border-white/5 hover:border-primary px-2.5 py-1 rounded-xl text-[9px] font-code text-primary flex items-center gap-1 transition-all cursor-pointer shadow"
                                          >
                                            <span className="material-symbols-outlined text-[10px] text-primary">link</span>
                                            <span>{file.split('/').slice(-1)[0]}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Key Topics checklist */}
                                  {module.keyTopics && module.keyTopics.length > 0 && (
                                    <div className="pt-3 border-t border-white/5">
                                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-label">Core Topics</p>
                                      <ul className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                                        {module.keyTopics.map((topic, tidx) => (
                                          <li key={tidx} className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                                            <span className="truncate">{topic}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-white/10 p-6 rounded-2xl text-center text-slate-400 text-xs">
                  {gapData.message || 'No training modules roadmap available.'}
                </div>
              )}
            </div>

            {/* Right Side: Skill Badges & Gaps summaries */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Badges Panel */}
              <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label border-b border-white/5 pb-2">Training Badges</h4>
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`border p-3.5 rounded-2xl flex items-center gap-3 transition-all ${
                        badge.unlocked 
                          ? `bg-gradient-to-br ${badge.colorClass} text-white shadow-lg` 
                          : 'bg-slate-950/40 border-white/5 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        badge.unlocked ? 'bg-white/10' : 'bg-slate-900 border border-white/5'
                      }`}>
                        <span className={`material-symbols-outlined text-lg ${badge.unlocked ? 'text-white' : 'text-slate-600'}`}>{badge.icon}</span>
                      </div>
                      <div className="leading-tight overflow-hidden">
                        <p className={`text-xs font-black truncate ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>{badge.title}</p>
                        <p className={`text-[9px] mt-0.5 ${badge.unlocked ? 'text-white/80' : 'text-slate-500'}`}>{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified foundations */}
              <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary">check_circle</span> Verified Skills
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Static index configuration indicates foundational skills in the stack:
                </p>
                <div className="flex flex-wrap gap-1.5 select-none">
                  {gapData.confident && gapData.confident.length > 0 ? (
                    gapData.confident.map((tech, tidx) => (
                      <span 
                        key={tidx} 
                        className={`px-2 py-0.5 rounded-lg text-[9px] border flex items-center gap-1 font-bold ${getCategoryColor(tech.category)}`}
                      >
                        <span>{tech.icon || '⚙️'}</span>
                        <span>{tech.label}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No foundational skills mapped.</span>
                  )}
                </div>
              </div>

              {/* Identified learning curve gaps */}
              <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl glass-panel shadow-xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-label flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">warning</span> Learning Gaps
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Technologies detected in dependencies that present active learning curves:
                </p>
                <div className="flex flex-wrap gap-1.5 select-none">
                  {gapData.gaps && gapData.gaps.length > 0 ? (
                    gapData.gaps.map((tech, tidx) => (
                      <span 
                        key={tidx} 
                        className={`px-2 py-0.5 rounded-lg text-[9px] border flex items-center gap-1 font-bold ${getCategoryColor(tech.category)}`}
                      >
                        <span>{tech.icon || '🔑'}</span>
                        <span>{tech.label}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No learning gaps detected. All stacks verified!</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-900/40 border border-white/10 p-8 rounded-2xl text-center text-slate-400 text-xs glass-panel">
            No training journey available. Register a monitored codebase in the dashboard first.
          </div>
        )}
      </div>
    </NavbarLayout>
  );
}
