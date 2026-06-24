import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRepoDetails } from '../hooks/useRepos.js';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Extract repoId from path if active
  const pathMatch = location.pathname.match(/\/(?:repository|architecture|chat|learning|impact)\/([^/]+)/);
  const repoId = pathMatch ? pathMatch[1] : null;
  const { data: repo } = useRepoDetails(repoId);

  // Define static page navigation options
  const staticPages = [
    { name: 'Dashboard Command Center', path: '/dashboard', icon: 'dashboard', category: 'General Pages' },
    { name: 'API Reference Documentation', path: '/docs', icon: 'api', category: 'General Pages' },
    { name: 'Interview Board Preparation', path: '/interview', icon: 'quiz', category: 'General Pages' },
    { name: 'System Settings', path: '/settings', icon: 'settings', category: 'General Pages' },
  ];

  const repoPages = repoId ? [
    { name: 'Codebase Explorer (VS Code Mode)', path: `/repository/${repoId}`, icon: 'folder_open', category: 'Repository Navigation' },
    { name: 'Software City Map (React Flow)', path: `/architecture/${repoId}`, icon: 'location_city', category: 'Repository Navigation' },
    { name: 'AI Intel Workspace Chat', path: `/chat/${repoId}`, icon: 'smart_toy', category: 'Repository Navigation' },
    { name: 'Learning Roadmap Journey', path: `/learning/${repoId}`, icon: 'school', category: 'Repository Navigation' },
    { name: 'Mission Control Impact Analyzer', path: `/impact/${repoId}`, icon: 'bolt', category: 'Repository Navigation' },
  ] : [];

  // Custom AI Intelligence Recommendations
  const aiRecommendations = repoId ? [
    { name: 'Trace Authentication Flow', path: `/architecture/${repoId}?simulate=auth`, icon: 'vpn_key', category: 'AI Quick Diagnostics' },
    { name: 'Scan Codebase Circular Dependencies', path: `/architecture/${repoId}?tab=insights`, icon: 'sync_problem', category: 'AI Quick Diagnostics' },
    { name: 'Locate Controller Skyscrapers', path: `/architecture/${repoId}?search=controller`, icon: 'search', category: 'AI Quick Diagnostics' },
    { name: 'Ask Assistant: How does Auth work?', path: `/chat/${repoId}?question=How+does+authentication+work%3F`, icon: 'question_answer', category: 'AI Quick Diagnostics' },
  ] : [];

  // Extract files list from repo
  const repoFiles = repo && repo.files && repo.files.length > 0
    ? repo.files.map(f => ({
        name: f.split('/').pop(),
        path: `/repository/${repoId}?file=${encodeURIComponent(f)}`,
        fullPath: f,
        icon: 'description',
        category: 'Repository Files'
      }))
    : [];

  // Merge options and filter based on query
  const allOptions = [...staticPages, ...repoPages, ...aiRecommendations, ...repoFiles];
  const filteredOptions = allOptions.filter(opt => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return opt.category !== 'Repository Files'; // Don't show all files when search is empty to avoid list clutter
    
    return (
      opt.name.toLowerCase().includes(term) ||
      (opt.fullPath && opt.fullPath.toLowerCase().includes(term)) ||
      opt.category.toLowerCase().includes(term)
    );
  }).slice(0, 10); // Limit to top 10 results for premium micro-UX

  // Toggle palette open/close on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Handle keyboard navigation inside search list
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen || filteredOptions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(filteredOptions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, filteredOptions, selectedIndex]);

  const handleSelect = (option) => {
    if (!option) return;
    navigate(option.path);
    setIsOpen(false);
  };

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-start justify-center pt-24 px-4 transition-all duration-300 select-none animate-fade-in"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-lg bg-slate-900/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-panel flex flex-col scale-[1.01] animate-scale-up"
        style={{ boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(99,102,241,0.05)' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 bg-slate-950/50">
          <span className="material-symbols-outlined text-primary text-base animate-pulse">search</span>
          <input 
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type code path or AI actions (e.g. trace, controller)..."
            className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 text-sm p-0 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-slate-950 border border-white/10 px-2 py-0.5 rounded text-[9px] text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Options List */}
        <div className="max-h-[340px] overflow-y-auto custom-scrollbar p-2 bg-slate-950/20">
          {filteredOptions.length > 0 ? (
            <div className="space-y-1">
              {filteredOptions.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                
                // Show category header if it changes
                const showHeader = idx === 0 || filteredOptions[idx - 1].category !== opt.category;

                return (
                  <div key={idx}>
                    {showHeader && (
                      <div className="text-[8px] font-bold text-slate-500 uppercase px-3 py-1.5 tracking-widest font-label">
                        {opt.category}
                      </div>
                    )}
                    <div 
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(99,102,241,0.25)] border-l-4 border-white' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-white' : 'text-primary'}`}>
                          {opt.icon}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="text-xs truncate">{opt.name}</span>
                          {opt.fullPath && (
                            <span className={`text-[9px] truncate font-code-sm ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                              {opt.fullPath}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <span className="material-symbols-outlined text-sm text-white animate-bounce-horizontal">keyboard_return</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 italic">
              No matching pages, AI actions, or files found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-white/5 px-4 py-2 bg-slate-950/80 text-[10px] text-slate-500 flex justify-between font-code">
          <span>Arrows to navigate, Enter to run</span>
          <span>Close with ESC</span>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceHorizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
        .animate-bounce-horizontal {
          animation: bounceHorizontal 1s infinite;
        }
      `}</style>
    </div>
  );
}
