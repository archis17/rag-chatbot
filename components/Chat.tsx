"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  context?: string;
  timestamp?: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContextIndex, setShowContextIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load existing history for the signed-in user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch {}
    })();
  }, []);

  async function handleSend() {
    if (!input.trim()) return;
    setError(null);
    
    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }
      
      const data = await response.json();
      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
        context: data.context || undefined,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, botMsg]);
      // Optimistically persisted by API; we also keep local state updated
    } catch (err: unknown) {
      let errorMessage = "Failed to send message.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(ts?: number) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-screen relative">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50" />
        <div className="absolute inset-0 opacity-60" style={{backgroundImage:'radial-gradient(800px 400px at 20% 10%, rgba(59,130,246,0.08), transparent), radial-gradient(600px 300px at 80% 20%, rgba(99,102,241,0.08), transparent), radial-gradient(600px 300px at 50% 90%, rgba(14,165,233,0.08), transparent)'}} />
      </div>

      {/* Header */}
      <header className="bg-white/60 backdrop-blur sticky top-0 z-20 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Sports AI Assistant</h1>
                <p className="text-slate-500 text-xs">Smart insights. Legendary knowledge.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex justify-center p-4 overflow-hidden">
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Welcome to Sports AI!
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Start a conversation about your favorite sports, teams, players, or recent matches. 
                  I am here to help with detailed information and insights!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "Latest football scores",
                    "Basketball stats",
                    "Tennis tournaments",
                    "Olympic records"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className="flex flex-col">
                <div
                  className={`flex items-start space-x-3 ${
                    msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {msg.role === "user" ? "U" : "AI"}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-3xl ${msg.role === "user" ? "text-right" : ""}`}>
                    <div
                      className={`inline-block px-4 py-3 rounded-2xl max-w-full ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md shadow"
                          : "bg-slate-100 text-slate-800 rounded-bl-md shadow"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown 
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({children}) => <ul className="mb-2 last:mb-0 pl-4">{children}</ul>,
                              ol: ({children}) => <ol className="mb-2 last:mb-0 pl-4">{children}</ol>,
                              li: ({children}) => <li className="mb-1">{children}</li>,
                              code: ({children}) => (
                                <code className="bg-slate-200 px-1 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ),
                              pre: ({children}) => (
                                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto my-2">
                                  {children}
                                </pre>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>

                    {/* Timestamp and Source Button */}
                    <div className={`flex items-center mt-1 space-x-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}>
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.role === "assistant" && msg.context && (
                        <button
                          className="text-xs text-blue-500 hover:text-blue-600 underline"
                          onClick={() =>
                            setShowContextIndex(idx === showContextIndex ? null : idx)
                          }
                        >
                          {showContextIndex === idx ? "Hide sources" : "Show sources"}
                        </button>
                      )}
                    </div>

                    {/* Context/Sources */}
                    {msg.role === "assistant" &&
                      showContextIndex === idx &&
                      msg.context && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm">📚</span>
                            <span className="text-sm font-medium text-amber-800">
                              Sources Used:
                            </span>
                          </div>
                          <pre className="text-xs text-amber-700 whitespace-pre-wrap font-mono">
                            {msg.context}
                          </pre>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-medium">
                  AI
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-sm text-red-700 flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 ml-auto"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="sticky bottom-0 border-t bg-white/80 backdrop-blur p-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-xs text-slate-500 mb-2">Press Enter to send • Shift+Enter for new line</div>
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm"
                    placeholder="Ask about sports, teams, players, scores..."
                    disabled={loading}
                    style={{
                      minHeight: '44px',
                      maxHeight: '120px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '44px';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={loading || input.trim() === ""}
                  className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow"
                  aria-label="Send message"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Send ✈️</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}