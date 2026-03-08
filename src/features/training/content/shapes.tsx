// SVG Shape Library for Spatial Rotation Drill
// Story 3.3: Pre-defined geometric shapes for mental rotation exercises
// Each shape: 120x120px viewBox, centered, currentColor fill for theming

import React from 'react';

export interface ShapeProps {
  className?: string;
  style?: React.CSSProperties;
}

// Square (60x60 centered in 120x120)
export const Square: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="30" y="30" width="60" height="60" />
  </svg>
);

// Circle (diameter 60, centered)
export const Circle: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="60" cy="60" r="30" />
  </svg>
);

// Triangle (equilateral, pointing up)
export const Triangle: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="60,25 95,85 25,85" />
  </svg>
);

// Rectangle (40x60 vertical orientation)
export const Rectangle: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="40" y="30" width="40" height="60" />
  </svg>
);

// Pentagon (regular, pointing up)
export const Pentagon: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="60,25 88,45 80,78 40,78 32,45" />
  </svg>
);

// Hexagon (regular)
export const Hexagon: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="60,30 85,45 85,75 60,90 35,75 35,45" />
  </svg>
);

// L-Shape (asymmetric for rotation testing)
export const LShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 35 30 L 55 30 L 55 70 L 85 70 L 85 90 L 35 90 Z" />
  </svg>
);

// T-Shape (asymmetric for rotation testing)
export const TShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 30 30 L 90 30 L 90 50 L 70 50 L 70 90 L 50 90 L 50 50 L 30 50 Z" />
  </svg>
);

// Arrow (pointing right, asymmetric)
export const Arrow: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="30,50 70,50 70,35 95,60 70,85 70,70 30,70" />
  </svg>
);

// Star (5-pointed)
export const Star: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="60,25 68,52 95,52 73,68 81,95 60,79 39,95 47,68 25,52 52,52" />
  </svg>
);

// Z-Shape (zigzag tetromino, asymmetric — confusable with S-shape)
export const ZShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 30 30 L 70 30 L 70 50 L 90 50 L 90 70 L 50 70 L 50 50 L 30 50 Z" />
  </svg>
);

// S-Shape (reverse zigzag, mirror of Z — confusable pair)
export const SShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 50 30 L 90 30 L 90 50 L 70 50 L 70 70 L 30 70 L 30 50 L 50 50 Z" />
  </svg>
);

// Hook-Shape (J-hook, asymmetric)
export const HookShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 50 30 L 70 30 L 70 70 L 90 70 L 90 90 L 50 90 Z" />
  </svg>
);

// U-Shape (open top, asymmetric when rotated)
export const UShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 25 30 L 50 30 L 50 65 L 70 65 L 70 30 L 95 30 L 95 90 L 25 90 Z" />
  </svg>
);

// F-Shape (F-pentomino, complex asymmetric)
export const FShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 50 25 L 90 25 L 90 45 L 70 45 L 70 95 L 50 95 L 50 65 L 30 65 L 30 45 L 50 45 Z" />
  </svg>
);

// W-Shape (staircase, asymmetric — hard to mentally rotate)
export const WShape: React.FC<ShapeProps> = ({ className, style }) => (
  <svg
    viewBox="0 0 120 120"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 30 30 L 50 30 L 50 50 L 70 50 L 70 70 L 90 70 L 90 90 L 50 90 L 50 70 L 30 70 Z" />
  </svg>
);

// Shape type definitions
export type ShapeType =
  | 'square'
  | 'circle'
  | 'triangle'
  | 'rectangle'
  | 'pentagon'
  | 'hexagon'
  | 'lshape'
  | 'tshape'
  | 'arrow'
  | 'star'
  | 'zshape'
  | 'sshape'
  | 'hookshape'
  | 'ushape'
  | 'fshape'
  | 'wshape';

// Map of shape names to components
export const SHAPES: Record<ShapeType, React.FC<ShapeProps>> = {
  square: Square,
  circle: Circle,
  triangle: Triangle,
  rectangle: Rectangle,
  pentagon: Pentagon,
  hexagon: Hexagon,
  lshape: LShape,
  tshape: TShape,
  arrow: Arrow,
  star: Star,
  zshape: ZShape,
  sshape: SShape,
  hookshape: HookShape,
  ushape: UShape,
  fshape: FShape,
  wshape: WShape,
};

// Difficulty-based shape sets
// Easy: Simple symmetric shapes
export const EASY_SHAPES: ShapeType[] = ['square', 'circle', 'triangle'];

// Medium: More complex shapes (pentagon, L-shape)
export const MEDIUM_SHAPES: ShapeType[] = [
  'square',
  'circle',
  'triangle',
  'rectangle',
  'pentagon',
  'lshape',
];

// Hard: All shapes including complex asymmetric ones
export const HARD_SHAPES: ShapeType[] = [
  'square',
  'circle',
  'triangle',
  'rectangle',
  'pentagon',
  'hexagon',
  'lshape',
  'tshape',
  'arrow',
  'star',
];

// Transformation utility: Apply rotation transform
export const rotateShape = (degrees: number): React.CSSProperties => ({
  transform: `rotate(${degrees}deg)`,
  // GPU acceleration for smooth performance
  willChange: 'transform',
});

// Transformation utility: Apply horizontal mirror (flip)
export const mirrorShape = (): React.CSSProperties => ({
  transform: 'scaleX(-1)',
  // GPU acceleration for smooth performance
  willChange: 'transform',
});

// Combined transformation: Rotation + Mirror
export const rotateAndMirrorShape = (degrees: number): React.CSSProperties => ({
  transform: `scaleX(-1) rotate(${degrees}deg)`,
  // GPU acceleration for smooth performance
  willChange: 'transform',
});
