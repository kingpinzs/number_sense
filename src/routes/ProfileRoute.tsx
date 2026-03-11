// ProfileRoute — User settings page
// Story 8.4: Implement Research Mode Settings Toggle

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Accessibility, Lightbulb, FlaskConical, Moon, Zap, Search, Bell } from 'lucide-react';
import type { ThemePreference } from '@/services/storage/localStorage';
import { useUserSettings } from '@/context/UserSettingsContext';
import { Switch } from '@/shared/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { requestNotificationPermission, formatHour } from '@/services/notifications';

export default function ProfileRoute() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useUserSettings();
  const [consentOpen, setConsentOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );

  function handleResearchToggle(checked: boolean) {
    if (checked) {
      // Turning ON → show consent dialog first
      setConsentOpen(true);
    } else {
      // Turning OFF → update directly without dialog
      updateSettings({ researchModeEnabled: false });
    }
  }

  function handleConsentConfirm() {
    updateSettings({ researchModeEnabled: true });
    setConsentOpen(false);
  }

  const handleNotificationsToggle = useCallback(
    async (checked: boolean) => {
      if (checked && typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await requestNotificationPermission();
        setNotifPermission(permission);
        if (permission === 'denied') return; // Don't enable if user blocked
      }
      updateSettings({ notificationsEnabled: checked });
    },
    [updateSettings]
  );

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Theme Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-info" aria-hidden="true" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred color theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="theme-select" className="text-sm font-medium">
              Theme
            </label>
            <select
              id="theme-select"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as ThemePreference })}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Theme"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
            Sound
          </CardTitle>
          <CardDescription>Control audio feedback during training.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="sound-switch" className="text-sm font-medium">
              Enable Sound
            </label>
            <Switch
              id="sound-switch"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              aria-label="Enable Sound"
            />
          </div>
        </CardContent>
      </Card>

      {/* Motion Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-secondary" aria-hidden="true" />
            Motion
          </CardTitle>
          <CardDescription>Reduce animations for accessibility.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="motion-switch" className="text-sm font-medium">
              Reduced Motion
            </label>
            <Switch
              id="motion-switch"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
              aria-label="Reduced Motion"
            />
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Insights */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" aria-hidden="true" />
            Adaptive Insights
          </CardTitle>
          <CardDescription>Show real-time coaching tips during training.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="toasts-switch" className="text-sm font-medium">
              Show Adaptive Toasts
            </label>
            <Switch
              id="toasts-switch"
              checked={settings.showAdaptiveToasts}
              onCheckedChange={(checked) => updateSettings({ showAdaptiveToasts: checked })}
              aria-label="Show Adaptive Toasts"
            />
          </div>
          <div className="mt-4 flex items-center justify-between min-h-[44px]">
            <label htmlFor="goal-input" className="text-sm font-medium">
              Daily Goal (minutes)
            </label>
            <input
              id="goal-input"
              type="number"
              min={1}
              max={120}
              value={settings.dailyGoalMinutes}
              onChange={(e) => updateSettings({ dailyGoalMinutes: Number(e.target.value) })}
              className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Daily Goal Minutes"
            />
          </div>
        </CardContent>
      </Card>

      {/* Boost Round (Magic Minute) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" aria-hidden="true" />
            Boost Round
          </CardTitle>
          <CardDescription>
            Quick targeted practice that activates when the app notices a pattern in your answers. You can turn it off if you find it disruptive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="magic-minute-switch" className="text-sm font-medium">
              Enable Boost Round
            </label>
            <Switch
              id="magic-minute-switch"
              checked={settings.magicMinuteEnabled}
              onCheckedChange={(checked) => updateSettings({ magicMinuteEnabled: checked })}
              aria-label="Enable Boost Round"
            />
          </div>
        </CardContent>
      </Card>

      {/* Smart Notifications */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            Smart Notifications
          </CardTitle>
          <CardDescription>
            Get reminded at the best time to train. The app learns when you perform
            best and automatically suggests adjusting your reminder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="notifications-switch" className="text-sm font-medium">
              Enable Reminders
            </label>
            <Switch
              id="notifications-switch"
              checked={settings.notificationsEnabled}
              onCheckedChange={handleNotificationsToggle}
              aria-label="Enable Reminders"
            />
          </div>
          {notifPermission === 'denied' && (
            <p className="text-xs text-destructive" role="alert">
              Notifications are blocked by your browser. Enable them in your device settings to receive reminders.
            </p>
          )}
          {settings.notificationsEnabled && (
            <>
              <div className="flex items-center justify-between min-h-[44px]">
                <label htmlFor="notification-hour-select" className="text-sm font-medium">
                  Reminder Time
                </label>
                <select
                  id="notification-hour-select"
                  value={settings.notificationHour}
                  onChange={(e) => updateSettings({ notificationHour: Number(e.target.value) })}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Reminder Time"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {formatHour(i)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <div>
                  <label htmlFor="smart-scheduling-switch" className="text-sm font-medium">
                    Smart Scheduling
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Suggest better times based on your performance patterns
                  </p>
                </div>
                <Switch
                  id="smart-scheduling-switch"
                  checked={settings.smartScheduling}
                  onCheckedChange={(checked) => updateSettings({ smartScheduling: checked })}
                  aria-label="Smart Scheduling"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Self-Discovery Profile Link */}
      <Card className="mb-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/self-discovery')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" aria-hidden="true" />
            My Self-Discovery Profile
          </CardTitle>
          <CardDescription>
            Symptom checklist, personal history, and visual processing results.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Research & Experiments */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-info" aria-hidden="true" />
            Research &amp; Experiments
          </CardTitle>
          <CardDescription>
            Help improve Discalculas by participating in experiments. Your data stays on your
            device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between min-h-[44px]">
            <label htmlFor="research-mode-switch" className="text-sm font-medium">
              Enable Research Mode
            </label>
            <Switch
              id="research-mode-switch"
              checked={settings.researchModeEnabled}
              onCheckedChange={handleResearchToggle}
              aria-label="Enable Research Mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Informed Consent Dialog */}
      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent
          data-testid="research-consent-dialog"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>About Research Mode</DialogTitle>
            <DialogDescription>
              You&apos;ll see experimental features that help us test improvements. All data stays
              on your device. You can disable this anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              Cancel
            </Button>
            <Button data-testid="confirm-research-mode" onClick={handleConsentConfirm}>
              Enable Research Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
