// Real-World Activity Tips Library
// Data-driven coaching: suggests real-world activities matched to weak areas

export interface RealWorldTip {
  id: string;
  module: 'number_line' | 'spatial_rotation' | 'math_operations' | 'general';
  category: 'spatial' | 'number_sense' | 'math_confidence' | 'daily_life';
  title: string;
  activity: string;
  why: string;
  difficulty: 'easy' | 'medium' | 'advanced';
}

export const REAL_WORLD_TIPS: RealWorldTip[] = [
  // ─── Spatial Awareness (~12 tips) ───────────────────────────────────
  {
    id: 'spatial-estimate-steps',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Estimate Steps to the Door',
    activity: 'Before walking to the door, estimate how many steps it will take — then count them.',
    why: 'Builds spatial distance estimation, the same skill used in number line placement.',
    difficulty: 'easy',
  },
  {
    id: 'spatial-sort-objects',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Sort Objects by Size',
    activity: 'Grab 5-10 items (cups, books, shoes) and sort them smallest to largest.',
    why: 'Trains your brain to compare magnitudes visually — a core dyscalculia skill.',
    difficulty: 'easy',
  },
  {
    id: 'spatial-left-right-directions',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Give Left/Right Directions',
    activity: 'Practice giving someone walking directions using only left, right, and distance estimates.',
    why: 'Strengthens spatial orientation and mental rotation — the same skills used in shape rotation drills.',
    difficulty: 'easy',
  },
  {
    id: 'spatial-furniture-fit',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Will It Fit?',
    activity: 'Before moving furniture, estimate whether it will fit through a doorway or in a space.',
    why: 'Practices mental size comparison and spatial reasoning in a real context.',
    difficulty: 'medium',
  },
  {
    id: 'spatial-paper-folding',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Paper Folding Predictions',
    activity: 'Fold a piece of paper, predict what shape it makes — then unfold to check.',
    why: 'Directly trains mental rotation and transformation, strengthening the same pathways used in spatial drills.',
    difficulty: 'medium',
  },
  {
    id: 'spatial-map-reading',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Read a Map',
    activity: 'Use a paper map (not GPS) to estimate distances between two locations.',
    why: 'Combines spatial reasoning with number estimation — two key dyscalculia skills at once.',
    difficulty: 'medium',
  },
  {
    id: 'spatial-packing',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Pack a Bag Efficiently',
    activity: 'When packing a bag or box, mentally rotate items to figure out how they fit before placing them.',
    why: 'Real-world mental rotation practice — exactly what spatial drills train.',
    difficulty: 'medium',
  },
  {
    id: 'spatial-tetris-tangram',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Play Tetris or Tangrams',
    activity: 'Spend 10 minutes on Tetris or a tangram puzzle app.',
    why: 'Research shows puzzle games improve spatial rotation skills and make the brain faster at recognizing rotated shapes.',
    difficulty: 'easy',
  },
  {
    id: 'spatial-symmetry-spotting',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Spot Symmetry Around You',
    activity: 'Look at buildings, faces, or leaves and identify lines of symmetry.',
    why: 'Trains mirror recognition — the same skill tested in mirror/rotation spatial drills.',
    difficulty: 'easy',
  },
  {
    id: 'spatial-draw-different-angle',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Draw From a Different Angle',
    activity: 'Look at an object, then try to draw what it would look like from the other side.',
    why: 'Forces mental rotation without a screen — builds the same neural pathways as spatial drills.',
    difficulty: 'advanced',
  },
  {
    id: 'spatial-navigate-no-gps',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Navigate Without GPS',
    activity: 'Try walking a familiar route using only memory and landmarks, no phone.',
    why: 'Strengthens spatial memory and orientation — reduces reliance on external tools.',
    difficulty: 'advanced',
  },
  {
    id: 'spatial-gesture-directions',
    module: 'spatial_rotation',
    category: 'spatial',
    title: 'Use Hand Gestures for Directions',
    activity: 'When explaining where something is, use hand gestures to show direction and distance.',
    why: 'Connects spatial thinking to body movement, reinforcing mental spatial models.',
    difficulty: 'easy',
  },

  // ─── Number Sense (~12 tips) ────────────────────────────────────────
  {
    id: 'number-grocery-estimate',
    module: 'number_line',
    category: 'number_sense',
    title: 'Estimate Your Grocery Total',
    activity: 'At the store, round each item to the nearest dollar and keep a running total in your head.',
    why: 'Builds number estimation and mental arithmetic — directly trains the number sense that number line drills target.',
    difficulty: 'medium',
  },
  {
    id: 'number-coin-grouping',
    module: 'number_line',
    category: 'number_sense',
    title: 'Group Coins Into Piles of 10',
    activity: 'Count coins by making groups of 10 — then count the groups.',
    why: 'Trains base-10 number sense and grouping, which helps with number line understanding.',
    difficulty: 'easy',
  },
  {
    id: 'number-analog-clock',
    module: 'number_line',
    category: 'number_sense',
    title: 'Read Analog Clocks',
    activity: 'Throughout the day, read analog clocks and estimate how many minutes until the next hour.',
    why: 'Analog clocks are circular number lines — reading them strengthens number placement skills.',
    difficulty: 'easy',
  },
  {
    id: 'number-distance-walking',
    module: 'number_line',
    category: 'number_sense',
    title: 'Estimate Walking Distances',
    activity: 'While walking, estimate "Is that 10 meters or 20?" then pace it out to check.',
    why: 'Connects abstract number magnitude to physical distance — makes numbers feel real.',
    difficulty: 'easy',
  },
  {
    id: 'number-jar-guess',
    module: 'number_line',
    category: 'number_sense',
    title: 'How Many in the Jar?',
    activity: 'Look at a group of objects (sweets in a jar, books on a shelf) and estimate how many.',
    why: 'Trains numerosity estimation — the ability to sense "how many" without counting, a key dyscalculia skill.',
    difficulty: 'easy',
  },
  {
    id: 'number-price-comparison',
    module: 'number_line',
    category: 'number_sense',
    title: 'Compare Prices Per Unit',
    activity: 'At the shop, compare two products and figure out which is better value per item or per gram.',
    why: 'Uses division and ratio thinking in a real context — strengthens proportional number sense.',
    difficulty: 'advanced',
  },
  {
    id: 'number-cooking-time',
    module: 'number_line',
    category: 'number_sense',
    title: 'Estimate Cooking Times',
    activity: 'Before checking the recipe, estimate how long something needs to cook — then compare.',
    why: 'Practices time estimation, which uses the same mental number line as placement drills.',
    difficulty: 'easy',
  },
  {
    id: 'number-step-counting',
    module: 'number_line',
    category: 'number_sense',
    title: 'Count Steps and Guess Distance',
    activity: 'Count your steps on a walk, then estimate how far you went in meters.',
    why: 'Connects counting to real-world magnitude, building intuition for number size.',
    difficulty: 'medium',
  },
  {
    id: 'number-crowd-size',
    module: 'number_line',
    category: 'number_sense',
    title: 'Estimate Crowd Sizes',
    activity: 'In a waiting room or at an event, estimate how many people are there before counting.',
    why: 'Trains rapid quantity estimation — a core number sense skill that improves with practice.',
    difficulty: 'medium',
  },
  {
    id: 'number-guessing-game',
    module: 'number_line',
    category: 'number_sense',
    title: 'Play a Number Guessing Game',
    activity: 'Ask someone to think of a number 1-100 and use "higher/lower" to find it in as few guesses as possible.',
    why: 'Practices binary search on a mental number line — directly builds number placement intuition.',
    difficulty: 'easy',
  },
  {
    id: 'number-check-change',
    module: 'number_line',
    category: 'number_sense',
    title: 'Check Your Change',
    activity: 'After paying, mentally calculate what your change should be before the cashier gives it.',
    why: 'Quick subtraction practice with real stakes — builds automatic number processing.',
    difficulty: 'medium',
  },
  {
    id: 'number-thermometer',
    module: 'number_line',
    category: 'number_sense',
    title: 'Read Thermometers',
    activity: 'Check the weather temperature and estimate: is it closer to 10°C or 20°C? How far from freezing?',
    why: 'Thermometers are literal number lines — reading them practices number placement in context.',
    difficulty: 'easy',
  },

  // ─── Math Confidence (~12 tips) ─────────────────────────────────────
  {
    id: 'math-halve-recipe',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Halve a Recipe',
    activity: 'Pick a recipe and halve every measurement — half of 3/4 cup, half of 350°F, etc.',
    why: 'Fraction and division practice with a tasty reward — connects math to something you enjoy.',
    difficulty: 'medium',
  },
  {
    id: 'math-dice-games',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Play Board Games with Dice',
    activity: 'Play any board game that uses dice — practice adding the dots quickly in your head.',
    why: 'Quick, low-pressure mental addition that builds automatic number processing.',
    difficulty: 'easy',
  },
  {
    id: 'math-tip-calculator',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Calculate Tips Mentally',
    activity: 'At a restaurant, calculate a 10% tip (move the decimal), then adjust for 15% or 20%.',
    why: 'Percentage practice in a real-world situation — builds confidence with proportional thinking.',
    difficulty: 'medium',
  },
  {
    id: 'math-double-recipe',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Double a Recipe',
    activity: 'Take any recipe and double every ingredient amount in your head.',
    why: 'Multiplication practice that produces something real — connects math to achievement.',
    difficulty: 'easy',
  },
  {
    id: 'math-weekly-budget',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Budget Your Week',
    activity: 'Write down expected expenses for the week and add them up on paper (no calculator).',
    why: 'Multi-step addition with meaningful numbers — builds sustained mental arithmetic endurance.',
    difficulty: 'medium',
  },
  {
    id: 'math-measure-rooms',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Measure a Room',
    activity: 'Measure the length and width of a room, then calculate the area in your head.',
    why: 'Multiplication with real numbers — connects abstract operations to physical space.',
    difficulty: 'medium',
  },
  {
    id: 'math-travel-time',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Calculate Travel Time',
    activity: 'Estimate how long a journey will take based on distance and speed (e.g., 30 miles at 60 mph).',
    why: 'Division practice with real-world context — makes abstract math tangible.',
    difficulty: 'advanced',
  },
  {
    id: 'math-card-game-scoring',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Keep Score in Card Games',
    activity: 'Play a card game and keep a running score in your head instead of writing it down.',
    why: 'Running totals build working memory for numbers — a key skill that improves with practice.',
    difficulty: 'medium',
  },
  {
    id: 'math-split-bill',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Split a Bill',
    activity: 'When dining with friends, split the bill mentally before reaching for a calculator.',
    why: 'Division under social pressure builds confidence — you can always check with a calculator after.',
    difficulty: 'medium',
  },
  {
    id: 'math-countdown-by-7',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Count Backwards by 7s',
    activity: 'Start at 100 and count backwards by 7 (100, 93, 86, 79...). How far can you get?',
    why: 'Subtraction drill that builds mental arithmetic speed and working memory.',
    difficulty: 'advanced',
  },
  {
    id: 'math-gas-pump-math',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Gas Pump Mental Math',
    activity: 'While fueling, estimate the total cost as the litres tick up.',
    why: 'Multiplication with decimals in real time — builds automatic calculation skills.',
    difficulty: 'advanced',
  },
  {
    id: 'math-sale-percentages',
    module: 'math_operations',
    category: 'math_confidence',
    title: 'Calculate Sale Prices',
    activity: 'When you see a "30% off" sign, calculate the sale price in your head before checking the tag.',
    why: 'Percentage practice that saves money — highly motivating real-world math application.',
    difficulty: 'medium',
  },

  // ─── General Confidence (~6 tips) ───────────────────────────────────
  {
    id: 'general-teach-someone',
    module: 'general',
    category: 'daily_life',
    title: 'Teach Someone a Concept',
    activity: 'Explain a math concept you recently practiced to a friend or family member.',
    why: 'Teaching reinforces your own understanding and builds confidence — if you can explain it, you know it.',
    difficulty: 'medium',
  },
  {
    id: 'general-number-journal',
    module: 'general',
    category: 'daily_life',
    title: 'Journal a Math Moment',
    activity: 'At the end of the day, write down one moment where math helped you (even small ones).',
    why: 'Reframes your relationship with numbers from anxiety to awareness.',
    difficulty: 'easy',
  },
  {
    id: 'general-number-moment-alarm',
    module: 'general',
    category: 'daily_life',
    title: 'Set a Number Moment Alarm',
    activity: 'Set a daily alarm — when it goes off, notice the next number you see and think about what it means.',
    why: 'Builds number awareness habits — the more you notice numbers, the less intimidating they become.',
    difficulty: 'easy',
  },
  {
    id: 'general-numbers-everywhere',
    module: 'general',
    category: 'daily_life',
    title: 'Notice Numbers Around You',
    activity: 'For 5 minutes, actively notice every number you can see: prices, addresses, times, distances.',
    why: 'Normalizes numbers as part of daily life rather than something to avoid.',
    difficulty: 'easy',
  },
  {
    id: 'general-celebrate-wins',
    module: 'general',
    category: 'daily_life',
    title: 'Celebrate Small Wins',
    activity: 'When you get a math problem right (in life or in the app), say "I got that!" out loud.',
    why: 'Positive reinforcement builds confidence faster than any drill — your brain learns what you celebrate.',
    difficulty: 'easy',
  },
  {
    id: 'general-reframe-language',
    module: 'general',
    category: 'daily_life',
    title: "Reframe 'I Can't' to 'I'm Learning'",
    activity: "Every time you catch yourself thinking 'I can't do math', replace it with 'I'm learning math'.",
    why: 'Growth mindset research shows this simple reframe measurably improves learning outcomes.',
    difficulty: 'easy',
  },
];

/**
 * Select the best real-world tip for the user's current state.
 * Priority: weakest module first → filter out shown tips → match difficulty to accuracy.
 *
 * @param weakestModule - User's weakest module (or null for general tips)
 * @param shownTipIds - Tips already shown to the user
 * @param moduleAccuracy - Accuracy for weakest module (to match difficulty)
 * @returns A tip or null if all have been shown
 */
export function selectRealWorldTip(
  weakestModule: string | null,
  shownTipIds: string[],
  moduleAccuracy: number | null,
): RealWorldTip | null {
  const unshown = REAL_WORLD_TIPS.filter(t => !shownTipIds.includes(t.id));
  if (unshown.length === 0) return null;

  // Determine target difficulty based on accuracy
  let targetDifficulty: 'easy' | 'medium' | 'advanced' = 'easy';
  if (moduleAccuracy !== null) {
    if (moduleAccuracy >= 75) targetDifficulty = 'advanced';
    else if (moduleAccuracy >= 50) targetDifficulty = 'medium';
  }

  // Try module-specific tips first
  if (weakestModule) {
    const moduleTips = unshown.filter(t => t.module === weakestModule);
    if (moduleTips.length > 0) {
      // Prefer matching difficulty
      const diffMatch = moduleTips.filter(t => t.difficulty === targetDifficulty);
      if (diffMatch.length > 0) return diffMatch[0];
      return moduleTips[0];
    }
  }

  // Fall back to general tips
  const generalTips = unshown.filter(t => t.module === 'general');
  if (generalTips.length > 0) return generalTips[0];

  // Fall back to any unshown tip
  return unshown[0];
}
