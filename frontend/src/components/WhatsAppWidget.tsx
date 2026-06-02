import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { safeSessionStorage } from "../lib/storage";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const QUICK_SUGGESTIONS = [
  "Suggest a luxury tour for Bali",
  "Show the day-by-day itinerary for Andaman",
  "What are the visa requirements for Vietnam?",
  "How do I customize a bespoke tour?"
];

export function WhatsAppWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  
  // Registration specs
  const [name, setName] = useState(() => safeSessionStorage.getItem("jf_chat_name") || "");
  const [phone, setPhone] = useState(() => safeSessionStorage.getItem("jf_chat_phone") || "");
  const [isRegistered, setIsRegistered] = useState(() => {
    return !!safeSessionStorage.getItem("jf_chat_name") && !!safeSessionStorage.getItem("jf_chat_phone");
  });

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when user is registered
  useEffect(() => {
    if (isRegistered) {
      const savedName = safeSessionStorage.getItem("jf_chat_name") || "Traveler";
      setMessages([
        {
          sender: "bot",
          text: `Hi *${savedName}*! 🌍 Welcome to JourneyFlicker. I'm your AI Curation Assistant. What luxury destinations or customized tours are you dreaming of today?`
        }
      ]);
    }
  }, [isRegistered]);

  // Auto-scroll chat window to the bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-dismiss the floating notification prompt after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and Phone are required to start curation.");
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s()-]/g, "");
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      toast.error("Please enter a valid phone or WhatsApp number.");
      return;
    }

    setLoadingReg(true);
    try {
      // 1. Save locally to session
      safeSessionStorage.setItem("jf_chat_name", name.trim());
      safeSessionStorage.setItem("jf_chat_phone", phone.trim());

      // 2. Perform background lead registration
      const leadEmail = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}_chat@journeyflicker.com`;
      await api.createContact({
        name: name.trim(),
        email: leadEmail,
        type: "Web Chat Session Init",
        message: `[Web Chat Session Init]
📞 Phone: ${phone.trim()}
💬 Customer initiated a direct web chat session with the AI Curator assistant.`,
      });

      setIsRegistered(true);
    } catch (err) {
      console.warn("Background registration failed (proceeding to chat anyway):", err);
      setIsRegistered(true); // Fallback to let them chat anyway
    } finally {
      setLoadingReg(false);
    }
  };

  const sendChatMessage = async (text: string) => {
    if (isTyping) return;

    // 1. Append user message to stream
    const newMessages: Message[] = [...messages, { sender: "user", text }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // 2. Query the live chat endpoint on the website backend (which proxies to the Render Chatbot)
      const res = await api.chat(text, name, phone);
      
      // 3. Append AI reply
      setMessages([...newMessages, { sender: "bot", text: res.reply }]);
    } catch (err) {
      console.error("Direct web chat failed:", err);
      setMessages([
        ...newMessages,
        { 
          sender: "bot", 
          text: "I apologize, I am having trouble connecting to our curation server. Please check your connection or contact us directly at tushar@journeyflicker.com." 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;
    setInputText("");
    await sendChatMessage(textToSend);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await sendChatMessage(suggestion);
  };

  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      // First parse links: [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        // Add preceding text
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        
        const anchorText = match[1];
        const url = match[2];
        const isExternal = url.startsWith("http");

        parts.push(
          isExternal ? (
            <a 
              key={match.index} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline decoration-emerald-500"
            >
              {anchorText}
            </a>
          ) : (
            <a 
              key={match.index} 
              href={url} 
              onClick={(e) => {
                e.preventDefault();
                navigate(url);
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline decoration-emerald-500 cursor-pointer"
            >
              {anchorText}
            </a>
          )
        );

        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      // Now map over parts to parse bold elements inside text strings
      const formattedParts = parts.map((part, idx) => {
        if (typeof part !== 'string') return part;

        const boldParts = part.split(/(\*\*|[*])/g);
        let isBold = false;

        return boldParts.map((subPart, subIdx) => {
          if (subPart === "**" || subPart === "*") {
            isBold = !isBold;
            return null;
          }
          return isBold ? (
            <strong key={`${idx}-${subIdx}`} className="font-extrabold text-on-surface dark:text-white">
              {subPart}
            </strong>
          ) : (
            subPart
          );
        });
      });

      return <span key={lineIdx} className="block mt-1">{formattedParts}</span>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] font-sans flex flex-col items-end">
      {/* ── FLOATING NOTIFICATION PROMPT ── */}
      {showNotification && !isOpen && (
        <div className="mb-3 mr-2 max-w-xs bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 text-zinc-800 dark:text-zinc-200 p-4 rounded-2xl shadow-2xl relative animate-reveal-up text-left flex items-start gap-3 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-sm font-semibold">chat</span>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight">Curation Assistant</h4>
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 mt-0.5">
              Chat live with our AI travel curator directly on our site!
            </p>
          </div>
          <button 
            onClick={() => setShowNotification(false)}
            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
          <div className="absolute right-6 -bottom-1.5 w-3 h-3 bg-white dark:bg-zinc-900 border-r border-b border-neutral-200 dark:border-neutral-800 rotate-45" />
        </div>
      )}

      {/* ── CHAT PANEL WINDOW ── */}
      {isOpen && (
        <div className="mb-4 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-900 rounded-3xl overflow-hidden shadow-2xl animate-reveal-up flex flex-col h-[520px] max-h-[85vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-zinc-900 p-5 text-white relative flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined text-white text-2xl font-light">robot_2</span>
                </div>
                <div className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-400 border-2 border-emerald-600 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-tight">AI Curator Assistant</h3>
                <p className="text-[10px] text-emerald-200/90 font-light flex items-center gap-1">
                  Active & Online • JourneyFlicker
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* ── STATE 1: INTRODUCTION REGISTER FORM ── */}
          {!isRegistered ? (
            <div className="flex-1 p-6 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900/50 text-left">
              <div className="text-center mb-6">
                <span className="material-symbols-outlined text-4xl text-emerald-600 animate-bounce">chat_bubble</span>
                <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mt-2">Bespoke Curation Chat</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light mt-1 px-4">
                  Introduce yourself to begin planning your customized travel itineraries instantly.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Your Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Gaurang Patel"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full text-xs font-light bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">WhatsApp / Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. +91 9988..."
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full text-xs font-light bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loadingReg}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-60"
                >
                  {loadingReg ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                      Registering Session...
                    </>
                  ) : (
                    <>
                      Start Live Chat <span className="material-symbols-outlined text-xs font-semibold">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            // ── STATE 2: DIRECT WEB CHAT STREAM ──
            <>
              {/* Chat Messages Logs */}
              <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-900/30 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-reveal-up`}
                  >
                    <div 
                      className={`max-w-[85%] text-xs leading-relaxed p-3.5 shadow-sm ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none text-left"
                          : "bg-white dark:bg-zinc-950 border border-neutral-200/50 dark:border-neutral-800 text-zinc-700 dark:text-zinc-300 rounded-2xl rounded-tl-none text-left font-light"
                      }`}
                    >
                      {msg.sender === "bot" && (
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1 text-[10px] tracking-wide uppercase">AI Curator</p>
                      )}
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>
                ))}

                {/* AI Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white dark:bg-zinc-950 border border-neutral-200/50 dark:border-neutral-800 text-zinc-500 p-3.5 rounded-2xl rounded-tl-none text-left font-light max-w-[85%] text-xs flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1 font-mono">Curator is designing...</span>
                    </div>
                  </div>
                )}

                {/* Quick Suggestion Prompts */}
                {messages.length === 1 && !isTyping && (
                  <div className="mt-4 space-y-2 animate-reveal-up">
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold px-1 select-none">Suggested Curation Prompts</p>
                    <div className="space-y-1.5">
                      {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left bg-white dark:bg-zinc-950 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl p-3 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-95 group cursor-pointer shadow-sm"
                        >
                          <div className="w-6.5 h-6.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[11px] font-semibold">chat_bubble</span>
                          </div>
                          <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                            {suggestion}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form panel */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-200 dark:border-neutral-900 bg-white dark:bg-zinc-950 flex items-center gap-2 flex-shrink-0">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={isTyping ? "AI is thinking..." : "Ask about a tour, visa, or customize trip..."}
                  disabled={isTyping}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-light focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200 placeholder:opacity-40 disabled:opacity-60"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg font-bold">send</span>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ── TOGGLE FLOAT BUTTON ── */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNotification(false);
        }}
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all hover:scale-105 duration-300 relative group cursor-pointer"
        aria-label="Chat via Direct Web Assistant"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping group-hover:opacity-40" />

        {isOpen ? (
          <span className="material-symbols-outlined text-2xl font-light">close</span>
        ) : (
          <span className="material-symbols-outlined text-3xl font-light">robot_2</span>
        )}

        {/* Small floating unread notification badge */}
        {!isOpen && showNotification && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 border border-white dark:border-zinc-950 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md select-none animate-bounce">
            1
          </span>
        )}
      </button>
    </div>
  );
}
