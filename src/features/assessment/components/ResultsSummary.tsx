// ResultsSummary - Assessment completion summary with domain scores
// Story 2.6: Build Results Summary Visualization

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Sprout, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { DomainScores } from '@/services/assessment/scoring';
import { saveAssessmentResults } from '@/services/assessment/storage';

// Constants
const CONFETTI_PARTICLE_COUNT = 20;

export interface ResultsSummaryProps {
  /** Domain scores (0-5 scale) for each assessment domain */
  domainScores: DomainScores;
  /** Assessment completion time */
  completionTime: {
    minutes: number;
    seconds: number;
  };
  /** Callback when Start Training button is clicked */
  onStartTraining: () => void;
}

type DomainLevel = 'weak' | 'moderate' | 'strong';

interface DomainConfig {
  name: string;
  score: number;
  level: DomainLevel;
  bgColor: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Determine domain performance level based on score thresholds
 * - Weak: ≤2.5
 * - Moderate: 2.6-3.5
 * - Strong: >3.5
 */
function getDomainLevel(score: number): DomainLevel {
  if (score <= 2.5) return 'weak';
  if (score <= 3.5) return 'moderate';
  return 'strong';
}

/**
 * Get domain configuration based on score
 */
function getDomainConfig(name: string, score: number): DomainConfig {
  const level = getDomainLevel(score);

  const configs: Record<DomainLevel, { bgColor: string; label: string; icon: React.ReactNode }> = {
    weak: {
      bgColor: '#E87461', // Coral
      label: 'Needs Focus',
      icon: <Target className="h-5 w-5" aria-hidden="true" />,
    },
    moderate: {
      bgColor: '#FFD56F', // Yellow
      label: 'Growing',
      icon: <Sprout className="h-5 w-5" aria-hidden="true" />,
    },
    strong: {
      bgColor: '#A8E6CF', // Mint
      label: 'Strength',
      icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
    },
  };

  return {
    name,
    score,
    level,
    ...configs[level],
  };
}

/**
 * Confetti particle animation configuration
 */
const confettiVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: [0, 1, 1, 0],
    scale: [0, 1.2, 1, 0],
    x: [0, (i % 2 === 0 ? 1 : -1) * (50 + Math.random() * 100)],
    y: [0, -100 - Math.random() * 100],
    transition: {
      duration: 1.5 + Math.random() * 0.5,
      ease: 'easeOut' as const,
      delay: i * 0.05,
    },
  }),
};

/**
 * ResultsSummary component - displays assessment completion summary
 * Shows domain scores with color-coded cards, celebration animation, and CTA
 */
export function ResultsSummary({ domainScores, completionTime, onStartTraining }: ResultsSummaryProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(true);

  // Domain display names
  const domains: { key: keyof DomainScores; name: string }[] = [
    { key: 'number_sense', name: 'Number Sense' },
    { key: 'place_value', name: 'Place Value & Estimation' },
    { key: 'sequencing', name: 'Sequencing & Patterns' },
    { key: 'arithmetic', name: 'Arithmetic Fluency' },
    { key: 'spatial', name: 'Spatial Reasoning' },
    { key: 'applied', name: 'Applied Math' },
  ];

  // Get configurations for all domains
  const domainConfigs = domains.map(({ key, name }) =>
    getDomainConfig(name, domainScores[key])
  );

  // Handle Start Training button click
  const handleStartTraining = () => {
    onStartTraining();
    navigate('/training', {
      state: {
        fromAssessment: true,
        domainScores,
      },
    });
  };

  // Save results to Dexie on mount (guards against navigation away)
  useEffect(() => {
    const saveResults = async () => {
      try {
        await saveAssessmentResults({
          domainScores,
          completionTime,
        });
      } catch (error) {
        console.error('Failed to save assessment results:', error);
        toast.error('Unable to save your results. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    saveResults();
  }, [domainScores, completionTime]);

  // Announce results to screen readers on mount
  useEffect(() => {
    const announcements = domainConfigs.map(
      (config) => `${config.name}: ${config.score} out of 5, ${config.label}`
    );
    const message = `Assessment complete. ${announcements.join('. ')}`;

    // Create live region announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    return () => {
      document.body.removeChild(announcement);
    };
  }, [domainConfigs]);

  // Show loading state while saving
  if (isSaving) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
      {/* Confetti animation */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        {Array.from({ length: CONFETTI_PARTICLE_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={confettiVariants}
            initial="hidden"
            animate="visible"
            className="absolute h-3 w-3 rounded-full"
            style={{
              backgroundColor: ['#E87461', '#FFD56F', '#A8E6CF'][i % 3],
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold" id="results-title">
            Your Number Sense Profile
          </h1>
          <p className="mb-4 text-lg text-muted-foreground">
            Here's what we discovered about your strengths
          </p>
          <p className="text-sm text-muted-foreground" aria-label={`Assessment completed in ${completionTime.minutes} minutes and ${completionTime.seconds} seconds`}>
            Completed in {completionTime.minutes} {completionTime.minutes === 1 ? 'minute' : 'minutes'}, {completionTime.seconds} {completionTime.seconds === 1 ? 'second' : 'seconds'}
          </p>
        </header>

        {/* Domain Cards */}
        <div className="mb-8 space-y-4" role="list" aria-labelledby="results-title">
          {domainConfigs.map((config, index) => {
            const scorePercentage = (config.score / 5) * 100;

            return (
              <Card
                key={index}
                className="overflow-hidden"
                style={{
                  backgroundColor: `${config.bgColor}15`, // 15 for 15% opacity
                  borderColor: config.bgColor,
                }}
                role="listitem"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>{config.name}</span>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <span
                        className="text-sm font-medium"
                        style={{ color: config.level === 'moderate' ? '#3B2B00' : undefined }}
                      >
                        {config.label}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Score:</span>
                      <span
                        className="font-semibold"
                        aria-label={`${config.score.toFixed(1)} out of 5`}
                      >
                        {config.score.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <Progress
                      value={scorePercentage}
                      className="h-3"
                      style={{
                        '--progress-background': config.bgColor,
                      } as React.CSSProperties}
                      aria-label={`${config.name} score progress bar, ${Math.round(scorePercentage)}% filled`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Start Training CTA */}
        <div className="flex justify-center">
          <Button
            onClick={handleStartTraining}
            size="lg"
            className="min-h-[48px] gap-2 px-8 text-lg shadow-lg transition-transform hover:scale-105"
            aria-label="Start your personalized training session"
          >
            <span>Start Training</span>
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResultsSummary;
