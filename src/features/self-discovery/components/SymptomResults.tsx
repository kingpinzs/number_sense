// SymptomResults — Domain impact visualization from symptom checklist
// Shows bar chart of domain impact + contextual guidance

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getLatestSymptomChecklist } from '../services/symptomStorage';
import type { SymptomChecklistEntry, Domain } from '../types';

interface SymptomResultsProps {
  onRetake: () => void;
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

const DOMAIN_GUIDANCE: Record<Domain, string> = {
  numberSense: 'You may benefit from exercises that build intuitive quantity awareness, like subitizing and number line practice.',
  placeValue: 'Place value exercises can help strengthen your understanding of how digits relate to quantity.',
  sequencing: 'Sequencing drills can improve your ability to see patterns and order in numbers.',
  arithmetic: 'Targeted arithmetic practice at adaptive difficulty may help build calculation confidence.',
  spatial: 'Spatial exercises can strengthen your mental rotation and directional awareness.',
  applied: 'Applied math practice (time, fractions, working memory) connects number skills to daily life.',
};

const DOMAIN_ORDER: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];

export default function SymptomResults({ onRetake, onBack }: SymptomResultsProps) {
  const [checklist, setChecklist] = useState<SymptomChecklistEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const latest = await getLatestSymptomChecklist();
      setChecklist(latest ?? null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-muted-foreground mb-4">No checklist results found.</p>
        <Button onClick={onRetake} className="min-h-[44px]">Take Checklist</Button>
      </div>
    );
  }

  const checkedCount = checklist.symptoms.filter(s => s.checked).length;
  const sortedDomains = [...DOMAIN_ORDER].sort(
    (a, b) => checklist.domainImpact[b] - checklist.domainImpact[a]
  );
  const maxImpact = Math.max(...Object.values(checklist.domainImpact));
  const flaggedDomains = sortedDomains.filter(d => checklist.domainImpact[d] > 0.2);

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-2 -ml-2 min-h-[44px]"
          aria-label="Back to self-discovery"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Your Symptom Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {checkedCount} symptoms identified across {flaggedDomains.length} domains
        </p>
      </div>

      {/* Domain Impact Chart */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Domain Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedDomains.map(domain => {
              const impact = checklist.domainImpact[domain];
              const widthPercent = maxImpact > 0 ? (impact / maxImpact) * 100 : 0;
              return (
                <div key={domain}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{DOMAIN_LABELS[domain]}</span>
                    <span className="text-muted-foreground">{Math.round(impact * 100)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${widthPercent}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(impact * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${DOMAIN_LABELS[domain]}: ${Math.round(impact * 100)}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Guidance for flagged domains */}
      {flaggedDomains.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What This Means</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flaggedDomains.map(domain => (
                <div key={domain} className="text-sm">
                  <span className="font-medium">{DOMAIN_LABELS[domain]}:</span>{' '}
                  <span className="text-muted-foreground">{DOMAIN_GUIDANCE[domain]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes display */}
      {checklist.notes && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{checklist.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onRetake}
          className="flex-1 min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retake
        </Button>
        <Button
          onClick={onBack}
          className="flex-1 min-h-[44px]"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
