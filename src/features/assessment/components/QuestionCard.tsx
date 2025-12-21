// QuestionCard - Consistent wrapper for assessment questions
// Story 2.2: Implement Number Sense Question Types
// AC8: All questions rendered with consistent styling

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/lib/utils';

export interface QuestionCardProps {
  /** Question prompt to display */
  question: string;
  /** Content area for question interaction */
  children: ReactNode;
  /** Optional footer for answer buttons */
  footer?: ReactNode;
  /** Optional additional class names */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * QuestionCard - Wrapper component for consistent question styling
 *
 * Features:
 * - Mobile-first design with generous padding
 * - 44px+ tap targets for buttons
 * - WCAG 2.1 AA compliant
 * - Consistent Card styling from shadcn/ui
 */
export function QuestionCard({
  question,
  children,
  footer,
  className,
  'data-testid': testId = 'question-card',
}: QuestionCardProps) {
  return (
    <Card
      className={cn('w-full max-w-lg mx-auto', className)}
      data-testid={testId}
    >
      <CardHeader className="pb-4">
        <CardTitle
          className="text-xl text-center font-medium"
          data-testid="question-prompt"
        >
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pb-6">
        {children}
        {footer && (
          <div
            className="flex flex-wrap justify-center gap-3 w-full pt-4"
            data-testid="question-footer"
          >
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuestionCard;
