import React from 'react';
import { Handle, Position } from 'reactflow';

// Visual configuration for different building types in the Software City
const TYPE_CONFIG = {
  controller: {
    label: 'Controller Tower',
    color: '#3b82f6', // Electric Blue
    lightColor: '#60a5fa',
    darkColor: '#1d4ed8',
    glowColor: 'rgba(59, 130, 246, 0.45)'
  },
  service: {
    label: 'Service Tower',
    color: '#8b5cf6', // Purple
    lightColor: '#a78bfa',
    darkColor: '#6d28d9',
    glowColor: 'rgba(139, 92, 246, 0.45)'
  },
  model: {
    label: 'Model Block',
    color: '#22c55e', // Green
    lightColor: '#4ade80',
    darkColor: '#15803d',
    glowColor: 'rgba(34, 197, 94, 0.45)'
  },
  route: {
    label: 'Route Hub',
    color: '#06b6d4', // Cyan
    lightColor: '#22d3ee',
    darkColor: '#0e7490',
    glowColor: 'rgba(6, 182, 212, 0.45)'
  },
  database: {
    label: 'Database Depot',
    color: '#10b981', // Emerald
    lightColor: '#34d399',
    darkColor: '#047857',
    glowColor: 'rgba(16, 185, 129, 0.45)'
  },
  external_api: {
    label: 'API Gateway',
    color: '#ec4899', // Pink
    lightColor: '#f472b6',
    darkColor: '#be185d',
    glowColor: 'rgba(236, 72, 153, 0.45)'
  },
  ai_component: {
    label: 'AI Core',
    color: '#f97316', // Orange
    lightColor: '#fb923c',
    darkColor: '#c2410c',
    glowColor: 'rgba(249, 115, 22, 0.45)'
  },
  middleware: {
    label: 'Middleware Filter',
    color: '#84cc16', // Lime
    lightColor: '#a3e635',
    darkColor: '#4d7c0f',
    glowColor: 'rgba(132, 204, 22, 0.45)'
  },
  config: {
    label: 'Config Vault',
    color: '#eab308', // Yellow
    lightColor: '#fde047',
    darkColor: '#a16207',
    glowColor: 'rgba(234, 179, 8, 0.45)'
  },
  test: {
    label: 'Testing Lab',
    color: '#f43f5e', // Rose
    lightColor: '#fb7185',
    darkColor: '#be123c',
    glowColor: 'rgba(244, 63, 94, 0.45)'
  },
  util: {
    label: 'Utility Plant',
    color: '#06b6d4', // Teal/Cyan
    lightColor: '#22d3ee',
    darkColor: '#0e7490',
    glowColor: 'rgba(6, 182, 212, 0.45)'
  },
  other: {
    label: 'Module',
    color: '#64748b', // Slate
    lightColor: '#94a3b8',
    darkColor: '#334155',
    glowColor: 'rgba(100, 116, 139, 0.45)'
  }
};

export const CityBuildingNode = ({ data }) => {
  const type = (data.type || 'other').toLowerCase();
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;

  const isHighlighted = data.isHighlighted;
  const isSelected = data.isSelected;

  const complexity = data.complexity || 5;
  const size = data.size || 3;
  const depCount = (data.incomingCount || 0) + (data.outgoingCount || 0);

  // Height formula based on complexity, dependencies, and size (LOC representation)
  const buildingHeight = Math.min(230, Math.max(65, 45 + (complexity * 8) + (depCount * 6) + (size * 4)));

  // Footprint width based on size and dependency count
  const buildingWidth = Math.min(130, Math.max(70, 72 + (size * 4) + (depCount * 2)));

  // Critical files with high complexity or many connections become landmarks
  const isLandmark = complexity >= 8 || depCount >= 5;

  // Generate grid windows based on building height
  const windowRows = Math.max(2, Math.floor(buildingHeight / 20));
  const windowCols = buildingWidth > 90 ? 4 : 3;

  // Determine window active state (illuminate all if selected/highlighted, else randomly/statically lit)
  const getWindowState = (r, c) => {
    if (isSelected || isHighlighted) {
      return 'bg-yellow-300 shadow-[0_0_8px_#fde047] animate-pulse';
    }
    
    // Static night lights pattern
    const isLit = (r * 2 + c * 3) % 4 === 0;
    if (isLit) {
      const delay = (r + c) % 3;
      return `bg-yellow-500/60 shadow-[0_0_3px_rgba(234,179,8,0.3)] window-pulse-${delay}`;
    }
    return 'bg-slate-950/80';
  };

  // Night-City Effect: Base outer glow scales with complexity (higher complexity = brighter glow)
  const nightGlowColor = config.glowColor;
  const glowIntensity = isSelected ? 24 : isHighlighted ? 18 : complexity * 2.0;

  return (
    <div
      className={`relative select-none transition-all duration-300 cursor-pointer ${
        isHighlighted ? 'scale-105 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]' : ''
      }`}
      style={{
        width: buildingWidth,
        height: buildingHeight + 25 // extra space for isometric top
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: config.color,
          border: '2px solid #0f172a',
          width: '8px',
          height: '8px',
          left: '-4px',
          zIndex: 10
        }}
      />

      {/* 3D BUILDING VIEWPORT WRAPPER */}
      <div className="absolute inset-0 flex flex-col justify-end">
        
        {/* BLINKING BEACON ON TALL BUILDINGS (LANDMARKS) */}
        {isLandmark && (
          <>
            <div 
              className="absolute rounded-full animate-ping pointer-events-none"
              style={{
                bottom: `${buildingHeight + 12}px`,
                left: `${buildingWidth / 2 - 11}px`, // Adjusted for skew offset
                width: '6px',
                height: '6px',
                backgroundColor: '#ef4444', // Red beacon glow
                boxShadow: '0 0 8px #ef4444, 0 0 16px #ef4444',
                zIndex: 20
              }}
            />
            <div 
              className="absolute rounded-full pointer-events-none"
              style={{
                bottom: `${buildingHeight + 12}px`,
                left: `${buildingWidth / 2 - 11}px`, // Adjusted for skew offset
                width: '6px',
                height: '6px',
                backgroundColor: '#ef4444', // Red beacon center
                boxShadow: '0 0 3px #ef4444',
                zIndex: 21
              }}
            />
          </>
        )}

        {/* ISOMETRIC ROOF FACE (TOP) */}
        <div
          className="absolute border border-white/20 transition-colors duration-300"
          style={{
            bottom: buildingHeight,
            left: 0,
            width: buildingWidth,
            height: '16px',
            transform: 'skewX(-45deg)',
            transformOrigin: 'bottom left',
            background: isSelected || isHighlighted ? config.lightColor : config.color,
            boxShadow: `inset 0 0 10px rgba(255,255,255,0.3)`
          }}
        />

        {/* ISOMETRIC SIDE FACE (RIGHT) */}
        <div
          className="absolute transition-colors duration-300 border-r border-b border-white/10"
          style={{
            bottom: 0,
            left: buildingWidth,
            width: '16px',
            height: buildingHeight,
            transform: 'skewY(-45deg)',
            transformOrigin: 'top left',
            background: config.darkColor,
            boxShadow: `inset 0 0 12px rgba(0,0,0,0.5)`
          }}
        />

        {/* ISOMETRIC FRONT FACADE (FRONT) */}
        <div
          className={`w-full relative transition-all duration-300 border border-white/15 flex flex-col justify-between p-2 rounded-bl-sm`}
          style={{
            height: buildingHeight,
            background: isSelected 
              ? `linear-gradient(135deg, ${config.lightColor} 0%, #1e1b4b 100%)`
              : `linear-gradient(135deg, ${config.darkColor} 0%, #0f172a 100%)`,
            boxShadow: `0 ${complexity / 2}px ${glowIntensity}px ${nightGlowColor}, inset 0 0 ${complexity}px rgba(255,255,255,0.08)`,
            borderColor: isSelected ? config.lightColor : isHighlighted ? '#ffffff55' : 'rgba(255,255,255,0.15)'
          }}
        >
          {/* Neon vertical line accent on the edge */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-[2px] opacity-80"
            style={{ 
              backgroundColor: isSelected || isHighlighted ? '#ffffff' : config.color,
              boxShadow: isSelected || isHighlighted ? `0 0 8px ${config.lightColor}` : 'none'
            }}
          />

          {/* Building Header */}
          <div className="z-10 flex flex-col leading-tight">
            <span 
              className="text-[7px] font-bold tracking-wider uppercase truncate"
              style={{ color: isSelected ? '#ffffff' : config.lightColor }}
            >
              {isLandmark ? `⭐ Landmark` : config.label}
            </span>
            <h4 className="text-[10px] font-bold text-white font-code-sm truncate max-w-[85px] mt-0.5" title={data.label}>
              {data.label}
            </h4>
          </div>

          {/* Windows Grid */}
          <div className="grid gap-1 mt-2 mb-1 flex-grow overflow-hidden opacity-95"
            style={{
              gridTemplateColumns: `repeat(${windowCols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${windowRows}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: windowRows }).map((_, r) =>
              Array.from({ length: windowCols }).map((_, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-[1px] transition-all duration-300 ${getWindowState(r, c)}`}
                />
              ))
            )}
          </div>

          {/* Building Footer Metrics */}
          <div className="z-10 flex justify-between items-center text-[7px] text-slate-400 border-t border-white/10 pt-1 mt-1 shrink-0 font-code-sm">
            <span className={complexity >= 7 ? 'text-orange-400 font-bold' : ''}>C:{complexity}</span>
            <span>LOC:{(size * 125)}</span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: config.color,
          border: '2px solid #0f172a',
          width: '8px',
          height: '8px',
          right: '-4px',
          zIndex: 10
        }}
      />

      {/* WINDOW PULSE STYLES */}
      <style>{`
        .window-pulse-0 {
          animation: window-pulse-slow 4s ease-in-out infinite;
        }
        .window-pulse-1 {
          animation: window-pulse-slow 4s ease-in-out infinite 1.3s;
        }
        .window-pulse-2 {
          animation: window-pulse-slow 4s ease-in-out infinite 2.6s;
        }
        @keyframes window-pulse-slow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1.0; }
        }
      `}</style>
    </div>
  );
};

export default CityBuildingNode;
