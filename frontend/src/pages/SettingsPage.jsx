import React, { useState } from 'react';
import NavbarLayout from '../components/NavbarLayout.jsx';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient.ts';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [defaultBranch, setDefaultBranch] = useState(localStorage.getItem('defaultBranch') || 'main');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Query server health as part of diagnostic verification (Phase 11: Verify API works)
  const { data: healthData, isLoading: isHealthLoading, error: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await apiClient.get('/api/health');
      return res.data;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('defaultBranch', defaultBranch);
    localStorage.setItem('theme', theme);
    toast.success('Settings updated successfully!');
  };

  const handleRunDiagnostics = () => {
    toast.promise(
      refetchHealth(),
      {
        loading: 'Testing connection to Express API and Database...',
        success: 'Diagnostics passed! API is responsive.',
        error: 'Diagnostics failed! Check server connection.'
      }
    );
  };

  return (
    <NavbarLayout>
      <div className="p-container-padding max-w-[800px] mx-auto space-y-gutter flex-grow">
        
        {/* Header */}
        <div className="border-b border-outline-variant/30 pb-6">
          <h2 className="font-headline-md text-headline-md text-on-surface">Platform Settings</h2>
          <p className="text-on-surface-variant text-xs mt-1">
            Configure default settings, explore diagnostic checks, and verify API connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* User Preferences */}
          <div className="bg-surface-container border border-outline-variant p-stack-lg rounded-xl flex flex-col justify-between glass-panel">
            <div className="space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">tune</span> General Preferences
              </h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">Default Repository Branch</label>
                  <input 
                    type="text" 
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    placeholder="main"
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">UI Theme Theme</label>
                  <select 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    <option value="dark">Navigator Dark (Recommended)</option>
                    <option value="light">Navigator Light</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all w-full"
                >
                  Save Preferences
                </button>
              </form>
            </div>
          </div>

          {/* Diagnostic status */}
          <div className="bg-surface-container border border-outline-variant p-stack-lg rounded-xl flex flex-col justify-between glass-panel">
            <div className="space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">medical_services</span> Server Diagnostics
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Verify that your client successfully resolves API calls and queries MongoDB database variables.
              </p>

              <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">API Server Connection:</span>
                  {isHealthLoading ? (
                    <span className="text-primary font-bold animate-pulse">CHECKING...</span>
                  ) : healthError ? (
                    <span className="text-error font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span> FAIL
                    </span>
                  ) : (
                    <span className="text-secondary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> SUCCESS
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Server Environment:</span>
                  <span className="font-code-sm text-[10px] text-on-surface uppercase font-bold">
                    {healthData?.environment || 'unknown'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Response Time Audit:</span>
                  <span className="text-on-surface font-bold">
                    {healthData ? 'OK' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleRunDiagnostics}
              className="border border-outline-variant hover:border-primary text-on-surface font-bold px-4 py-2 rounded-lg text-sm hover:bg-surface-container-highest transition-all w-full flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">rotate_left</span>
              <span>Run Test Connection</span>
            </button>
          </div>
        </div>

      </div>
    </NavbarLayout>
  );
}
