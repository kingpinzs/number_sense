// SelfDiscoverySummary — Combined insights from all self-discovery tools
// Shows symptom domain impact, history completion, and colored dots performance

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { db } from '@/services/storage/db';
import type { SymptomChecklistEntry, PersonalHistory, Domain } from '../types';

interface SelfDiscoverySummaryProps {
  onBack: () => void;
}

const DOMAIN_LABELS: Record<Domain, string> = {
  numberSense: 'Number Sense',
  placeValue: 'Place Value',
  sequencing: 'Sequencing',
  arithmetic: 'Arithmetic',
  spatial: 'Spatial',
  applied: 'Applied Math',
};

const DOMAIN_ORDER: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];

export default function SelfDiscoverySummary({ onBack }: SelfDiscoverySummaryProps) {
  const [checklist, setChecklist] = useState<SymptomChecklistEntry | null>(null);
  const [history, setHistory] = useState<PersonalHistory | null>(null);
  const [dotsAccuracy, setDotsAccuracy] = useState<number | null>(null);
  const [dotsCount, setDotsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const latestChecklist = await db.symptom_checklists.orderBy('timestamp').reverse().first();
      setChecklist(latestChecklist ?? null);

      const latestHistory = await db.personal_history.orderBy('timestamp').reverse().first();
      setHistory(latestHistory ?? null);

      // Get colored dots game results
      const dotsResults = await db.drill_results
        .where('module')
        .equals('colored_dots')
        .toArray();
      setDotsCount(dotsResults.length);
      if (dotsResults.length > 0) {
        const avgAcc = dotsResults.reduce((s, r) => s + r.accuracy, 0) / dotsResults.length;
        setDotsAccuracy(Math.round(avgAcc));
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const hasData = checklist || history || dotsCount > 0;

  const sortedDomains = checklist
    ? [...DOMAIN_ORDER].sort((a, b) => checklist.domainImpact[b] - checklist.domainImpact[a])
    : DOMAIN_ORDER;
  const maxImpact = checklist ? Math.max(...Object.values(checklist.domainImpact)) : 0;
  const topDomains = checklist
    ? sortedDomains.filter(d => checklist.domainImpact[d] > 0.2).slice(0, 3)
    : [];

  const historySections = history ? Object.values(history.sections) : [];
  const completedSections = historySections.filter(s => s.completed).length;

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-2 -ml-2 min-h-[44px]"
        aria-label="Back to self-discovery"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <h1 className="text-2xl font-bold mb-4">Self-Discovery Summary</h1>

      {!hasData && (
        <p className="text-muted-foreground text-center py-8">
          Complete at least one tool to see your summary.
        </p>
      )}

      {/* Domain Impact from Symptoms */}
      {checklist && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Symptom Domain Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {sortedDomains.map(domain => {
                const impact = checklist.domainImpact[domain];
                const widthPercent = maxImpact > 0 ? (impact / maxImpact) * 100 : 0;
                return (
                  <div key={domain}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span>{DOMAIN_LABELS[domain]}</span>
                      <span className="text-muted-foreground">{Math.round(impact * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {topDomains.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Focus areas: {topDomains.map(d => DOMAIN_LABELS[d]).join(', ')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personal History Status */}
      {history && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Personal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-1">
              <span>Status:</span>
              <span className="font-medium capitalize">{history.completionStatus}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Sections completed:</span>
              <span className="font-medium">{completedSections}/13</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colored Dots Performance */}
      {dotsCount > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Colored Dots Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-1">
              <span>Games played:</span>
              <span className="font-medium">{dotsCount}</span>
            </div>
            {dotsAccuracy !== null && (
              <div className="flex justify-between text-sm">
                <span>Average accuracy:</span>
                <span className="font-medium">{dotsAccuracy}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guidance */}
      {topDomains.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Based on your responses, these areas may benefit from focused practice:{' '}
              <span className="font-medium text-foreground">
                {topDomains.map(d => DOMAIN_LABELS[d]).join(', ')}
              </span>.
              Your training drills are already weighted to prioritize these domains.
            </p>
          </CardContent>
        </Card>
      )}

      <Button onClick={onBack} className="w-full min-h-[44px] mt-4">
        Done
      </Button>
    </div>
  );
}
