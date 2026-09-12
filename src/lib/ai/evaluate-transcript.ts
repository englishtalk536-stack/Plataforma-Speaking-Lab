import type { CEFRLevel, FeedbackWord, MockFeedback, TeacherNote } from './practice-context';

/**
 * Real-transcript evaluation
 * ------------------------------------------------------------------------
 * Honest scope: this is rule-based heuristic scoring over the text the
 * browser's Web Speech API transcribed — NOT a grammar-checking LLM and
 * NOT phoneme-level pronunciation analysis. The signals actually available
 * from the browser are used deliberately:
 *   - ASR confidence (0-1 per finalized result) — a rough proxy for how
 *     clearly the speech was recognized, blended with speaking pace into
 *     `pronunciationScore`.
 *   - Words-per-minute from actual recording duration — the fluency
 *     signal, and part of the pronunciation blend above.
 *   - A "completeness ceiling" tied to response length prevents a one-word
 *     or ambiguous answer from ever scoring near-perfect just because it
 *     happened not to match a known mistake pattern — evaluation requires
 *     *enough signal*, not just *absence of a caught error*.
 * Grammar is checked against a small dictionary of common level-typical
 * mistakes (irregular verbs, conditional structure, etc.), with extra
 * weight given to whatever the active Teacher Focus note calls out.
 * Swapping this for a real call to AiPracticeService (already built, and
 * already returning this exact shape of feedback from Claude) is the
 * natural upgrade path; nothing downstream of this function needs to
 * change to make that swap.
 */

interface KnownMistake {
  /** Matched case-insensitively as a whole phrase. */
  wrong: string;
  correction: string;
  /** Keyword(s) that tie this mistake to a Teacher Focus note, e.g. "irregular", "present perfect". */
  focusTags: string[];
}

const COMMON_MISTAKES_BY_LEVEL: Record<CEFRLevel, KnownMistake[]> = {
  A1: [
    { wrong: 'eated', correction: 'ate', focusTags: ['irregular', 'past'] },
    { wrong: 'goed', correction: 'went', focusTags: ['irregular', 'past'] },
    { wrong: 'buyed', correction: 'bought', focusTags: ['irregular', 'past'] },
    { wrong: 'runned', correction: 'ran', focusTags: ['irregular', 'past'] },
  ],
  A2: [
    { wrong: 'eated', correction: 'ate', focusTags: ['irregular', 'past'] },
    { wrong: 'goed', correction: 'went', focusTags: ['irregular', 'past'] },
    { wrong: 'buyed', correction: 'bought', focusTags: ['irregular', 'past'] },
    { wrong: 'holded', correction: 'held', focusTags: ['irregular', 'past'] },
  ],
  B1: [
    { wrong: 'have went', correction: 'have gone', focusTags: ['present perfect', 'irregular'] },
    { wrong: 'since two years', correction: 'for two years', focusTags: ['present perfect'] },
    { wrong: 'must to', correction: 'must', focusTags: ['modal'] },
  ],
  B2: [
    { wrong: 'if i would', correction: 'if i', focusTags: ['conditional'] },
    { wrong: 'would of', correction: 'would have', focusTags: ['modal'] },
    { wrong: 'more better', correction: 'better', focusTags: ['comparative'] },
  ],
  C1: [
    { wrong: 'despite of', correction: 'despite', focusTags: ['formal connector'] },
    { wrong: 'according with', correction: 'according to', focusTags: ['formal connector'] },
  ],
  C2: [
    { wrong: 'less people', correction: 'fewer people', focusTags: ['idiom'] },
    { wrong: 'irregardless', correction: 'regardless', focusTags: ['idiom'] },
  ],
};

const EXPECTED_WORDS_PER_MINUTE_BY_LEVEL: Record<CEFRLevel, number> = {
  A1: 60,
  A2: 75,
  B1: 90,
  B2: 105,
  C1: 120,
  C2: 130,
};

/** Minimum word count a "complete" answer at this level should reach before scores can approach 100. */
const EXPECTED_MIN_WORDS_BY_LEVEL: Record<CEFRLevel, number> = {
  A1: 4,
  A2: 5,
  B1: 7,
  B2: 9,
  C1: 11,
  C2: 13,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Maps a few keywords a teacher might write in a note to the `focusTags` used above. */
function extractFocusTags(teacherNote: TeacherNote | null): string[] {
  if (!teacherNote) return [];
  const text = `${teacherNote.title} ${teacherNote.detail}`.toLowerCase();
  const tags: string[] = [];
  if (text.includes('irregular')) tags.push('irregular');
  if (text.includes('past')) tags.push('past');
  if (text.includes('present perfect')) tags.push('present perfect');
  if (text.includes('phrasal')) tags.push('phrasal');
  if (text.includes('idiom')) tags.push('idiom');
  if (text.includes('conditional')) tags.push('conditional');
  if (text.includes('fluidez') || text.includes('fluency') || text.includes('10 second')) tags.push('fluency');
  return tags;
}

/**
 * Flags words that are part of a known-mistake phrase. Multi-word phrases
 * (e.g. "have went") are matched against the lowercase transcript, then
 * every token belonging to a matched phrase is marked 'needs-work'.
 * Returns both the tagged words and which mistakes were actually found, so
 * scoring and tips can react to them.
 */
function tagTranscriptWords(
  transcript: string,
  level: CEFRLevel,
): { words: FeedbackWord[]; foundMistakes: KnownMistake[] } {
  const words = transcript.split(/\s+/).filter(Boolean);
  const lowerTranscript = ` ${transcript.toLowerCase()} `;
  const flaggedIndices = new Set<number>();
  const foundMistakes: KnownMistake[] = [];

  for (const mistake of COMMON_MISTAKES_BY_LEVEL[level]) {
    if (!lowerTranscript.includes(` ${mistake.wrong} `)) continue;

    const mistakeTokens = mistake.wrong.split(' ');
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[.,!?]/g, ''));
    for (let i = 0; i <= lowerWords.length - mistakeTokens.length; i++) {
      const slice = lowerWords.slice(i, i + mistakeTokens.length).join(' ');
      if (slice === mistake.wrong) {
        for (let j = i; j < i + mistakeTokens.length; j++) flaggedIndices.add(j);
      }
    }
    foundMistakes.push(mistake);
  }

  const tagged = words.map((word, index) => ({
    text: word,
    status: (flaggedIndices.has(index) ? 'needs-work' : 'correct') as FeedbackWord['status'],
  }));

  return { words: tagged, foundMistakes };
}

export interface EvaluateTranscriptInput {
  transcript: string;
  cefrLevel: CEFRLevel;
  /** ASR confidence (0-1) averaged across finalized speech results this turn. */
  confidence: number;
  /** Wall-clock recording duration for this turn, in seconds. */
  durationSeconds: number;
  /** The active Teacher Focus note, if any — mistakes matching it are called out more directly. */
  teacherNote?: TeacherNote | null;
}

/** Builds a `MockFeedback`-shaped result from a real transcript, scored against the target CEFR level and any active teacher focus. */
export function evaluateTranscript({
  transcript,
  cefrLevel,
  confidence,
  durationSeconds,
  teacherNote = null,
}: EvaluateTranscriptInput): MockFeedback {
  const trimmed = transcript.trim();
  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length;

  // No speech at all: the floor, not the 50 an "unlucky heuristic" might otherwise land on.
  if (wordCount === 0) {
    return {
      transcript: [{ text: '(no speech detected)', status: 'needs-work' }],
      grammarScore: 15,
      pronunciationScore: 15,
      fluencyDelta: 1,
      vocabularyDelta: 1,
      tip: "I didn't catch a response — try speaking a little closer to the mic, or make sure it's not muted.",
    };
  }

  const { words, foundMistakes } = tagTranscriptWords(trimmed, cefrLevel);
  const mistakeCount = foundMistakes.length;

  const expectedMinWords = EXPECTED_MIN_WORDS_BY_LEVEL[cefrLevel];
  // 0 at zero words, 1.0 once the response reaches (or passes) the level's expected minimum length.
  const completenessRatio = clamp(wordCount / expectedMinWords, 0, 1);
  // A too-short answer can score at best ~50-95, never a flat 100 — length is part of "correct" at this stage.
  const completenessCeiling = 45 + completenessRatio * 55;

  const isBrief = wordCount < expectedMinWords;
  const isAmbiguous = confidence > 0 && confidence < 0.55;

  const focusTags = extractFocusTags(teacherNote);
  const focusedMistake = foundMistakes.find((m) => m.focusTags.some((tag) => focusTags.includes(tag)));

  // Grammar: penalize each caught mistake, penalize focus-relevant mistakes a bit harder, cap by completeness.
  const focusPenalty = focusedMistake ? 6 : 0;
  const rawGrammarScore = 100 - mistakeCount * 12 - focusPenalty;
  const grammarScore = Math.round(clamp(Math.min(rawGrammarScore, completenessCeiling), 20, 100));

  // Pronunciation: blend of ASR confidence (how clearly it was recognized)
  // and speaking pace relative to what's expected at this level — both are
  // real signals the browser actually gives us, per the brief.
  const wordsPerMinute = durationSeconds > 0 ? (wordCount / durationSeconds) * 60 : 0;
  const expectedWpm = EXPECTED_WORDS_PER_MINUTE_BY_LEVEL[cefrLevel];
  const paceScore = clamp((wordsPerMinute / expectedWpm) * 100, 0, 100);
  const rawPronunciationScore = confidence * 70 + paceScore * 0.3;
  const pronunciationScore = Math.round(clamp(Math.min(rawPronunciationScore, completenessCeiling), 20, 100));

  const fluencyDelta = clamp(Math.round((wordsPerMinute / expectedWpm) * 4), 1, 6);
  const uniqueWordCount = new Set(words.map((w) => w.text.toLowerCase().replace(/[.,!?]/g, ''))).size;
  const vocabularyDelta = clamp(Math.round((uniqueWordCount / expectedMinWords) * 4), 1, 6);

  const tip = buildTip({ isBrief, isAmbiguous, focusedMistake, foundMistakes, expectedMinWords, wordCount, teacherNote });

  return { transcript: words, grammarScore, pronunciationScore, fluencyDelta, vocabularyDelta, tip };
}

function buildTip(args: {
  isBrief: boolean;
  isAmbiguous: boolean;
  focusedMistake?: KnownMistake;
  foundMistakes: KnownMistake[];
  expectedMinWords: number;
  wordCount: number;
  teacherNote: TeacherNote | null;
}): string {
  const { isBrief, isAmbiguous, focusedMistake, foundMistakes, expectedMinWords, wordCount, teacherNote } = args;

  if (focusedMistake) {
    return `Your teacher's focus is on this: "${focusedMistake.wrong}" should be "${focusedMistake.correction}". Keep an eye on it.`;
  }

  if (foundMistakes.length > 0) {
    const mistake = foundMistakes[0];
    return `Watch for: "${mistake.wrong}" → "${mistake.correction}".`;
  }

  if (isBrief) {
    return `Try to say a bit more — aim for at least ${expectedMinWords} words (you said ${wordCount}). A fuller sentence gives you a better score here.`;
  }

  if (isAmbiguous) {
    return "I wasn't fully confident I heard that correctly — try speaking a little more clearly or slightly slower.";
  }

  if (teacherNote) {
    return `Solid answer — no common mistakes caught. Now push yourself to use what your teacher flagged: ${teacherNote.title.replace('Foco del Profesor: ', '')}.`;
  }

  return 'Nice — no common mistakes detected for this level. Keep building longer, more detailed answers.';
}

/** Word count helper reused by the adaptive next-challenge logic in practice-context.ts. */
export function countWords(transcript: string): number {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}
