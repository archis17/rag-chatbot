"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css"; // You can replace with preferred highlight.js theme

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  context?: string; // Optional: for source/context citations
  timestamp?: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContextIndex, setShowContextIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to backend and get bot’s reply
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
      // Optionally, accept 'context' array if your backend returns it
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

  // Handle submit via Enter key (Shift+Enter for newlines)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Format timestamp as HH:MM
  function formatTime(ts?: number) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="max-w-2xl mx-auto my-4 flex flex-col h-[80vh] border rounded-lg shadow-xl bg-white">
      {/* Header */}
      <header className="px-4 py-3 bg-blue-800 text-white font-bold text-lg rounded-t-lg">
        <span role="img" aria-label="sports">
          🏆
        </span>{" "}
        Sports RAG Chatbot
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-8">
            Start chatting about sports—ask me anything!
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="flex flex-col items-start">
            <div
              className={`flex items-end space-x-2 ${
                msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border ${
                  msg.role === "user"
                    ? "bg-blue-200 border-blue-400"
                    : "bg-gray-200 border-gray-400"
                } text-sm`}
              >
                {msg.role === "user" ? "You" : "AI"}
              </div>
              <div
                className={`
                px-4 py-2 rounded-xl
                ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }
                shadow-sm max-w-lg
                prose prose-sm prose-invert dark:prose-dark
              `}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span>{msg.content}</span>
                )}
                {msg.role === "assistant" && msg.context && (
                  <button
                    className="mt-2 text-xs text-blue-500 underline"
                    onClick={() =>
                      setShowContextIndex(idx === showContextIndex ? null : idx)
                    }
                  >
                    {showContextIndex === idx ? "Hide source" : "Show source"}
                  </button>
                )}
              </div>
              <span className="text-xs text-gray-400 ml-2">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            {/* Show source/context if toggled */}
            {msg.role === "assistant" &&
              showContextIndex === idx &&
              msg.context && (
                <div className="mt-1 mb-1 ml-10 bg-yellow-50 border-l-2 border-yellow-400 text-xs p-2 rounded">
                  <div className="font-semibold text-yellow-700 mb-1">
                    Sources used:
                  </div>
                  <pre className="whitespace-pre-wrap">{msg.context}</pre>
                </div>
              )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 p-2 text-xs text-red-700 bg-red-50 border border-red-300 rounded text-center">
          {error}
        </div>
      )}

      {/* Input area */}
      <footer className="px-4 py-3 border-t flex items-end space-x-2 bg-white">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 rounded p-2 resize-none focus:outline-blue-500 disabled:bg-gray-100"
          placeholder="Ask about sports, tournaments, athletes..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || input.trim() === ""}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </footer>
    </div>
  );
}
