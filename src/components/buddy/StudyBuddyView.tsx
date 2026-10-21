import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  FileText,
  HelpCircle,
  Copy,
  Check,
  AlertCircle,
  Zap,
  BookmarkPlus,
  ArrowRight,
  GraduationCap,
  ListOrdered,
  ChevronDown,
} from 'lucide-react';
import {
  ExplanationStyle,
  StudyBuddyMessage,
  Subject,
  Topic,
  StudyDocument,
} from '../../types/index.ts';
import { aiService } from '../../services/aiService.ts';

interface StudyBuddyViewProps {
  subjects: Subject[];
  topics: Topic[];
  documents: StudyDocument[];
  userId: string;
  onOpenQuestionGenerator: (subjectId?: string, topicId?: string, docId?: string) => void;
  initialDocumentId?: string | null;
}

const STARTER_PROMPTS = [
  { label: 'Explain like I am 5', prompt: 'Explain the core intuition of this concept in simple, beginner-friendly terms without jargon.' },
  { label: 'Step-by-step example', prompt: 'Walk me through a concrete, step-by-step example with a real-world analogy.' },
  { label: 'Common exam pitfalls', prompt: 'What are the most common misconceptions or mistakes students make on this topic in exams?' },
  { label: 'Quick active recall drill', prompt: 'Give me a fast, high-yield active-recall question to test if I really understood this.' },
];

function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-inherit">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-inherit">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-xs">{token.slice(1, -1)}</code>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

const FormattedMessage: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  const lines = content.split('\n');
  return (
    <div className={`space-y-1.5 text-sm leading-relaxed ${isUser ? 'text-white' : 'text-[#1C1917]'}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="font-serif font-bold text-sm mt-2.5 mb-1 text-inherit">
              {renderInlineFormatting(trimmed.slice(5))}
            </h4>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="font-serif font-bold text-base mt-3 mb-1 text-inherit">
              {renderInlineFormatting(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="font-serif font-bold text-lg mt-3.5 mb-1.5 text-inherit">
              {renderInlineFormatting(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-inherit opacity-70 mt-1 text-xs">•</span>
              <div className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</div>
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-xs opacity-75 mt-0.5">{numMatch[1]}.</span>
              <div className="flex-1">{renderInlineFormatting(numMatch[2])}</div>
            </div>
          );
        }
        return (
          <p key={idx} className="text-inherit">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const StudyBuddyView: React.FC<StudyBuddyViewProps> = ({
  subjects,
  topics,
  documents,
  userId,
  onOpenQuestionGenerator,
  initialDocumentId,
}) => {
  // Context state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || '');
  const [style, setStyle] = useState<ExplanationStyle>('detailed');

  // Chat conversation state
  const [messages, setMessages] = useState<StudyBuddyMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your **StudyMate AI Tutor**. I'm here to break down tricky concepts, guide your revision step-by-step, and test your active recall.\n\nChoose a **Subject** or **Study Document** above to focus our discussion, or ask any question right away!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter topics for chosen subject
  const availableTopics = topics.filter(
    (t) => !selectedSubjectId || t.subjectId === selectedSubjectId
  );

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeTopic = topics.find((t) => t.id === selectedTopicId);
  const activeDocument = documents.find((d) => d.id === selectedDocId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    setError(null);
    const userMsgId = `user-${Date.now()}`;
    const userMessage: StudyBuddyMessage = {
      id: userMsgId,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      style,
      context: {
        subjectName: activeSubject?.name,
        topicTitle: activeTopic?.title,
        documentTitle: activeDocument?.title,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(
        promptText,
        messages,
        {
          subjectName: activeSubject?.name,
          topicTitle: activeTopic?.title,
          documentText: activeDocument?.textContent,
          documentTitle: activeDocument?.title,
        },
        style,
        userId
      );

      const assistantMsg: StudyBuddyMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        style,
        isGrounded: response.isGrounded,
        citations: response.isGrounded && activeDocument ? [activeDocument.title] : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Unable to connect to AI Study Buddy. Please check your network and try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset! What would you like to study next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden">
      {/* Top Header / Context Selection Bar */}
      <div className="bg-[#FAF7F2] border-b border-[#EBE5DF] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-[#F3E5AB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-semibold text-[#1C1917]">AI Study Buddy</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBE5DF] text-[#4A453E] font-medium">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-[#6B6560]">
              Personalized concept explanations & active recall grounding
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTopic && (
            <button
              onClick={() => onOpenQuestionGenerator(selectedSubjectId, selectedTopicId)}
              className="px-3 py-1.5 rounded-lg bg-[#FAF0EA] text-[#C85A32] hover:bg-[#F5E2D6] text-xs font-medium flex items-center gap-1.5 border border-[#F0D5C7] transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Quiz for Topic
            </button>
          )}

          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-[#6B6560] hover:text-[#1C1917] hover:bg-[#EBE5DF]/60 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Anchors & Style Pills */}
      <div className="bg-[#FAF7F2]/60 border-b border-[#EBE5DF] px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs">
        {/* Subject dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#6B6560] font-medium">Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedTopicId('');
            }}
            className="bg-white border border-[#DCD5CE] rounded-md px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
          >
            <option value="">General (All Subjects)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Topic dropdown */}
        {selectedSubjectId && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B6560] font-medium">Topic:</span>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="bg-white border border-[#DCD5CE] rounded-md px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
            >
              <option value="">All Topics in Subject</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Grounding Document */}
        {documents.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B6560] font-medium">Study Material:</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className={`bg-white border rounded-md px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] ${
                selectedDocId ? 'border-[#1E3A2F] bg-[#E9F0EC] text-[#1E3A2F] font-medium' : 'border-[#DCD5CE]'
              }`}
            >
              <option value="">None (Standard AI Knowledge)</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  📄 {d.title} ({d.wordCount || 0} words)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Explanation Style Pills */}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[#6B6560] font-medium mr-1">Style:</span>
          {(['concise', 'detailed', 'exam'] as ExplanationStyle[]).map((st) => (
            <button
              key={st}
              onClick={() => setStyle(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                style === st
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'bg-white text-[#6B6560] border border-[#DCD5CE] hover:bg-[#F3EFEA]'
              }`}
            >
              {st === 'concise' && '⚡ Concise'}
              {st === 'detailed' && '📖 Detailed'}
              {st === 'exam' && '🎯 Exam Revision'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Grounding Indicator Banner */}
      {activeDocument && (
        <div className="bg-[#E9F0EC] border-b border-[#C3D9CE] px-4 py-2 flex items-center justify-between text-xs text-[#1E3A2F]">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#1E3A2F]" />
            <span>
              <strong>Grounded in:</strong> &ldquo;{activeDocument.title}&rdquo; (Answers will prioritize this text with source attribution)
            </span>
          </div>
          <button
            onClick={() => setSelectedDocId('')}
            className="text-xs underline text-[#1E3A2F] hover:text-[#0F221B]"
          >
            Detach
          </button>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FBF9F5]/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#8C827A]">
                <span>{isUser ? 'You' : 'StudyMate'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.isGrounded && (
                  <span className="px-1.5 py-0.2 rounded bg-[#E9F0EC] text-[#1E3A2F] font-medium text-[10px]">
                    Grounded in notes
                  </span>
                )}
                {msg.style && (
                  <span className="capitalize text-[10px] text-[#A89F91]">
                    [{msg.style}]
                  </span>
                )}
              </div>

              <div
                className={`group relative rounded-2xl p-4 md:p-5 max-w-[85%] md:max-w-[78%] text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#1E3A2F] text-white rounded-tr-xs'
                    : 'bg-white text-[#1C1917] border border-[#EBE5DF] shadow-xs rounded-tl-xs'
                }`}
              >
                {/* Formatted Markdown Content */}
                <FormattedMessage content={msg.content} isUser={isUser} />

                {/* Grounding Source Citation Footer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EBE5DF] text-xs text-[#6B6560] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1E3A2F]" />
                    <span>Referenced study note: <em>{msg.citations.join(', ')}</em></span>
                  </div>
                )}

                {/* Copy button */}
                <button
                  onClick={() => handleCopyText(msg.content, msg.id)}
                  className={`absolute top-2.5 right-2.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                    isUser
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-[#8C827A] hover:text-[#1C1917] hover:bg-[#FAF7F2]'
                  }`}
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[75%]">
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#8C827A]">
              <span>StudyMate</span>
              <span>•</span>
              <span>Thinking...</span>
            </div>
            <div className="bg-white border border-[#EBE5DF] rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-3">
              <div className="flex space-x-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-[#1E3A2F] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#1E3A2F] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#1E3A2F] animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-[#6B6560]">
                Formulating step-by-step explanation...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#FDF2F0] border border-[#F8C8C2] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#B33A2B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Response Notice</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="px-2 py-1 bg-white border border-[#F8C8C2] rounded-md font-medium text-[#B33A2B] hover:bg-[#FDF2F0]"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="bg-[#FAF7F2] border-t border-[#EBE5DF] px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-[#8C827A] font-medium shrink-0">Prompts:</span>
        {STARTER_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-white border border-[#DCD5CE] text-xs text-[#4A453E] hover:border-[#1E3A2F] hover:text-[#1E3A2F] shrink-0 transition-colors disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="p-3 md:p-4 bg-white border-t border-[#EBE5DF]">
        <div className="flex items-end gap-2 bg-[#FAF7F2] border border-[#DCD5CE] focus-within:border-[#1E3A2F] focus-within:ring-1 focus-within:ring-[#1E3A2F] rounded-xl p-2 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeTopic
                ? `Ask about "${activeTopic.title}"... (Press Enter to send, Shift+Enter for new line)`
                : `Ask any study question or clarify a concept...`
            }
            className="flex-1 bg-transparent border-0 resize-none text-sm text-[#1C1917] placeholder:text-[#A89F91] focus:outline-none p-1.5 max-h-40"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-[#1E3A2F] text-white hover:bg-[#2A4E40] disabled:opacity-40 disabled:hover:bg-[#1E3A2F] transition-colors shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#8C827A]">
          <span>
            {activeTopic ? `Context: ${activeTopic.title}` : 'No specific topic chosen'}
          </span>
          <span>Shift + Enter for new line • Enter to send</span>
        </div>
      </div>
    </div>
  );
};
