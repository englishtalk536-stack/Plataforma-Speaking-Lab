import { Inject, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  ConversationStatus,
  MessageSender,
  Prisma,
  PrismaClient,
  ScenarioType,
  XpSource,
} from '@prisma/client';
import { GamificationEngineService } from '../gamification/gamification-engine.service';

// ============================================================================
// Public types
// ============================================================================

export interface ProcessUserMessageParams {
  userId: string;
  conversationId: string;
  userText: string;
  scenarioType: ScenarioType;
}

export interface FeedbackCorrection {
  issue: string;
  explanation: string;
}

export interface AiPracticeFeedback {
  originalText: string;
  correctedText: string;
  hasErrors: boolean;
  grammarScore: number;
  corrections: FeedbackCorrection[];
  pronunciationTip: string;
}

export interface GamificationSummary {
  xpEarned: number;
  newTotalXp: number;
  currentLevel: number;
  didLevelUp: boolean;
  currentStreak: number;
}

export interface ProcessUserMessageResult {
  conversationId: string;
  userMessageId: string;
  aiMessageId: string;
  aiResponseText: string;
  feedback: AiPracticeFeedback;
  gamification: GamificationSummary;
}

// ============================================================================
// AI provider abstraction
// ============================================================================
// Kept separate from AiPracticeService so the underlying model (Claude,
// GPT-4o, or a mock in tests) is swappable without touching business logic.

export interface ConversationTurn {
  sender: MessageSender;
  text: string;
}

export interface GenerateReplyInput {
  scenarioType: ScenarioType;
  history: ConversationTurn[];
  userText: string;
}

export interface AiProviderPort {
  generateScenarioReply(input: GenerateReplyInput): Promise<{ aiResponseText: string; feedback: AiPracticeFeedback }>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

// ============================================================================
// Errors
// ============================================================================

export class AiPracticeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiPracticeError';
  }
}

export class InvalidProcessMessageParamsError extends AiPracticeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProcessMessageParamsError';
  }
}

export class ConversationNotFoundError extends AiPracticeError {
  constructor(conversationId: string) {
    super(`AiConversation not found: ${conversationId}`);
    this.name = 'ConversationNotFoundError';
  }
}

export class ConversationAccessDeniedError extends AiPracticeError {
  constructor(conversationId: string, userId: string) {
    super(`Conversation ${conversationId} does not belong to user ${userId}`);
    this.name = 'ConversationAccessDeniedError';
  }
}

export class ConversationNotActiveError extends AiPracticeError {
  constructor(conversationId: string, status: ConversationStatus) {
    super(`Conversation ${conversationId} is not active (status: ${status})`);
    this.name = 'ConversationNotActiveError';
  }
}

export class ScenarioMismatchError extends AiPracticeError {
  constructor(expected: ScenarioType, received: ScenarioType) {
    super(`Conversation scenario is ${expected}, but request specified ${received}`);
    this.name = 'ScenarioMismatchError';
  }
}

export class UnsupportedScenarioError extends AiPracticeError {
  constructor(scenarioType: string) {
    super(`Unsupported ScenarioType: ${scenarioType}`);
    this.name = 'UnsupportedScenarioError';
  }
}

export class AiProviderError extends AiPracticeError {
  constructor(message: string) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export class GamificationSyncError extends AiPracticeError {
  constructor(message: string) {
    super(`Failed to record AI_PRACTICE gamification event: ${message}`);
    this.name = 'GamificationSyncError';
  }
}

// ============================================================================
// Constants
// ============================================================================

const MAX_USER_TEXT_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 20;

// ============================================================================
// Validation schema for the structured AI reply
// ============================================================================

const feedbackCorrectionSchema = z.object({
  issue: z.string().min(1),
  explanation: z.string().min(1),
});

const feedbackSchema = z.object({
  originalText: z.string(),
  correctedText: z.string(),
  hasErrors: z.boolean(),
  grammarScore: z.number().int().min(0).max(100),
  corrections: z.array(feedbackCorrectionSchema),
  pronunciationTip: z.string().min(1),
});

const aiReplySchema = z.object({
  aiResponseText: z.string().min(1),
  feedback: feedbackSchema,
});

type AiReplyPayload = z.infer<typeof aiReplySchema>;

// ============================================================================
// Scenario personas
// ============================================================================

const SCENARIO_PERSONAS: Record<ScenarioType, string> = {
  [ScenarioType.ROLEPLAY_CAFE]:
    'You are Sam, a warm and chatty barista at a busy neighborhood café. ' +
    'You take the student\'s order, make small talk, suggest menu items, and handle payment — ' +
    'entirely in character, never breaking the fourth wall.',
  [ScenarioType.JOB_INTERVIEW]:
    'You are Jordan, a professional but friendly HR interviewer at a mid-size tech company. ' +
    'You ask common interview questions (background, strengths, situational questions), react ' +
    'naturally to the candidate\'s answers, and keep a realistic interview pace.',
  [ScenarioType.AIRPORT_CHECKIN]:
    'You are an airline check-in agent at an international airport counter. ' +
    'You ask for the passenger\'s destination, passport/ticket details, luggage, and seat ' +
    'preference, and respond the way a real agent would.',
  [ScenarioType.FREE_TALK]:
    'You are a friendly, curious conversation partner chatting casually about everyday topics ' +
    '(hobbies, weekend plans, food, movies). Keep the exchange natural and engaging, and ask ' +
    'follow-up questions like a real friend would.',
  [ScenarioType.BUSINESS_NEGOTIATION]:
    'You are Alex, a procurement manager negotiating a supply contract with the student, who ' +
    'represents a vendor. You push back on price and terms realistically, but remain ' +
    'professional and open to a reasonable deal.',
};

// ============================================================================
// Anthropic (Claude) provider implementation
// ============================================================================

const AI_REPLY_TOOL_NAME = 'submit_scenario_reply';

/**
 * A single Anthropic tool whose input_schema mirrors `aiReplySchema`. Forcing
 * the model to call this tool (`tool_choice: { type: 'tool', name: ... }`)
 * is what guarantees a strict, parseable JSON shape instead of relying on
 * the model to "just follow" formatting instructions in prose.
 */
const AI_REPLY_TOOL: Anthropic.Tool = {
  name: AI_REPLY_TOOL_NAME,
  description:
    'Submit the in-character scenario reply together with grammar feedback on the student\'s last message.',
  input_schema: {
    type: 'object',
    properties: {
      aiResponseText: {
        type: 'string',
        description:
          'Your in-character reply that continues the roleplay. English only. No meta-commentary, no mention of grading.',
      },
      feedback: {
        type: 'object',
        properties: {
          originalText: {
            type: 'string',
            description: "Verbatim copy of the student's message being evaluated.",
          },
          correctedText: {
            type: 'string',
            description: 'The student\'s message rewritten with correct grammar (unchanged if no errors).',
          },
          hasErrors: {
            type: 'boolean',
            description: 'true if correctedText differs meaningfully from originalText.',
          },
          grammarScore: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Grammar quality of the original message, 0 (very poor) to 100 (flawless).',
          },
          corrections: {
            type: 'array',
            description: 'One entry per distinct grammar issue found. Empty array if hasErrors is false.',
            items: {
              type: 'object',
              properties: {
                issue: { type: 'string', description: 'Short label for the error, e.g. "Wrong verb tense".' },
                explanation: {
                  type: 'string',
                  description: 'Plain-English explanation of why it is wrong and how to fix it.',
                },
              },
              required: ['issue', 'explanation'],
            },
          },
          pronunciationTip: {
            type: 'string',
            description:
              'One short, practical tip to sound more natural, based on likely pronunciation pitfalls for ' +
              'the vocabulary/structures used in the message (e.g. word stress, linking, a commonly ' +
              'mispronounced word). Always provide one, even if grammar was perfect.',
          },
        },
        required: ['originalText', 'correctedText', 'hasErrors', 'grammarScore', 'corrections', 'pronunciationTip'],
      },
    },
    required: ['aiResponseText', 'feedback'],
  },
};

export interface AnthropicAiProviderOptions {
  apiKey?: string;
  /**
   * Anthropic model id to use for scenario replies. Left configurable (env
   * var `ANTHROPIC_MODEL`, falling back to a Claude 3.5 Sonnet snapshot) so
   * this doesn't go stale as new model versions ship — check
   * https://docs.claude.com for the current recommended model id before
   * deploying.
   */
  model?: string;
  maxAttempts?: number;
}

@Injectable()
export class AnthropicAiProvider implements AiProviderPort {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxAttempts: number;

  constructor(options: AnthropicAiProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AiProviderError('Missing Anthropic API key (set ANTHROPIC_API_KEY or pass apiKey explicitly).');
    }
    this.client = new Anthropic({ apiKey });
    this.model = options.model ?? process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
    this.maxAttempts = options.maxAttempts ?? 2;
  }

  async generateScenarioReply(
    input: GenerateReplyInput,
  ): Promise<{ aiResponseText: string; feedback: AiPracticeFeedback }> {
    const persona = SCENARIO_PERSONAS[input.scenarioType];
    if (!persona) {
      throw new UnsupportedScenarioError(input.scenarioType);
    }

    const system = this.buildSystemPrompt(persona);
    const messages = this.buildMessages(input.history, input.userText);

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system,
          messages,
          tools: [AI_REPLY_TOOL],
          tool_choice: { type: 'tool', name: AI_REPLY_TOOL_NAME },
        });

        const payload = this.extractAndValidate(response);
        return payload;
      } catch (err) {
        lastError = err;
        if (attempt < this.maxAttempts && this.isRetryable(err)) {
          await this.sleep(300 * attempt);
          continue;
        }
        break;
      }
    }

    const reason = lastError instanceof Error ? lastError.message : 'unknown error';
    throw new AiProviderError(`Claude request failed after ${this.maxAttempts} attempt(s): ${reason}`);
  }

  private buildSystemPrompt(persona: string): string {
    return [
      persona,
      '',
      'You are simultaneously an English tutor invisibly grading the student. For every reply you must:',
      '1. Stay fully in character in `aiResponseText` — natural, conversational English, no grading talk.',
      "2. Evaluate ONLY the student's most recent message for grammar (not spelling of proper nouns, not style).",
      '3. Call the `' + AI_REPLY_TOOL_NAME + '` tool exactly once with your complete response — do not reply in plain text.',
      '4. If the message has no grammar issues, set hasErrors to false, corrections to an empty array, and ' +
        'grammarScore to a high value (90-100).',
      '5. Keep aiResponseText concise (1-4 sentences), matching how a real person would respond in this scenario.',
    ].join('\n');
  }

  private buildMessages(history: ConversationTurn[], userText: string): Anthropic.MessageParam[] {
    const historyMessages: Anthropic.MessageParam[] = history.map((turn) => ({
      role: turn.sender === MessageSender.USER ? 'user' : 'assistant',
      content: turn.text,
    }));

    return [...historyMessages, { role: 'user', content: userText }];
  }

  private extractAndValidate(response: Anthropic.Message): { aiResponseText: string; feedback: AiPracticeFeedback } {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === AI_REPLY_TOOL_NAME,
    );

    if (!toolUseBlock) {
      throw new AiProviderError('Claude response did not include the expected tool_use block.');
    }

    const parsed = aiReplySchema.safeParse(toolUseBlock.input);
    if (!parsed.success) {
      throw new AiProviderError(`Claude response failed schema validation: ${parsed.error.message}`);
    }

    const payload: AiReplyPayload = parsed.data;
    return { aiResponseText: payload.aiResponseText, feedback: payload.feedback };
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof Anthropic.APIError) {
      return err.status === 429 || (typeof err.status === 'number' && err.status >= 500);
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// AiPracticeService
// ============================================================================

/**
 * Orchestrates a single turn of AI conversation practice: persists the
 * student's message, asks the configured AI provider for an in-character
 * reply plus grammar feedback, persists the AI's message (with feedback
 * attached), and returns everything the client needs to render the turn.
 */
@Injectable()
export class AiPracticeService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProviderPort,
    private readonly gamificationEngine: GamificationEngineService,
  ) {}

  async processUserMessage(params: ProcessUserMessageParams): Promise<ProcessUserMessageResult> {
    this.validateParams(params);

    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id: params.conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: MAX_HISTORY_MESSAGES,
        },
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundError(params.conversationId);
    }
    if (conversation.userId !== params.userId) {
      throw new ConversationAccessDeniedError(params.conversationId, params.userId);
    }
    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new ConversationNotActiveError(params.conversationId, conversation.status);
    }
    if (conversation.scenarioType !== params.scenarioType) {
      throw new ScenarioMismatchError(conversation.scenarioType, params.scenarioType);
    }

    // Persist the student's turn first so it's never lost even if the AI call fails below.
    const userMessage = await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        sender: MessageSender.USER,
        textContent: params.userText,
      },
    });

    const history: ConversationTurn[] = (conversation.messages ?? []).map((m) => ({
      sender: m.sender,
      text: m.textContent,
    }));

    let aiReply: { aiResponseText: string; feedback: AiPracticeFeedback };
    try {
      aiReply = await this.aiProvider.generateScenarioReply({
        scenarioType: params.scenarioType,
        history,
        userText: params.userText,
      });
    } catch (err) {
      // The user's message is already saved; the caller can safely retry
      // "get the AI reply" for this conversation without re-submitting text.
      if (err instanceof AiPracticeError) throw err;
      throw new AiProviderError(err instanceof Error ? err.message : 'Unknown AI provider failure.');
    }

    const aiMessage = await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        sender: MessageSender.AI,
        textContent: aiReply.aiResponseText,
        feedback: aiReply.feedback as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Award XP for the completed practice turn now that both messages are
    // safely persisted. This runs in the gamification engine's own
    // transaction (XpLog write + streak update + user XP/level update), kept
    // separate from the writes above so a gamification failure never rolls
    // back the conversation history that was already saved.
    let gamificationResult: {
      xpEarned: number;
      newTotalXp: number;
      currentLevel: number;
      didLevelUp: boolean;
      currentStreak: number;
    };
    try {
      gamificationResult = await this.gamificationEngine.processEvent({
        userId: params.userId,
        eventType: XpSource.AI_PRACTICE,
        metadata: {
          conversationId: params.conversationId,
          aiMessageId: aiMessage.id,
          grammarScore: aiReply.feedback.grammarScore,
        },
      });
    } catch (err) {
      throw new GamificationSyncError(err instanceof Error ? err.message : 'Unknown gamification failure.');
    }

    return {
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      aiMessageId: aiMessage.id,
      aiResponseText: aiReply.aiResponseText,
      feedback: aiReply.feedback,
      gamification: {
        xpEarned: gamificationResult.xpEarned,
        newTotalXp: gamificationResult.newTotalXp,
        currentLevel: gamificationResult.currentLevel,
        didLevelUp: gamificationResult.didLevelUp,
        currentStreak: gamificationResult.currentStreak,
      },
    };
  }

  private validateParams(params: ProcessUserMessageParams): void {
    if (!params.userId || typeof params.userId !== 'string') {
      throw new InvalidProcessMessageParamsError('processUserMessage requires a valid userId.');
    }
    if (!params.conversationId || typeof params.conversationId !== 'string') {
      throw new InvalidProcessMessageParamsError('processUserMessage requires a valid conversationId.');
    }
    if (!params.userText || typeof params.userText !== 'string' || params.userText.trim().length === 0) {
      throw new InvalidProcessMessageParamsError('processUserMessage requires non-empty userText.');
    }
    if (params.userText.length > MAX_USER_TEXT_LENGTH) {
      throw new InvalidProcessMessageParamsError(
        `userText exceeds the ${MAX_USER_TEXT_LENGTH}-character limit.`,
      );
    }
    if (!params.scenarioType || !(params.scenarioType in ScenarioType)) {
      throw new InvalidProcessMessageParamsError(`Invalid scenarioType: ${String(params.scenarioType)}`);
    }
  }
}
