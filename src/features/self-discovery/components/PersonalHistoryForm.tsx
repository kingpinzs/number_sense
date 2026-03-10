// PersonalHistoryForm — Multi-step wizard for 13-section personal history intake
// Save-as-you-go with debounced auto-save, resume from last incomplete section

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import IntakeSection from './IntakeSection';
import { INTAKE_SECTIONS } from '../content/intakeSections';
import {
  getLatestPersonalHistory,
  createPersonalHistory,
  updateHistorySection,
  completePersonalHistory,
} from '../services/historyStorage';
import type { HistorySectionData } from '../types';

interface PersonalHistoryFormProps {
  onBack: () => void;
}

export default function PersonalHistoryForm({ onBack }: PersonalHistoryFormProps) {
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sections, setSections] = useState<Record<string, HistorySectionData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing history or create new one
  useEffect(() => {
    async function init() {
      const existing = await getLatestPersonalHistory();
      if (existing?.id && existing.completionStatus === 'in-progress') {
        setHistoryId(existing.id);
        setSections(existing.sections);

        // Resume from first incomplete section
        const firstIncomplete = INTAKE_SECTIONS.findIndex(
          s => !existing.sections[s.id]?.completed
        );
        setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : 0);
      } else {
        const newId = await createPersonalHistory();
        setHistoryId(newId);
      }
      setLoading(false);
    }
    init();
  }, []);

  // Get current section data
  const currentSectionDef = INTAKE_SECTIONS[currentStep];
  const currentData: HistorySectionData = sections[currentSectionDef?.id] ?? {
    completed: false,
    data: {},
  };

  // Debounced auto-save (2s)
  const scheduleSave = useCallback((sectionId: string, data: HistorySectionData) => {
    if (!historyId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await updateHistorySection(historyId, sectionId, data);
    }, 2000);
  }, [historyId]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleSectionChange = (data: HistorySectionData) => {
    const sectionId = currentSectionDef.id;
    setSections(prev => ({ ...prev, [sectionId]: data }));
    scheduleSave(sectionId, data);
  };

  const saveCurrentSection = async (markComplete: boolean) => {
    if (!historyId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const sectionId = currentSectionDef.id;
    const data = { ...currentData, completed: markComplete };
    setSections(prev => ({ ...prev, [sectionId]: data }));
    await updateHistorySection(historyId, sectionId, data);
  };

  const handleNext = async () => {
    await saveCurrentSection(true);
    if (currentStep < INTAKE_SECTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!historyId) return;
    setSaving(true);
    await saveCurrentSection(true);
    await completePersonalHistory(historyId);
    setSaving(false);
    onBack();
  };

  const handleSaveAndExit = async () => {
    setSaving(true);
    await saveCurrentSection(false);
    setSaving(false);
    onBack();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const progressPercent = ((currentStep + 1) / INTAKE_SECTIONS.length) * 100;
  const isLastStep = currentStep === INTAKE_SECTIONS.length - 1;

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={handleSaveAndExit}
          className="mb-2 -ml-2 min-h-[44px]"
          aria-label="Save and return to self-discovery"
          disabled={saving}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Save &amp; Continue Later
        </Button>
        <h1 className="text-2xl font-bold">Personal History</h1>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Section {currentStep + 1} of {INTAKE_SECTIONS.length}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Privacy notice */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-4">
        This data stays 100% on your device.
      </div>

      {/* Current Section */}
      <IntakeSection
        section={currentSectionDef}
        data={currentData}
        onChange={handleSectionChange}
      />

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex-1" />

        {isLastStep ? (
          <Button
            onClick={handleComplete}
            disabled={saving}
            className="min-h-[48px] font-bold"
          >
            <Check className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Complete'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="min-h-[44px]"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Save indicator */}
      {!isLastStep && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={handleSaveAndExit}
            disabled={saving}
            className="text-xs text-muted-foreground min-h-[44px]"
          >
            <Save className="w-3 h-3 mr-1" />
            Save &amp; Continue Later
          </Button>
        </div>
      )}
    </div>
  );
}
