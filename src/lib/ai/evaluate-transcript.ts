import type { CEFRLevel, FeedbackWord, MockFeedback } from './practice-context';

/**
 * Real-transcript evaluation
 * ------------------------------------------------------------------------
 * Honest scope: this is rule-based heuristic scoring over the text the
 * browser's Web Speech API transcribed — NOT a grammar-checking LLM and
 * NOT phoneme-level pronunciation analysis. Two real, if imperfect,
 * signals are available from the browser and used here:
 *   - ASR confidence (0-1 per finalized result) — a rough proxy for how
 *     clearly the speech was recognized, used as `pronunciationScore`.
 *   - Words-per-minute from actual recording duration — used for the
 *     fluency signal.
 * Grammar is checked against a small dictionary of common level-typical
 * mistakes (irregular verbs, conditional structure, etc.) — it will not
 * catch most real grammar errors. Swapping this for a real call to
 * AiPracticeService (already built, and already returning this exact
 * shape of feedback from Claude) is the natural upgrade path; nothing
 * downstream of this function needs to change to make that swap.
 */

interface KnownMistake {
  /** Matched case-insensitively as a whole word. */
  wrong: string;
  correction: string;
}

const COMMON_MISTAKES_BY_LEVEL: Record<CEFRLevel, KnownMistake[]> = {
  A1: [
    { wrong: 'eated', correction: 'ate' },
    { wrong: 'goed', correction: 'went' },
    { wrong: 'buyed', correction: 'bought' },
    { wrong: 'runned', correction: 'ran' },
  ],
  A2: [
    { wrong: 'eated', correction: 'ate' },
    { wrong: 'goed', correction: 'went' },
    { wrong: 'buyed', correction: 'bought' },
    { wrong: 'holded', correction: 'held' },
  ],
  B1: [
    { wrong: 'have went', correction: 'have gone' },
    { wrong: 'since two years', correction: 'for two years' },
    { wrong: 'must to', correction: 'must' },
  ],
  B2: [
    { wrong: 'if i would', correction: 'if i' },
    { wrong: 'would of', correction: 'would have' },
    { wrong: 'more better', correction: 'better' },
  ],
  C1: [
    { wrong: 'despite of', correction: 'despite' },
    { wrong: 'according with', correction: 'according to' },
  ],
  C2: [
    { wrong: 'less people', correction: 'fewer people' },
    { wrong: 'irregardless', correction: 'regardless' },
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Flags words that are part of a known-mistake phrase. Multi-word phrases
 * (e.g. "have went") are matched against the lowercase transcript, then
 * every token belonging to a matched phrase is marked 'needs-work'.
 */
function tagTranscriptWords(transcript: string, level: CEFRLevel): FeedbackWord[] {
  const words = transcript.split(/\s+/).filter(Boolean);
  const lowerTranscript = ` ${transcript.toLowerCase()} `;
  const flaggedIndices = new Set<number>();

  for (const mistake of COMMON_MISTAKES_BY_LEVEL[level]) {
    if (lowerTranscript.includes(` ${mistake.wrong} `)) {
      const mistakeTokens = mistake.wrong.split(' ');
      const lowerWords = words.map((w) => w.toLowerCase().replace(/[.,!?]/g, ''));
      for (let i = 0; i <= lowerWords.length - mistakeTokens.length; i++) {
        const slice = lowerWords.slice(i, i + mistakeTokens.length).join(' ');
        if (slice === mistake.wrong) {
          for (let j = i; j < i + mistakeTokens.length; j++) flaggedIndices.add(j);
        }
      }
    }
  }

  return words.map((word, index) => ({
    text: word,
    status: flaggedIndices.has(index) ? 'needs-work' : 'correct',
  }));
}

export interface EvaluateTranscriptInput {
  transcript: string;
  cefrLevel: CEFRLevel;
  /** ASR confidence (0-1) averaged across finalized speech results this turn. */
  confidence: number;
  /** Wall-clock recording duration for this turn, in seconds. */
  durationSeconds: number;
}

/** Builds a `MockFeedback`-shaped result from a real transcript instead of a canned example. */
export function evaluateTranscript({
  transcript,
  cefrLevel,
  confidence,
  durationSeconds,
}: EvaluateTranscriptInput): MockFeedback {
  const trimmed = transcript.trim();
  const words = tagTranscriptWords(trimmed, cefrLevel);
  const mistakeCount = words.filter((w) => w.status === 'needs-work').length;
  const wordCount = words.length;

  const grammarScore = wordCount === 0 ? 50 : clamp(100 - mistakeCount * 12, 40, 100);

  // ASR confidence is only meaningful once the recognizer actually heard
  // something; an empty/near-silent turn shouldn't read as "perfect pronunciation".
  const pronunciationScore = wordCount === 0 ? 50 : clamp(Math.round(confidence * 100), 30, 100);

  const wordsPerMinute = durationSeconds > 0 ? (wordCount / durationSeconds) * 60 : 0;
  const expectedWpm = EXPECTED_WORDS_PER_MINUTE_BY_LEVEL[cefrLevel];
  const fluencyDelta = clamp(Math.round((wordsPerMinute / expectedWpm) * 4), 1, 6);

  const uniqueWordCount = new Set(words.map((w) => w.text.toLowerCase().replace(/[.,!?]/g, ''))).size;
  const vocabularyDelta = clamp(Math.round(uniqueWordCount / 4), 1, 6);

  const tip =
    wordCount === 0
      ? "I didn't catch a response — try speaking a little closer to the mic, or make sure it's not muted."
      : mistakeCount > 0
        ? `Watch for: "${COMMON_MISTAKES_BY_LEVEL[cefrLevel].find((m) => trimmed.toLowerCase().includes(m.wrong))?.wrong}" → "${COMMON_MISTAKES_BY_LEVEL[cefrLevel].find((m) => trimmed.toLowerCase().includes(m.wrong))?.correction}".`
        : 'Nice — no common mistakes detected for this level. Keep building longer, more detailed answers.';

  return {
    transcript: wordCount === 0 ? [{ text: '(no speech detected)', status: 'needs-work' }] : words,
    grammarScore,
    pronunciationScore,
    fluencyDelta,
    vocabularyDelta,
    tip,
  };
}

/** Word count helper reused by the adaptive next-challenge logic in practice-context.ts. */
export function countWords(transcript: string): number {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}
