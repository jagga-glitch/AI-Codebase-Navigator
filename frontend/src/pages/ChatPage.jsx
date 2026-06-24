import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useChat, useChatActions } from '../hooks/useChat.js';
import { useRepoDetails } from '../hooks/useRepos.js';
import { useAuthContext } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuestion = searchParams.get('question') || '';

  const { user } = useAuthContext();
  const { data: repo } = useRepoDetails(repoId);
  const { data: chatData, isLoading: isChatLoading } = useChat(repoId);
  const { sendMutation, deleteMutation } = useChatActions(repoId);

  const [messageText, setMessageText] = useState('');
  const [interviewMode, setInterviewMode] = useState(false);
  const chatEndRef = useRef(null);

  const messages = chatData?.messages || [];

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  // Autofill and trigger search question parameter if present
  useEffect(() => {
    if (urlQuestion && messages.length === 0 && !sendMutation.isPending) {
      sendMutation.mutate({ message: decodeURIComponent(urlQuestion) });
    }
  }, [urlQuestion, messages.length, sendMutation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const currentMsg = messageText;
    setMessageText('');

    try {
      await sendMutation.mutateAsync({ message: currentMsg });
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
      setMessageText(currentMsg); // Restore text on failure
    }
  };

  const handleClearHistory = () => {
    if (!window.confirm('Are you sure you want to clear this conversation history?')) {
      return;
    }
    toast.promise(
      deleteMutation.mutateAsync(),
      {
        loading: 'Clearing chat history...',
        success: 'Chat history cleared successfully',
        error: (err) => err.message || 'Failed to clear chat history'
      }
    );
  };

  const handleSuggestedQuery = (query) => {
    setMessageText(query);
  };

  // Connects citations to deep link previews in Architecture view
  const handleCitationClick = (path) => {
    navigate(`/architecture/${repoId}?file=${encodeURIComponent(path)}`);
  };

  return (
    <NavbarLayout>
      <div className="flex-1 flex h-[calc(100vh-64px)] relative overflow-hidden bg-slate-950">
        
        {/* Left Sidebar: Suggested Questions categorized */}
        <aside className="w-64 bg-slate-900/60 border-r border-white/10 flex flex-col p-4 overflow-y-auto custom-scrollbar shrink-0 backdrop-blur-md select-none z-10 shadow-lg">
          <h3 className="font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 text-[9px] font-label">
            <span className="material-symbols-outlined text-xs text-primary animate-pulse">forum</span> Suggestion Board
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Onboarding Guides</p>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSuggestedQuery('Can you explain the directory structure of this repository?')}
                  className="w-full bg-slate-950 border border-white/5 hover:border-primary p-2.5 rounded-xl text-left text-[10px] text-slate-300 hover:text-white transition-all shadow"
                >
                  Codebase Directory Tour
                </button>
                <button 
                  onClick={() => handleSuggestedQuery('How does authentication and JWT session validation work in this codebase?')}
                  className="w-full bg-slate-950 border border-white/5 hover:border-primary p-2.5 rounded-xl text-left text-[10px] text-slate-300 hover:text-white transition-all shadow"
                >
                  Verify Auth & JWT filters
                </button>
              </div>
            </div>

            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Architecture & DB</p>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSuggestedQuery('What database schemas, collections, or Mongoose models are defined?')}
                  className="w-full bg-slate-950 border border-white/5 hover:border-primary p-2.5 rounded-xl text-left text-[10px] text-slate-300 hover:text-white transition-all shadow"
                >
                  Scan Database Schemas
                </button>
                <button 
                  onClick={() => handleSuggestedQuery('Show me the entrypoint files and outline how backend API routing is structured.')}
                  className="w-full bg-slate-950 border border-white/5 hover:border-primary p-2.5 rounded-xl text-left text-[10px] text-slate-300 hover:text-white transition-all shadow"
                >
                  Locate Entry API Routes
                </button>
              </div>
            </div>

            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Refactoring Hotspots</p>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSuggestedQuery('Which modules have high complexity or are candidate refactors?')}
                  className="w-full bg-slate-950 border border-white/5 hover:border-primary p-2.5 rounded-xl text-left text-[10px] text-slate-300 hover:text-white transition-all shadow"
                >
                  Scan Refactor Candidates
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Canvas: Interactive AI chat conversation */}
        <div className="flex-1 flex flex-col justify-between bg-slate-950/20 h-full relative min-w-0">
          
          {/* Chat Messages viewport */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* Onboarding Welcome Screen */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto select-none animate-fade-in">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <span className="material-symbols-outlined text-white text-3xl animate-pulse">smart_toy</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">AI Developer Workspace</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Query architectural properties, extract schema blueprints, or trace backend controller structures. The assistant references repository files tree index directly.
                </p>
              </div>
            )}

            {/* Message History Thread */}
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={index} className={`flex gap-4 items-start ${isUser ? 'justify-end' : ''}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${
                      isUser 
                        ? 'bg-slate-900/60 border border-white/10 rounded-2xl p-4 max-w-xl shadow-md select-text' 
                        : 'space-y-3'
                    }`}>
                      <p className="text-slate-200 leading-relaxed text-xs select-text whitespace-pre-wrap font-sans">{msg.content}</p>
                      
                      {/* Citations chips linked directly to visualizer pages */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 select-none">
                          {msg.citations.map((cite, cidx) => (
                            <button 
                              key={cidx} 
                              onClick={() => handleCitationClick(cite)}
                              className="px-2.5 py-1 bg-slate-950 hover:border-primary rounded-lg text-[9px] border border-white/5 uppercase tracking-wider text-primary flex items-center gap-1 font-code transition-all cursor-pointer shadow"
                            >
                              <span className="material-symbols-outlined text-[10px] text-primary">link</span>
                              <span>Ref: {cite.split('/').slice(-1)[0]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                        useEffect(() => {
                          first
                        
                          return () => {
                            second
                          }
                        }, [third])
                        
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming loading shimmer skeletons */}
              {sendMutation.isPending && (
                <div className="flex gap-4 items-start w-full select-none">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
                  </div>
                  <div className="flex-1 space-y-2 py-2">
                    <div className="h-2 bg-slate-900 rounded max-w-sm animate-pulse shimmer" />
                    <div className="h-2 bg-slate-900 rounded max-w-lg animate-pulse shimmer" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Input Field overlay */}
          <div className="p-4 bg-gradient-to-t from-slate-950 to-transparent border-t border-white/5 z-10">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 mb-2 text-[10px] text-slate-500 font-bold select-none">
              <span>ACTIVE SESSION: GRAPH CONTEXT SYNCHRONIZED</span>
              {messages.length > 0 && (
                <button 
                  onClick={handleClearHistory} 
                  className="hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  <span>Clear Conversation</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto glass-panel p-2 rounded-2xl flex items-end gap-2 shadow-2xl bg-slate-900/40 border border-white/10 focus-within:border-primary transition-all">
              <textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Query workspace schemas, architecture tiers... (Enter to send)" 
                rows="1"
                className="flex-grow bg-transparent border-none focus:ring-0 text-white py-2 resize-none custom-scrollbar text-xs focus:outline-none placeholder:text-slate-600 font-sans"
              />
              <button 
                type="submit"
                disabled={sendMutation.isPending || !messageText.trim()}
                className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:opacity-95 active:scale-95 transition-all text-xs cursor-pointer shadow-lg shadow-primary/10"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-xs">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Info Drawer Sidebar: Context & AI Memory note */}
        <aside className="w-80 bg-slate-900/60 border-l border-white/10 flex flex-col h-full z-10 backdrop-blur-md select-none shadow-lg">
          <div className="p-4 border-b border-white/10 bg-slate-950/80">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] font-label">Index Status</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
            </div>
            <h3 className="font-bold text-white truncate text-sm">
              {repo?.name || 'Index Core'}
            </h3>
            <p className="text-[9px] text-slate-500 font-code-sm">Default branch: {repo?.defaultBranch || 'main'}</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 text-xs">
            {/* AI Session Memory console */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 shadow-inner space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm animate-pulse">memory</span>
                <span className="text-[10px] tracking-wider uppercase">AI Memory Bank</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Active session context maps backend database schema details, file metrics list, and calling dependency graphs. Queries reference dynamic node properties.
              </p>
            </div>

            {/* Smart Onboarding */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 shadow">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">school</span>
                <span>Codebase Onboarding</span>
              </h4>
              <div className="space-y-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                  <span>Analyze structural dependencies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                  <span>Clustered architecture districts</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <span className="material-symbols-outlined text-base">circle</span>
                  <span>Walkthrough logic routes</span>
                </div>
              </div>
            </div>

            {/* Self-Assessment Mode */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 shadow space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-white text-xs">Self Assessment</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">Interactive Board</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
              {interviewMode && (
                <div className="bg-secondary/5 border border-secondary/20 p-3 rounded-xl text-[10px]">
                  <p className="italic text-secondary leading-normal">
                    "Identify the central database model definition and outline how its collection is referenced across business logic layers."
                  </p>
                  <button 
                    onClick={() => navigate('/interview')}
                    className="mt-2.5 text-primary hover:underline font-bold flex items-center gap-0.5"
                  >
                    <span>Practice Board</span>
                    <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>

            {/* Context Index stats */}
            {repo && (
              <div className="space-y-2 border-t border-white/5 pt-3.5">
                <h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-label">Index Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/40 border border-white/5 p-2 rounded-lg">
                    <p className="text-slate-500 text-[8px] uppercase font-bold">Total Files</p>
                    <p className="font-bold text-white mt-0.5 font-code-sm">{repo.stats?.fileCount || 0}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-white/5 p-2 rounded-lg">
                    <p className="text-slate-500 text-[8px] uppercase font-bold">Avg Complexity</p>
                    <p className="font-bold text-white mt-0.5 font-code-sm">{repo.stats?.avgFileComplexity?.toFixed(1) || '0.0'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </NavbarLayout>
  );
}
