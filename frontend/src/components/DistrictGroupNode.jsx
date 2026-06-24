import React from 'react';

export const DistrictGroupNode = ({ data }) => {
  const color = data.color || '#3b82f6';
  
  // Choose health status color dot
  const health = data.health || 80;
  const statusColor = health >= 85 ? '#10b981' : health >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="w-full h-full rounded-3xl border transition-all duration-500 pointer-events-none select-none relative overflow-hidden"
      style={{
        borderColor: `${color}44`,
        background: `radial-gradient(circle at 10% 10%, ${color}0d 0%, rgba(9, 11, 20, 0.6) 80%)`,
        boxShadow: `0 0 50px ${color}12, inset 0 0 35px ${color}08`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* HIGH-TECH TECH-GRID BACKGROUND PATTERN */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%),
            linear-gradient(to right, ${color} 1px, transparent 1px),
            linear-gradient(to bottom, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px'
        }}
      />

      {/* DYNAMIC NEON GLOW CORNER OVERLAYS */}
      <div 
        className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 pointer-events-none rounded-tl-2xl transition-all duration-300"
        style={{ borderColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div 
        className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 pointer-events-none rounded-tr-2xl transition-all duration-300"
        style={{ borderColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div 
        className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 pointer-events-none rounded-bl-2xl transition-all duration-300"
        style={{ borderColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 pointer-events-none rounded-br-2xl transition-all duration-300"
        style={{ borderColor: color, boxShadow: `0 0 8px ${color}` }}
      />

      {/* ACTIVE GLOW OVERLAY FOR DISTRICT HIGHLIGHTS */}
      {data.isHighlighted && (
        <div 
          className="absolute inset-0 rounded-3xl border-2 transition-all duration-300 pointer-events-none"
          style={{
            borderColor: color,
            boxShadow: `0 0 45px ${color}33, inset 0 0 25px ${color}15`,
            background: `radial-gradient(circle at 10% 10%, ${color}1a 0%, rgba(9, 11, 20, 0.4) 80%)`,
          }}
        />
      )}

      {/* FLOATING DISTRICT INFO CARD */}
      <div 
        className="absolute -top-7 left-5 bg-slate-950/95 border rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-2xl backdrop-blur-md pointer-events-auto"
        style={{ 
          borderColor: `${color}77`,
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 10px ${color}22`
        }}
      >
        {/* Status indicator pulse ring */}
        <span className="relative flex h-2 w-2">
          <span 
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: statusColor }}
          />
          <span 
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
        </span>
        
        <span className="text-[10px] font-extrabold text-white uppercase tracking-widest font-label">
          {data.label} District
        </span>
        
        <span className="text-[8px] text-slate-400 border-l border-white/10 pl-2.5 font-code-sm">
          {data.stats}
        </span>
        
        <span 
          className="text-[8px] font-bold border-l border-white/10 pl-2.5"
          style={{ color: statusColor }}
        >
          Health: {health}%
        </span>
      </div>
    </div>
  );
};

export default DistrictGroupNode;
