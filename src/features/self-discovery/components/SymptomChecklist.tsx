// SymptomChecklist — 22-item dyscalculia symptoms self-assessment
// Grouped by category with severity toggles and notes

import { useState, useCallback } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { saveSymptomChecklist } from '../services/symptomStorage';
import {
  SYMPTOM_DEFINITIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getSymptomsByCategory,
} from '../content/symptomDefinitions';
import type { SymptomResponse, SymptomSeverity, SymptomCategory } from '../types';

interface SymptomChecklistProps {
  onComplete: () => void;
  onBack: () => void;
}

const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
};

export default function SymptomChecklist({ onComplete, onBack }: SymptomChecklistProps) {
  const [responses, setResponses] = useState<Map<string, SymptomResponse>>(() => {
    const map = new Map<string, SymptomResponse>();
    for (const def of SYMPTOM_DEFINITIONS) {
      map.set(def.id, { symptomId: def.id, checked: false });
    }
    return map;
  });
  const [notes, setNotes] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<SymptomCategory>>(
    () => new Set(CATEGORY_ORDER)
  );
  const [saving, setSaving] = useState(false);

  const toggleCategory = useCallback((category: SymptomCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const toggleSymptom = useCallback((symptomId: string) => {
    setResponses(prev => {
      const next = new Map(prev);
      const current = next.get(symptomId)!;
      next.set(symptomId, {
        ...current,
        checked: !current.checked,
        severity: !current.checked ? 1 : undefined,
      });
      return next;
    });
  }, []);

  const setSeverity = useCallback((symptomId: string, severity: SymptomSeverity) => {
    setResponses(prev => {
      const next = new Map(prev);
      const current = next.get(symptomId)!;
      next.set(symptomId, { ...current, severity });
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSymptomChecklist(Array.from(responses.values()), notes || undefined);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const symptomsByCategory = getSymptomsByCategory();
  const checkedCount = Array.from(responses.values()).filter(r => r.checked).length;

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
        <h1 className="text-2xl font-bold">Symptoms Checklist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Check any symptoms you experience. Optionally rate severity.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {checkedCount} of {SYMPTOM_DEFINITIONS.length} items checked
        </p>
      </div>

      {/* Symptom categories */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map(category => {
          const symptoms = symptomsByCategory.get(category) ?? [];
          const isExpanded = expandedCategories.has(category);
          const categoryChecked = symptoms.filter(s => responses.get(s.id)?.checked).length;

          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full min-h-[44px] text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`category-${category}`}
                >
                  <CardTitle className="text-base">
                    {CATEGORY_LABELS[category]}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({categoryChecked}/{symptoms.length})
                    </span>
                  </CardTitle>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>

              {isExpanded && (
                <CardContent id={`category-${category}`}>
                  <div className="space-y-3">
                    {symptoms.map(symptom => {
                      const response = responses.get(symptom.id)!;
                      return (
                        <div key={symptom.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
                            <input
                              type="checkbox"
                              checked={response.checked}
                              onChange={() => toggleSymptom(symptom.id)}
                              className="mt-1 h-5 w-5 rounded border-input accent-primary shrink-0"
                              aria-label={symptom.label}
                            />
                            <span className="text-sm">{symptom.label}</span>
                          </label>

                          {/* Severity toggle — only shown when checked */}
                          {response.checked && (
                            <div className="ml-8 mt-2 flex gap-1" role="radiogroup" aria-label={`Severity for: ${symptom.label}`}>
                              {([1, 2, 3] as SymptomSeverity[]).map(level => (
                                <button
                                  key={level}
                                  onClick={() => setSeverity(symptom.id, level)}
                                  className={`px-3 py-1.5 text-xs rounded-full min-h-[36px] transition-colors ${
                                    response.severity === level
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                                  role="radio"
                                  aria-checked={response.severity === level}
                                  aria-label={SEVERITY_LABELS[level]}
                                >
                                  {SEVERITY_LABELS[level]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label htmlFor="symptom-notes" className="text-sm font-medium block mb-2">
          Additional Notes (optional)
        </label>
        <textarea
          id="symptom-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional context about your experiences..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          rows={3}
        />
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-[48px] text-base font-bold"
        >
          {saving ? 'Saving...' : 'Save Checklist'}
        </Button>
      </div>
    </div>
  );
}
