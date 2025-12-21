import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProbe } from '@/shared/components/theme/ThemeProbe';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Progress } from '@/shared/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/shared/components/ui/sheet';
import { toast } from '@/shared/components/ui/toast';
import { useForm } from 'react-hook-form';
import { UserSettingsProvider } from '@/context/UserSettingsContext';
import { AppProvider } from '@/context/AppContext';
import { SessionProvider } from '@/context/SessionContext';
import AssessmentRoute from '@/routes/AssessmentRoute';
import TrainingRoute from '@/routes/TrainingRoute';
import ProgressRoute from '@/routes/ProgressRoute';
import ProfileRoute from '@/routes/ProfileRoute';

type DesignSystemForm = {
  email: string;
};

const highlights = [
  {
    title: 'Balanced Warmth tokens',
    body: 'Primary coral, mint secondary, and sunny accent colors ship as semantic Tailwind tokens.'
  },
  {
    title: '8px rhythm grid',
    body: 'Spacing utilities map 1-20 → 8px increments for predictable layout composition.'
  },
  {
    title: 'Mobile-first breakpoints',
    body: 'sm:320px, md:768px, lg:1024px align with the UX spec for consistent responsive behavior.'
  }
];

const palette = [
  { name: 'Primary', value: '#E87461', className: 'bg-primary text-primary-foreground' },
  { name: 'Secondary', value: '#A8E6CF', className: 'bg-secondary text-secondary-foreground' },
  { name: 'Accent', value: '#FFD56F', className: 'bg-accent text-accent-foreground' },
  { name: 'Success', value: '#66BB6A', className: 'bg-success text-success-foreground' },
  { name: 'Warning', value: '#FFB74D', className: 'bg-warning text-warning-foreground' },
  { name: 'Error', value: '#EF5350', className: 'bg-error text-error-foreground' }
];

function AppContent() {
  const form = useForm<DesignSystemForm>({
    defaultValues: { email: '' },
    mode: 'onBlur'
  });

  const warmupProgress = useMemo(() => 62, []);

  const handleSubmit = form.handleSubmit(({ email }) => {
    toast(`Saved ${email}`, {
      description: 'Design system notifications will use the Balanced Warmth theme.'
    });
  });

  return (
    <main className="min-h-screen bg-background text-foreground" data-testid="app-shell">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-10 text-balance shadow-2xl shadow-primary/10">
          <p className="text-sm uppercase tracking-[0.3em] text-secondary">Discalculas</p>
          <h1 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl lg:text-5xl">
            Tailwind + shadcn/ui foundation
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Story 1.2 locks in the Balanced Warmth palette, 8px rhythm, and shadcn/ui baseline so future
            UI stories can focus on features instead of plumbing.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={() => toast('Theme ready', { description: 'Primary coral active.' })}>
              Trigger Toast
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="lg">
                  View tokens
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="max-w-md">
                <SheetHeader>
                  <SheetTitle>Balanced Warmth tokens</SheetTitle>
                  <SheetDescription>Semantic Tailwind tokens mapped to UX-approved colors.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 grid gap-3">
                  {palette.map((chip) => (
                    <div
                      key={chip.name}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ${chip.className}`}
                    >
                      <span>{chip.name}</span>
                      <span>{chip.value}</span>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <ThemeProbe />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Warm-up Progress</CardTitle>
              <CardDescription>Progress component renders with theme-aware colors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{warmupProgress}% ready</span>
                <span>100% target</span>
              </div>
              <Progress value={warmupProgress} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Form primitives validate inputs with Inter typography.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: 'Email is required',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification email</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            type="email"
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-base"
                            placeholder="ux-team@discalculas.dev"
                          />
                        </FormControl>
                        <FormDescription>We will send toast alerts for new shadcn/ui drops.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Save contact
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

/**
 * App - Main application component
 * Wraps the app with Context providers in correct order:
 * UserSettingsProvider → AppProvider → SessionProvider → Routes
 *
 * This order ensures:
 * 1. User settings load first (needed by other contexts)
 * 2. App-level state initializes next
 * 3. Session state initializes last
 * 4. Routes are rendered with full context access
 */
function App() {
  return (
    <UserSettingsProvider>
      <AppProvider>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/assessment" element={<AssessmentRoute />} />
            <Route path="/training" element={<TrainingRoute />} />
            <Route path="/progress" element={<ProgressRoute />} />
            <Route path="/profile" element={<ProfileRoute />} />
          </Routes>
        </SessionProvider>
      </AppProvider>
    </UserSettingsProvider>
  );
}

export default App;
