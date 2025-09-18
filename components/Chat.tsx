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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Sports AI Assistant</h1>
              <p className="text-blue-100 text-sm">Ask me anything about sports!</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex justify-center p-4 overflow-hidden">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
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
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
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
                                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ),
                              pre: ({children}) => (
                                <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">
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
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}