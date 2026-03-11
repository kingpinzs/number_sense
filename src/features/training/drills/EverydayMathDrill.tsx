/**
 * EverydayMathDrill Component
 * Bridges abstract math and real-world situations.
 *
 * Presents scenario-based problems drawn from daily life: counting coins,
 * calculating tips, splitting bills, applying discounts, and unit pricing.
 * Easy: free-form number input. Medium/Hard: 4-option multiple choice.
 *
 * DrillResult module key: 'everyday_math'
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult } from '@/services/storage/schemas';

// ---------------------------------------------------------------------------
// Public interface — must match the DrillProps contract shared across drills
// ---------------------------------------------------------------------------

export interface DrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: number;
  onComplete: (result: DrillResult) => void;
  onSkip?: () => void;
}

// ---------------------------------------------------------------------------
// Problem types and generation
// ---------------------------------------------------------------------------

/** Category drives the emoji icon shown in the scenario card */
type ProblemCategory = 'money' | 'cooking' | 'time' | 'shopping';

const CATEGORY_EMOJI: Record<ProblemCategory, string> = {
  money: '💰',
  cooking: '🍳',
  time: '🕐',
  shopping: '🛒',
};

export interface EverydayProblem {
  /** Narrative context shown above the question */
  scenario: string;
  /** The specific question to solve */
  question: string;
  /** Numeric correct answer (always a finite number) */
  correctAnswer: number;
  /** Display unit appended to the answer ("$", "cents", "cups", "oz") */
  unit: string;
  /** Multiple-choice options (medium/hard only) */
  choices?: number[];
  /** Optional hint text */
  hint?: string;
  /** Visual category for the emoji icon */
  category: ProblemCategory;
}

// ---------------------------------------------------------------------------
// Problem pools per difficulty
// ---------------------------------------------------------------------------

/** Returns a seeded shuffle-safe random integer in [min, max] (inclusive) */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Fisher-Yates shuffle returning a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build 4 multiple-choice options that always include the correct answer.
 * Distractors are offset-based to be plausible but clearly wrong.
 */
function buildChoices(correct: number): number[] {
  const offsets = [
    Math.max(1, Math.round(correct * 0.2)),
    Math.max(2, Math.round(correct * 0.4)),
    Math.max(3, Math.round(correct * 0.6)),
  ];

  const distractors = new Set<number>();
  for (const offset of offsets) {
    if (distractors.size >= 3) break;
    const candidate =
      Math.random() < 0.5
        ? correct + offset
        : Math.max(0, correct - offset);
    if (candidate !== correct) distractors.add(candidate);
  }

  // Fallback: fill remaining slots with small increments
  let counter = 1;
  while (distractors.size < 3) {
    const candidate = correct + counter;
    if (candidate !== correct) distractors.add(candidate);
    counter++;
  }

  const choices = shuffle([correct, ...Array.from(distractors)]).slice(0, 4);
  return choices;
}

// ---- Easy problems (free-form input) -------------------------------------

function generateEasyProblem(): EverydayProblem {
  const variant = randInt(0, 2);

  if (variant === 0) {
    // Counting coins
    const quarters = randInt(1, 4);
    const dimes = randInt(1, 4);
    const answer = quarters * 25 + dimes * 10;
    return {
      category: 'money',
      scenario: `You find some coins in your jacket pocket.`,
      question: `You have ${quarters} quarter${quarters > 1 ? 's' : ''} and ${dimes} dime${dimes > 1 ? 's' : ''}. How much money is that?`,
      correctAnswer: answer,
      unit: 'cents',
      hint: `A quarter is 25 cents, a dime is 10 cents.`,
    };
  }

  if (variant === 1) {
    // Simple 10% tip
    const mealCost = randInt(1, 9) * 10; // $10, $20, ... $90
    const tip = mealCost / 10;
    return {
      category: 'money',
      scenario: `You just finished a meal at a restaurant.`,
      question: `Your meal costs $${mealCost}. What is a 10% tip?`,
      correctAnswer: tip,
      unit: '$',
      hint: `10% means divide the total by 10.`,
    };
  }

  // Making change
  const itemCost = randInt(1, 4) * 100 + randInt(0, 3) * 25; // e.g. 125, 150, 375
  const itemDollars = (itemCost / 100).toFixed(2);
  const payment = Math.ceil(itemCost / 100) * 100; // next whole dollar
  const change = payment - itemCost;
  const paymentDollars = (payment / 100).toFixed(0);
  return {
    category: 'money',
    scenario: `You are at a shop and need to make exact change.`,
    question: `You pay $${paymentDollars} for an item that costs $${itemDollars}. What change do you get?`,
    correctAnswer: Math.round(change / 1), // keep in cents for the answer
    unit: 'cents',
    hint: `Subtract the item cost from what you paid.`,
    // Override unit display in the UI: we store cents, show as cents
  };
}

// ---- Medium problems (multiple choice) ------------------------------------

function generateMediumProblem(): EverydayProblem {
  const variant = randInt(0, 3);

  if (variant === 0) {
    // Splitting bills
    const people = randInt(2, 5);
    const perPerson = randInt(10, 30);
    const total = people * perPerson;
    const answer = perPerson;
    const choices = buildChoices(answer);
    return {
      category: 'money',
      scenario: `You are dining out with friends.`,
      question: `Dinner for ${people} people costs $${total}. How much does each person pay?`,
      correctAnswer: answer,
      unit: '$',
      choices,
      hint: `Divide the total by the number of people.`,
    };
  }

  if (variant === 1) {
    // Recipe scaling
    const originalBatch = randInt(1, 4) * 12; // 12, 24, 36, 48 cookies
    const newBatch = originalBatch * 2;
    const flour = randInt(1, 4);
    const answer = flour * 2;
    const choices = buildChoices(answer);
    return {
      category: 'cooking',
      scenario: `You are baking cookies for a party.`,
      question: `A recipe needs ${flour} cup${flour > 1 ? 's' : ''} of flour for ${originalBatch} cookies. How many cups for ${newBatch} cookies?`,
      correctAnswer: answer,
      unit: 'cups',
      choices,
      hint: `If you double the batch, you double the flour.`,
    };
  }

  if (variant === 2) {
    // Percentage discount
    const originalPrice = randInt(2, 8) * 10; // $20–$80
    const discountPercent = [10, 20, 25, 50][randInt(0, 3)];
    const discount = (originalPrice * discountPercent) / 100;
    const answer = originalPrice - discount;
    const choices = buildChoices(answer);
    return {
      category: 'shopping',
      scenario: `You spot a sale at your favourite store.`,
      question: `A $${originalPrice} shirt is ${discountPercent}% off. What do you pay?`,
      correctAnswer: answer,
      unit: '$',
      choices,
      hint: `Find ${discountPercent}% of $${originalPrice}, then subtract it from the original price.`,
    };
  }

  // Time calculations
  const startHour = randInt(1, 11);
  const startMin = [0, 15, 30, 45][randInt(0, 3)];
  const durationHours = randInt(1, 2);
  const durationMins = [0, 15, 30, 45][randInt(0, 3)];
  const totalMins = startHour * 60 + startMin + durationHours * 60 + durationMins;
  const endHour = Math.floor(totalMins / 60) % 12 || 12;
  const endMin = totalMins % 60;
  // Encode end time as a number: HHMM (e.g. 420 = 4:20)
  const answer = endHour * 100 + endMin;
  const choices = buildChoices(answer);
  const pad = (n: number) => String(n).padStart(2, '0');
  const startAmPm = startHour < 12 ? 'AM' : 'PM';
  return {
    category: 'time',
    scenario: `You are planning your afternoon.`,
    question: `A movie starts at ${startHour}:${pad(startMin)} ${startAmPm} and is ${durationHours}h ${pad(durationMins)}m long. What time does it end? (HHMM, 24h)`,
    correctAnswer: answer,
    unit: '',
    choices,
    hint: `Add ${durationHours} hour${durationHours > 1 ? 's' : ''} and ${durationMins} minutes to the start time.`,
  };
}

// ---- Hard problems (multiple choice) --------------------------------------

function generateHardProblem(): EverydayProblem {
  const variant = randInt(0, 2);

  if (variant === 0) {
    // Unit pricing — which brand is cheaper per oz?
    // Brand A: small pack. Brand B: large pack, but better value.
    const ozA = randInt(8, 14);
    const priceACents = ozA * randInt(28, 35); // ~$0.30/oz
    const ozB = ozA + randInt(4, 8);
    const priceBCents = ozB * randInt(24, 29); // ~$0.27/oz → cheaper
    const perOzACents = Math.round(priceACents / ozA);
    const perOzBCents = Math.round(priceBCents / ozB);
    // Correct answer: 0 = Brand A cheaper, 1 = Brand B cheaper
    // We encode as the lower per-oz price in cents
    const answer = Math.min(perOzACents, perOzBCents);
    const choices = buildChoices(answer);
    const fmtPrice = (c: number) => `$${(c / 100).toFixed(2)}`;
    return {
      category: 'shopping',
      scenario: `You are comparing two breakfast cereals in the supermarket.`,
      question: `Brand A: ${ozA}oz for ${fmtPrice(priceACents)}. Brand B: ${ozB}oz for ${fmtPrice(priceBCents)}. What is the lower price per oz (in cents)?`,
      correctAnswer: answer,
      unit: 'cents/oz',
      choices,
      hint: `Divide each total price by its weight in ounces.`,
    };
  }

  if (variant === 1) {
    // Compound tips — meal + 20% tip total
    const mealDollars = randInt(3, 9) * 10 - 2; // $28, $38, ... $88
    const tip = Math.round(mealDollars * 0.2);
    const answer = mealDollars + tip;
    const choices = buildChoices(answer);
    return {
      category: 'money',
      scenario: `You enjoyed a meal and want to leave a generous tip.`,
      question: `Your meal is $${mealDollars}. You want to leave a 20% tip. What is the total amount you pay?`,
      correctAnswer: answer,
      unit: '$',
      choices,
      hint: `20% tip = meal × 0.2, then add it to the meal cost.`,
    };
  }

  // Budget math — percentage of monthly income
  const income = randInt(2, 5) * 600; // $1200, $1800, $2400, $3000
  const rentPercent = [25, 30, 35, 40][randInt(0, 3)];
  const answer = Math.round((income * rentPercent) / 100);
  const choices = buildChoices(answer);
  return {
    category: 'money',
    scenario: `You are setting up your monthly budget.`,
    question: `You earn $${income}/month. Rent takes up ${rentPercent}% of your income. How much is rent?`,
    correctAnswer: answer,
    unit: '$',
    choices,
    hint: `Multiply your income by ${rentPercent / 100} to find ${rentPercent}%.`,
  };
}

/**
 * Public generator — selects a problem appropriate for the given difficulty.
 */
export function generateEverydayProblem(
  difficulty: 'easy' | 'medium' | 'hard'
): EverydayProblem {
  switch (difficulty) {
    case 'easy':
      return generateEasyProblem();
    case 'medium':
      return generateMediumProblem();
    case 'hard':
      return generateHardProblem();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EverydayMathDrill({
  difficulty,
  sessionId,
  onComplete,
}: DrillProps) {
  const [problem] = useState<EverydayProblem>(() =>
    generateEverydayProblem(difficulty)
  );
  const {
    scenario,
    question,
    correctAnswer,
    unit,
    choices,
    hint,
    category,
  } = problem;

  // Free-form input state (easy)
  const [userInput, setUserInput] = useState('');
  // Track which multiple-choice option was selected (medium/hard)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Clean up timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // Submission logic shared by both input modes
  // ------------------------------------------------------------------

  const commit = async (userAnswer: number) => {
    if (submitted) return;

    const correct = userAnswer === correctAnswer;
    const timeToAnswer = Date.now() - startTime;

    setIsCorrect(correct);
    setSubmitted(true);
    setShowFeedback(true);

    const result: DrillResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      module: 'everyday_math',
      difficulty,
      isCorrect: correct,
      timeToAnswer,
      accuracy: correct ? 100 : 0,
      targetNumber: correctAnswer,
      userAnswer,
      correctAnswer,
    };

    // Persist to Dexie; fall back to localStorage on failure
    try {
      await db.drill_results.add(result);
    } catch (error) {
      console.error('Failed to persist drill result:', error);
      try {
        const backup = localStorage.getItem(STORAGE_KEYS.DRILL_RESULTS_BACKUP);
        const results: DrillResult[] = backup ? JSON.parse(backup) : [];
        results.push(result);
        localStorage.setItem(
          STORAGE_KEYS.DRILL_RESULTS_BACKUP,
          JSON.stringify(results)
        );
      } catch {
        localStorage.setItem(
          STORAGE_KEYS.DRILL_RESULTS_BACKUP,
          JSON.stringify([result])
        );
      }
    }

    feedbackTimerRef.current = setTimeout(() => {
      onComplete(result);
    }, 1500);
  };

  // Easy: free-form submission
  const handleTextSubmit = () => {
    if (submitted || userInput.trim() === '') return;
    const parsed = parseFloat(userInput);
    if (Number.isNaN(parsed)) return;
    commit(parsed);
  };

  // Medium/Hard: multiple-choice selection
  const handleChoiceSelect = (choice: number) => {
    if (submitted) return;
    setSelectedChoice(choice);
    commit(choice);
  };

  // Keyboard support for free-form input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && difficulty === 'easy') {
      handleTextSubmit();
    }
  };

  const emoji = CATEGORY_EMOJI[category];

  // ------------------------------------------------------------------
  // Explanation text shown in feedback overlay
  // ------------------------------------------------------------------

  const explanationText =
    hint ??
    `The correct answer is ${correctAnswer}${unit ? ` ${unit}` : ''}.`;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Everyday math drill"
      data-testid="everyday-math-drill"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Label */}
        <p className="text-center text-sm font-medium text-muted-foreground">
          Everyday Math
        </p>

        {/* Scenario card */}
        <div
          className="rounded-xl border bg-card p-5 text-card-foreground shadow"
          data-testid="scenario-card"
        >
          <div className="mb-3 flex items-center gap-3">
            <span
              className="text-4xl"
              aria-hidden="true"
              data-testid="category-emoji"
            >
              {emoji}
            </span>
            <p className="text-base text-muted-foreground" data-testid="scenario-text">
              {scenario}
            </p>
          </div>
          <p
            className="text-lg font-bold text-foreground"
            data-testid="question-text"
            aria-live="polite"
            aria-atomic="true"
          >
            {question}
          </p>
        </div>

        {/* Unit hint */}
        {unit && (
          <p className="text-center text-sm text-muted-foreground">
            Answer in:{' '}
            <span className="font-semibold text-primary">{unit}</span>
          </p>
        )}

        {/* ---- Easy: free-form number input ---- */}
        {difficulty === 'easy' && !submitted && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {unit === '$' && (
                <span className="text-2xl font-semibold text-muted-foreground">
                  $
                </span>
              )}
              <input
                type="number"
                inputMode="decimal"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Your answer"
                className="w-full rounded-xl border-2 border-primary bg-card px-4 py-4 text-2xl font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                aria-label="Enter your answer"
                data-testid="answer-input"
                disabled={submitted}
              />
            </div>
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={submitted || userInput.trim() === ''}
              className="w-full min-h-[52px] rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
              data-testid="submit-button"
            >
              Submit
            </button>
          </div>
        )}

        {/* ---- Medium/Hard: 2x2 multiple choice grid ---- */}
        {(difficulty === 'medium' || difficulty === 'hard') &&
          !submitted &&
          choices && (
            <div
              className="grid grid-cols-2 gap-4"
              data-testid="choices"
              role="group"
              aria-label="Answer choices"
            >
              {choices.map((choice, index) => (
                <motion.button
                  key={index}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                  whileHover={
                    prefersReducedMotion ? undefined : { scale: 1.03 }
                  }
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={submitted}
                  className="min-h-[60px] rounded-xl border-2 border-primary bg-card px-4 py-4 text-xl font-semibold text-foreground transition-colors hover:bg-primary/10 disabled:opacity-40"
                  data-testid={`choice-${index}`}
                  aria-label={`Answer: ${unit === '$' ? '$' : ''}${choice}${unit && unit !== '$' ? ` ${unit}` : ''}`}
                  type="button"
                >
                  {unit === '$' ? `$${choice}` : choice}
                  {unit && unit !== '$' && unit !== 'cents/oz' && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {unit}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

        {/* Selection confirmation for medium/hard after choosing */}
        {submitted && selectedChoice !== null && (difficulty === 'medium' || difficulty === 'hard') && (
          <p className="text-center text-muted-foreground text-sm">
            You selected:{' '}
            <span className="font-semibold text-foreground">
              {unit === '$' ? `$${selectedChoice}` : selectedChoice}
            </span>
          </p>
        )}

        {/* Feedback overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { scale: 0, opacity: 0 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { scale: 1, opacity: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { scale: 0.8, opacity: 0 }
              }
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80 px-6"
              role="alert"
              aria-live="assertive"
              data-testid="feedback-overlay"
            >
              <div className="text-center max-w-sm">
                {isCorrect ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <Check
                        className="h-24 w-24 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-2xl font-bold text-green-500 mb-3">
                      Correct!
                    </p>
                    <p
                      className="text-base text-muted-foreground"
                      data-testid="feedback-explanation"
                    >
                      {explanationText}
                    </p>
                    <p className="sr-only">
                      Correct! {explanationText}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex justify-center">
                      <X
                        className="h-24 w-24 text-yellow-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Not quite — keep going!
                    </p>
                    <p className="text-2xl font-semibold text-primary mb-3">
                      Answer:{' '}
                      {unit === '$'
                        ? `$${correctAnswer}`
                        : `${correctAnswer}${unit ? ` ${unit}` : ''}`}
                    </p>
                    <p
                      className="text-base text-muted-foreground"
                      data-testid="feedback-explanation"
                    >
                      {explanationText}
                    </p>
                    <p className="sr-only">
                      Incorrect. The answer is {correctAnswer}
                      {unit ? ` ${unit}` : ''}. {explanationText}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
