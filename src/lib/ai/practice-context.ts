/**
 * Practice Context Engine
 * ------------------------------------------------------------------------
 * Given a skill-tree `nodeId`, resolves:
 *   1. The CEFR level that node teaches (A1-C2) and its grammar focus.
 *   2. Any teacher note/observation on file for that node.
 *   3. A simulated AI challenge + mock pronunciation feedback, so the
 *      Speaking Playground UI can be built and tested end-to-end without
 *      an external AI API key. Swapping the `generate*` functions below for
 *      real calls to AiPracticeService (see the backend module built
 *      earlier) is the natural next step — the UI never needs to change,
 *      since it only depends on the shapes defined here.
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LevelBand = 'A1-A2' | 'B1-B2' | 'C1-C2';

export interface TeacherNote {
  title: string;
  detail: string;
}

export interface PracticeContext {
  nodeId: string;
  exerciseTitle: string;
  cefrLevel: CEFRLevel;
  /** Standard MCER name for the level, e.g. "Umbral" for B1. */
  cefrName: string;
  levelBand: LevelBand;
  grammarFocus: string[];
  teacherNote: TeacherNote | null;
  initialChallenge: string;
  /** Total practice turns in a session, for the progress bar. */
  totalTurns: number;
}

export interface FeedbackWord {
  text: string;
  status: 'correct' | 'needs-work';
}

export interface MockFeedback {
  transcript: FeedbackWord[];
  grammarScore: number;
  pronunciationScore: number;
  fluencyDelta: number;
  vocabularyDelta: number;
  tip: string;
}

// ============================================================================
// CEFR display names & level bands
// ============================================================================

const CEFR_NAMES: Record<CEFRLevel, string> = {
  A1: 'Acceso',
  A2: 'Plataforma',
  B1: 'Umbral',
  B2: 'Avanzado',
  C1: 'Dominio operativo eficaz',
  C2: 'Maestría',
};

function getLevelBand(level: CEFRLevel): LevelBand {
  if (level === 'A1' || level === 'A2') return 'A1-A2';
  if (level === 'B1' || level === 'B2') return 'B1-B2';
  return 'C1-C2';
}

const GRAMMAR_FOCUS_BY_BAND: Record<LevelBand, string[]> = {
  'A1-A2': [
    'Present Simple & Past Simple',
    'Preguntas elementales (Wh- questions)',
    'Conectores básicos: and, but, because',
    'Transacciones cotidianas (comprar, pedir comida)',
  ],
  'B1-B2': [
    'Conditionals (1st & 2nd)',
    'Present Perfect vs. Past Simple',
    'Phrasal verbs comunes',
    'Modales de obligación/deducción: must, should, might',
    'Justificación de opiniones',
  ],
  'C1-C2': [
    'Inversión sintáctica: "Rarely have I seen..."',
    'Expresiones idiomáticas',
    'Conectores formales: nevertheless, notwithstanding',
    'Flexibilidad discursiva y matización',
  ],
};

// ============================================================================
// Mock curriculum (skill-tree nodes -> CEFR level)
// ============================================================================
// The first three ids match the SkillNode seed data from the Prisma seed
// script so a real nodeId from that table resolves here too; the rest are
// mock nodes added to cover the full A1-C2 range for this UI-only deliverable.

interface CurriculumNode {
  nodeId: string;
  exerciseTitle: string;
  cefrLevel: CEFRLevel;
}

const CURRICULUM_NODES: CurriculumNode[] = [
  { nodeId: '00000000-0000-0000-0000-000000000001', exerciseTitle: 'Basic Greetings', cefrLevel: 'A1' },
  { nodeId: '00000000-0000-0000-0000-000000000002', exerciseTitle: 'Ordering Food', cefrLevel: 'A2' },
  { nodeId: '00000000-0000-0000-0000-000000000003', exerciseTitle: 'Job Interview Prep', cefrLevel: 'B1' },
  { nodeId: '00000000-0000-0000-0000-000000000004', exerciseTitle: 'Making Plans & Complaints', cefrLevel: 'B2' },
  { nodeId: '00000000-0000-0000-0000-000000000005', exerciseTitle: 'Business Negotiation', cefrLevel: 'C1' },
  { nodeId: '00000000-0000-0000-0000-000000000006', exerciseTitle: 'Debating Abstract Ideas', cefrLevel: 'C2' },
];

const DEFAULT_NODE = CURRICULUM_NODES[2]; // B1, used as a graceful fallback for unknown ids

function getCurriculumNode(nodeId: string): CurriculumNode {
  return CURRICULUM_NODES.find((node) => node.nodeId === nodeId) ?? { ...DEFAULT_NODE, nodeId };
}

// ============================================================================
// Mock teacher notes (per node)
// ============================================================================

const TEACHER_NOTES: Record<string, TeacherNote> = {
  '00000000-0000-0000-0000-000000000001': {
    title: 'Foco del Profesor: Saludos formales vs. informales',
    detail: 'El alumno mezcla "How do you do" con contextos casuales. Practicar cuándo usar cada registro.',
  },
  '00000000-0000-0000-0000-000000000002': {
    title: 'Foco del Profesor: Pasados irregulares',
    detail: 'Reforzar uso de pasados irregulares (ate, went, bought) — el alumno tiende a regularizarlos ("eated").',
  },
  '00000000-0000-0000-0000-000000000003': {
    title: 'Foco del Profesor: Past Simple vs. Present Perfect',
    detail:
      'Trabajar fluidez en respuestas de más de 10 segundos y la distinción "I worked there" vs. "I have worked there".',
  },
};

function getTeacherNote(nodeId: string): TeacherNote | null {
  return TEACHER_NOTES[nodeId] ?? null;
}

// ============================================================================
// Mock AI challenges per level (the "initial prompt" and subsequent turns)
// ============================================================================

const CHALLENGES_BY_LEVEL: Record<CEFRLevel, string[]> = {
  A1: [
    'Hi! What is your name, and where are you from?',
    'What do you usually eat for breakfast?',
    'Do you have any brothers or sisters? Tell me about them.',
  ],
  A2: [
    "Welcome! What would you like to order today, and why don't you tell me what you had for lunch yesterday?",
    'What did you do last weekend?',
    'How often do you go to a café like this one?',
  ],
  B1: [
    "Thanks for coming in today. Can you tell me about a time you've worked in a team? What was challenging about it?",
    'What would you do if your manager disagreed with your idea?',
    'How long have you been learning English, and what has been the hardest part?',
  ],
  B2: [
    "If you could change one thing about your daily routine, what would it be and why? I'm curious how you'd justify it.",
    "I've heard some complaints about the new schedule — what's your take on it?",
    'Have you ever had to convince someone to change their mind? How did you approach it?',
  ],
  C1: [
    "Let's talk numbers. Our current terms are net-60 — what would it take for you to agree to net-30 instead?",
    'Rarely do negotiations go exactly as planned. Tell me about a deal that fell through, and what you learned.',
    "Notwithstanding the delays, we'd like to move forward. What contingencies would you put in place?",
  ],
  C2: [
    'Some argue that technology is eroding genuine human connection. Where do you stand, and why?',
    "Play devil's advocate for a moment: what's the strongest case against the position you just made?",
    'How would you reconcile individual freedom with collective responsibility in a modern democracy?',
  ],
};

/**
 * Deterministically cycles through that level's challenge bank by turn
 * index. When `previousWordCount` is provided and very low (the student
 * barely answered), the question is prefixed with a gentle nudge to
 * elaborate — a small, honest adaptation to what was actually said,
 * short of full conversational reasoning (that's what AiPracticeService +
 * a real model call would add later).
 */
export function generateNextChallenge(cefrLevel: CEFRLevel, turnIndex: number, previousWordCount?: number): string {
  const bank = CHALLENGES_BY_LEVEL[cefrLevel];
  const next = bank[turnIndex % bank.length];
  if (previousWordCount !== undefined && previousWordCount > 0 && previousWordCount < 4) {
    return `Could you tell me a bit more about that? ${next}`;
  }
  return next;
}

// ============================================================================
// Mock pronunciation/grammar feedback per level
// ============================================================================
// Each level has one canned "imagined transcript" with a couple of words
// flagged as needing work — a stand-in for a real ASR + scoring pipeline,
// purely so PronunciationFeedback has believable data to render.

const MOCK_FEEDBACK_BY_LEVEL: Record<CEFRLevel, MockFeedback> = {
  A1: {
    transcript: [
      { text: 'My', status: 'correct' },
      { text: 'name', status: 'correct' },
      { text: 'is', status: 'correct' },
      { text: 'Carlos', status: 'needs-work' },
      { text: 'and', status: 'correct' },
      { text: 'I', status: 'correct' },
      { text: 'eated', status: 'needs-work' },
      { text: 'breakfast', status: 'correct' },
    ],
    grammarScore: 68,
    pronunciationScore: 72,
    fluencyDelta: 2,
    vocabularyDelta: 1,
    tip: '"Eated" should be "ate" — Past Simple of "eat" is irregular.',
  },
  A2: {
    transcript: [
      { text: "I'd", status: 'correct' },
      { text: 'like', status: 'correct' },
      { text: 'a', status: 'correct' },
      { text: 'coffee', status: 'needs-work' },
      { text: 'and', status: 'correct' },
      { text: 'yesterday', status: 'correct' },
      { text: 'I', status: 'correct' },
      { text: 'goed', status: 'needs-work' },
      { text: 'shopping', status: 'correct' },
    ],
    grammarScore: 74,
    pronunciationScore: 78,
    fluencyDelta: 3,
    vocabularyDelta: 2,
    tip: '"Goed" should be "went" — remember "go" is also irregular in the past.',
  },
  B1: {
    transcript: [
      { text: 'I', status: 'correct' },
      { text: 'worked', status: 'correct' },
      { text: 'there', status: 'correct' },
      { text: 'for', status: 'correct' },
      { text: 'two', status: 'correct' },
      { text: 'years', status: 'needs-work' },
      { text: 'and', status: 'correct' },
      { text: 'it', status: 'correct' },
      { text: 'was', status: 'needs-work' },
      { text: 'challenging', status: 'correct' },
    ],
    grammarScore: 79,
    pronunciationScore: 81,
    fluencyDelta: 4,
    vocabularyDelta: 3,
    tip: 'Good control of Past Simple. For an ongoing result, try "I have worked there for two years."',
  },
  B2: {
    transcript: [
      { text: 'If', status: 'correct' },
      { text: 'I', status: 'correct' },
      { text: 'would', status: 'needs-work' },
      { text: 'change', status: 'correct' },
      { text: 'something', status: 'correct' },
      { text: 'it', status: 'correct' },
      { text: 'would', status: 'correct' },
      { text: 'be', status: 'correct' },
      { text: 'my', status: 'correct' },
      { text: 'commute', status: 'needs-work' },
    ],
    grammarScore: 83,
    pronunciationScore: 85,
    fluencyDelta: 4,
    vocabularyDelta: 3,
    tip: 'Avoid "would" in the if-clause: "If I changed something" (2nd conditional), not "If I would change".',
  },
  C1: {
    transcript: [
      { text: 'We', status: 'correct' },
      { text: 'could', status: 'correct' },
      { text: 'consider', status: 'correct' },
      { text: 'net-30', status: 'needs-work' },
      { text: 'provided', status: 'correct' },
      { text: 'that', status: 'correct' },
      { text: 'volume', status: 'correct' },
      { text: 'increases', status: 'needs-work' },
      { text: 'accordingly', status: 'correct' },
    ],
    grammarScore: 88,
    pronunciationScore: 86,
    fluencyDelta: 5,
    vocabularyDelta: 4,
    tip: 'Strong use of "provided that". Watch the stress on "accordingly" — it falls on the third syllable.',
  },
  C2: {
    transcript: [
      { text: 'Rarely', status: 'correct' },
      { text: 'do', status: 'correct' },
      { text: 'we', status: 'correct' },
      { text: 'question', status: 'correct' },
      { text: 'whether', status: 'needs-work' },
      { text: 'convenience', status: 'needs-work' },
      { text: 'comes', status: 'correct' },
      { text: 'at', status: 'correct' },
      { text: 'a', status: 'correct' },
      { text: 'cost', status: 'correct' },
    ],
    grammarScore: 93,
    pronunciationScore: 90,
    fluencyDelta: 6,
    vocabularyDelta: 5,
    tip: "Excellent inversion structure. Soften the 'wh' in \"whether\" — it's often reduced in fast speech.",
  },
};

export function generateMockFeedback(cefrLevel: CEFRLevel): MockFeedback {
  return MOCK_FEEDBACK_BY_LEVEL[cefrLevel];
}

// ============================================================================
// Public entry point
// ============================================================================

const SESSION_TURNS = 5;

/** Resolves everything the Speaking Playground needs to open a practice session for `nodeId`. */
export function buildPracticeContext(nodeId: string): PracticeContext {
  const node = getCurriculumNode(nodeId);
  const levelBand = getLevelBand(node.cefrLevel);

  return {
    nodeId: node.nodeId,
    exerciseTitle: node.exerciseTitle,
    cefrLevel: node.cefrLevel,
    cefrName: CEFR_NAMES[node.cefrLevel],
    levelBand,
    grammarFocus: GRAMMAR_FOCUS_BY_BAND[levelBand],
    teacherNote: getTeacherNote(node.nodeId),
    initialChallenge: generateNextChallenge(node.cefrLevel, 0),
    totalTurns: SESSION_TURNS,
  };
}
