// SelfDiscoveryHub — Hub page with cards for self-discovery tools
// Symptoms Checklist, Personal History, Colored Dots Test, Summary

import { useState, useEffect } from 'react';
import { ClipboardCheck, FileText, Eye, BarChart3, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';
import SymptomChecklist from './SymptomChecklist';
import SymptomResults from './SymptomResults';
import PersonalHistoryForm from './PersonalHistoryForm';
import ColoredDotsTest from './ColoredDotsTest';
import SelfDiscoverySummary from './SelfDiscoverySummary';
import type { SymptomChecklistEntry, PersonalHistory } from '../types';

type ActiveView = 'hub' | 'checklist' | 'checklist-results' | 'history' | 'colored-dots' | 'summary';

export default function SelfDiscoveryHub() {
  const [activeView, setActiveView] = useState<ActiveView>('hub');
  const [latestChecklist, setLatestChecklist] = useState<SymptomChecklistEntry | null>(null);
  const [latestHistory, setLatestHistory] = useState<PersonalHistory | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const checklist = await db.symptom_checklists.orderBy('timestamp').reverse().first();
      setLatestChecklist(checklist ?? null);

      const history = await db.personal_history.orderBy('timestamp').reverse().first();
      setLatestHistory(history ?? null);
    }
    loadStatus();
  }, [activeView]);

  const handleChecklistComplete = () => {
    setActiveView('checklist-results');
  };

  const handleBack = () => {
    setActiveView('hub');
  };

  if (activeView === 'checklist') {
    return <SymptomChecklist onComplete={handleChecklistComplete} onBack={handleBack} />;
  }

  if (activeView === 'checklist-results') {
    return (
      <SymptomResults
        onRetake={() => setActiveView('checklist')}
        onBack={handleBack}
      />
    );
  }

  if (activeView === 'history') {
    return <PersonalHistoryForm onBack={handleBack} />;
  }

  if (activeView === 'colored-dots') {
    return <ColoredDotsTest onBack={handleBack} />;
  }

  if (activeView === 'summary') {
    return <SelfDiscoverySummary onBack={handleBack} />;
  }

  // Hub view
  const checklistStatus = latestChecklist ? 'Completed' : 'Not started';
  const historyStatus = latestHistory
    ? latestHistory.completionStatus === 'completed' ? 'Completed' : 'In progress'
    : 'Not started';

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Self-Discovery</h1>
        </div>
        <p className="text-base text-muted-foreground">
          Understand your unique number processing patterns
        </p>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
        All data stays 100% on your device. This is a personal tool for self-understanding, not clinical diagnosis.
      </div>

      <div className="grid gap-3">
        {/* Symptoms Checklist */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Symptoms Checklist</CardTitle>
            </div>
            <CardDescription>
              22 real-world symptoms mapped to your training domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{checklistStatus}</span>
              <Button
                onClick={() => setActiveView('checklist')}
                variant="default"
                className="min-h-[44px]"
              >
                {latestChecklist ? 'Retake' : 'Start'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal History */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Personal History</CardTitle>
            </div>
            <CardDescription>
              13-section developmental, medical, and academic questionnaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{historyStatus}</span>
              <Button
                onClick={() => setActiveView('history')}
                variant="default"
                className="min-h-[44px]"
              >
                {latestHistory ? 'Continue' : 'Start'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Colored Dots Test */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Colored Dots Test</CardTitle>
            </div>
            <CardDescription>
              Visual processing test for subitizing and selective attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setActiveView('colored-dots')}
              variant="default"
              className="w-full min-h-[44px]"
            >
              Take Test
            </Button>
          </CardContent>
        </Card>

        {/* Summary / Combined Insights */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <CardTitle className="text-lg">Summary &amp; Insights</CardTitle>
            </div>
            <CardDescription>
              Combined view of all your self-discovery results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setActiveView('summary')}
              variant="outline"
              className="w-full min-h-[44px]"
              disabled={!latestChecklist && !latestHistory}
            >
              View Insights
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
