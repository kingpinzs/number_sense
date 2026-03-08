// ContextTestComponent - Test component for verifying Context providers
// Used in Story 1.5 to demonstrate all three contexts working together
// This file is for testing purposes and can be removed after verification

import { useApp } from '@/context/AppContext';
import { useSession } from '@/context/SessionContext';
import { useUserSettings } from '@/context/UserSettingsContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

/**
 * ContextTestComponent - Demonstrates all three context providers
 * Tests reading and dispatching to AppContext, SessionContext, and UserSettingsContext
 */
export function ContextTestComponent() {
  // AppContext - Streak management
  const { state: appState, setStreak, updateOnlineStatus } = useApp();

  // SessionContext - Session lifecycle
  const { state: sessionState, startSession, endSession, pauseSession, resumeSession } = useSession();

  // UserSettingsContext - Settings management
  const { settings, updateSettings } = useUserSettings();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* AppContext Test */}
      <Card>
        <CardHeader>
          <CardTitle>AppContext</CardTitle>
          <CardDescription>Global app state (streak, online status)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Streak: {appState.streak}</p>
            <p className="text-sm text-muted-foreground">Online: {appState.onlineStatus ? 'Yes' : 'No'}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStreak(appState.streak + 1)}>
              +1 Streak
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateOnlineStatus(!appState.onlineStatus)}>
              Toggle Online
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SessionContext Test */}
      <Card>
        <CardHeader>
          <CardTitle>SessionContext</CardTitle>
          <CardDescription>Active session management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Status: {sessionState.sessionStatus}</p>
            <p className="text-sm text-muted-foreground">Module: {sessionState.currentModule || 'None'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => startSession('training', Date.now())}
              disabled={sessionState.sessionStatus === 'active'}
            >
              Start
            </Button>
            <Button size="sm" variant="outline" onClick={() => pauseSession()} disabled={sessionState.sessionStatus !== 'active'}>
              Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => resumeSession()}
              disabled={sessionState.sessionStatus !== 'paused'}
            >
              Resume
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => endSession()}
              disabled={sessionState.sessionStatus === 'idle'}
            >
              End
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* UserSettingsContext Test */}
      <Card>
        <CardHeader>
          <CardTitle>UserSettingsContext</CardTitle>
          <CardDescription>User preferences (persisted)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Sound: {settings.soundEnabled ? 'On' : 'Off'}</p>
            <p className="text-sm text-muted-foreground">Reduced Motion: {settings.reducedMotion ? 'On' : 'Off'}</p>
            <p className="text-sm text-muted-foreground">Daily Goal: {settings.dailyGoalMinutes} min</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}>
              Toggle Sound
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}>
              Toggle Motion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
