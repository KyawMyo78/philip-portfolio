"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: "user" | "assistant"; text: string; loading?: boolean };

// Quick action suggestions for new users
const QUICK_ACTIONS = [
  "How do I add a blog post?",
  "How can I update my profile?", 
  "How do I upload images?",
  "How do I add a new project?",
  "How can I manage my skills?"
];

export default function ChatUI({
  initialPrompt = "",
  initialAiReply = "",
  mascot = "/apclover.jpg",
  initialUserSummary = "",
}: {
  initialPrompt?: string;
  initialAiReply?: string;
  mascot?: string;
  initialUserSummary?: string;
}) {
  // simple inline styles for the loading dots (keeps this component self-contained)
  const dotsStyle = (
    <style>{`
      .loading-dots .dot{ display:inline-block; width:6px; height:6px; margin:0 2px; border-radius:50%; background:currentColor; opacity:0; transform:translateY(0);
        animation: loading-dot 1s infinite linear; }
      .loading-dots .dot:nth-child(1){ animation-delay:0s }
      .loading-dots .dot:nth-child(2){ animation-delay:0.15s }
      .loading-dots .dot:nth-child(3){ animation-delay:0.3s }
      @keyframes loading-dot{ 0%{opacity:0; transform:translateY(-2px)} 50%{opacity:1; transform:translateY(0)} 100%{opacity:0; transform:translateY(2px)} }
    `}</style>
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const msgs: Message[] = [];
    if (initialAiReply) msgs.push({ role: "assistant", text: initialAiReply });
    return msgs;
  });
  // Start with an empty input; use placeholder text instead of prefilled content
  const [text, setText] = useState("");
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // scroll only the message list, not the whole page
    const box = messagesEndRef.current?.parentElement;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (ev?: MediaQueryListEvent) => setIsLargeScreen(ev ? ev.matches : mq.matches);
    update();
    try {
      mq.addEventListener?.("change", update);
    } catch (e) {
      // Safari older engines
      (mq as any).addListener?.(update);
    }
    return () => {
      try {
        mq.removeEventListener?.("change", update);
      } catch (e) {
        (mq as any).removeListener?.(update);
      }
    };
  }, []);

  async function send() {
    if (!text.trim()) return;
    const prompt = text.trim();
    const userMsg: Message = { role: "user", text: prompt };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setLoading(true);

    // Add a temporary loading bubble from assistant
    const loadingMsg: Message = { role: "assistant", text: "", loading: true };
    setMessages((m) => [...m, loadingMsg]);

    try {
      // Send chat history for context (last 10 messages to avoid token limits)
      const recentHistory = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));
      
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          userSummary: initialUserSummary,
          chatHistory: recentHistory
        }),
      });
      const textBody = await res.text();
      if (!res.ok) {
        // Try parse JSON error if possible
        let errMsg = textBody;
        try {
          const parsed = JSON.parse(textBody);
          errMsg = parsed?.error || JSON.stringify(parsed);
        } catch (e) {
          // keep textBody
        }
        const aiMsg: Message = { role: "assistant", text: `Error from server: ${errMsg}` };
        setMessages((m) => [...m, aiMsg]);
        return;
      }

      const data = JSON.parse(textBody);
      const reply: string = data?.reply || data?.text || "(no reply)";
      // Replace the last loading message with the real reply
      setMessages((m) => {
        const copy = [...m];
        const lastLoadingIndex = copy.map((x) => x.loading).lastIndexOf(true);
        if (lastLoadingIndex >= 0) {
          copy[lastLoadingIndex] = { role: "assistant", text: reply };
        } else {
          copy.push({ role: "assistant", text: reply });
        }
        return copy;
      });
    } catch (err: any) {
      const msg = `Network error: ${err?.message || String(err)}`;
      setMessages((m) => {
        const copy = [...m];
        const lastLoadingIndex = copy.map((x) => x.loading).lastIndexOf(true);
        if (lastLoadingIndex >= 0) {
          copy[lastLoadingIndex] = { role: "assistant", text: msg };
        } else {
          copy.push({ role: "assistant", text: msg });
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  const [loading, setLoading] = React.useState(false);

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-primary-200">
      {dotsStyle}
      
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img src={mascot} alt="AP Clover" className="w-16 h-16 rounded-full border-4 border-secondary-300/30 object-cover" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AP's Clover</h2>
            <p className="text-secondary-200">Portfolio Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96 min-h-[300px]">
        {/* Quick Actions for new users */}
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg mb-6">Start a conversation with AP's Clover</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600 font-medium text-sm">Try asking:</p>
              <div className="grid gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setText(action)}
                    className="text-left p-3 bg-secondary-50 hover:bg-primary-50 hover:border-primary-200 border border-primary-100 rounded-xl text-sm transition-all duration-200 hover:shadow-sm"
                  >
                    <span className="text-primary-700 mr-2">💬</span>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
            <div className={`flex items-end space-x-2 max-w-[80%] ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
              {/* Avatar for assistant */}
              {m.role === "assistant" && (
                <img src={mascot} alt="AP Clover" className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-gray-200" />
              )}
              
              {/* Message bubble */}
              <div className={`px-4 py-3 rounded-2xl ${
                m.role === "user" 
                  ? "bg-primary-800 text-white rounded-br-md shadow-lg" 
                  : "bg-secondary-100 text-primary-900 rounded-bl-md shadow-sm border border-primary-100"
              }`}>
                <div className="text-sm">
                  {m.loading ? (
                    <div className="flex items-center space-x-2 py-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-primary-600 text-xs">AP's Clover is thinking...</span>
                    </div>
                  ) : (
                    // Render assistant replies as Markdown for richer formatting
                    m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-primary-900 prose-p:text-primary-800 prose-strong:text-primary-900">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t bg-secondary-50 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                autoResize();
              }}
              placeholder="Message AP's Clover..."
              className="w-full resize-none border-2 border-primary-200 rounded-2xl px-4 py-3 focus:border-primary-600 focus:outline-none transition-colors bg-white shadow-sm"
              disabled={loading}
              rows={1}
              onInput={autoResize}
              onKeyDown={(e) => {
                // Large screens: Enter sends (unless Shift held). Shift+Enter => newline.
                // Small screens: Enter inserts newline; sending must be done via Send button.
                if (isLargeScreen) {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                  // otherwise allow default (Shift+Enter -> newline)
                } else {
                  // Small screens: Enter should insert newline (default behavior). Optionally,
                  // we could support Ctrl+Enter to send, but per request, only Send button sends.
                }
              }}
            />
          </div>
          <button 
            onClick={send} 
            className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
              loading || !text.trim() 
                ? "bg-primary-200 text-primary-400 cursor-not-allowed" 
                : "bg-primary-700 hover:bg-primary-800 text-white hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Status indicator */}
        {loading && (
          <div className="flex items-center mt-2 text-sm text-primary-600">
            <div className="flex items-center space-x-2">
              <img src={mascot} className="w-4 h-4 rounded-full" />
              <span>AP's Clover is crafting a response...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
