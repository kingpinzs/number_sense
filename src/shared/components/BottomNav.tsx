// BottomNav - Mobile navigation bar with 5 tabs
// Uses React Router for navigation, WCAG 2.1 AA compliant
// Hides on assessment route; shows lock indicators pre-assessment

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Brain, BarChart3, User, Lock } from 'lucide-react';
import { db } from '@/services/storage/db';

export interface BottomNavProps {
  className?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  requiresAssessment: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home, requiresAssessment: false },
  { path: '/training', label: 'Training', icon: Dumbbell, requiresAssessment: true },
  { path: '/cognition', label: 'Games', icon: Brain, requiresAssessment: false },
  { path: '/progress', label: 'Progress', icon: BarChart3, requiresAssessment: true },
  { path: '/profile', label: 'Profile', icon: User, requiresAssessment: false },
];

/**
 * BottomNav component - Mobile-optimized bottom navigation bar
 * Features:
 * - 5 tabs: Home, Training, Games, Progress, Profile
 * - Active state highlighting with coral primary color
 * - 44px minimum tap targets for mobile accessibility
 * - Full keyboard navigation (Tab + Enter/Space)
 * - ARIA roles and aria-current for screen readers
 * - Hides during assessment flow
 * - Shows lock icon on gated features pre-assessment
 */
export function BottomNav({ className = '' }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasAssessment, setHasAssessment] = useState<boolean | null>(null);

  // Check assessment status
  useEffect(() => {
    const check = async () => {
      try {
        const count = await db.assessments
          .where('status')
          .equals('completed')
          .count();
        setHasAssessment(count > 0);
      } catch {
        setHasAssessment(false);
      }
    };
    check();
  }, [location.pathname]);

  // Hide bottom nav on assessment route
  if (location.pathname === '/assessment') {
    return null;
  }

  const handleNavigation = (item: NavItem) => {
    if (item.requiresAssessment && !hasAssessment) {
      navigate('/assessment');
      return;
    }
    navigate(item.path);
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: NavItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigation(item);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 right-0 z-30 border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.1)] ${className}`}
      style={{
        backgroundColor: 'var(--background, #fdfbf9)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isLocked = item.requiresAssessment && !hasAssessment;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              role="button"
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={isLocked || undefined}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[44px] min-h-[44px] p-2
                transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isLocked
                  ? 'text-muted-foreground/40 cursor-default'
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 ${isLocked ? 'opacity-40' : ''}`}
                  aria-hidden={true}
                />
                {isLocked && (
                  <Lock className="absolute -top-1 -right-2 w-3 h-3 text-muted-foreground/60" aria-hidden={true} />
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isLocked ? 'opacity-40' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
