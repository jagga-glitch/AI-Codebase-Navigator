import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoutes } from './ProtectedRoutes.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ArchitecturePage from './pages/ArchitecturePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import LearningPage from './pages/LearningPage.jsx';
import ApiDocumentationPage from './pages/ApiDocumentationPage.jsx';
import InterviewPrepPage from './pages/InterviewPrepPage.jsx';
import RepositoryPage from './pages/RepositoryPage.jsx';
import ImpactPage from './pages/ImpactPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1f26',
            color: '#e2e2eb',
            border: '1px solid #424754',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/docs" element={<ApiDocumentationPage />} />
        <Route path="/interview" element={<InterviewPrepPage />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoutes>
              <DashboardPage />
            </ProtectedRoutes>
          } 
        />
        <Route 
          path="/repository/:repoId" 
          element={
            <ProtectedRoutes>
              <RepositoryPage />
            </ProtectedRoutes>
          } 
        />
        <Route 
          path="/architecture/:repoId" 
          element={
            <ProtectedRoutes>
              <ArchitecturePage />
            </ProtectedRoutes>
          } 
        />
        <Route 
          path="/chat/:repoId" 
          element={
            <ProtectedRoutes>
              <ChatPage />
            </ProtectedRoutes>
          } 
        />
        <Route 
          path="/learning/:repoId" 
          element={
            <ProtectedRoutes>
              <LearningPage />
            </ProtectedRoutes>
          } 
        />
        <Route 
          path="/impact/:repoId" 
          element={
            <ProtectedRoutes>
              <ImpactPage />
            </ProtectedRoutes>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoutes>
              <SettingsPage />
            </ProtectedRoutes>
          } 
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
