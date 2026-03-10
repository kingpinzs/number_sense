// Personal history intake section definitions
// 13 sections covering developmental, medical, and academic history

import type { IntakeSection } from '../types';

export const INTAKE_SECTIONS: IntakeSection[] = [
  {
    id: 'medications',
    title: 'Current Medications & Medical Conditions',
    description: 'List any current medications, supplements, or diagnosed medical conditions.',
    fields: [
      {
        key: 'medications',
        label: 'Current medications and supplements',
        type: 'textarea',
        placeholder: 'List any medications you currently take...',
      },
      {
        key: 'conditions',
        label: 'Diagnosed medical conditions',
        type: 'textarea',
        placeholder: 'Any diagnosed conditions (ADHD, anxiety, etc.)...',
      },
    ],
  },
  {
    id: 'sensory',
    title: 'Vision, Hearing & Sensory',
    description: 'Any vision, hearing, or sensory processing concerns.',
    fields: [
      {
        key: 'vision',
        label: 'Vision problems or corrections',
        type: 'textarea',
        placeholder: 'Glasses, contacts, vision issues...',
      },
      {
        key: 'hearing',
        label: 'Hearing problems',
        type: 'textarea',
        placeholder: 'Any hearing difficulties...',
      },
      {
        key: 'sensory_processing',
        label: 'Sensory processing concerns',
        type: 'textarea',
        placeholder: 'Sensitivity to light, sound, textures, etc.',
      },
    ],
  },
  {
    id: 'early_childhood',
    title: 'Early Childhood (Birth - Age 6)',
    description: 'Developmental milestones and early learning experiences.',
    fields: [
      {
        key: 'birth_complications',
        label: 'Birth complications or premature birth',
        type: 'textarea',
        placeholder: 'Any complications during birth...',
      },
      {
        key: 'developmental_milestones',
        label: 'Developmental milestones (walking, talking, fine motor)',
        type: 'textarea',
        placeholder: 'Were any milestones delayed?',
      },
      {
        key: 'early_number_exposure',
        label: 'Early exposure to numbers and counting',
        type: 'textarea',
        placeholder: 'Did you learn to count early/late? Any difficulties?',
      },
    ],
  },
  {
    id: 'elementary',
    title: 'Elementary Grades (1-8)',
    description: 'Difficulties, interventions, and support during elementary school.',
    fields: [
      {
        key: 'math_difficulties',
        label: 'Math difficulties experienced',
        type: 'textarea',
        placeholder: 'What was hardest in math? When did problems start?',
      },
      {
        key: 'interventions',
        label: 'Interventions or special support received',
        type: 'textarea',
        placeholder: 'Tutoring, IEP, 504, special education, etc.',
      },
      {
        key: 'other_academic',
        label: 'Other academic difficulties',
        type: 'textarea',
        placeholder: 'Reading, writing, or other learning challenges...',
      },
    ],
  },
  {
    id: 'emotional_behavioral',
    title: 'Emotional, Behavioral & Social',
    description: 'Emotional or behavioral challenges related to learning.',
    fields: [
      {
        key: 'anxiety_depression',
        label: 'Anxiety or depression related to school/math',
        type: 'textarea',
        placeholder: 'Math anxiety, test anxiety, school avoidance...',
      },
      {
        key: 'behavioral',
        label: 'Behavioral challenges',
        type: 'textarea',
        placeholder: 'Attention difficulties, acting out, withdrawal...',
      },
      {
        key: 'social',
        label: 'Social impacts',
        type: 'textarea',
        placeholder: 'Embarrassment, peer relationships, self-esteem...',
      },
    ],
  },
  {
    id: 'high_school',
    title: 'High School (Grades 9-12)',
    description: 'Difficulties and interventions during high school.',
    fields: [
      {
        key: 'math_courses',
        label: 'Math courses taken and difficulties',
        type: 'textarea',
        placeholder: 'Highest math completed, courses failed/repeated...',
      },
      {
        key: 'accommodations',
        label: 'Accommodations or support',
        type: 'textarea',
        placeholder: 'Extra time, calculator use, tutoring, etc.',
      },
      {
        key: 'coping_strategies',
        label: 'Coping strategies developed',
        type: 'textarea',
        placeholder: 'How did you work around math difficulties?',
      },
    ],
  },
  {
    id: 'college_adult',
    title: 'College & Adult Years',
    description: 'Post-secondary education and adult life impacts.',
    fields: [
      {
        key: 'education',
        label: 'Post-secondary education and math requirements',
        type: 'textarea',
        placeholder: 'College, trade school, certification math barriers...',
      },
      {
        key: 'workplace',
        label: 'Workplace impacts',
        type: 'textarea',
        placeholder: 'Job tasks involving numbers, math-related limitations...',
      },
      {
        key: 'daily_life',
        label: 'Daily life impacts',
        type: 'textarea',
        placeholder: 'Budgeting, cooking measurements, tipping, scheduling...',
      },
    ],
  },
  {
    id: 'reasons_goals',
    title: 'Reasons for Seeking Testing & Goals',
    description: 'Why you are exploring this now and what you hope to achieve.',
    fields: [
      {
        key: 'why_now',
        label: 'What prompted you to explore this now?',
        type: 'textarea',
        placeholder: 'What triggered your interest in understanding your math difficulties?',
      },
      {
        key: 'goals',
        label: 'What do you hope to gain from this process?',
        type: 'textarea',
        placeholder: 'Understanding, accommodation, skill improvement...',
      },
    ],
  },
  {
    id: 'family_history',
    title: 'Family History',
    description: 'Family history of learning disabilities or similar difficulties.',
    fields: [
      {
        key: 'family_learning_disabilities',
        label: 'Family members with learning disabilities',
        type: 'textarea',
        placeholder: 'Parents, siblings, children with dyscalculia, dyslexia, ADHD...',
      },
      {
        key: 'family_math_difficulties',
        label: 'Family members who struggled with math',
        type: 'textarea',
        placeholder: 'Anyone in your family who had similar math difficulties?',
      },
    ],
  },
  {
    id: 'strengths',
    title: 'Talents, Strengths & Hobbies',
    description: 'What you are good at and enjoy doing.',
    fields: [
      {
        key: 'talents',
        label: 'Your talents and strengths',
        type: 'textarea',
        placeholder: 'Art, writing, verbal skills, creativity, empathy...',
      },
      {
        key: 'hobbies',
        label: 'Hobbies and interests',
        type: 'textarea',
        placeholder: 'Activities you enjoy and are good at...',
      },
    ],
  },
  {
    id: 'weaknesses',
    title: 'Weaknesses',
    description: 'Areas you find challenging beyond math.',
    fields: [
      {
        key: 'cognitive_weaknesses',
        label: 'Cognitive or academic weaknesses',
        type: 'textarea',
        placeholder: 'Memory, organization, time management, reading...',
      },
      {
        key: 'practical_weaknesses',
        label: 'Practical life weaknesses',
        type: 'textarea',
        placeholder: 'Navigation, cooking, technology, planning...',
      },
    ],
  },
  {
    id: 'future_goals',
    title: 'Immediate Future Goals',
    description: 'Your short-term goals for school, career, or personal development.',
    fields: [
      {
        key: 'school_goals',
        label: 'Education goals',
        type: 'textarea',
        placeholder: 'Courses to take, degrees to complete, certifications...',
      },
      {
        key: 'career_goals',
        label: 'Career goals',
        type: 'textarea',
        placeholder: 'Job changes, promotions, career shifts...',
      },
    ],
  },
  {
    id: 'occupation',
    title: 'Current Occupation',
    description: 'Your current work situation and how math affects it.',
    fields: [
      {
        key: 'current_job',
        label: 'Current job or occupation',
        type: 'text',
        placeholder: 'Your current role...',
      },
      {
        key: 'math_at_work',
        label: 'How math affects your work',
        type: 'textarea',
        placeholder: 'Tasks that require numbers, calculations, data...',
      },
    ],
  },
];
