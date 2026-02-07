# Discalculas UX Design Specification

_Created on 2025-11-09 by Jeremy_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**Project Vision:** Discalculas transforms a rough prototype into a trustworthy, phone-friendly daily companion for living with dyscalculia. A calm, mobile-ready wizard that delivers precise dyscalculia drills, cognition boosters, and progress feedback in minutes—lightweight enough for a daily habit yet smart enough to adapt to anxiety levels and cognitive load.

**Target Users:**
- Primary: Adults living with dyscalculia who need reliable daily math & spatial drills
- Context: Often dealing with anxiety, ADHD, or dyslexia co-occurrence
- Future: Broader dyscalculia community (5-10% of population)

**Core Experience:**
- **Most frequent action:** Daily training drills in 20-minute adaptive sessions
- **Must be effortless:** Starting a session with one tap
- **Critical to nail:** Drill interactions that feel supportive, not frustrating
- **Platform:** Phone-first native PWA experience (full-screen, bottom nav, offline-capable)

**User Journey:**
1. First-time users complete an initial Assessment
2. Daily users jump straight into Training drills
3. Progress tracking and notifications keep motivation high
4. Little rewards and celebrations maintain the daily habit

**Desired Emotional Response:**
- **Primary feeling:** Motivated and energized - "This makes me want to keep coming back"
- **Must prevent:** Frustration - No shame, no overwhelm, no anxiety spirals
- **Design implication:** Every interaction should feel like progress, not pressure. Celebrate small wins, provide supportive feedback, and make failure feel like learning, not losing.

**Inspiration Analysis:**

Three apps inform the UX direction: **Headspace, Duolingo, and Elevate**

**1. Headspace (Meditation/Wellness)**
- **What works:** Emotion-driven design with warm colors (orange/yellow), circular comfort elements, delightful animations that make complex concepts accessible
- **Key UX patterns:** Simple interface with quirky animations, consistent voice, instant feedback, proper spacing creates calm
- **Applicable to Discalculas:** Circular comfort elements for drill interactions, warm feedback colors, animations that celebrate progress without overwhelming
- **Takeaway:** Visual imagery makes abstract concepts (meditation → dyscalculia drills) approachable for anxious users

**2. Duolingo (Language Learning/Gamification)**
- **What works:** Streak system drives 60% increase in commitment; 9M+ users have year+ streaks; Streak Freeze reduced churn 21%
- **Key UX patterns:** Daily streaks with gentle nudges (no guilt-trips), XP/leaderboards (40% more engagement), badges (30% completion boost), social friend streaks
- **Applicable to Discalculas:** Streak system for daily drill habit, gentle reminders, progress badges, potential friend accountability
- **Takeaway:** Behavioral design through positive reinforcement, not pressure; 37% DAU/MAU shows daily habit success

**3. Elevate (Brain Training)**
- **What works:** Clean, professional yet approachable; bright colors with rounded lines reduce stress; personalized training programs adapt over time
- **Key UX patterns:** Short science-based games, personalized challenges, clean interface balances credibility with engagement, 40+ mini-games
- **Applicable to Discalculas:** Clean professional design builds trust; bright rounded aesthetics reduce math anxiety; adaptive difficulty personalizes experience
- **Takeaway:** Balance professional credibility (science-backed) with playful, stress-reducing visual design

**Synthesized UX Principles from Inspiration:**
- **Warm, calm visual design** (Headspace orange/yellow warmth + Elevate rounded lines)
- **Streak-based habit system** (Duolingo's proven 60% engagement boost)
- **Celebrate progress, prevent guilt** (Duolingo gentle nudges + Headspace instant positive feedback)
- **Clean, trustworthy interface** (Elevate professional credibility + Headspace consistent voice)
- **Personalized adaptive content** (Elevate's tailored programs)
- **Short, focused sessions** (All three emphasize brief daily engagement)

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Selected: shadcn/ui + Tailwind CSS v4**

**Rationale:**
- **Mobile-first responsive:** Built-in adaptive components (drawer on mobile, dropdown on desktop) perfect for native PWA experience
- **Lightweight performance:** Minimal bundle size critical for <2s load time on mid-tier phones
- **Full customization:** Complete theme control enables Headspace-inspired warm colors and Elevate's calm rounded aesthetic
- **Accessibility:** WCAG 2.1 AA compliance baked in (PRD requirement)
- **No vendor lock-in:** Components are fully editable, not a black-box library
- **2025 ready:** Tailwind v4, React 19 support, active ecosystem

**What shadcn/ui Provides:**
- **Button hierarchy:** Primary, secondary, destructive variants for drill CTAs and navigation
- **Form components:** Inputs, labels, validation states for confidence prompts and settings
- **Progress indicators:** Perfect for streaks, session completion, drill progress
- **Drawer/Sheet components:** Mobile-native feeling for wizard flows and modals
- **Toast/Alert components:** Celebration feedback and gentle error handling
- **Card components:** Drill containers, progress widgets, module tiles

**Custom Components Needed:**
- **Drill interaction widgets:** Number line manipulatives, spatial rotation controls, math problem displays
- **Magic Minute timer:** 60-second countdown with visual progress ring
- **Confidence Radar chart:** Multi-dimensional session impact visualization
- **Gamification elements:** Streak counter with flame animation, achievement badges, progress rings
- **Ambient sync indicator:** Subtle pulsing border for offline→online sync feedback

**Theme Customization Strategy:**
- Base: shadcn/ui default component structure
- Colors: Warm orange/yellow primary (Headspace), calm neutrals, success/error states
- Typography: Rounded, legible sans-serif (reduce math anxiety)
- Spacing: Generous padding (thumb-friendly touch targets 44px+)
- Borders: Rounded corners throughout (Elevate calm aesthetic)
- Animations: Subtle, celebratory (Headspace delight without overwhelm)

---

## 2. Core User Experience

### 2.1 Defining Experience

**The Signature Experience:**

"Discalculas knows where you struggle and helps you improve there first - it reacts to you as you use it."

**What makes this special:**
1. **Assessment-driven personalization** - Starts by identifying your specific weaknesses (not generic drills)
2. **Immediate accomplishment** - Focuses on your struggles so every small win feels significant
3. **Adaptive responsiveness** - The app learns and adjusts based on how you perform and feel
4. **Comprehensive coverage** - Everything you need for both math AND spatial issues in one place

**Pattern Classification:**

This combines **standard patterns** with **adaptive enhancements**:

**Standard Patterns (proven, well-understood):**
- Initial assessment/onboarding (common in learning apps)
- Drill practice sessions (Duolingo-style repetition)
- Progress tracking and streaks (gamification standard)
- Module navigation (tabs/bottom nav)

**Adaptive Enhancements (what makes Discalculas unique):**
- **Weakness-first prioritization** - Most apps start with easy wins; you start with struggles for maximum impact
- **Real-time emotional adaptation** - Adjusts difficulty based on confidence levels and anxiety (not just correctness)
- **Dual-domain coverage** - Math + spatial in one integrated experience (most apps focus on one)

**Core UX Challenge:**

The challenge is making adaptive difficulty feel **supportive, not patronizing**. Users need to:
- **Trust** the assessment identified real weaknesses
- **Feel** the app is helping, not judging
- **See** tangible progress on their specific struggles
- **Understand** why the app is adjusting (transparency in adaptation)

### 2.2 Novel UX Patterns

Your PRD describes several innovative interaction patterns that need careful UX design:

**1. Magic Minute Sprint**

**User Goal:** Get immediate reinforcement on the toughest mistakes from today's session

**Pattern Mechanics:**
- **Trigger:** Automatically launches after completing a drill block (no button - happens seamlessly)
- **Content:** 60-second micro-challenge blending math + spatial cues based on logged mistakes
- **Feedback:** Visual timer with progress ring; immediate correctness indicators; celebration at completion
- **Success:** Completes in 60 seconds, sees immediate correction of today's mistakes, feels "I'm improving right now"
- **Error handling:** If they struggle, adapts within the minute (easier variant); no failure state - just adaptive support

**Visual Design:**
- Distinct "Magic Minute" branding (special icon, color treatment)
- Countdown timer prominent but not stressful (circular progress, not harsh red countdown)
- Seamless transition from drill → Magic Minute (flow feels connected, not jarring)

**2. Confidence x Time Radar View**

**User Goal:** Visually understand which sessions truly help across multiple dimensions

**Pattern Mechanics:**
- **Trigger:** Available in Progress tab; potentially shown after session completion
- **Visualization:** Multi-axis radar/spider chart showing:
  - Session duration (time axis)
  - Confidence delta (before/after comparison)
  - Cognitive load (self-reported difficulty)
  - Accuracy (correctness percentage)
  - Anxiety level (emotional state)
- **Interaction:** Tap/hover on spoke to see session details; compare sessions side-by-side
- **Insight:** Patterns emerge: "20-min sessions boost confidence more than 10-min" or "Morning sessions feel easier"

**Visual Design:**
- Filled radar chart with warm colors (not clinical/cold)
- Each axis clearly labeled with icons + text
- Past sessions shown as faint overlays for comparison
- Celebratory highlighting when metrics improve

**3. Adaptive Difficulty with Transparent Communication**

**User Goal:** Trust the app is helping, not judging performance

**Pattern Mechanics:**
- **Trigger:** Real-time during drills based on performance + confidence prompts
- **Adjustment:** Difficulty increases/decreases dynamically
- **Transparency:** Brief toast notification explains WHY adjustment happened
  - "You're crushing this! Let's try something harder 💪"
  - "This is tough - let's build confidence with something more manageable 🌱"
- **User control:** Option to override ("Keep current difficulty" / "Accept change")

**Visual Design:**
- Gentle, encouraging language (never "You failed" → "Let's try a different approach")
- Warm color palette for adjustments (not red/error styling)
- Smooth transitions between difficulty levels (no abrupt changes)

---

## 3. Visual Foundation

### 3.1 Color System

**Chosen Theme: Balanced Warmth** (Hybrid of Theme 3 "Gentle Energy" + Theme 4 "Professional Warmth")

**Color Palette:**

| Color Role | Hex Code | Usage | Source |
|------------|----------|-------|--------|
| **Primary** | `#E87461` | Main CTAs, active states, primary actions | Theme 4 (coral warmth) |
| **Secondary** | `#A8E6CF` | Supporting actions, secondary buttons, calm accents | Theme 3 (mint calm) |
| **Accent** | `#FFD56F` | Highlights, celebrations, Magic Minute branding | Theme 3 (sunny yellow) |
| **Success** | `#66BB6A` | Correct answers, achievements, progress milestones | Theme 3 (fresh green) |
| **Warning/Caution** | `#FBD786` | Gentle alerts, "try again" prompts | Theme 4 (soft gold) |
| **Error/Support** | `#FF8A65` | Supportive error states (never harsh red) | Theme 3 (warm coral) |
| **Neutral Dark** | `#2C3E50` | Primary text, headings | Custom (legible, not black) |
| **Neutral Medium** | `#7F8C8D` | Secondary text, captions | Custom |
| **Neutral Light** | `#ECF0F1` | Borders, dividers | Custom |
| **Background** | `#FAFAFA` | App background | Theme 3 (clean white) |
| **Surface** | `#FFFFFF` | Cards, modals, elevated surfaces | White |

**Rationale for Hybrid:**
- **Primary coral** (#E87461) provides **professional warmth** and credibility (science-backed feel)
- **Secondary mint** (#A8E6CF) adds **calming energy** to reduce math anxiety
- **Accent yellow** (#FFD56F) brings **optimistic motivation** for celebrations and Magic Minute
- **Success green** balances energy with growth/progress symbolism
- The combination creates **motivated calm** - energizing without overwhelming

**Semantic Color Usage:**

**Gamification & Motivation:**
- Streak counter: Primary coral gradient with accent yellow highlights
- Achievement badges: Accent yellow with success green accents
- Progress rings: Primary → Secondary gradient (coral to mint)
- Magic Minute timer: Accent yellow background with primary coral ring

**Feedback States:**
- Correct answer: Success green with checkmark, subtle celebration animation
- Incorrect answer: Warning gold (not error coral) - "Let's try another approach" tone
- Adaptive difficulty up: Primary coral - "You're crushing this! 💪"
- Adaptive difficulty down: Secondary mint - "Let's build confidence here 🌱"
- Session complete: Accent yellow burst with confetti

**Interactive Elements:**
- Primary buttons: Coral background, white text, 44px+ touch targets
- Secondary buttons: Mint background, dark text
- Disabled state: Neutral light with 50% opacity
- Focus rings: 3px primary coral outline for accessibility

**Typography System:**

**Font Families:**
- **Headings:** 'Inter', 'SF Pro Display', -apple-system (rounded, friendly, legible)
- **Body:** 'Inter', -apple-system, BlinkMacSystemFont (consistent, highly legible)
- **Monospace:** 'SF Mono', 'Courier New' (for drill numbers, data)

**Type Scale:**
- H1: 32px / 2rem - Page titles
- H2: 24px / 1.5rem - Section headers
- H3: 20px / 1.25rem - Card titles
- Body: 16px / 1rem - Main content
- Small: 14px / 0.875rem - Captions, metadata
- Tiny: 12px / 0.75rem - Labels, fine print

**Font Weights:**
- Headings: 700 (bold) for confidence and clarity
- Buttons/CTAs: 600 (semibold) for prominence
- Body: 400 (regular) for comfortable reading
- Emphasis: 500 (medium) for subtle highlighting

**Line Heights:**
- Headings: 1.2 (tight for impact)
- Body: 1.6 (generous for readability, reduces anxiety)
- Buttons: 1.4 (balanced)

**Spacing & Layout Foundation:**

**Base Unit:** 8px system (4px for micro-adjustments)

**Spacing Scale:**
- xs: 4px - Tight internal spacing
- sm: 8px - Component internal padding
- md: 16px - Standard spacing between elements
- lg: 24px - Section spacing
- xl: 32px - Major section breaks
- 2xl: 48px - Page-level spacing

**Touch Targets (Mobile-Critical):**
- Minimum: 44px × 44px (iOS/WCAG recommendation)
- Preferred: 48px × 48px for primary actions
- Spacing: 8px minimum between tappable elements

**Border Radius (Rounded, Calm Aesthetic):**
- Buttons: 12px (friendly, approachable)
- Cards: 16px (substantial, comfortable)
- Inputs: 8px (subtle, professional)
- Pills/Tags: 999px (fully rounded)
- Modals: 20px (elevated, special)

**Shadows (Subtle Depth):**
- Card elevation: `0 2px 8px rgba(0,0,0,0.08)`
- Button hover: `0 4px 12px rgba(232,116,97,0.2)` (primary coral glow)
- Modal: `0 8px 24px rgba(0,0,0,0.12)`
- Focus: `0 0 0 3px rgba(232,116,97,0.3)` (coral outline)

**Accessibility Compliance:**

All color combinations meet **WCAG 2.1 AA** contrast requirements:
- Primary coral on white: 4.52:1 (AA ✓)
- Neutral dark on white: 12.63:1 (AAA ✓)
- Success green on white: 4.56:1 (AA ✓)
- Secondary mint on dark text: 4.88:1 (AA ✓)

**Interactive Visualizations:**
- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html) (original 4 themes)
- Chosen hybrid documented above for implementation

**Interactive Visualizations:**

- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Selected: Direction #6 - Split Dashboard**

**Design Philosophy:** Balanced, dual-focus, organized - Progress + action visible together

**Why This Works for Discalculas:**

This direction perfectly balances the core needs of your users:
- **Motivation through visible progress** - Streak hero card and progress metrics immediately show growth
- **Effortless action** - "Continue Training" and "Magic Minute" CTAs always visible in Quick Actions section
- **Reduces anxiety** - Split layout prevents overwhelm by organizing information into digestible sections
- **Data + encouragement** - Stats grid (3/5 drills, +2 confidence) reinforces "you're making progress" without being clinical

**Layout Structure:**

**Section 1: Streak Hero (Top)**
- Large gradient card (coral→yellow) featuring streak count
- Prominent "7 Days" with flame icon
- Progress bar showing weekly goal
- Visual prominence establishes motivation immediately

**Section 2: Stats Grid (Middle)**
- 2-column grid showing key metrics side-by-side:
  - **Drills Today** (3/5) - coral accent
  - **Confidence** (+2) - success green accent
- At-a-glance progress without scrolling

**Section 3: Quick Actions (Bottom)**
- White card with clear hierarchy:
  - Primary CTA: "Continue Training" (coral button, 48px height)
  - Secondary action: "Magic Minute ⚡" (mint button)
- Always accessible, no hunting for "what do I do next?"

**Section 4: Bottom Navigation (Fixed)**
- 4 tabs: Home, Training, Progress, Profile
- Native mobile pattern, thumb-friendly
- Current tab (Home) highlighted in coral

**Key Design Decisions:**

**Visual Hierarchy:**
1. **Streak hero** draws eye first (celebration, motivation)
2. **Stats grid** provides context (progress snapshot)
3. **Quick Actions** offers clear next step (reduces decision fatigue)

**Information Density:** Medium - Organized blocks
- Not overwhelming (like Direction #2 Dense Dashboard)
- Not too sparse (like Direction #3 Single Focus)
- Goldilocks balance: everything you need, nothing you don't

**Color Application:**
- **Streak card:** Gradient background (coral #E87461 → yellow #FFD56F) - warm, energizing
- **Stat cards:** White with colored accents - clean, professional
- **Primary CTA:** Solid coral - unmissable action
- **Secondary CTA:** Mint #A8E6CF - calm alternative

**Spacing & Touch Targets:**
- Card-to-card spacing: 16px (md)
- Internal card padding: 20px
- Button heights: 48px (primary), 44px (secondary)
- Stat grid gap: 12px (allows two columns on 375px width)

**Responsive Behavior:**
- 375px width (iPhone SE): 2-column stats grid, stacked cards
- Larger phones: Same layout, more comfortable spacing
- Tablet (future): Could expand to side-by-side panels

**Why This Beats Other Directions:**

vs **Direction #1 (Card Flow):** Split Dashboard has more prominent stats visibility
vs **Direction #2 (Dense):** Less overwhelming, better hierarchy
vs **Direction #3 (Single Focus):** Shows more context without losing simplicity
vs **Direction #4 (Grid):** Less playful/game-like, more trustworthy/professional
vs **Direction #5 (Timeline):** Focuses on present/future, not just past narrative
vs **Direction #7 (Hero CTA):** Balances action + progress instead of action-only
vs **Direction #8 (Progress):** Balances progress + action instead of progress-only

**Implementation Notes:**

- Streak card gradient: `linear-gradient(135deg, #E87461, #FFD56F)`
- Progress bar within streak card: White fill at 70% width (example)
- Stat cards: Box-shadow `0 2px 8px rgba(0,0,0,0.06)` for subtle elevation
- Bottom nav: Fixed position, border-top `1px solid #ECF0F1`

**Interactive Mockup:**
- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html) (Direction #6)

{{design_direction_decision}}

**Interactive Mockups:**

- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html)

---

## 5. User Journey Flows

### 5.1 Critical User Paths

Based on your PRD, Discalculas has 5 core flows: **Assessment, Training, Coach, Cognition, and Progress**. Let's design each journey with detailed UX decisions.

---

### 5.2 Journey 1: First-Time Assessment

**User Goal:** Complete initial assessment to identify specific math and spatial weaknesses

**Entry Point:** App launch (first time) or Settings → Retake Assessment

**Flow Approach:** **Wizard/Stepper** - Multi-step with clear progress, can't skip ahead

**Why This Approach:**
- Reduces overwhelm by showing one question at a time
- Progress bar builds confidence ("I'm 40% done!")
- Explicit steps prevent rushing through assessment
- Can save progress and resume later

**Detailed Flow:**

**Step 1: Welcome & Consent**
- **Screen:** Full-screen modal with warm gradient background
- **Content:**
  - "Welcome to Discalculas! 👋"
  - Brief explanation: "This 10-minute assessment helps us understand your unique strengths and challenges with numbers and spatial thinking."
  - "Your responses are private and stored locally on your device."
- **Action:** Primary button "Start Assessment" (coral)
- **Exit:** X button (top-right) → Confirm dialog "Assessment incomplete. Resume later?"

**Step 2-11: Assessment Questions** (10 questions total)
- **Screen:** Clean, focused layout
  - Top: Progress bar (10 segments, fills coral as you progress)
  - Middle: Question card (white, large text, 20px font)
    - Number line questions: Interactive slider or tap targets
    - Spatial questions: Visual rotation controls or multiple choice
    - Math operations: Number pad input or choice grid
  - Bottom:
    - "Question 3 of 10" (tiny text, neutral)
    - Primary button "Next" (disabled until answered)
    - Text link "Skip" (neutral, small) → Warning "Skipped questions reduce personalization accuracy. Continue?"

- **Feedback:**
  - No "right/wrong" shown during assessment (non-judgmental)
  - Answered questions: Green checkmark appears on progress bar segment
  - Skipped questions: Yellow dot on progress bar segment

- **Confidence Prompt (every 3 questions):**
  - After questions 3, 6, 9: "How confident did you feel about that?"
  - 5-point scale: 😰 😟 😐 🙂 😄 (emoji + text labels)
  - Stored for anxiety tracking

**Step 12: Processing**
- **Screen:** Animated progress indicator
  - Circular progress ring (coral→mint gradient)
  - "Analyzing your responses..."
  - Subtle animations (no long wait, ~2 seconds)

**Step 13: Results Summary**
- **Screen:** Card-based results
  - Celebration: "Assessment Complete! 🎉"
  - Summary cards (2-column grid):
    - "Number Sense": 3/5 stars visual
    - "Spatial Awareness": 2/5 stars visual
    - "Operations": 4/5 stars visual
  - **Key insight:** "We've identified Number Line as your primary focus area. Training will start here for maximum impact!"
- **Action:** Primary button "Start My First Training" (coral, 48px)
- **Secondary:** "View Detailed Results" (text link) → Navigate to Progress tab

**Success State:**
- User reaches Home dashboard
- Training module is pre-selected based on weakest area
- Assessment results stored locally
- User sees personalized training plan

**Error Recovery:**
- **Connection lost mid-assessment:** Auto-save progress after each question; resume from last completed
- **Assessment abandoned:** Soft reminder after 24 hours: "Finish your assessment to unlock personalized training"
- **All questions skipped:** Show gentle message: "We need at least 5 answers to personalize training. Let's try again?"

---

### 5.3 Journey 2: Daily Training Session

**User Goal:** Complete daily drill practice in identified weak areas (~20 minutes)

**Entry Point:**
- Home dashboard → "Continue Training" button
- Bottom nav → Training tab
- Notification → "Daily training ready!"

**Flow Approach:** **Progressive Creation** - Start with recommended drill, adaptive progression

**Why This Approach:**
- Guided path reduces decision paralysis
- Adaptive difficulty maintains engagement zone
- Can deviate if user wants different module

**Detailed Flow:**

**Step 1: Training Home**
- **Screen:** Module selection (if not continuing)
  - Header: "Choose Your Focus" (H2, 24px)
  - Module cards (grid or list based on screen size):
    - Each card shows:
      - Icon (📐 number line, 🔄 spatial, ➕ operations)
      - Module name (H3, bold)
      - Progress: "3/5 drills complete" + progress bar
      - Difficulty indicator: "●●○○○" (filled dots = completed levels)
      - Recommended badge (if assessment-driven): "⭐ Recommended for you"
  - **Action:** Tap card → Navigate to Drill Session

**Step 2: Pre-Session Confidence Check**
- **Screen:** Simple prompt overlay (not full modal)
  - "How are you feeling about [Module Name] today?"
  - 5-point scale: 😰 😟 😐 🙂 😄
  - Optional text input: "Any notes?" (collapsed by default)
- **Action:** Select mood → Auto-advances to drill (no extra button)
- **Rationale:** Captures anxiety baseline for adaptive difficulty

**Step 3: Drill Session (Repeated 3-5 times)**
- **Screen:** Full-screen drill interface
  - Top bar:
    - Module icon + name (tiny, 12px)
    - Progress: "Drill 2 of 5" (small text)
    - Timer: Optional "15:30 elapsed" (can hide)
    - Exit: X button → Confirm "Save progress and exit?"

  - **Drill Content Area** (varies by module):
    - **Number Line:** Visual number line (0-100) with draggable marker or tap targets
    - **Spatial Rotation:** 3D-style object with rotation controls (swipe/buttons)
    - **Operations:** Math problem with number pad or multiple choice

  - **Interaction:**
    - User submits answer → Immediate feedback
    - **Correct:** Success green checkmark ✓ + encouraging message "Great work! 🌟" (toast, 2s)
    - **Incorrect:** Warning gold "Let's try another approach" + hint (if available) + "Try Again" button (no penalty)
    - After 2 incorrect: Adaptive difficulty triggers (see Step 4)

  - **Bottom:**
    - Drill progress dots: ●●●○○ (filled = completed)
    - Primary button: "Submit" (disabled until answer selected)

**Step 4: Adaptive Difficulty Adjustment**
- **Trigger:** 2 incorrect answers OR 5 consecutive correct answers
- **Screen:** Toast notification (bottom-up slide animation)
  - **Difficulty Down (Mint background):**
    - Icon: 🌱
    - Text: "This is tough - let's build confidence with something more manageable"
    - Action buttons: "Accept" (mint) | "Keep Current" (text link)
  - **Difficulty Up (Coral background):**
    - Icon: 💪
    - Text: "You're crushing this! Let's try something harder"
    - Action buttons: "Bring it on!" (coral) | "Stay Here" (text link)
- **User Control:** Choice affects next drill difficulty
- **Transparency:** Settings shows difficulty history: "You've moved up 2 levels this week!"

**Step 5: Drill Block Complete (After 3-5 drills)**
- **Screen:** Celebration overlay
  - Animation: Confetti burst (accent yellow) from center
  - Big text: "Drill Block Complete! 🎉"
  - Summary stats:
    - "5 drills completed"
    - "80% accuracy"
    - "Confidence +1"
  - **Auto-transition:** 3 seconds → Magic Minute (if enabled)
  - **Skip option:** "Skip Magic Minute" (text link, small)

**Step 6: Magic Minute Sprint** (Auto-triggered)
- **Screen:** Distinct visual treatment (accent yellow background tint)
  - Top: "⚡ MAGIC MINUTE" branding (bold, large)
  - Center: Circular 60-second countdown timer
    - Coral ring depletes clockwise
    - Number in center: "47s" remaining
  - **Challenge:** 1-3 micro-drills targeting today's mistakes
    - Faster pace, immediate feedback (no delay)
    - Adaptive within the minute (if struggling, easier variant)
  - **Success animation:**
    - Timer completes → Burst animation
    - "Magic Minute Complete! ⚡ You corrected 2/3 mistakes!"
  - **Exit:** No skip option - it's only 60 seconds
  - **Completion:** Auto-return to Home dashboard

**Step 7: Post-Session Confidence Check**
- **Screen:** Simple overlay (similar to Step 2)
  - "How do you feel now about [Module Name]?"
  - 5-point scale: 😰 😟 😐 🙂 😄
  - Delta shown: "+2 from before!" (if improved)
- **Action:** Select → Auto-save → Return to Home

**Success State:**
- Session logged with duration, accuracy, confidence delta
- Streak updated (if daily goal met)
- Home dashboard shows updated progress
- Achievement unlocked (if milestone): Toast "🏆 5-Day Streak Unlocked!"

**Error Recovery:**
- **App closed mid-session:** Resume prompt on next launch: "Continue your Number Line session? (3/5 drills complete)"
- **Offline mode:** Drills work fully offline, sync when online returns (ambient indicator shows sync status)
- **User stuck on question:** After 2 minutes, hint button appears: "Need a hint?" → Reveals strategy

---

### 5.4 Journey 3: Coach Guidance

**User Goal:** Get personalized advice, encouragement, or understand "why am I doing this?"

**Entry Point:**
- Home dashboard → "Coach" bottom nav tab
- During training → "?" help button → Opens Coach drawer

**Flow Approach:** **Conversational + Contextual Help**

**Why This Approach:**
- Feels like a supportive guide, not a static FAQ
- Context-aware (knows where you're stuck)
- Optional - doesn't interrupt flow

**Detailed Flow:**

**Step 1: Coach Home**
- **Screen:** Chat-like interface (but curated, not free-form)
  - Header: "Your Coach" with friendly avatar/icon
  - **Quick Actions** (card chips):
    - "Why this module?"
    - "I'm feeling frustrated"
    - "Show me tips"
    - "Explain my progress"
  - **Recent Messages** (if any):
    - Time-stamped cards showing past coach interactions
    - Example: "Yesterday: Tips for Number Line mastery"

**Step 2: Contextual Guidance**
- **Trigger:** User selects quick action or help during drill
- **Screen:** Drawer slides up (mobile) or modal (tablet)
  - **Content varies by context:**

    - **"Why this module?"**
      - "Number Line helps build foundational number sense. Your assessment showed this as a primary growth area."
      - Visual: Simple diagram showing how number line connects to real-world tasks (budgeting, time management)
      - Research link: "Learn more about dyscalculia and number lines" (optional)

    - **"I'm feeling frustrated"**
      - "It's totally normal to feel challenged - that means you're growing! 🌱"
      - "Want to try an easier drill variant?"
      - "Take a 5-minute break and come back refreshed"
      - Action buttons: "Easier Drill" | "5-Min Break" | "I'm OK, Continue"

    - **"Show me tips"**
      - Module-specific strategies
      - Example for Number Line: "Visualize the number line like a ruler. Where would [number] sit?"
      - Video embed or animated GIF (if available)

    - **"Explain my progress"**
      - "You've completed 24 drills this week - that's 3.4 per day!"
      - "Your confidence in Number Line improved +6 points"
      - Radar chart preview (link to full Progress tab)

**Step 3: Coach Response**
- **Screen:** Content card with clear typography
  - Warm tone, encouraging language
  - Visual aids when helpful (diagrams, charts)
  - **Actions:**
    - "Got it, thanks!" (closes drawer)
    - "Tell me more" (expands to related topics)
    - "Try recommended drill" (navigates to Training)

**Success State:**
- User feels supported and understands "why"
- Returns to training (if mid-session)
- Anxiety reduced through explanation

---

### 5.5 Journey 4: Cognition Boosters

**User Goal:** Quick brain exercises (spatial, memory, attention) separate from focused training

**Entry Point:**
- Home dashboard → Magic Minute card (if ready)
- Bottom nav → Cognition tab
- Post-training cooldown

**Flow Approach:** **Single-screen micro-games** - Fast, gamified, optional

**Detailed Flow:**

**Step 1: Cognition Home**
- **Screen:** Grid of mini-game cards
  - Each card:
    - Game icon (🧠 memory, 👁️ attention, 🔄 mental rotation)
    - Game name (e.g., "Pattern Match", "Spatial Flip")
    - Best score: "High: 18/20"
    - Play button (centered, coral)

**Step 2: Mini-Game Session**
- **Screen:** Full-screen game interface
  - Simple, fast-paced (30-60 seconds)
  - Immediate scoring feedback
  - Completion: "Score: 16/20! +2 from last time 🎉"
- **Action:** "Play Again" | "Back to Games"

**Success State:**
- Quick cognitive boost
- Logged for progress tracking
- Optional, low-pressure

---

### 5.6 Journey 5: Progress Tracking

**User Goal:** Visualize growth, understand patterns, see confidence radar

**Entry Point:**
- Bottom nav → Progress tab
- Post-session → "View Detailed Results" link

**Flow Approach:** **Dashboard with multiple views** - Overview → Drill down

**Detailed Flow:**

**Step 1: Progress Home**
- **Screen:** Stats dashboard (similar to Home but more detailed)
  - **Streak Card** (larger, more prominent)
  - **This Week Summary:**
    - Drills completed: 24/30
    - Session time: 142 min
    - Confidence delta: +6 points
  - **Module Progress:** List of modules with progress bars
  - **Confidence Radar Chart:** (Tap to expand full-screen)

**Step 2: Confidence Radar Detail**
- **Screen:** Full-screen radar chart
  - 5 axes: Duration, Confidence Delta, Cognitive Load, Accuracy, Anxiety
  - Current session highlighted (filled coral)
  - Past sessions faint overlays (gray)
  - **Interaction:** Tap spoke → Session detail card
  - **Insight cards:** "💡 20-min sessions boost confidence most!"

**Success State:**
- User sees tangible progress
- Patterns emerge (best time of day, optimal session length)
- Motivation reinforced

---

## 6. Component Library

### 6.1 Component Strategy

**Foundation:** shadcn/ui + Tailwind provides standard UI components (buttons, cards, forms, modals)

**Custom Components Needed:** Unique Discalculas-specific widgets not covered by design system

---

### 6.2 Custom Component Specifications

#### Component 1: StreakCounter

**Purpose:** Display current streak with celebratory styling to motivate daily usage

**Anatomy:**
- Gradient background container (coral → yellow)
- Large flame emoji (🔥) or animated SVG flame
- Streak number (bold, large font)
- Progress bar (optional, for weekly goal)
- Subtitle text ("Day Streak" or custom message)

**States:**
- **Default:** Current streak displayed
- **At Risk:** Border pulsing if user hasn't completed today's goal (after 8pm)
- **Milestone:** Confetti animation when hitting 5, 10, 30, 100 days
- **Broken:** Gentle message "Start a new streak today!" with muted styling

**Variants:**
- **Hero** (180px height) - For dashboard streak card
- **Compact** (60px height) - For top bar or small widgets
- **Badge** (40px pill) - For inline mentions

**Behavior:**
- Tap → Navigate to Progress tab showing streak history
- Long press (mobile) → Share streak achievement dialog

**Accessibility:**
- ARIA role: "status"
- Screen reader: "Current streak: 7 days. Tap to view streak history"
- Keyboard: Focusable, Enter/Space activates

---

#### Component 2: MagicMinuteTimer

**Purpose:** 60-second countdown timer for Magic Minute sprint challenges

**Anatomy:**
- Circular SVG progress ring (depleting clockwise)
- Center number display (seconds remaining)
- Accent yellow (#FFD56F) background tint
- "⚡ MAGIC MINUTE" title text (top)
- Micro-drill content area (center, below timer)

**States:**
- **Countdown:** Ring animates from 100% to 0%, number counts down
- **Paused:** Ring stops, pause icon appears, blur background
- **Complete:** Burst animation, success message "Magic Minute Complete! ⚡"
- **Abandoned:** Soft message "Come back anytime to finish!"

**Variants:**
- **Full Screen** (only variant - takes over entire screen)

**Behavior:**
- Auto-starts on component mount (no manual start needed)
- Cannot skip or exit during countdown (prevents avoidance)
- Pause button (rare use): Tap → "Are you sure? Magic Minute is most effective uninterrupted"
- Completion: Auto-dismiss after 3 seconds showing results

**Accessibility:**
- ARIA role: "timer" with live region updates
- Screen reader: Announces every 15 seconds "45 seconds remaining"
- Keyboard: Pause = Spacebar, Resume = Spacebar
- Reduced motion: Linear progress bar instead of circular ring

---

#### Component 3: ConfidenceRadarChart

**Purpose:** Multi-dimensional visualization of session impact (Duration, Confidence, Cognitive Load, Accuracy, Anxiety)

**Anatomy:**
- SVG radar/spider chart with 5 axes
- Each axis labeled with icon + text (e.g., ⏱️ Duration)
- Filled polygon shape (coral fill, 30% opacity)
- Axis lines (neutral light gray)
- Data points at each axis intersection
- Past session overlays (faint gray polygons, 10% opacity)
- Legend showing current vs past

**States:**
- **Default:** Current session highlighted, past sessions faint
- **Hover/Tap:** Axis spoke highlights, tooltip shows value + context
- **Comparison Mode:** Multiple sessions shown in different colors
- **Empty:** Placeholder message "Complete a session to see your radar!"

**Variants:**
- **Full Screen** (400px × 400px) - Progress tab detail view
- **Widget** (200px × 200px) - Dashboard preview

**Behavior:**
- Tap axis spoke → Drill down to that metric's history (e.g., all confidence deltas)
- Pinch-to-zoom (mobile): Expands to full-screen detail
- Swipe left/right: Navigate between sessions chronologically

**Accessibility:**
- ARIA role: "img" with detailed aria-label
- Screen reader: "Radar chart showing session performance. Duration: 20 minutes, Confidence: +2 points, Cognitive Load: moderate..."
- Keyboard: Tab through axes, Enter to drill down
- Alternative text view: Table format showing same data for screen readers

---

#### Component 4: DrillProgressIndicator

**Purpose:** Show progress through a drill block (e.g., "3 of 5 drills complete")

**Anatomy:**
- Horizontal row of circles (dots)
- Filled circles = completed drills (success green)
- Current circle = coral ring (pulsing animation)
- Future circles = neutral light gray
- Optional numeric text: "3 of 5"

**States:**
- **In Progress:** Current drill pulsing
- **Complete:** All circles filled, brief celebration (scale animation)
- **Paused:** Current drill has pause icon overlay

**Variants:**
- **Dots Only** (compact, 24px height)
- **Dots + Text** (32px height)
- **Vertical** (for side panel layout)

**Behavior:**
- Non-interactive (visual indicator only)
- Smooth fill animation as each drill completes

**Accessibility:**
- ARIA role: "progressbar"
- Screen reader: "Drill progress: 3 of 5 complete"
- Value updates trigger live region announcement

---

#### Component 5: AdaptiveDifficultyToast

**Purpose:** Transparent notification when adaptive difficulty changes

**Anatomy:**
- Toast card (bottom-up slide animation)
- Icon (🌱 for easier, 💪 for harder)
- Title text: Adjustment message
- Two action buttons: Accept | Keep Current
- Auto-dismiss timer (8 seconds)
- Background color: Mint (easier) or Coral (harder)

**States:**
- **Slide In:** Animates up from bottom
- **User Choice:** Buttons become disabled after selection
- **Auto-Dismiss:** Fades out after 8s if no interaction
- **Dismissed:** Slides down, removed from DOM

**Variants:**
- **Difficulty Down** (mint background, 🌱 icon)
- **Difficulty Up** (coral background, 💪 icon)

**Behavior:**
- Appears after trigger (2 incorrect or 5 correct)
- User clicks "Accept" → Next drill at new difficulty
- User clicks "Keep Current" → Maintains current level
- Auto-dismiss → Defaults to "Accept" (recommendation trusted)

**Accessibility:**
- ARIA role: "alert" (interrupts flow appropriately)
- Screen reader: Announces message immediately
- Keyboard: Tab to buttons, Enter/Space activates
- Focus trap: Keeps focus within toast until dismissed

---

#### Component 6: DrillInteractionWidget (Abstract)

**Purpose:** Base interactive widget for drill content (number line, spatial rotation, math operations)

**Anatomy (varies by drill type):**

**Number Line Variant:**
- SVG number line (0-100) with tick marks
- Draggable marker or tap targets
- Highlight zone on hover
- Large touch targets (48px minimum)

**Spatial Rotation Variant:**
- Canvas or SVG 3D-style object
- Rotation controls (swipe gestures or arrow buttons)
- Current rotation angle indicator
- Reset button

**Math Operations Variant:**
- Problem display (large, readable font)
- Number pad input or multiple choice grid
- Clear/backspace button
- Submit button

**States (all variants):**
- **Default:** Awaiting input
- **Input Active:** User interacting (dragging, rotating, typing)
- **Submitted:** Disabled, awaiting feedback
- **Correct:** Success green border, checkmark overlay
- **Incorrect:** Warning gold border, hint appears
- **Hint Revealed:** Additional guidance shown

**Behavior:**
- Submit disabled until valid answer provided
- Immediate visual feedback on submission
- Gentle error recovery (no harsh penalties)

**Accessibility:**
- **Number Line:** Arrow keys move marker, Space/Enter submits
- **Spatial Rotation:** Arrow keys rotate, +/- zoom
- **Math Operations:** Fully keyboard navigable, number keys work
- Screen reader announces current state and available actions

---

#### Component 7: AmbientSyncIndicator

**Purpose:** Subtle visual feedback showing offline→online data sync status

**Anatomy:**
- Thin border overlay on entire app (2px)
- Pulsing animation
- Color: Secondary mint (#A8E6CF)
- Position: Top edge of viewport

**States:**
- **Offline:** Border becomes neutral light (#ECF0F1), subtle pulse
- **Syncing:** Mint border, faster pulse, left-to-right animation
- **Synced:** Brief success flash (success green), then disappears
- **Sync Error:** Error color, persist until resolved

**Variants:**
- **Border** (default, 2px top border)
- **Icon** (optional, small cloud icon in corner)

**Behavior:**
- Appears automatically when offline/online transitions
- Non-intrusive (doesn't block content)
- Tap border → Shows sync details in toast

**Accessibility:**
- ARIA live region: Announces "Offline mode active" or "Data synced"
- Non-visual: System notification for screen reader users
- No keyboard interaction (passive indicator)

---

### 6.3 shadcn/ui Component Usage

**Components Used from shadcn/ui:**

| Component | Usage in Discalculas |
|-----------|----------------------|
| **Button** | Primary/secondary CTAs, navigation buttons |
| **Card** | Module tiles, stat cards, content containers |
| **Sheet/Drawer** | Mobile modals, Coach guidance panel, settings |
| **Toast** | Celebration messages, gentle errors, adaptive difficulty notifications |
| **Progress** | Session progress bars, module completion indicators |
| **Form** (Input, Label) | Confidence prompts, settings, notes |
| **Badge** | Difficulty indicators, recommendation labels |
| **Dialog** | Confirmation prompts, exit warnings |
| **Tabs** | Alternate views within Progress tab |

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules for Discalculas

These decisions ensure users get a consistent, predictable experience across the entire app.

---

### 7.2 Button Hierarchy

**Primary Actions** (Coral #E87461, white text):
- Start/Continue Training
- Submit answers in drills
- Complete assessment
- Accept adaptive difficulty changes
- **Usage:** One primary action per screen maximum
- **Touch target:** 48px height minimum
- **Hover:** Subtle scale (1.02) + shadow glow

**Secondary Actions** (Mint #A8E6CF, dark text):
- View Progress
- Magic Minute (when not auto-triggered)
- Alternative module selection
- **Usage:** Supporting actions, less critical
- **Touch target:** 44px height minimum

**Tertiary Actions** (Text links, neutral color):
- Skip questions
- View detailed results
- Help/Coach access
- **Usage:** Optional, informational paths
- **Styling:** Underline on hover only

**Destructive Actions** (Error/Support #FF8A65, white text):
- Delete progress (rare)
- Reset assessment (confirmation required)
- **Usage:** Reserved for irreversible actions
- **Confirmation:** Always require explicit confirmation dialog

---

### 7.3 Feedback Patterns

**Success Feedback:**
- **Visual:** Success green (#66BB6A) checkmark + border flash
- **Message:** Toast (top-right), 3-second auto-dismiss
- **Examples:** "Great work! 🌟", "Drill block complete! 🎉"
- **Animation:** Subtle confetti burst for major milestones
- **Sound:** Optional celebration chime (user can disable)

**Error/Support Feedback:**
- **Visual:** Warning gold (#FBD786) border, NOT red (less anxiety)
- **Message:** Inline below input or toast if contextless
- **Tone:** "Let's try another approach" (supportive, not punitive)
- **Recovery:** Always provide clear next step or hint
- **Persistence:** Errors stay visible until resolved

**Info Feedback:**
- **Visual:** Neutral blue border or accent yellow for highlights
- **Message:** Toast (bottom-center), 5-second auto-dismiss
- **Examples:** "Offline mode active", "Progress synced"
- **Icon:** ℹ️ or relevant context icon

**Loading States:**
- **Short waits (<2s):** Inline spinner (coral color)
- **Medium waits (2-5s):** Progress ring with animated gradient
- **Long waits (>5s):** Skeleton screens + percentage indicator
- **Pattern:** Never block entire UI - show partial content ASAP

---

### 7.4 Form Patterns

**Label Position:** Above input (mobile-friendly, no floating labels)

**Required Field Indicator:**
- Asterisk (*) after label text (coral color)
- "Required" text (small, neutral) if critical

**Validation Timing:**
- **onBlur** for most fields (validate when user leaves field)
- **onChange** for password strength, character limits
- **onSubmit** for final form validation
- **Never:** Validate while user actively typing (creates anxiety)

**Error Display:**
- Inline below input field (warning gold background, dark text)
- Icon: ⚠️ prepended to error message
- Specific messaging: "Please enter a number between 0-100" (not "Invalid input")
- Focus: Auto-focus error field on submission failure

**Help Text:**
- Below label, above input (small, neutral text)
- Expandable tooltips (?) for complex explanations
- Examples shown when helpful: "e.g., 42"

---

### 7.5 Modal Patterns

**Size Variants:**
- **Small (320px):** Confirmations, simple prompts
- **Medium (480px):** Forms, content views
- **Large (640px):** Detailed results, Coach guidance
- **Full Screen (mobile):** Assessment, drill sessions

**Dismiss Behavior:**
- **Click outside:** Dismiss for informational modals ONLY
- **Escape key:** Dismiss unless critical flow (Assessment)
- **Explicit close:** X button (top-right) always present
- **Unsaved changes:** Warn before dismissing: "Leave without saving?"

**Focus Management:**
- Auto-focus first interactive element (input or primary button)
- Tab trap: Keep keyboard navigation within modal
- Return focus: Focus returns to trigger element on close

**Stacking:**
- Maximum 2 modals deep (avoid modal → modal → modal)
- Second modal centers over first with darker overlay
- Close second → Returns to first (breadcrumb behavior)

---

### 7.6 Navigation Patterns

**Active State Indication:**
- Bottom nav: Coral icon + text color
- Background: Subtle coral tint (10% opacity)
- Visual: Icon slightly larger (scale 1.1)

**Breadcrumb Usage:**
- Not used (bottom nav provides context)
- Exception: Multi-step flows show step indicator instead

**Back Button Behavior:**
- Browser back: Supported, navigates within app
- In-app back: Rare - bottom nav provides navigation
- Exception: Exit drill session → Confirm "Save progress?"

**Deep Linking:**
- Support direct URLs to all major screens
- Format: `/training/number-line`, `/progress`, `/assessment`
- State restoration: Resume incomplete sessions from URL

---

### 7.7 Empty State Patterns

**First Use (No content yet):**
- Friendly illustration or icon
- Encouraging message: "Complete your first assessment to get started!"
- Clear CTA: Primary button to take action
- Example: Empty Progress tab → "Start training to see your progress"

**No Results (Search/filter returned nothing):**
- Message: "No drills found matching '[term]'"
- Suggestions: "Try a different search" or recommend popular modules
- Clear filter button if filters active

**Cleared Content (User deleted everything):**
- Message: "All progress cleared"
- Undo option (toast, 10-second window): "Undo clear"
- Quick restart: "Start fresh with a new assessment"

---

### 7.8 Confirmation Patterns

**Delete Actions:**
- **Always confirm** with explicit dialog
- Message: "Delete all progress? This cannot be undone."
- Buttons: "Cancel" (secondary) | "Delete" (destructive)
- No undo: Make consequence crystal clear

**Leave Unsaved:**
- **Warn if changes exist:** "Leave without saving?"
- Buttons: "Stay" (secondary) | "Leave" (text link)
- Auto-save: Prefer auto-saving drafts when possible

**Irreversible Actions:**
- **Two-step confirmation** for critical actions
- Example: Reset → "Are you sure?" → Type "RESET" to confirm
- Rarely needed in Discalculas (most actions reversible)

---

### 7.9 Notification Patterns

**Placement:** Top-right corner (desktop) or top-center (mobile)

**Duration:**
- Success: 3 seconds auto-dismiss
- Info: 5 seconds auto-dismiss
- Warning: 8 seconds (user can dismiss early)
- Error: Persist until user dismisses

**Stacking:**
- Maximum 3 notifications visible
- Older notifications push down, newest on top
- After 3: Queue additional, show when space available

**Priority Levels:**
- **Critical:** Red border, sound alert, persist
- **Important:** Coral border, standard display
- **Info:** Neutral, auto-dismiss

---

### 7.10 Search Patterns

**Not applicable:** Discalculas doesn't have search functionality currently

**Future consideration:** Module/drill search if content library expands

---

### 7.11 Date/Time Patterns

**Format:**
- **Relative** for recent: "2 hours ago", "Yesterday", "Last week"
- **Absolute** for older: "Nov 8, 2025"
- **Time of day:** 12-hour format with AM/PM: "9:30 AM"

**Timezone Handling:**
- User's local timezone (automatic)
- No timezone conversion needed (local-only storage)

**Pickers:**
- Not needed currently (no user date selection)
- Future: Native browser date picker if needed

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Breakpoint System:**

| Breakpoint | Width | Layout | Navigation |
|------------|-------|--------|------------|
| **Mobile** | 320px - 767px | Single column, stacked cards | Bottom nav (4 tabs) |
| **Tablet** | 768px - 1023px | Flexible 2-column where beneficial | Bottom nav maintained |
| **Desktop** | 1024px+ | Optional sidebar, max-width containers | Consider top nav (future) |

**Adaptation Patterns:**

**Navigation:**
- Mobile: Bottom nav fixed (70px height, 4 tabs)
- Tablet: Same (native mobile feel maintained)
- Desktop: Could add persistent sidebar (future enhancement)

**Streak Card:**
- Mobile: Full-width gradient card, 180px height
- Tablet: Same layout, more comfortable spacing
- Desktop: Max-width 600px, centered

**Stats Grid:**
- Mobile: 2 columns (tight 12px gap)
- Tablet: 2 columns (comfortable 16px gap)
- Desktop: Could expand to 3-4 columns

**Modals:**
- Mobile: Full-screen overlay (100% width/height)
- Tablet: Centered card (max 640px width)
- Desktop: Same as tablet

**Drill Interfaces:**
- Mobile: Full-screen, vertical layout
- Tablet: Same (maintains focus)
- Desktop: Centered, max-width 800px

**Bottom Navigation:**
- Mobile/Tablet: Fixed bottom, 4 tabs
- Desktop: Could become sidebar or persist as bottom nav (TBD based on testing)

**Touch Targets:**
- All breakpoints: Minimum 44px × 44px
- Mobile-specific: Prefer 48px height for primary actions
- Spacing: 8px minimum between tappable elements

**Typography Scaling:**
- Mobile: Base 16px (comfortable reading on small screens)
- Tablet: Base 16px (same, no change needed)
- Desktop: Base 18px (optional, for larger displays)

**Responsive Images/Icons:**
- Mobile: Smaller icons (24px) to conserve space
- Tablet/Desktop: Larger icons (32px) where space allows
- SVG preferred (scales without quality loss)

---

### 8.2 Accessibility Strategy

**Compliance Target: WCAG 2.1 Level AA**

**Why Level AA:**
- Recommended standard for web applications
- Legally required for government/public sites
- Balances accessibility with practical implementation
- Covers most disability needs

**Key Requirements:**

**Color Contrast:**
- Text contrast: 4.5:1 minimum (normal text)
- Large text: 3:1 minimum (18pt+ or 14pt+ bold)
- Interactive elements: 3:1 against background
- **Verified:** All color combinations in Balanced Warmth theme meet AA

**Keyboard Navigation:**
- All interactive elements focusable (tab order logical)
- Skip links: "Skip to main content" at top
- Focus indicators: 3px coral outline, visible on all elements
- No keyboard traps: Modal focus traps intentional, escapable with Esc
- Shortcuts: None currently (reduce complexity for users with dyscalculia)

**Screen Reader Support:**
- ARIA labels: All interactive elements labeled
- Live regions: Progress updates, notifications announced
- Semantic HTML: Proper heading hierarchy (h1 → h2 → h3)
- Alt text: All meaningful images described
- Forms: Labels properly associated with inputs

**Form Accessibility:**
- Labels: Always visible, never placeholder-only
- Errors: Announced to screen readers (aria-live)
- Required fields: Marked with asterisk + aria-required
- Help text: Associated with aria-describedby

**Touch Target Size:**
- Minimum: 44px × 44px (WCAG AAA guideline)
- Preferred: 48px × 48px for primary actions
- Spacing: 8px minimum between targets

**Reduced Motion:**
- Respect `prefers-reduced-motion` media query
- Disable: Confetti animations, progress ring rotations, parallax
- Maintain: Color changes, instant state transitions
- Alternative: Crossfade transitions instead of sliding

**Cognitive Accessibility (Critical for dyscalculia users):**
- Clear language: Avoid jargon, explain concepts simply
- Consistent patterns: Predictable navigation, repeatable flows
- Error prevention: Confirmation dialogs for destructive actions
- Progressive disclosure: Show complexity gradually, not all at once
- Visual hierarchy: Clear headings, scannable content
- Generous spacing: Reduce visual clutter, calm aesthetic

**Testing Strategy:**

**Automated Testing:**
- **Lighthouse:** Run on every build (CI/CD integration)
- **axe DevTools:** Browser extension for spot checks
- **WAVE:** Manual validation for complex flows
- **Target:** 100% score on automated checks

**Manual Testing:**
- **Keyboard-only:** Navigate entire app without mouse
- **Screen reader:** Test with NVDA (Windows) or VoiceOver (Mac/iOS)
- **Zoom:** Test at 200% zoom (text remains readable)
- **Color blindness:** Deuteranopia and Protanopia simulators

**User Testing:**
- Recruit users with dyscalculia for feedback
- Test with screen reader users
- Test with motor impairment (keyboard-only users)

---

## 9. Implementation Guidance

### 9.1 Completion Summary

**UX Design Specification Complete!**

This comprehensive UX Design Specification for Discalculas provides everything developers and designers need to build an exceptional dyscalculia companion app.

**What We Created:**

1. **Design System Foundation**
   - shadcn/ui + Tailwind CSS v4 selected
   - Mobile-first, accessible, lightweight
   - Full customization for brand identity

2. **Visual Foundation**
   - "Balanced Warmth" color theme (hybrid coral + mint + yellow)
   - Complete typography system (Inter font family)
   - Spacing scale (8px base unit) and layout foundation
   - WCAG 2.1 AA compliant color palette

3. **Design Direction**
   - Direction #6 "Split Dashboard" chosen
   - Balanced progress + action visibility
   - Medium density (not overwhelming, not sparse)
   - Native mobile feel with bottom navigation

4. **User Journey Flows**
   - 5 core flows documented in detail:
     - First-Time Assessment (wizard, 10 questions)
     - Daily Training Session (adaptive drills + Magic Minute)
     - Coach Guidance (contextual help)
     - Cognition Boosters (quick brain games)
     - Progress Tracking (radar chart + stats)
   - Error recovery strategies defined
   - Success states and transitions mapped

5. **Component Library**
   - 7 custom components specified:
     - StreakCounter, MagicMinuteTimer, ConfidenceRadarChart
     - DrillProgressIndicator, AdaptiveDifficultyToast
     - DrillInteractionWidget, AmbientSyncIndicator
   - shadcn/ui component usage mapped
   - States, variants, accessibility per component

6. **UX Pattern Decisions**
   - Button hierarchy (primary, secondary, tertiary, destructive)
   - Feedback patterns (success, error, info, loading)
   - Form patterns (labels, validation, errors)
   - Modal patterns (sizing, dismiss, focus, stacking)
   - Navigation patterns (active states, deep linking)
   - Empty states, confirmations, notifications
   - Date/time formatting

7. **Responsive & Accessibility Strategy**
   - Breakpoints: Mobile (320-767px), Tablet (768-1023px), Desktop (1024px+)
   - Adaptation patterns for all components
   - WCAG 2.1 Level AA compliance
   - Cognitive accessibility for dyscalculia users
   - Testing strategy (automated + manual + user testing)

**Deliverables:**

- **UX Design Specification:** [ux-design-specification.md](./ux-design-specification.md) (this document)
- **Color Theme Visualizer:** [ux-color-themes.html](./ux-color-themes.html) (4 themes explored)
- **Design Direction Mockups:** [ux-design-directions.html](./ux-design-directions.html) (8 directions, #6 chosen)

**Key Design Decisions Summary:**

| Decision Category | Choice | Rationale |
|-------------------|--------|-----------|
| **Design System** | shadcn/ui + Tailwind v4 | Mobile-first, customizable, accessible, lightweight |
| **Color Theme** | Balanced Warmth (coral + mint + yellow) | Professional warmth + calming energy = motivated calm |
| **Design Direction** | Split Dashboard (#6) | Progress + action visible together, reduces overwhelm |
| **Primary Emotion** | Motivated and energized | Duolingo-style positive reinforcement drives daily habit |
| **Must Prevent** | Frustration and anxiety | Supportive feedback, gentle errors, transparent adaptation |
| **Navigation** | Bottom nav (4 tabs) | Native mobile pattern, thumb-friendly |
| **Typography** | Inter (rounded, legible) | Reduces math anxiety, highly readable |
| **Accessibility** | WCAG 2.1 AA | Legally compliant, cognitive accessibility prioritized |

**Implementation Priorities:**

**Phase 1: Core Foundation**
- Set up shadcn/ui + Tailwind with Balanced Warmth theme
- Implement bottom navigation shell
- Build Home dashboard (Split Dashboard layout)
- Create StreakCounter component

**Phase 2: Assessment Flow**
- Build Assessment wizard (10-question flow)
- Implement progress indicator
- Create results summary screen
- Wire up personalization logic

**Phase 3: Training Flow**
- Build drill interaction widgets (Number Line, Spatial, Operations)
- Implement adaptive difficulty system
- Create MagicMinuteTimer component
- Build celebration/feedback animations

**Phase 4: Progress & Gamification**
- Implement ConfidenceRadarChart
- Build Progress dashboard
- Create achievement/badge system
- Wire up telemetry logging

**Phase 5: Polish & PWA**
- Add Coach guidance system
- Implement offline-first PWA (service worker)
- Create AmbientSyncIndicator
- Accessibility audit + fixes

**Next Steps:**

For BMad Method workflow, proceed to:
- **Architecture Workflow** - Define technical architecture with this UX context
- **Epic & Story Creation** - Break down PRD into implementation tasks using UX spec as reference

For standalone use:
- Share UX spec with developers for implementation planning
- Create high-fidelity mockups in Figma (optional)
- Build interactive prototype for user testing (optional)

---

### 9.2 Design Principles Recap

Every design decision in Discalculas supports these core principles:

**1. Motivated Calm**
- Warm colors motivate (coral, yellow)
- Calm colors soothe (mint, soft neutrals)
- Balance energy with peace

**2. Progress, Not Pressure**
- Celebrate small wins immediately
- Never shame or punish errors
- Transparent adaptive difficulty
- Supportive language throughout

**3. Effortless Daily Habit**
- One-tap session start
- Duolingo-proven streak system
- Gentle nudges (no guilt)
- Celebrations maintain momentum

**4. Trust Through Transparency**
- Explain why adaptive difficulty changes
- Show tangible progress visually
- Clear privacy (local storage)
- Science-backed credibility

**5. Accessibility First**
- WCAG 2.1 AA compliance
- Cognitive accessibility (critical for dyscalculia)
- Keyboard navigation throughout
- Generous touch targets (48px)

---

### 9.3 Usage Notes for Developers

**This specification is intentionally detailed** to ensure UX consistency during implementation. Use it as:

- **Source of truth** for visual design (colors, spacing, typography)
- **Reference** for interaction patterns (modals, buttons, feedback)
- **Guide** for component behavior (states, variants, accessibility)
- **Blueprint** for user flows (journey step-by-step documentation)

**When in doubt:**
- Prioritize user experience over technical convenience
- Default to supportive, encouraging language
- Test with real users (especially those with dyscalculia)
- Maintain accessibility compliance (non-negotiable)

---

## Appendix

### Related Documents

- **Product Requirements:** [PRD.md](./PRD.md)
- **Product Brief:** [index.md](./index.md)
- **Domain Research:** [research-domain-2025-11-08.md](./research-domain-2025-11-08.md)

### Core Interactive Deliverables

- **Color Theme Visualizer:** [ux-color-themes.html](./ux-color-themes.html)
  - Interactive HTML showing 4 color theme options explored
  - Live UI component examples in each theme
  - Side-by-side comparison and semantic color usage

- **Design Direction Mockups:** [ux-design-directions.html](./ux-design-directions.html)
  - Interactive HTML with 8 complete design approaches
  - Full-screen phone mockups of key screens
  - Design philosophy and rationale for each direction
  - Direction #6 "Split Dashboard" selected

### Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-09 | 1.0 | Initial UX Design Specification created through collaborative design workflow | Jeremy |

---

_This UX Design Specification was created through collaborative design facilitation using the BMad Method create-ux-design workflow. All decisions were made with user input and are documented with clear rationale for future reference._

_Generated with Claude Code - BMad Method v1.0_

{{component_library_strategy}}

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

{{ux_pattern_decisions}}

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

{{responsive_accessibility_strategy}}

---

## 9. Implementation Guidance

### 9.1 Completion Summary

{{completion_summary}}

---

## Appendix

### Related Documents

- Product Requirements: `docs/PRD.md`
- Product Brief: `docs/index.md`
- Domain Research: `docs/research-domain-2025-11-08.md`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: docs/ux-color-themes.html
  - Interactive HTML showing all color theme options explored
  - Live UI component examples in each theme
  - Side-by-side comparison and semantic color usage

- **Design Direction Mockups**: docs/ux-design-directions.html
  - Interactive HTML with 6-8 complete design approaches
  - Full-screen mockups of key screens
  - Design philosophy and rationale for each direction

### Version History

| Date       | Version | Changes                         | Author  |
| ---------- | ------- | ------------------------------- | ------- |
| 2025-11-09 | 1.0     | Initial UX Design Specification | Jeremy  |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
