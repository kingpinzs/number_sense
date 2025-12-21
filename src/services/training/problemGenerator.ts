/**
 * Problem Generator Service
 * Story 3.4: Math Operations Drill
 *
 * Generates random arithmetic problems with configurable difficulty levels.
 * Used by MathOperationsDrill to create practice problems.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  problem: string;
  answer: number;
}

/**
 * Generate an addition problem based on difficulty
 * @param difficulty - easy: single-digit, medium: double-digit, hard: double-digit
 */
export function generateAddition(difficulty: Difficulty): Problem {
  let num1: number, num2: number;

  switch (difficulty) {
    case 'easy':
      // Single-digit addition (0-9 + 0-9)
      num1 = Math.floor(Math.random() * 10);
      num2 = Math.floor(Math.random() * 10);
      break;

    case 'medium':
    case 'hard':
      // Double-digit addition (10-99 + 1-50)
      num1 = Math.floor(Math.random() * 90) + 10; // 10-99
      num2 = Math.floor(Math.random() * 50) + 1;  // 1-50
      break;
  }

  const answer = num1 + num2;
  const problem = `${num1} + ${num2}`;

  return { problem, answer };
}

/**
 * Generate a subtraction problem based on difficulty
 * @param difficulty - easy: single-digit, medium: double-digit, hard: double-digit
 */
export function generateSubtraction(difficulty: Difficulty): Problem {
  let num1: number, num2: number;

  switch (difficulty) {
    case 'easy':
      // Single-digit subtraction, ensure no negatives (larger - smaller)
      num1 = Math.floor(Math.random() * 10);
      num2 = Math.floor(Math.random() * (num1 + 1)); // num2 <= num1
      break;

    case 'medium':
    case 'hard':
      // Double-digit subtraction, ensure no negatives
      num1 = Math.floor(Math.random() * 90) + 10; // 10-99
      num2 = Math.floor(Math.random() * num1);     // num2 < num1
      break;
  }

  const answer = num1 - num2;
  const problem = `${num1} - ${num2}`;

  return { problem, answer };
}

/**
 * Generate a multiplication problem based on difficulty
 * @param difficulty - easy: N/A, medium: single-digit, hard: 12×12 times tables
 */
export function generateMultiplication(difficulty: Difficulty): Problem {
  let num1: number, num2: number;

  switch (difficulty) {
    case 'easy':
      // Not used for easy difficulty (only addition/subtraction)
      // Fallback to simple single-digit if called
      num1 = Math.floor(Math.random() * 5) + 1;   // 1-5
      num2 = Math.floor(Math.random() * 5) + 1;   // 1-5
      break;

    case 'medium':
      // Single-digit multiplication (1-9 × 1-9)
      num1 = Math.floor(Math.random() * 9) + 1;   // 1-9
      num2 = Math.floor(Math.random() * 9) + 1;   // 1-9
      break;

    case 'hard':
      // 12×12 times tables (1-12 × 1-12)
      num1 = Math.floor(Math.random() * 12) + 1;  // 1-12
      num2 = Math.floor(Math.random() * 12) + 1;  // 1-12
      break;
  }

  const answer = num1 * num2;
  const problem = `${num1} × ${num2}`;

  return { problem, answer };
}

/**
 * Generate a random problem of any operation type based on difficulty
 * @param difficulty - Determines problem complexity
 * @param operationType - Optional: force specific operation, otherwise random
 */
export function generateProblem(
  difficulty: Difficulty,
  operationType?: 'addition' | 'subtraction' | 'multiplication'
): Problem & { operation: 'addition' | 'subtraction' | 'multiplication' } {
  let operation: 'addition' | 'subtraction' | 'multiplication';

  if (operationType) {
    operation = operationType;
  } else {
    // Randomly select operation based on difficulty
    if (difficulty === 'easy') {
      // Easy: only addition and subtraction
      operation = Math.random() < 0.5 ? 'addition' : 'subtraction';
    } else if (difficulty === 'medium') {
      // Medium: all three operations
      const rand = Math.random();
      if (rand < 0.33) operation = 'addition';
      else if (rand < 0.66) operation = 'subtraction';
      else operation = 'multiplication';
    } else {
      // Hard: focus on multiplication (times tables)
      const rand = Math.random();
      if (rand < 0.7) operation = 'multiplication';
      else if (rand < 0.85) operation = 'addition';
      else operation = 'subtraction';
    }
  }

  let result: Problem;
  switch (operation) {
    case 'addition':
      result = generateAddition(difficulty);
      break;
    case 'subtraction':
      result = generateSubtraction(difficulty);
      break;
    case 'multiplication':
      result = generateMultiplication(difficulty);
      break;
  }

  return { ...result, operation };
}
