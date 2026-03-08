// BottomNav - Mobile navigation bar with 5 tabs
// Uses React Router for navigation, WCAG 2.1 AA compliant

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Brain, BarChart3, User } from 'lucide-react';

export interface BottomNavProps {
  className?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/training', label: 'Training', icon: Dumbbell },
  { path: '/cognition', label: 'Games', icon: Brain },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

/**
 * BottomNav component - Mobile-optimized bottom navigation bar
 * Features:
 * - 5 tabs: Home, Training, Games, Progress, Profile
 * - Active state highlighting with coral primary color
 * - 44px minimum tap targets for mobile accessibility
 * - Full keyboard navigation (Tab + Enter/Space)
 * - ARIA roles and aria-current for screen readers
 */
export function BottomNav({ className = '' }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigation(path);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, backgroundColor: 'var(--background, #fdfbf9)' }}
      className={`border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.1)] ${className}`}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              onKeyDown={(e) => handleKeyDown(e, item.path)}
              role="button"
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center
                min-w-[44px] min-h-[44px] p-2
                transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon
                className="w-6 h-6"
                aria-hidden={true}
              />
              <span className="text-xs mt-1 font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
