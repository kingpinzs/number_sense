// Tests for TrainingRoute - Story 3.1
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserSettingsProvider } from '@/context/UserSettingsContext';
import { AppProvider } from '@/context/AppContext';
import { SessionProvider } from '@/context/SessionContext';
import TrainingRoute from './TrainingRoute';
import { db } from '@/services/storage/db';
import type { Assessment } from '@/services/storage/schemas';

// Mock database
vi.mock('@/services/storage/db', () => ({
  db: {
    assessments: {
      orderBy: vi.fn(),
    },
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock('@/shared/components/ui/toast', () => ({
  toast: vi.fn(),
}));

// Mock TrainingSession component
vi.mock('@/features/training/components/TrainingSession', () => ({
  default: () => <div data-testid="training-session">Training Session</div>,
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <UserSettingsProvider>
        <AppProvider>
          <SessionProvider>
            <TrainingRoute />
          </SessionProvider>
        </AppProvider>
      </UserSettingsProvider>
    </BrowserRouter>
  );
};

describe('TrainingRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    // Arrange: Mock assessment query to return empty
    const mockFirst = vi.fn().mockResolvedValue(null);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    renderComponent();

    // Assert: Loading spinner should be visible initially
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /assessment when no assessment exists', async () => {
    // Arrange: Mock assessment query to return null
    const mockFirst = vi.fn().mockResolvedValue(null);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    renderComponent();

    // Assert: Should redirect to /assessment
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/assessment', { replace: true });
    });
  });

  it('redirects to /assessment when assessment is in-progress', async () => {
    // Arrange: Mock incomplete assessment
    const incompleteAssessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'in-progress',
      totalQuestions: 10,
      correctAnswers: 0,
      weaknesses: [],
      strengths: [],
      recommendations: [],
      userId: 'local_user',
    };

    const mockFirst = vi.fn().mockResolvedValue(incompleteAssessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    renderComponent();

    // Assert: Should redirect to /assessment
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/assessment', { replace: true });
    });
  });

  it('renders TrainingSession when completed assessment exists', async () => {
    // Arrange: Mock completed assessment
    const completedAssessment: Partial<Assessment> = {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'completed',
      totalQuestions: 10,
      correctAnswers: 7,
      weaknesses: ['number-sense'],
      strengths: ['spatial'],
      recommendations: ['Practice number line exercises'],
      userId: 'local_user',
    };

    const mockFirst = vi.fn().mockResolvedValue(completedAssessment);
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    renderComponent();

    // Assert: Should render TrainingSession component
    await waitFor(() => {
      expect(screen.getByTestId('training-session')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to /assessment on database error', async () => {
    // Arrange: Mock database error
    const mockFirst = vi.fn().mockRejectedValue(new Error('Database error'));
    const mockReverse = vi.fn().mockReturnValue({ first: mockFirst });
    const mockOrderBy = vi.fn().mockReturnValue({ reverse: mockReverse });
    (db.assessments.orderBy as any) = mockOrderBy;

    // Act
    renderComponent();

    // Assert: Should redirect to /assessment on error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/assessment', { replace: true });
    });
  });
});
