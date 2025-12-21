// Training route - Entry point for training sessions
// Story 3.1: Build Training Session Shell and State Management
// Protected route: Redirects to assessment if no training plan weights exist

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/services/storage/db';
import { toast } from '@/shared/components/ui/toast';
import TrainingSession from '@/features/training/components/TrainingSession';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

/**
 * TrainingRoute - Protected route for training sessions
 * Checks for assessment completion before allowing access
 */
export default function TrainingRoute() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(false);

  useEffect(() => {
    async function checkAssessment() {
      try {
        // Query latest assessment from Dexie
        const latestAssessment = await db.assessments
          .orderBy('timestamp')
          .reverse()
          .first();

        if (!latestAssessment || latestAssessment.status !== 'completed') {
          // No completed assessment - redirect to assessment
          toast('Please complete your assessment first to personalize training.', {
            description: 'Assessment helps us understand your needs.',
          });
          navigate('/assessment', { replace: true });
          return;
        }

        // Assessment exists - allow access to training
        setHasAssessment(true);
      } catch (error) {
        console.error('Error checking assessment:', error);
        toast('Error loading training data', {
          description: 'Please try again or complete the assessment first.',
        });
        navigate('/assessment', { replace: true });
      } finally {
        setIsLoading(false);
      }
    }

    checkAssessment();
  }, [navigate]);

  // Show loading spinner while checking assessment
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Only render training session if assessment exists
  if (!hasAssessment) {
    return null; // Will redirect via useEffect
  }

  return <TrainingSession />;
}
