// WhatsMyRuleGame — Abstract pattern recognition
// Given input→output pairs, discover the hidden rule and predict the next output.
// Builds abstract reasoning: the missing connection between concrete numbers and algebra.

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { db } from '@/services/storage/db';

interface GameProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'setup' | 'playing' | 'results';
type AnswerState = 'idle' | 'correct' | 'wrong';

interface Rule {
  /** Human-readable description shown after the player answers */
  name: string;
  /** Transform an input number to its output */
  apply: (n: number) => number;
  difficulty: Difficulty;
}

interface Example {
  input: number;
  output: number;
}

interface Round {
  rule: Rule;
  examples: Example[];
  /** The hidden input whose output the player must predict */
  targetInput: number;
  /** Correct answer */
  targetOutput: number;
  /** Four multiple-choice options including the correct answer */
  choices: number[];
  /** Four rule-name options including the correct rule */
  ruleChoices: string[];
}

interface RoundResult {
  isCorrect: boolean;
  ruleCorrect: boolean;
  outputCorrect: boolean;
  timeMs: number;
}

// ---------------------------------------------------------------------------
// Rule banks
// ---------------------------------------------------------------------------

const EASY_RULES: Rule[] = [
  { name: 'add 2', apply: n => n + 2, difficulty: 'easy' },
  { name: 'add 3', apply: n => n + 3, difficulty: 'easy' },
  { name: 'add 4', apply: n => n + 4, difficulty: 'easy' },
  { name: 'add 5', apply: n => n + 5, difficulty: 'easy' },
  { name: 'add 7', apply: n => n + 7, difficulty: 'easy' },
  { name: 'add 10', apply: n => n + 10, difficulty: 'easy' },
  { name: 'subtract 2', apply: n => n - 2, difficulty: 'easy' },
  { name: 'subtract 3', apply: n => n - 3, difficulty: 'easy' },
  { name: 'multiply by 2', apply: n => n * 2, difficulty: 'easy' },
  { name: 'multiply by 3', apply: n => n * 3, difficulty: 'easy' },
];

const MEDIUM_RULES: Rule[] = [
  { name: 'multiply by 2, then add 1', apply: n => n * 2 + 1, difficulty: 'medium' },
  { name: 'multiply by 2, then add 3', apply: n => n * 2 + 3, difficulty: 'medium' },
  { name: 'multiply by 3, then subtract 1', apply: n => n * 3 - 1, difficulty: 'medium' },
  { name: 'multiply by 3, then add 2', apply: n => n * 3 + 2, difficulty: 'medium' },
  { name: 'add 5, then multiply by 2', apply: n => (n + 5) * 2, difficulty: 'medium' },
  { name: 'add 3, then multiply by 3', apply: n => (n + 3) * 3, difficulty: 'medium' },
  { name: 'multiply by 4, then subtract 2', apply: n => n * 4 - 2, difficulty: 'medium' },
  { name: 'multiply by 2, then subtract 1', apply: n => n * 2 - 1, difficulty: 'medium' },
];

const HARD_RULES: Rule[] = [
  { name: 'square the number (n²)', apply: n => n * n, difficulty: 'hard' },
  { name: 'square, then subtract 1 (n²−1)', apply: n => n * n - 1, difficulty: 'hard' },
  { name: 'square, then add 2 (n²+2)', apply: n => n * n + 2, difficulty: 'hard' },
  { name: 'square, then multiply by 2 (2n²)', apply: n => 2 * n * n, difficulty: 'hard' },
  { name: 'multiply by 5, then add 3', apply: n => n * 5 + 3, difficulty: 'hard' },
  { name: 'multiply by 4, then add 7', apply: n => n * 4 + 7, difficulty: 'hard' },
  { name: 'add 4, then multiply by 4', apply: n => (n + 4) * 4, difficulty: 'hard' },
  { name: 'multiply by 3, then add 10', apply: n => n * 3 + 10, difficulty: 'hard' },
];

const RULES_BY_DIFFICULTY: Record<Difficulty, Rule[]> = {
  easy: EASY_RULES,
  medium: MEDIUM_RULES,
  hard: HARD_RULES,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shuffle an array in-place using Fisher-Yates. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random rule for the difficulty level.
 */
function pickRule(difficulty: Difficulty): Rule {
  const pool = RULES_BY_DIFFICULTY[difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate distinct, small input values to use as example pairs.
 * Easy/medium: 3 examples + 1 target (4 inputs total).
 * Hard: 4 examples + 1 target (5 inputs total).
 */
function generateExampleInputs(difficulty: Difficulty): number[] {
  const count = difficulty === 'hard' ? 5 : 4;
  // Use small, visually friendly inputs to avoid very large outputs.
  const maxInput = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 8 : 7;
  const pool = Array.from({ length: maxInput }, (_, i) => i + 1);
  return shuffle(pool).slice(0, count);
}

/**
 * Generate 4 rule-name choices (including the correct one) as distractors.
 */
function generateRuleChoices(correctRule: Rule, difficulty: Difficulty): string[] {
  // Pull all rules from the same difficulty + adjacent difficulties for better distractors
  const allRules = [
    ...RULES_BY_DIFFICULTY[difficulty],
    ...(difficulty === 'easy' ? MEDIUM_RULES.slice(0, 3) : []),
    ...(difficulty === 'medium' ? [...EASY_RULES.slice(0, 2), ...HARD_RULES.slice(0, 2)] : []),
    ...(difficulty === 'hard' ? MEDIUM_RULES.slice(0, 3) : []),
  ];

  const distractorNames = new Set<string>();
  const shuffledRules = shuffle([...allRules]);
  for (const r of shuffledRules) {
    if (r.name !== correctRule.name && !distractorNames.has(r.name)) {
      distractorNames.add(r.name);
      if (distractorNames.size >= 3) break;
    }
  }

  return shuffle([correctRule.name, ...Array.from(distractorNames)]);
}

/**
 * Build a complete Round object for one game question.
 */
function generateRound(difficulty: Difficulty): Round {
  const rule = pickRule(difficulty);
  const exampleCount = difficulty === 'hard' ? 4 : 3;
  const inputs = generateExampleInputs(difficulty);
  const examples: Example[] = inputs.slice(0, exampleCount).map(input => ({
    input,
    output: rule.apply(input),
  }));
  const targetInput = inputs[exampleCount];
  const targetOutput = rule.apply(targetInput);
  const choices = generateDistractors(targetOutput, rule, difficulty, targetInput);
  const ruleChoices = generateRuleChoices(rule, difficulty);

  return { rule, examples, targetInput, targetOutput, choices, ruleChoices };
}

/**
 * Generate four answer choices that include the correct answer.
 * Distractors come from applying plausible-but-wrong rules to the target input,
 * and from nearby integers, so the player cannot guess purely by proximity.
 */
export function generateDistractors(
  correctAnswer: number,
  _rule: Rule,
  _difficulty: Difficulty,
  targetInput: number,
): number[] {
  const wrong = new Set<number>();

  // Distractor 1: apply a simpler rule to the same input
  const simpleAlternatives = [
    targetInput * 2,
    targetInput * 3,
    targetInput + 5,
    targetInput * 2 + 5,
    targetInput * 4,
    targetInput + 10,
  ];
  for (const v of simpleAlternatives) {
    if (v !== correctAnswer && v > 0) {
      wrong.add(v);
      break;
    }
  }

  // Distractor 2: off-by-one or off-by-two from correct
  const offByAmounts = [1, 2, 3, 4, 5];
  for (const delta of offByAmounts) {
    const candidate = correctAnswer + (Math.random() < 0.5 ? delta : -delta);
    if (candidate !== correctAnswer && candidate > 0 && !wrong.has(candidate)) {
      wrong.add(candidate);
      break;
    }
  }

  // Distractor 3: apply easy +N rule (different constant)
  const addOpts = [correctAnswer + 3, correctAnswer - 3, correctAnswer + 7, correctAnswer - 7];
  for (const v of addOpts) {
    if (v !== correctAnswer && v > 0 && !wrong.has(v)) {
      wrong.add(v);
      break;
    }
  }

  // Pad with incrementing integers if we still need more distractors
  let pad = correctAnswer + 8;
  while (wrong.size < 3) {
    if (!wrong.has(pad) && pad !== correctAnswer) wrong.add(pad);
    pad++;
  }

  // Combine and shuffle
  const all = shuffle([correctAnswer, ...Array.from(wrong).slice(0, 3)]);
  return all;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_ROUNDS = 10;
const BASE_POINTS = 100;
const BONUS_POINTS = 50;
/** Milliseconds within which a correct answer earns the speed bonus */
const BONUS_TIME_MS = 8000;
/** Auto-advance delay after feedback (ms) */
const FEEDBACK_DURATION_MS = 2000;

// ---------------------------------------------------------------------------
// Difficulty descriptions
// ---------------------------------------------------------------------------

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Single operation rules (+n, −n, ×2, ×3)',
  medium: 'Two-step rules (×n+c, (n+a)×b)',
  hard: 'Complex rules (n², ×n+m with large numbers)',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
}

function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <div className="space-y-3 mb-6" role="group" aria-label="Select difficulty">
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`w-full p-4 rounded-lg border text-left min-h-[44px] transition-colors capitalize ${
            selected === d
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
          aria-pressed={selected === d}
        >
          <div className="font-medium capitalize">{d}</div>
          <div className="text-xs text-muted-foreground">{DIFFICULTY_DESCRIPTIONS[d]}</div>
        </button>
      ))}
    </div>
  );
}

/** The function-machine table showing IN → OUT pairs. */
interface ExamplesTableProps {
  examples: Example[];
  targetInput: number;
  answerState: AnswerState;
  targetOutput: number;
}

function ExamplesTable({ examples, targetInput, answerState, targetOutput }: ExamplesTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden mb-6" data-testid="examples-table">
      {/* Column headers */}
      <div className="grid grid-cols-3 bg-muted/50 border-b border-border text-sm font-semibold">
        <div className="px-4 py-2 text-center">IN</div>
        <div className="px-4 py-2 text-center text-muted-foreground">→</div>
        <div className="px-4 py-2 text-center">OUT</div>
      </div>

      {/* Example rows */}
      {examples.map((ex, i) => (
        <div
          key={i}
          className="grid grid-cols-3 border-b border-border/50 text-base"
        >
          <div className="px-4 py-3 text-center font-mono font-semibold">{ex.input}</div>
          <div className="px-4 py-3 text-center text-muted-foreground">→</div>
          <div className="px-4 py-3 text-center font-mono font-semibold">{ex.output}</div>
        </div>
      ))}

      {/* Target row */}
      <div
        className="grid grid-cols-3 text-base bg-primary/5"
        aria-label={`Predict the output for input ${targetInput}`}
      >
        <div className="px-4 py-3 text-center font-mono font-bold text-primary">
          {targetInput}
        </div>
        <div className="px-4 py-3 text-center text-muted-foreground">→</div>
        <div className="px-4 py-3 text-center font-mono font-bold text-primary">
          {answerState !== 'idle' ? (
            <span className={answerState === 'correct' ? 'text-green-500' : 'text-red-500'}>
              {targetOutput}
            </span>
          ) : (
            <span className="text-2xl">?</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WhatsMyRuleGame({ onBack }: GameProps) {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Per-round state
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  // Refs to avoid stale closures when auto-submitting on second selection
  const selectedAnswerRef = useRef<number | null>(null);
  const selectedRuleRef = useRef<string | null>(null);

  // Accumulated results
  const [results, setResults] = useState<RoundResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  // Timing
  const roundStartRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  // Timer ref for cleanup
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Game flow
  // -------------------------------------------------------------------------

  const loadRound = useCallback((diff: Difficulty) => {
    const newRound = generateRound(diff);
    setRound(newRound);
    setAnswerState('idle');
    setSelectedAnswer(null);
    setSelectedRule(null);
    selectedAnswerRef.current = null;
    selectedRuleRef.current = null;
    roundStartRef.current = Date.now();
  }, []);

  const startGame = useCallback(() => {
    setResults([]);
    setTotalScore(0);

    setRoundIndex(0);
    gameStartRef.current = Date.now();
    setPhase('playing');
  }, []);

  // Load a new round whenever we enter 'playing' or the roundIndex changes.
  useEffect(() => {
    if (phase === 'playing') {
      loadRound(difficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex]);

  /** Submit both answers (rule + output). Called when both are selected. */
  const handleSubmit = useCallback(
    (chosenOutput: number, chosenRule: string) => {
      if (!round || answerState !== 'idle') return;

      const timeMs = Date.now() - roundStartRef.current;
      const outputCorrect = chosenOutput === round.targetOutput;
      const ruleCorrect = chosenRule === round.rule.name;
      // "Correct" overall if either the rule or output is right
      const isCorrect = outputCorrect || ruleCorrect;

      setAnswerState(outputCorrect ? 'correct' : 'wrong');

      // Scoring: full points for both, half for either one alone
      let points = 0;
      if (outputCorrect && ruleCorrect) {
        points = BASE_POINTS + (timeMs <= BONUS_TIME_MS ? BONUS_POINTS : 0);
      } else if (outputCorrect || ruleCorrect) {
        points = Math.round(BASE_POINTS / 2);
      }

      setResults(prev => [...prev, { isCorrect, ruleCorrect, outputCorrect, timeMs }]);
      setTotalScore(prev => prev + points);

      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        const nextRound = roundIndex + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          setPhase('results');
        } else {
          setRoundIndex(nextRound);
        }
      }, FEEDBACK_DURATION_MS);
    },
    [round, answerState, roundIndex],
  );

  /** When both selections are made, auto-submit */
  const handleOutputChoice = useCallback(
    (choice: number) => {
      if (answerState !== 'idle') return;
      setSelectedAnswer(choice);
      selectedAnswerRef.current = choice;
      if (selectedRuleRef.current !== null) {
        handleSubmit(choice, selectedRuleRef.current);
      }
    },
    [answerState, handleSubmit],
  );

  const handleRuleChoice = useCallback(
    (ruleName: string) => {
      if (answerState !== 'idle') return;
      setSelectedRule(ruleName);
      selectedRuleRef.current = ruleName;
      if (selectedAnswerRef.current !== null) {
        handleSubmit(selectedAnswerRef.current, ruleName);
      }
    },
    [answerState, handleSubmit],
  );

  /** Persist results to Dexie. */
  const persistResults = useCallback(
    async (allResults: RoundResult[], diff: Difficulty, duration: number) => {
      const correctCount = allResults.filter(r => r.isCorrect).length;
      const accuracy = Math.round((correctCount / allResults.length) * 100);
      const avgTime = Math.round(
        allResults.reduce((s, r) => s + r.timeMs, 0) / allResults.length,
      );
      try {
        const sessionId = await db.sessions.add({
          timestamp: new Date().toISOString(),
          module: 'cognition',
          duration,
          completionStatus: 'completed',
        });
        await db.drill_results.add({
          sessionId,
          timestamp: new Date().toISOString(),
          module: 'whats_my_rule',
          difficulty: diff,
          isCorrect: accuracy >= 70,
          timeToAnswer: avgTime,
          accuracy,
        });
      } catch (e) {
        console.error('Failed to log whats my rule results:', e);
      }
    },
    [],
  );

  // Persist once when results screen appears
  useEffect(() => {
    if (phase === 'results' && results.length > 0) {
      const duration = Date.now() - gameStartRef.current;
      persistResults(results, difficulty, duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handlePlayAgain = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setPhase('setup');
    setRoundIndex(0);
    setResults([]);
    setTotalScore(0);

    setRound(null);
    setAnswerState('idle');
    setSelectedAnswer(null);
    setSelectedRule(null);
    selectedAnswerRef.current = null;
    selectedRuleRef.current = null;
  }, []);

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------

  const correctCount = results.filter(r => r.isCorrect).length;
  const outputCorrectCount = results.filter(r => r.outputCorrect).length;
  const ruleCorrectCount = results.filter(r => r.ruleCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgTimeS =
    results.length > 0
      ? (results.reduce((s, r) => s + r.timeMs, 0) / results.length / 1000).toFixed(1)
      : '0.0';

  // -------------------------------------------------------------------------
  // Render: Setup
  // -------------------------------------------------------------------------

  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-2 -ml-2 min-h-[44px]"
          aria-label="Back to games"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to games
        </Button>

        <h1 className="text-2xl font-bold mb-1">What's My Rule?</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Study the input→output pairs and discover the hidden rule. Predict the final output.{' '}
          {TOTAL_ROUNDS} rounds, max {TOTAL_ROUNDS * (BASE_POINTS + BONUS_POINTS)} points.
        </p>

        <DifficultySelector selected={difficulty} onChange={setDifficulty} />

        <Button onClick={startGame} className="w-full min-h-[48px] text-base font-bold">
          Start Game
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Results
  // -------------------------------------------------------------------------

  if (phase === 'results') {
    let encouragement: string;
    if (accuracy === 100) encouragement = 'Perfect pattern recognition!';
    else if (ruleCorrectCount >= 7 && outputCorrectCount < 5)
      encouragement = 'You see the patterns! Focus on computing the output now.';
    else if (accuracy >= 70) encouragement = 'Well done! Patterns are getting clearer.';
    else encouragement = 'Pattern spotting improves with practice. Try again!';

    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-4">Game Complete!</h2>
        <p className="text-center text-muted-foreground mb-6">{encouragement}</p>

        <div className="rounded-lg border border-border bg-card p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Score:</span>
            <span className="font-semibold">{totalScore}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Rules Identified:</span>
            <span className="font-semibold">
              {ruleCorrectCount}/{TOTAL_ROUNDS}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Outputs Correct:</span>
            <span className="font-semibold">
              {outputCorrectCount}/{TOTAL_ROUNDS}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Accuracy:</span>
            <span className="font-semibold">{accuracy}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Avg Response:</span>
            <span className="font-semibold">{avgTimeS}s</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Difficulty:</span>
            <span className="font-semibold capitalize">{difficulty}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePlayAgain}
            className="flex-1 min-h-[44px]"
          >
            Play Again
          </Button>
          <Button onClick={onBack} className="flex-1 min-h-[44px]">
            Back to games
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Playing
  // -------------------------------------------------------------------------

  if (!round) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="min-h-[44px] -ml-2"
          aria-label="Back to games"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">
          Round {roundIndex + 1}/{TOTAL_ROUNDS}
        </p>
        <p className="text-sm font-semibold">{totalScore} pts</p>
      </div>

      {/* Title prompt */}
      <h2 className="text-xl font-bold text-center mb-1">What's My Rule?</h2>
      <p className="text-sm text-center text-muted-foreground mb-4">
        Study the pattern. Pick the rule AND the output — answer both!
      </p>

      {/* Examples + target table */}
      <ExamplesTable
        examples={round.examples}
        targetInput={round.targetInput}
        answerState={answerState}
        targetOutput={round.targetOutput}
      />

      {/* Feedback banner */}
      <div
        className="min-h-[28px] text-center text-sm font-semibold mb-4"
        aria-live="assertive"
        aria-atomic="true"
      >
        {answerState !== 'idle' && selectedAnswer !== null && selectedRule !== null && (
          <>
            {selectedRule === round.rule.name && selectedAnswer === round.targetOutput && (
              <span className="text-green-500" data-testid="feedback-both-correct">
                Both correct! Rule: {round.rule.name}
              </span>
            )}
            {selectedRule === round.rule.name && selectedAnswer !== round.targetOutput && (
              <span className="text-yellow-500" data-testid="feedback-rule-only">
                Rule correct! But the output was {round.targetOutput} ({round.rule.name})
              </span>
            )}
            {selectedRule !== round.rule.name && selectedAnswer === round.targetOutput && (
              <span className="text-yellow-500" data-testid="feedback-output-only">
                Output correct! But the rule was: {round.rule.name}
              </span>
            )}
            {selectedRule !== round.rule.name && selectedAnswer !== round.targetOutput && (
              <span className="text-red-500" data-testid="feedback-both-wrong">
                Not quite — the rule is: {round.rule.name} (answer: {round.targetOutput})
              </span>
            )}
          </>
        )}
      </div>

      {/* Rule selection */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 text-center">
          1. What is the rule?
        </p>
        <div
          className="grid grid-cols-1 gap-2"
          role="group"
          aria-label="Choose the rule"
          data-testid="rule-choices"
        >
          {round.ruleChoices.map(ruleName => {
            const isSelected = selectedRule === ruleName;
            let extraClass = '';

            if (answerState !== 'idle') {
              if (ruleName === round.rule.name) {
                extraClass = 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
              } else if (ruleName === selectedRule) {
                extraClass = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
              }
            } else if (isSelected) {
              extraClass = 'border-primary bg-primary/10';
            }

            return (
              <button
                key={ruleName}
                onClick={() => handleRuleChoice(ruleName)}
                disabled={answerState !== 'idle'}
                className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium text-left transition-colors
                  ${answerState === 'idle' && !isSelected ? 'border-border hover:border-primary/50 hover:bg-primary/5' : ''}
                  ${extraClass}
                  disabled:cursor-default
                `}
                aria-label={`Rule: ${ruleName}`}
                data-testid={`rule-choice-${ruleName}`}
              >
                {ruleName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Output selection */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 text-center">
          2. What is the output?
        </p>
        <div
          className="grid grid-cols-2 gap-3"
          role="group"
          aria-label="Choose the output"
          data-testid="output-choices"
        >
          {round.choices.map(choice => {
            const isSelected = selectedAnswer === choice;
            let extraClass = '';

            if (answerState !== 'idle') {
              if (choice === round.targetOutput) {
                extraClass = 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
              } else if (choice === selectedAnswer) {
                extraClass = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
              }
            } else if (isSelected) {
              extraClass = 'border-primary bg-primary/10';
            }

            return (
              <button
                key={choice}
                onClick={() => handleOutputChoice(choice)}
                disabled={answerState !== 'idle'}
                className={`min-h-[56px] rounded-lg border text-lg font-bold transition-colors
                  ${answerState === 'idle' && !isSelected ? 'border-border hover:border-primary/50 hover:bg-primary/5' : ''}
                  ${extraClass}
                  disabled:cursor-default
                `}
                aria-label={`Answer ${choice}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
