import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../utils/api.js';
import {
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Send,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Student default initial greeting - clean, simple, no emojis, only 2 questions
  const studentInitial = {
    sender: 'assistant',
    text: 'Hello. How can I help you today with your coursework, assignments, or certificates?',
    suggestions: [
      'Certificate requirements',
      'Passing score for exams',
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Admin default initial greeting - clean, simple, no emojis, only 2 questions
  const adminInitial = {
    sender: 'assistant',
    text: 'Hello, Administrator. How can I assist you with platform operations or telemetry today?',
    suggestions: [
      'Platform telemetry & stats',
      'Grading queue status',
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState(() => [isAdmin ? adminInitial : studentInitial]);

  // Update initial message when auth role changes
  useEffect(() => {
    setMessages([isAdmin ? adminInitial : studentInitial]);
  }, [user?.role]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Hide on active proctored quiz sessions
  if (location.pathname.startsWith('/test/take')) {
    return null;
  }

  const handleResetChat = () => {
    setMessages([isAdmin ? adminInitial : studentInitial]);
    setInputMessage('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const data = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: query }),
      });

      if (data.success && data.reply) {
        const assistantMsg = {
          sender: 'assistant',
          text: data.reply,
          suggestions: (data.suggestions || []).slice(0, 2),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.message || 'Unable to retrieve answer.');
      }
    } catch {
      const errorMsg = {
        sender: 'assistant',
        text: 'Unable to connect to the assistant service. Please check your connection or contact support at +91 9108118381.',
        suggestions: ['Certificate requirements'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Clean Markdown Renderer matching website theme
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, i) => {
      // H3 heading
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="font-semibold text-xs text-[#07241a] mt-2 mb-1 border-b border-slate-200/80 pb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }

      // Unordered list item
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemText = line.substring(2);
        return (
          <li key={i} className="ml-3 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            {renderInlineSpans(itemText)}
          </li>
        );
      }

      // Numbered list item
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <li key={i} className="ml-3 list-decimal text-xs text-slate-700 leading-relaxed my-0.5">
            {renderInlineSpans(numMatch[2])}
          </li>
        );
      }

      // Empty line
      if (!line.trim()) {
        return <div key={i} className="h-1" />;
      }

      // Normal paragraph
      return (
        <p key={i} className="text-xs text-slate-700 leading-relaxed my-0.5">
          {renderInlineSpans(line)}
        </p>
      );
    });
  };

  // Helper for inline markdown: bold, italics, code, links
  const renderInlineSpans = (text) => {
    const linkRegex = /(\*\*)?\[([^\]]+)\]\(([^)]+)\)(\*\*)?/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderFormattingTokens(text.substring(lastIndex, match.index)));
      }
      const isBold = Boolean(match[1] && match[4]);
      const label = match[2];
      const href = match[3];

      const isInternal = href.startsWith('/');
      parts.push(
        <button
          key={`link-${match.index}`}
          type="button"
          onClick={() => {
            if (isInternal) {
              navigate(href);
            } else {
              window.open(href, '_blank', 'noopener,noreferrer');
            }
          }}
          className={`inline-flex items-center gap-0.5 text-[#07241a] underline decoration-slate-300 hover:text-[#9d4225] transition-colors ${
            isBold ? 'font-bold' : 'font-semibold'
          }`}
        >
          {label}
          {!isInternal && <ExternalLink size={10} className="inline ml-0.5 opacity-70" />}
        </button>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(renderFormattingTokens(text.substring(lastIndex)));
    }

    return parts;
  };

  const renderFormattingTokens = (rawText) => {
    const tokens = rawText.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={idx} className="px-1 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-800">
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={idx} className="italic text-slate-600">
            {token.slice(1, -1)}
          </em>
        );
      }
      return token;
    });
  };

  return (
    <>
      {/* Floating Trigger Button - Clean & compact */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open Assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-11 h-11 bg-[#07241a] hover:bg-[#123629] text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <MessageSquare size={18} className="text-white" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </button>
      )}

      {/* Chat Window - Compact Normal Size */}
      {isOpen && (
        <div
          className={`fixed z-50 right-3 sm:right-5 bottom-3 sm:bottom-5 w-[calc(100vw-24px)] sm:w-[320px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
            isMinimized ? 'h-[44px]' : 'h-[415px] max-h-[68vh]'
          }`}
        >
          {/* Minimalist Header */}
          <div className="bg-[#07241a] px-3.5 py-2.5 text-white flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold tracking-tight text-white font-serif">CRISMATECH Assistant</span>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Restart"
                className="p-1 text-slate-300 hover:text-white rounded transition-colors"
                aria-label="Restart chat"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1 text-slate-300 hover:text-white rounded transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1 text-slate-300 hover:text-white rounded transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
                {messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`relative max-w-[88%] p-2.5 rounded-xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#07241a] text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div>{renderFormattedContent(msg.text)}</div>
                        )}

                        {!isUser && (
                          <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.text, index)}
                              className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check size={10} className="text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={10} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Suggested Questions - Max 2 simple chips */}
                      {!isUser && index === messages.length - 1 && msg.suggestions?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 max-w-[92%]">
                          {msg.suggestions.slice(0, 2).map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSendMessage(suggestion)}
                              className="text-[10px] text-slate-600 hover:text-[#07241a] bg-white hover:bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-left transition-colors font-mono"
                            >
                              {suggestion} →
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {loading && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 max-w-[90px]">
                    <div className="w-1.5 h-1.5 bg-[#07241a] rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-[#07241a] rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#07241a] rounded-full animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-2 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    disabled={loading}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#07241a] focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="h-7 w-7 flex items-center justify-center bg-[#07241a] hover:bg-[#123629] disabled:opacity-40 text-white rounded-md transition-colors shrink-0"
                    aria-label="Send"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
