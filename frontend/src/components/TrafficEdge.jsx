import React from 'react';
import { getBezierPath } from 'reactflow';

export const TrafficEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data = {}
}) => {
  // Compute standard bezier curved path
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  });

  const isHighlighted = data.isHighlighted;
  const highlightColor = data.highlightColor || '#3b82f6';
  
  // Base connection line style
  const strokeColor = isHighlighted ? highlightColor : '#334155';
  const strokeWidth = isHighlighted ? (data.edgeWidth || 2.5) : 1.2;
  const opacity = isHighlighted ? 1.0 : 0.25;

  return (
    <>
      {/* BACKGROUND GLOW PATH (only when highlighted) */}
      {isHighlighted && (
        <path
          id={`${id}-glow`}
          d={edgePath}
          fill="none"
          stroke={highlightColor}
          strokeWidth={strokeWidth + 4}
          className="opacity-25 blur-sm pointer-events-none animate-pulse"
        />
      )}

      {/* BASE DEPENDENCY ROAD PATH */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{
          ...style,
          opacity,
          transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s'
        }}
        markerEnd={markerEnd}
      />

      {/* CONSTANT SUBTLE TRAFFIC (always running, but dim and slow) */}
      {!isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke="#475569" // slate-600
          strokeWidth={1.2}
          strokeDasharray="4, 15"
          className="pointer-events-none"
          style={{
            animation: 'traffic-flow-constant 7s linear infinite',
            opacity: 0.25
          }}
        />
      )}

      {/* DYNAMIC FLOWING TRAFFIC LAYER (active when highlighted or during business flows) */}
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke={highlightColor}
          strokeWidth={strokeWidth + 0.5}
          strokeDasharray="6, 16"
          className="pointer-events-none"
          style={{
            animation: 'traffic-flow 1.5s linear infinite',
            opacity: 0.95
          }}
        />
      )}

      {/* INLINE CSS FOR KEYFRAME TRAFFIC ANIMATION */}
      <style>{`
        @keyframes traffic-flow {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes traffic-flow-constant {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
};

export default TrafficEdge;
