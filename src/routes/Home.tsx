// Home - Main dashboard route
// Shows personalized content based on user's assessment status
// Story 5.3: Integrated StreakCounter with milestone celebrations

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Target, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { db } from '@/services/storage/db';
import { StreakCounter } from '@/shared/components/StreakCounter';
import { getCurrentStreak, checkMilestone } from '@/services/training/streakManager';
import { addMilestoneShown, getLastSessionDate } from '@/services/storage/localStorage';
import { MilestoneModal } from '@/features/progress';
import type { Milestone } from '@/services/training/streakManager';

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
  if (!hasAssessment) {
    return (
      <main className="min-h-screen bg-background p-6">
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

          {/* Assessment Card */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Let's Get Started</CardTitle>
              <CardDescription className="text-base">
                Take a quick 10-question assessment to discover your strengths
                and create a personalized training plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button
                size="lg"
                onClick={() => navigate('/assessment')}
                className="min-h-[48px] gap-2 px-8"
              >
                <Sparkles className="h-5 w-5" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-6 grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  Adaptive Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Exercises adapt to your skill level, focusing on areas that need the most work.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-5 w-5 text-accent" />
                  Daily Practice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Short, focused sessions help build lasting confidence with numbers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  // Returning user: Show dashboard with quick actions
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-lg">
        {/* Streak Counter */}
        <div className="mb-4 flex justify-center">
          <StreakCounter
            streak={displayStreak}
            noSessions={noSessions}
            onTap={() => navigate('/progress')}
          />
        </div>

        {/* Welcome Back Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Ready for your daily practice?
          </p>
        </div>

        {/* Quick Start Training */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Start Training
            </CardTitle>
            <CardDescription>
              Jump into a personalized training session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onClick={() => navigate('/training')}
              className="w-full min-h-[48px]"
            >
              Begin Session
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => navigate('/progress')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-secondary" />
                View Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See your improvement over time
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => navigate('/assessment')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-accent" />
                New Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Retake to update your plan
              </p>
            </CardContent>
          </Card>
        </div>
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
