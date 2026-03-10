// Home - Main dashboard route
// Shows personalized content based on user's assessment status
// Story 5.3: Integrated StreakCounter with milestone celebrations
// Story 6.1: Integrated CoachCard with contextual guidance
// Story 6.2: Integrated QuickActions with dynamic action cards

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Target, Sparkles, Lock, Brain, BarChart3, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { db } from '@/services/storage/db';
import { StreakCounter } from '@/shared/components/StreakCounter';
import { getCurrentStreak, checkMilestone } from '@/services/training/streakManager';
import { addMilestoneShown, getLastSessionDate } from '@/services/storage/localStorage';
import { MilestoneModal } from '@/features/progress';
import CoachCard from '@/features/coach/components/CoachCard';
import QuickActions from '@/features/coach/components/QuickActions';
import { useCoachGuidance } from '@/features/coach/hooks/useCoachGuidance';
import type { Milestone } from '@/services/training/streakManager';
import { useUserSettings } from '@/context/UserSettingsContext';

/**
 * Home - Main dashboard showing personalized content
 *
 * First-time users: Prompted to complete assessment
 * Returning users: Quick access to training with progress summary + streak counter
 */
export default function Home() {
  const navigate = useNavigate();
  const [hasAssessment, setHasAssessment] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayStreak, setDisplayStreak] = useState(0);
  const [noSessions, setNoSessions] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const { guidance, dismiss } = useCoachGuidance();
  const { settings } = useUserSettings();

  // Check if user has completed an assessment
  useEffect(() => {
    const checkAssessment = async () => {
      try {
        const assessments = await db.assessments
          .where('status')
          .equals('completed')
          .count();
        setHasAssessment(assessments > 0);
      } catch (error) {
        console.error('Failed to check assessment status:', error);
        setHasAssessment(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAssessment();
  }, []);

  // Compute display streak and check milestones
  useEffect(() => {
    if (hasAssessment) {
      const streak = getCurrentStreak();
      setDisplayStreak(streak);
      setNoSessions(getLastSessionDate() === null);

      // Check if there's a milestone to celebrate
      const pendingMilestone = checkMilestone(streak);
      if (pendingMilestone) {
        setMilestone(pendingMilestone);
      }
    }
  }, [hasAssessment]);

  const handleMilestoneClose = () => {
    if (milestone) {
      addMilestoneShown(milestone.streak);
    }
    setMilestone(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // First-time user: Show assessment prompt
  // Note: CoachCard intentionally omitted — first-time view already has assessment CTA
  if (!hasAssessment) {
    return (
      <main className="min-h-screen bg-background p-6 pb-24">
        <div className="mx-auto max-w-lg">
          {/* Welcome Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to Discalculas
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Your daily companion for building number confidence
            </p>
          </div>

          {/* Assessment CTA — primary action */}
          <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 shadow-inner">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Let&apos;s Get Started</CardTitle>
              <CardDescription className="text-base mt-2">
                Take a quick 10-question assessment to discover your strengths
                and create a personalized training plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8 pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/assessment')}
                className="min-h-[56px] gap-3 px-10 text-lg font-bold shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 [&_svg]:size-6"
              >
                <Sparkles className="h-6 w-6" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>

          {/* Locked Feature Cards — shows what unlocks after assessment */}
          <p className="mt-8 mb-3 text-sm font-medium text-muted-foreground text-center">
            Complete the assessment to unlock
          </p>
          <div className="grid gap-3">
            <Card className="opacity-50 border-dashed">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  Adaptive Training
                  <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">
                  Personalized exercises that adapt to your skill level.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50 border-dashed">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-muted-foreground" />
                  Brain Games
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">
                  Fun cognitive exercises to strengthen number skills.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50 border-dashed">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  Progress Tracking
                  <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">
                  Charts and insights to see how you&apos;re improving.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Self-Discovery — always available */}
          <Card className="mt-3 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/self-discovery')}>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-5 w-5 text-primary" />
                Self-Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-muted-foreground">
                Understand your number processing patterns with symptom checklists and visual tests.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Returning user: Show dashboard with quick actions
  return (
    <main className="min-h-screen bg-background p-6 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Streak Counter */}
        <div className="mb-4 flex justify-center">
          <StreakCounter
            streak={displayStreak}
            noSessions={noSessions}
            onTap={() => navigate('/progress')}
          />
        </div>

        {/* Research Mode Badge — visible when research mode is active */}
        {settings.researchModeEnabled && (
          <div
            data-testid="research-mode-badge"
            className="text-xs text-primary-foreground bg-primary/80 px-2 py-1 rounded-full inline-block mb-3 font-medium"
            aria-label="Research Mode is active"
          >
            Research Mode Active
          </div>
        )}

        {/* Welcome Back Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Ready for your daily practice?
          </p>
        </div>

        {/* Coach Guidance */}
        {guidance && (
          <CoachCard
            guidance={guidance}
            onDismiss={() => dismiss(guidance.triggerId)}
          />
        )}

        {/* Quick Actions - Story 6.2 */}
        <QuickActions />

        {/* Self-Discovery Card */}
        <Card className="mt-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/self-discovery')}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5 text-primary" />
              Self-Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-muted-foreground">
              Understand your number processing patterns.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Celebration Modal */}
      {milestone && (
        <MilestoneModal
          milestone={milestone}
          open={true}
          onClose={handleMilestoneClose}
        />
      )}
    </main>
  );
}
