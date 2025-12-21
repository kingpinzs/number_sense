/**
 * Shapes Library Tests
 * Story 3.3: Test coverage for SVG shape components and transformation utilities
 *
 * Test Coverage:
 * - All 10 shape components render without errors
 * - Shape transformations apply correct CSS
 * - Rotation utilities generate expected transform values
 * - Mirroring utilities apply scaleX(-1)
 * - Difficulty-based shape sets contain expected shapes
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  Square,
  Circle,
  Triangle,
  Rectangle,
  Pentagon,
  Hexagon,
  LShape,
  TShape,
  Arrow,
  Star,
  SHAPES,
  EASY_SHAPES,
  MEDIUM_SHAPES,
  HARD_SHAPES,
  rotateShape,
  mirrorShape,
  rotateAndMirrorShape,
  type ShapeType,
} from './shapes';

describe('SVG Shape Components', () => {
  describe('Shape Rendering', () => {
    it('renders Square component without errors', () => {
      const { container } = render(<Square />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Circle component without errors', () => {
      const { container } = render(<Circle />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Triangle component without errors', () => {
      const { container } = render(<Triangle />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Rectangle component without errors', () => {
      const { container } = render(<Rectangle />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Pentagon component without errors', () => {
      const { container } = render(<Pentagon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Hexagon component without errors', () => {
      const { container } = render(<Hexagon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders LShape component without errors', () => {
      const { container } = render(<LShape />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders TShape component without errors', () => {
      const { container } = render(<TShape />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Arrow component without errors', () => {
      const { container } = render(<Arrow />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('renders Star component without errors', () => {
      const { container } = render(<Star />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    });

    it('all shapes use consistent 120x120 viewBox', () => {
      const shapeComponents = [Square, Circle, Triangle, Rectangle, Pentagon, Hexagon, LShape, TShape, Arrow, Star];

      shapeComponents.forEach((ShapeComponent) => {
        const { container } = render(<ShapeComponent />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
      });
    });

    it('all shapes use currentColor fill for theming', () => {
      const shapeComponents = [Square, Circle, Triangle, Rectangle, Pentagon, Hexagon, LShape, TShape, Arrow, Star];

      shapeComponents.forEach((ShapeComponent) => {
        const { container } = render(<ShapeComponent />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('fill')).toBe('currentColor');
      });
    });

    it('all shapes have 2px stroke width', () => {
      const shapeComponents = [Square, Circle, Triangle, Rectangle, Pentagon, Hexagon, LShape, TShape, Arrow, Star];

      shapeComponents.forEach((ShapeComponent) => {
        const { container } = render(<ShapeComponent />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('strokeWidth')).toBe('2');
      });
    });

    it('shapes accept custom className prop', () => {
      const { container } = render(<Square className="custom-class" />);
      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('custom-class')).toBe(true);
    });

    it('shapes accept custom style prop', () => {
      const customStyle = { transform: 'rotate(45deg)' };
      const { container } = render(<Square style={customStyle} />);
      const svg = container.querySelector('svg');
      expect(svg?.style.transform).toBe('rotate(45deg)');
    });
  });

  describe('Shape Type Constants', () => {
    it('SHAPES map contains all 10 shape types', () => {
      const shapeKeys: ShapeType[] = [
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

      shapeKeys.forEach((key) => {
        expect(SHAPES[key]).toBeDefined();
        expect(typeof SHAPES[key]).toBe('function');
      });
    });

    it('EASY_SHAPES contains only simple symmetric shapes', () => {
      expect(EASY_SHAPES).toEqual(['square', 'circle', 'triangle']);
      expect(EASY_SHAPES).toHaveLength(3);
    });

    it('MEDIUM_SHAPES contains easy shapes plus more complex ones', () => {
      expect(MEDIUM_SHAPES).toEqual([
        'square',
        'circle',
        'triangle',
        'rectangle',
        'pentagon',
        'lshape',
      ]);
      expect(MEDIUM_SHAPES).toHaveLength(6);
    });

    it('HARD_SHAPES contains all 10 shapes', () => {
      expect(HARD_SHAPES).toEqual([
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
      ]);
      expect(HARD_SHAPES).toHaveLength(10);
    });
  });

  describe('Transformation Utilities', () => {
    describe('rotateShape', () => {
      it('generates correct CSS transform for 0 degrees', () => {
        const style = rotateShape(0);
        expect(style.transform).toBe('rotate(0deg)');
        expect(style.willChange).toBe('transform');
      });

      it('generates correct CSS transform for 90 degrees', () => {
        const style = rotateShape(90);
        expect(style.transform).toBe('rotate(90deg)');
        expect(style.willChange).toBe('transform');
      });

      it('generates correct CSS transform for 180 degrees', () => {
        const style = rotateShape(180);
        expect(style.transform).toBe('rotate(180deg)');
        expect(style.willChange).toBe('transform');
      });

      it('generates correct CSS transform for 270 degrees', () => {
        const style = rotateShape(270);
        expect(style.transform).toBe('rotate(270deg)');
        expect(style.willChange).toBe('transform');
      });

      it('generates correct CSS transform for 45 degrees', () => {
        const style = rotateShape(45);
        expect(style.transform).toBe('rotate(45deg)');
      });

      it('includes willChange for GPU acceleration', () => {
        const style = rotateShape(90);
        expect(style.willChange).toBe('transform');
      });
    });

    describe('mirrorShape', () => {
      it('generates horizontal flip with scaleX(-1)', () => {
        const style = mirrorShape();
        expect(style.transform).toBe('scaleX(-1)');
        expect(style.willChange).toBe('transform');
      });

      it('includes willChange for GPU acceleration', () => {
        const style = mirrorShape();
        expect(style.willChange).toBe('transform');
      });
    });

    describe('rotateAndMirrorShape', () => {
      it('combines rotation and mirroring', () => {
        const style = rotateAndMirrorShape(90);
        expect(style.transform).toBe('scaleX(-1) rotate(90deg)');
        expect(style.willChange).toBe('transform');
      });

      it('generates correct combined transform for 180 degrees', () => {
        const style = rotateAndMirrorShape(180);
        expect(style.transform).toBe('scaleX(-1) rotate(180deg)');
      });

      it('generates correct combined transform for 0 degrees', () => {
        const style = rotateAndMirrorShape(0);
        expect(style.transform).toBe('scaleX(-1) rotate(0deg)');
      });

      it('includes willChange for GPU acceleration', () => {
        const style = rotateAndMirrorShape(45);
        expect(style.willChange).toBe('transform');
      });
    });
  });

  describe('Shape Rendering with Transformations', () => {
    it('applies rotation transform correctly', () => {
      const rotationStyle = rotateShape(90);
      const { container } = render(<Square style={rotationStyle} />);
      const svg = container.querySelector('svg');
      expect(svg?.style.transform).toBe('rotate(90deg)');
    });

    it('applies mirror transform correctly', () => {
      const mirrorStyle = mirrorShape();
      const { container } = render(<Triangle style={mirrorStyle} />);
      const svg = container.querySelector('svg');
      expect(svg?.style.transform).toBe('scaleX(-1)');
    });

    it('applies combined rotation and mirror transform correctly', () => {
      const combinedStyle = rotateAndMirrorShape(180);
      const { container } = render(<Pentagon style={combinedStyle} />);
      const svg = container.querySelector('svg');
      expect(svg?.style.transform).toBe('scaleX(-1) rotate(180deg)');
    });
  });
});
