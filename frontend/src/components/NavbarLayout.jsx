import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import { useRepoDetails } from '../hooks/useRepos.js';
import CommandPalette from './CommandPalette.jsx';

export default function NavbarLayout({ children }) {
  const { user, logout } = useAuthContext();
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { data: repo } = useRepoDetails(repoId);
  const [expandedFolders, setExpandedFolders] = useState({ 'root': true });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Build a tree structure from repository files
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
    
    // Sort so folders are shown first
    childrenList.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div key={node.name} className={`${depth > 0 ? 'ml-3 pl-1 border-l border-white/5' : ''}`}>
        {node.name !== 'root' && (
          <div 
            onClick={() => node.isFolder ? toggleFolder(node.name) : navigate(`/repository/${repoId}?file=${encodeURIComponent(node.path)}`)}
            className={`flex items-center text-slate-400 hover:text-white py-1 px-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-all duration-150 group`}
          >
            {node.isFolder ? (
              <>
                <span className="material-symbols-outlined text-[14px] mr-1 text-slate-500 transition-transform duration-200 group-hover:text-slate-300">
                  {expandedFolders[node.name] ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[14px] mr-1.5 text-secondary">folder</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px] mr-2 text-primary group-hover:scale-110 transition-transform">description</span>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex">
      <CommandPalette />
      
      {/* Dynamic Glassmorphic Sidebar */}
      <aside 
        className="w-sidebar-width fixed left-0 top-0 bottom-0 bg-slate-900/60 border-r border-white/10 flex flex-col py-6 z-50 backdrop-blur-md"
        style={{ boxShadow: '10px 0 30px -15px rgba(0, 0, 0, 0.9)' }}
      >
        {/* Sidebar Header Brand */}
        <div className="px-5 mb-6 flex flex-col select-none">
          <Link 
            to="/" 
            className="font-headline-sm text-headline-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tighter hover:opacity-95 transition-opacity"
          >
            Navigator
          </Link>
          <span className="text-slate-500 text-[8px] tracking-widest uppercase font-bold mt-0.5">DEV INTELLIGENCE COMMAND</span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar select-none px-2.5">
          
          <div className="px-2.5 py-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Main Entry</p>
          </div>

          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                isActive 
                  ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3 text-base">dashboard</span>
            <span className="text-xs">Dashboard</span>
          </NavLink>

          {repoId && (
            <>
              <div className="pt-4 px-2.5 py-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Intelligence Suite</p>
              </div>

               <NavLink 
                to={`/repository/${repoId}`}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                    isActive 
                      ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                      : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-base">folder_open</span>
                <span className="text-xs">Code Explorer</span>
              </NavLink>

              <NavLink 
                to={`/architecture/${repoId}`}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                    isActive 
                      ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                      : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-base">location_city</span>
                <span className="text-xs">Software City Map</span>
              </NavLink>

              <NavLink 
                to={`/chat/${repoId}`}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                    isActive 
                      ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                      : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-base">smart_toy</span>
                <span className="text-xs">AI Workspace Chat</span>
              </NavLink>

              <NavLink 
                to={`/learning/${repoId}`}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                    isActive 
                      ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                      : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-base">school</span>
                <span className="text-xs">Journey Roadmap</span>
              </NavLink>

              <NavLink 
                to={`/impact/${repoId}`}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                    isActive 
                      ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                      : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-base">bolt</span>
                <span className="text-xs">Impact Control</span>
              </NavLink>
            </>
          )}

          <div className="pt-4 px-2.5 py-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resources</p>
          </div>

          <NavLink 
            to="/docs" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                isActive 
                  ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3 text-base">api</span>
            <span className="text-xs">API Reference</span>
          </NavLink>

          <NavLink 
            to="/interview" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                isActive 
                  ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3 text-base">quiz</span>
            <span className="text-xs">Practice Board</span>
          </NavLink>

          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                isActive 
                  ? 'text-white border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined mr-3 text-base">settings</span>
            <span className="text-xs">Settings</span>
          </NavLink>

          {/* Interactive File Explorer for active Repo */}
          {repoId && repo && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-2">Files Directory</p>
              <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar px-1">
                {renderTree(fileTreeRoot)}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="mt-auto border-t border-white/5 pt-4 px-4 select-none">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-950/40 p-2 rounded-xl border border-white/5">
              {/* Profile Avatar Gradient */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col flex-1 truncate leading-tight">
                <span className="text-[11px] font-bold text-white truncate">{user.name}</span>
                <span className="text-[9px] text-slate-500 truncate">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="material-symbols-outlined text-slate-500 hover:text-error transition-colors p-1 cursor-pointer"
                title="Logout"
              >
                logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold text-xs py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-xs">login</span>
              <span>Login</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-sidebar-width min-h-screen flex flex-col">
        
        {/* Top Header Navbar */}
        <header 
          className="h-16 border-b border-white/10 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40"
          style={{ boxShadow: '0 4px 20px -10px rgba(0, 0, 0, 0.8)' }}
        >
          <div className="flex items-center gap-4">
            {repo && (
              <div className="flex items-center gap-2.5 bg-slate-900/50 px-3.5 py-2 rounded-xl border border-white/5 shadow-md">
                <span className="material-symbols-outlined text-secondary text-sm">inventory_2</span>
                <span className="text-xs font-bold font-code text-white truncate max-w-[200px]">{repo.owner}/{repo.name}</span>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    repo.status === 'done' ? 'bg-secondary' : repo.status === 'error' ? 'bg-error' : 'bg-primary'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    repo.status === 'done' ? 'bg-secondary' : repo.status === 'error' ? 'bg-error' : 'bg-primary'
                  }`} />
                </span>
              </div>
            )}
            
            {/* Search Spotlight trigger */}
            <button 
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }))}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-white/5 hover:border-primary/50 hover:bg-slate-900 rounded-xl text-xs text-slate-400 hover:text-white transition-all cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-sm text-primary">search</span>
              <span>Search codebase...</span>
              <kbd className="bg-slate-950 px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-white/10 text-slate-500">Ctrl+K</kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors p-2 cursor-pointer relative">
              notifications
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center hover:border-primary transition-all cursor-pointer">
              <span className="material-symbols-outlined text-slate-400 hover:text-white text-base">person</span>
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 flex flex-col bg-slate-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
