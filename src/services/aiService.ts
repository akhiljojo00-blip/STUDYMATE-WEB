import { ExplanationStyle, PracticeQuestion, QuestionType, StudyBuddyMessage } from '../types/index.ts';

export interface ChatContext {
  subjectName?: string;
  topicTitle?: string;
  documentText?: string;
  documentTitle?: string;
}

export interface ChatResponse {
  reply: string;
  isGrounded?: boolean;
  isFallback?: boolean;
  documentTitle?: string;
}

export interface GenerateQuestionsParams {
  subjectName?: string;
  topicTitle?: string;
  type: QuestionType;
  count: number;
  documentText?: string;
  documentTitle?: string;
}

export interface SummarizeResponse {
  summary: string;
  keyPoints: string[];
  suggestedQuestions: string[];
  isFallback?: boolean;
}

export const aiService = {
  /**
   * Send a question to AI Study Buddy with academic context and chosen explanation style
   */
  async sendMessage(
    message: string,
    history: StudyBuddyMessage[],
    context: ChatContext = {},
    style: ExplanationStyle = 'detailed',
    userId: string = 'student'
  ): Promise<ChatResponse> {
    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        message,
        history: formattedHistory,
        context,
        style,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `Error ${response.status}: Failed to get answer`);
    }

    return await response.json();
  },

  /**
   * Generate structured, validated practice questions (MCQs, Short-Answer, Exam-Style)
   */
  async generateQuestions(
    params: GenerateQuestionsParams,
    userId: string = 'student'
  ): Promise<PracticeQuestion[]> {
    const response = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `Error ${response.status}: Failed to generate questions`);
    }

    const data = await response.json();
    return data.questions || [];
  },

  /**
   * Generate conceptual summary and active recall prompts from study document text
   */
  async summarizeDocument(
    textContent: string,
    title: string = 'Study Document',
    userId: string = 'student'
  ): Promise<SummarizeResponse> {
    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        textContent,
        title,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errData.error || `Error ${response.status}: Failed to summarize document`);
    }

    return await response.json();
  },
};
