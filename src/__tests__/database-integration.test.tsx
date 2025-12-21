// Integration tests for Dexie React hooks
// Testing: useLiveQuery() reactive updates

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DiscalculasDB } from '@/services/storage/db';
import type { Session } from '@/services/storage/schemas';

describe('Database Integration with React', () => {
  let testDB: DiscalculasDB;

  beforeEach(() => {
    testDB = new DiscalculasDB();
  });

  afterEach(async () => {
    await testDB.delete();
    await testDB.close();
  });

  describe('useLiveQuery Hook', () => {
    it('loads initial data', async () => {
      // Arrange - Add test data
      await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      // Act - Create component using useLiveQuery
      function TestComponent() {
        const sessions = useLiveQuery(
          () => testDB.sessions.toArray()
        );

        if (!sessions) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="session-count">{sessions.length}</div>
            {sessions.map((session, index) => (
              <div key={index} data-testid={`session-${index}`}>
                {session.module}
              </div>
            ))}
          </div>
        );
      }

      render(<TestComponent />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('1');
      });

      expect(screen.getByTestId('session-0')).toHaveTextContent('training');
    });

    it('reactively updates when data changes', async () => {
      // Arrange - Create component
      function TestComponent() {
        const sessions = useLiveQuery(
          () => testDB.sessions.orderBy('timestamp').reverse().toArray()
        );

        if (!sessions) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="session-count">{sessions.length}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('0');
      });

      // Act - Add data after component mounted
      await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      // Assert - Component should re-render with new data
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('1');
      });

      // Add another session
      await testDB.sessions.add({
        timestamp: '2025-11-10T11:00:00.000Z',
        module: 'assessment',
        duration: 180000,
        completionStatus: 'completed'
      });

      // Should update again
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('2');
      });
    });

    it('reactively updates on delete', async () => {
      // Arrange - Add initial data
      const id = await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      function TestComponent() {
        const sessions = useLiveQuery(
          () => testDB.sessions.toArray()
        );

        if (!sessions) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="session-count">{sessions.length}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('1');
      });

      // Act - Delete the session
      await testDB.sessions.delete(id);

      // Assert - Component should update
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('0');
      });
    });

    it('reactively updates on update', async () => {
      // Arrange - Add initial data
      const id = await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'paused'
      });

      function TestComponent() {
        const sessions = useLiveQuery(
          () => testDB.sessions.toArray()
        );

        if (!sessions) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="completion-status">
              {sessions[0]?.completionStatus || 'none'}
            </div>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('completion-status')).toHaveTextContent('paused');
      });

      // Act - Update the session
      await testDB.sessions.update(id, { completionStatus: 'completed' });

      // Assert - Component should update
      await waitFor(() => {
        expect(screen.getByTestId('completion-status')).toHaveTextContent('completed');
      });
    });

    it('queries with filters', async () => {
      // Arrange - Add multiple sessions
      await testDB.sessions.bulkAdd([
        {
          timestamp: '2025-11-10T10:00:00.000Z',
          module: 'training',
          duration: 300000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2025-11-10T11:00:00.000Z',
          module: 'assessment',
          duration: 180000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2025-11-10T12:00:00.000Z',
          module: 'training',
          duration: 240000,
          completionStatus: 'completed'
        }
      ]);

      // Act - Query only training sessions
      function TestComponent() {
        const trainingSessions = useLiveQuery(
          () => testDB.sessions
            .where('module')
            .equals('training')
            .toArray()
        );

        if (!trainingSessions) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="training-count">{trainingSessions.length}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('training-count')).toHaveTextContent('2');
      });
    });

    it('handles complex queries with ordering', async () => {
      // Arrange - Add sessions out of order
      await testDB.sessions.bulkAdd([
        {
          timestamp: '2025-11-10T12:00:00.000Z',
          module: 'training',
          duration: 240000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2025-11-10T10:00:00.000Z',
          module: 'training',
          duration: 300000,
          completionStatus: 'completed'
        },
        {
          timestamp: '2025-11-10T11:00:00.000Z',
          module: 'assessment',
          duration: 180000,
          completionStatus: 'completed'
        }
      ]);

      // Act - Query with ordering
      function TestComponent() {
        const sessions = useLiveQuery(
          () => testDB.sessions
            .orderBy('timestamp')
            .reverse()
            .limit(2)
            .toArray()
        );

        if (!sessions) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="latest-timestamp">
              {sessions[0]?.timestamp || 'none'}
            </div>
          </div>
        );
      }

      render(<TestComponent />);

      // Assert - Should get most recent timestamp
      await waitFor(() => {
        expect(screen.getByTestId('latest-timestamp'))
          .toHaveTextContent('2025-11-10T12:00:00.000Z');
      });
    });

    it('handles multiple live queries independently', async () => {
      // Arrange - Add data to multiple tables
      await testDB.sessions.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed'
      });

      await testDB.telemetry_logs.add({
        timestamp: '2025-11-10T10:00:00.000Z',
        event: 'test_event',
        module: 'system',
        data: {},
        userId: 'local_user'
      });

      // Act - Create component with multiple live queries
      function TestComponent() {
        const sessions = useLiveQuery(() => testDB.sessions.toArray());
        const logs = useLiveQuery(() => testDB.telemetry_logs.toArray());

        if (!sessions || !logs) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="session-count">{sessions.length}</div>
            <div data-testid="log-count">{logs.length}</div>
          </div>
        );
      }

      render(<TestComponent />);

      // Assert - Both queries work independently
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('1');
        expect(screen.getByTestId('log-count')).toHaveTextContent('1');
      });

      // Update only sessions table
      await testDB.sessions.add({
        timestamp: '2025-11-10T11:00:00.000Z',
        module: 'assessment',
        duration: 180000,
        completionStatus: 'completed'
      });

      // Only session count should update
      await waitFor(() => {
        expect(screen.getByTestId('session-count')).toHaveTextContent('2');
        expect(screen.getByTestId('log-count')).toHaveTextContent('1');
      });
    });
  });
});
