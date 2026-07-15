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
    exercises: ['Treadmill Run', 'Rowing Machine', 'Cycling', 'Jump Rope'],
  },
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
