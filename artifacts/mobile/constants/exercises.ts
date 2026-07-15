export interface ExerciseCategory {
  category: string;
  exercises: string[];
}

export const EXERCISE_LIBRARY: ExerciseCategory[] = [
  {
    category: 'Chest',
    exercises: [
      'Barbell Bench Press',
      'Incline Dumbbell Press',
      'Push-Up',
      'Cable Fly',
      'Dips',
    ],
  },
  {
    category: 'Back',
    exercises: [
      'Deadlift',
      'Pull-Up',
      'Barbell Row',
      'Lat Pulldown',
      'Seated Cable Row',
    ],
  },
  {
    category: 'Legs',
    exercises: [
      'Back Squat',
      'Front Squat',
      'Romanian Deadlift',
      'Walking Lunge',
      'Leg Press',
      'Calf Raise',
    ],
  },
  {
    category: 'Shoulders',
    exercises: [
      'Overhead Press',
      'Lateral Raise',
      'Face Pull',
      'Arnold Press',
    ],
  },
  {
    category: 'Arms',
    exercises: [
      'Barbell Curl',
      'Hammer Curl',
      'Tricep Pushdown',
      'Skull Crusher',
    ],
  },
  {
    category: 'Core',
    exercises: ['Plank', 'Hanging Leg Raise', 'Cable Crunch', 'Sit-Up'],
  },
  {
    category: 'Cardio',
    exercises: ['Running', 'Treadmill Run', 'Rowing Machine', 'Cycling', 'Jump Rope'],
  },
];

// Exercises that support the "tailor your run" flow (run type + interval
// repeats) in the exercise picker.
export const RUNNING_EXERCISE_NAMES = ['Running', 'Treadmill Run'];

export function isRunningExercise(name: string): boolean {
  return RUNNING_EXERCISE_NAMES.includes(name);
}

export type RunType = 'Easy' | 'Tempo' | 'Long' | 'Interval';

export const RUN_TYPES: { type: RunType; label: string; description: string; icon: string }[] = [
  { type: 'Easy', label: 'Easy Run', description: 'Relaxed, steady pace', icon: 'sun' },
  { type: 'Tempo', label: 'Tempo Run', description: 'Sustained, comfortably hard', icon: 'trending-up' },
  { type: 'Long', label: 'Long Run', description: 'Distance-building endurance', icon: 'map' },
  { type: 'Interval', label: 'Interval Repeats', description: 'e.g. 6 × 400m with rest', icon: 'repeat' },
];

const CARDIO_KEYWORDS = [
  'run',
  'jog',
  'sprint',
  'bike',
  'cycle',
  'cycling',
  'row',
  'swim',
  'cardio',
  'treadmill',
  'elliptical',
  'jump rope',
];

export function looksLikeCardio(name: string): boolean {
  const lower = name.toLowerCase();
  return CARDIO_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function searchExercises(query: string): ExerciseCategory[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return EXERCISE_LIBRARY;

  return EXERCISE_LIBRARY.map((group) => ({
    category: group.category,
    exercises: group.exercises.filter((name) =>
      name.toLowerCase().includes(trimmed),
    ),
  })).filter((group) => group.exercises.length > 0);
}
