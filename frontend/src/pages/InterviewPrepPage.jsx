import React, { useState } from 'react';
import NavbarLayout from '../components/NavbarLayout.jsx';

export default function InterviewPrepPage() {
  const [expandedCards, setExpandedCards] = useState({});
  const [completedCards, setCompletedCards] = useState({});

  const questions = {
    architecture: [
      {
        id: '#ARC-102',
        level: 'Intermediate',
        q: 'What is the role of Event Sourcing in CQRS architecture?',
        ans: 'Event sourcing records all changes as a chronological log of events, which serves as the source of truth. CQRS splits the write (commands) and read (queries) models. Event sourcing ensures the read model can be fully rebuilt by replaying events.'
      },
      {
        id: '#ARC-104',
        level: 'Staff',
        q: 'Describe the CAP theorem and how it influences distributed database choices.',
        ans: 'CAP theorem states that a distributed system can guarantee at most two of: Consistency, Availability, Partition Tolerance. Since network partition (P) is inevitable in distributed environments, databases must choose between Consistency (CP, e.g., Spanner, MongoDB) or Availability (AP, e.g., DynamoDB, Cassandra).'
      }
    ],
    design: [
      {
        id: '#DSN-012',
        level: 'Intermediate',
        q: 'Design a global rate limiter for a public API serving 1M requests per second.',
        ans: 'Implement a Token Bucket or Leaky Bucket algorithm using Redis for distributed state management. To handle high throughput, use local in-memory pre-allocation filters (token batching) in the edge servers to minimize global roundtrips.'
      },
      {
        id: '#DSN-441',
        level: 'Senior Scenario',
        q: 'How do you mitigate Single Points of Failure (SPOF) in a multi-tier web application?',
        ans: 'Deploy web tiers across multiple availability zones behind a redundant Load Balancer. Use master-slave replica models with automatic failover for databases, and distributed caching clusters (e.g. Redis Sentinel/Cluster).'
      }
    ],
    security: [
      {
        id: '#SEC-009',
        level: 'Critical',
        q: 'How do you prevent JWT hijacking and Cross-Site Scripting (XSS) in a SPA?',
        ans: 'Store JWTs in secure, HttpOnly, SameSite=Strict cookies to block access from JavaScript. Implement a robust Content Security Policy (CSP), sanitize all inputs, and escape output variables before rendering to HTML.'
      },
      {
        id: '#SEC-088',
        level: 'SOC2 Compliance',
        q: "Explain the concept of 'Least Privilege' in the context of IAM roles.",
        ans: 'Users or machine roles are granted only the minimum permissions necessary to complete their specified task. This narrows the blast radius in case of credentials compromise. Utilize temporary session credentials.'
      }
    ]
  };

  const toggleAnswer = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleCompleted = (cardId, e) => {
    e.stopPropagation();
    setCompletedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Compute stats
  const totalCards = Object.values(questions).reduce((acc, col) => acc + col.length, 0);
  const completedCount = Object.keys(completedCards).filter(k => completedCards[k]).length;
  const percentage = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0;
  const dashOffset = 251.2 - (percentage / 100) * 251.2;

  return (
    <NavbarLayout>
      <div className="p-container-padding max-w-[1200px] mx-auto space-y-gutter flex-grow">
        
        {/* Header */}
        <section className="border-b border-outline-variant/30 pb-6 flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-black text-on-surface">Interview Preparation Board</h2>
            <p className="text-on-surface-variant font-body-lg mt-1">
              Review core system design, distributed systems, and security concepts.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4 bg-surface-container border border-outline-variant px-4 py-2.5 rounded-xl">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-secondary transition-all duration-500" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset={125.6 - (percentage / 100) * 125.6}></circle>
              </svg>
              <span className="absolute text-xs font-bold text-on-surface">{percentage}%</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-label-caps text-on-surface-variant">Self-Check Progress</p>
              <p className="text-xs text-on-surface font-bold mt-0.5">{completedCount} of {totalCards} completed</p>
            </div>
          </div>
        </section>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          
          {/* Architecture column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 pb-1 border-b border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-xl">schema</span>
              <h3 className="font-headline-sm text-headline-sm text-primary uppercase text-sm font-bold">Architecture</h3>
            </div>
            {questions.architecture.map((q) => (
              <div 
                key={q.id}
                className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="p-stack-md space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-label-caps text-primary font-bold">{q.level}</span>
                    <span className="text-on-surface-variant font-code-md">{q.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface leading-snug">{q.q}</h4>
                </div>
                <div className="px-stack-md pb-stack-md flex justify-between items-center">
                  <button 
                    onClick={() => toggleAnswer(q.id)}
                    className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                  >
                    <span className={`material-symbols-outlined text-sm transition-transform ${expandedCards[q.id] ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                    <span>{expandedCards[q.id] ? 'Hide Answer' : 'Show Answer'}</span>
                  </button>
                  <button 
                    onClick={(e) => toggleCompleted(q.id, e)}
                    className={`material-symbols-outlined text-lg ${completedCards[q.id] ? 'text-secondary' : 'text-on-surface-variant hover:text-secondary'} transition-colors`}
                    title={completedCards[q.id] ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {completedCards[q.id] ? 'check_box' : 'check_box_outline_blank'}
                  </button>
                </div>
                {expandedCards[q.id] && (
                  <div className="p-stack-md bg-surface-container-lowest border-t border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed select-text">
                    {q.ans}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* System Design column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 pb-1 border-b border-outline-variant/30">
              <span className="material-symbols-outlined text-tertiary text-xl">polyline</span>
              <h3 className="font-headline-sm text-headline-sm text-tertiary uppercase text-sm font-bold">System Design</h3>
            </div>
            {questions.design.map((q) => (
              <div 
                key={q.id}
                className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-tertiary/50 transition-colors"
              >
                <div className="p-stack-md space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-label-caps text-tertiary font-bold">{q.level}</span>
                    <span className="text-on-surface-variant font-code-md">{q.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface leading-snug">{q.q}</h4>
                </div>
                <div className="px-stack-md pb-stack-md flex justify-between items-center">
                  <button 
                    onClick={() => toggleAnswer(q.id)}
                    className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                  >
                    <span className={`material-symbols-outlined text-sm transition-transform ${expandedCards[q.id] ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                    <span>{expandedCards[q.id] ? 'Hide Answer' : 'Show Answer'}</span>
                  </button>
                  <button 
                    onClick={(e) => toggleCompleted(q.id, e)}
                    className={`material-symbols-outlined text-lg ${completedCards[q.id] ? 'text-secondary' : 'text-on-surface-variant hover:text-secondary'} transition-colors`}
                    title={completedCards[q.id] ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {completedCards[q.id] ? 'check_box' : 'check_box_outline_blank'}
                  </button>
                </div>
                {expandedCards[q.id] && (
                  <div className="p-stack-md bg-surface-container-lowest border-t border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed select-text">
                    {q.ans}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Security column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 pb-1 border-b border-outline-variant/30">
              <span className="material-symbols-outlined text-error text-xl">security</span>
              <h3 className="font-headline-sm text-headline-sm text-error uppercase text-sm font-bold">Security</h3>
            </div>
            {questions.security.map((q) => (
              <div 
                key={q.id}
                className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-error/50 transition-colors"
              >
                <div className="p-stack-md space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-label-caps text-error font-bold">{q.level}</span>
                    <span className="text-on-surface-variant font-code-md">{q.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface leading-snug">{q.q}</h4>
                </div>
                <div className="px-stack-md pb-stack-md flex justify-between items-center">
                  <button 
                    onClick={() => toggleAnswer(q.id)}
                    className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                  >
                    <span className={`material-symbols-outlined text-sm transition-transform ${expandedCards[q.id] ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                    <span>{expandedCards[q.id] ? 'Hide Answer' : 'Show Answer'}</span>
                  </button>
                  <button 
                    onClick={(e) => toggleCompleted(q.id, e)}
                    className={`material-symbols-outlined text-lg ${completedCards[q.id] ? 'text-secondary' : 'text-on-surface-variant hover:text-secondary'} transition-colors`}
                    title={completedCards[q.id] ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {completedCards[q.id] ? 'check_box' : 'check_box_outline_blank'}
                  </button>
                </div>
                {expandedCards[q.id] && (
                  <div className="p-stack-md bg-surface-container-lowest border-t border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed select-text">
                    {q.ans}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </NavbarLayout>
  );
}
